import { Response, NextFunction } from 'express';
import { CustomRequest, RecoverySession, ResetToken } from '../types';
import { loadSecretsByCPF, selectQuestions, sanitizeQuestionsForFrontend } from '../services/secretsService';
import { updatePassword } from '../services/backendService';
import { sha256Hash, normalizeText, compareHash, generateSecureToken } from '../utils/hash';
import { registerFailedAttempt, clearFailedAttempts } from '../middleware/accountLockout';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';
import { recoveryAttemptsCounter } from '../utils/metrics';

/**
 * POST /api/recovery/init
 * Inicia processo de recuperação de senha
 * Retorna perguntas secretas para o usuário
 */
export const initRecovery = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cpf } = req.body;
    const cpfNormalized = cpf.replace(/\D/g, '');

    // Carregar perguntas secretas do arquivo
    const userSecrets = await loadSecretsByCPF(cpfNormalized);

    // IMPORTANTE: Resposta UNIFORME para prevenir enumeração de usuários
    // Sempre retornar 200 OK, mesmo se usuário não existir
    if (!userSecrets) {
      logger.warn('Tentativa de recuperação para CPF não cadastrado', {
        cpf: cpfNormalized.substring(0, 3) + '***',
      });

      // Retornar perguntas falsas para prevenir enumeração
      return res.status(200).json({
        success: true,
        message: 'Perguntas enviadas',
        questions: [
          { id: 1, pergunta: 'Qual o nome do seu banco?', tipo: 'texto' },
          { id: 2, pergunta: 'Qual o nome da sua empresa?', tipo: 'texto' },
          { id: 3, pergunta: 'Qual o número da sua agência?', tipo: 'numerico' },
          { id: 4, pergunta: 'Qual seu código de segurança?', tipo: 'numerico' },
          { id: 5, pergunta: 'Qual o valor da última transação?', tipo: 'numerico' },
        ],
      });
    }

    // Selecionar perguntas
    const questions = selectQuestions(userSecrets);

    // Sanitizar perguntas para frontend (remover hashes)
    const sanitizedQuestions = sanitizeQuestionsForFrontend(questions);

    // Armazenar sessão de recuperação no Redis
    const recoverySession: RecoverySession = {
      cpf: cpfNormalized,
      questions,
      attempts: 0,
      started_at: Date.now(),
      expires_at: Date.now() + 15 * 60 * 1000, // 15 minutos
    };

    const sessionKey = `recovery:${req.sessionID}`;
    await redisClient.setex(sessionKey, 15 * 60, JSON.stringify(recoverySession));

    logger.info('Sessão de recuperação iniciada', {
      cpf: cpfNormalized.substring(0, 3) + '***',
      sessionId: req.sessionID,
    });

    res.json({
      success: true,
      message: 'Perguntas enviadas',
      questions: sanitizedQuestions,
    });
  } catch (error: any) {
    logger.error('Erro ao iniciar recuperação', { error: error.message });
    next(error);
  }
};

/**
 * POST /api/recovery/validate
 * Valida respostas das perguntas secretas
 * Se correto, gera token de reset de senha
 */
export const validateAnswers = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cpf, respostas } = req.body;
    const cpfNormalized = cpf.replace(/\D/g, '');

    // Buscar sessão de recuperação
    const sessionKey = `recovery:${req.sessionID}`;
    const sessionData = await redisClient.get(sessionKey);

    if (!sessionData) {
      return res.status(400).json({
        error: 'Sessão expirada',
        message: 'Sua sessão de recuperação expirou. Inicie o processo novamente.',
      });
    }

    const recoverySession: RecoverySession = JSON.parse(sessionData);

    // Verificar se CPF da sessão corresponde
    if (recoverySession.cpf !== cpfNormalized) {
      logger.warn('Tentativa de validar respostas com CPF diferente da sessão', {
        sessionCPF: recoverySession.cpf.substring(0, 3) + '***',
        requestCPF: cpfNormalized.substring(0, 3) + '***',
      });

      return res.status(400).json({
        error: 'Dados inválidos',
        message: 'CPF não corresponde à sessão de recuperação.',
      });
    }

    // Verificar se sessão expirou
    if (Date.now() > recoverySession.expires_at) {
      await redisClient.del(sessionKey);
      return res.status(400).json({
        error: 'Sessão expirada',
        message: 'Tempo esgotado. Inicie o processo novamente.',
      });
    }

    // Incrementar tentativas
    recoverySession.attempts++;

    // Validar respostas
    let correctAnswers = 0;
    const { questions } = recoverySession;

    for (let i = 0; i < respostas.length; i++) {
      const userAnswer = normalizeText(respostas[i]);
      const userAnswerHash = sha256Hash(userAnswer);
      const expectedHash = questions[i].resposta_hash;

      if (compareHash(userAnswerHash, expectedHash)) {
        correctAnswers++;
      }
    }

    // Verificar se todas as respostas estão corretas
    const allCorrect = correctAnswers === questions.length;

    if (allCorrect) {
      // ✅ SUCESSO - Respostas corretas

      recoveryAttemptsCounter.inc({ result: 'success' });

      // Limpar contador de falhas
      await clearFailedAttempts(cpfNormalized);

      // Limpar sessão de recuperação
      await redisClient.del(sessionKey);

      // Gerar token de reset de senha
      const resetToken = generateSecureToken(32); // 64 caracteres hex

      const resetTokenData: ResetToken = {
        cpf: cpfNormalized,
        email: (await loadSecretsByCPF(cpfNormalized))?.email || '',
        token: resetToken,
        created_at: Date.now(),
        expires_at: Date.now() + 30 * 60 * 1000, // 30 minutos
      };

      const tokenKey = `reset:${resetToken}`;
      await redisClient.setex(tokenKey, 30 * 60, JSON.stringify(resetTokenData));

      logger.info('✅ Recuperação bem-sucedida - Token gerado', {
        cpf: cpfNormalized.substring(0, 3) + '***',
        attempts: recoverySession.attempts,
      });

      return res.json({
        success: true,
        message: 'Respostas corretas! Você pode definir uma nova senha.',
        reset_token: resetToken,
      });
    } else {
      // ❌ FALHA - Respostas incorretas

      recoveryAttemptsCounter.inc({ result: 'failure' });

      // Registrar falha e aplicar bloqueio se necessário
      const { failures, tier } = await registerFailedAttempt(cpfNormalized);

      // Atualizar sessão com nova tentativa
      await redisClient.setex(sessionKey, 15 * 60, JSON.stringify(recoverySession));

      logger.warn('❌ Tentativa de recuperação falhada', {
        cpf: cpfNormalized.substring(0, 3) + '***',
        attempts: recoverySession.attempts,
        failures,
        correctAnswers,
        totalQuestions: questions.length,
      });

      return res.status(400).json({
        error: 'Respostas incorretas',
        message: 'Uma ou mais respostas estão incorretas. Verifique e tente novamente.',
        attempts: recoverySession.attempts,
        failures,
      });
    }
  } catch (error: any) {
    logger.error('Erro ao validar respostas', { error: error.message });
    next(error);
  }
};

/**
 * POST /api/recovery/reset-password
 * Define nova senha usando token de reset
 */
export const resetPassword = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reset_token, new_password } = req.body;

    // Buscar dados do token
    const tokenKey = `reset:${reset_token}`;
    const tokenData = await redisClient.get(tokenKey);

    if (!tokenData) {
      logger.warn('Tentativa de reset com token inválido ou expirado', {
        token: reset_token.substring(0, 8) + '***',
      });

      return res.status(400).json({
        error: 'Token inválido ou expirado',
        message: 'O token de reset não é válido ou já expirou. Inicie o processo novamente.',
      });
    }

    const resetTokenInfo: ResetToken = JSON.parse(tokenData);

    // Verificar se token expirou
    if (Date.now() > resetTokenInfo.expires_at) {
      await redisClient.del(tokenKey);
      return res.status(400).json({
        error: 'Token expirado',
        message: 'O token de reset expirou. Inicie o processo novamente.',
      });
    }

    // Carregar dados do usuário
    const userSecrets = await loadSecretsByCPF(resetTokenInfo.cpf);

    if (!userSecrets) {
      logger.error('Usuário não encontrado para token de reset', {
        cpf: resetTokenInfo.cpf.substring(0, 3) + '***',
      });

      return res.status(400).json({
        error: 'Erro ao resetar senha',
        message: 'Não foi possível completar o reset. Entre em contato com o suporte.',
      });
    }

    // Atualizar senha no backend (Lab-v4)
    // Senha já foi validada pelo middleware de validação
    const success = await updatePassword(userSecrets.username, new_password);

    if (!success) {
      logger.error('Falha ao atualizar senha no backend', {
        username: userSecrets.username,
      });

      return res.status(500).json({
        error: 'Erro ao atualizar senha',
        message: 'Não foi possível atualizar a senha. Tente novamente.',
      });
    }

    // Deletar token de reset (uso único)
    await redisClient.del(tokenKey);

    logger.info('✅ Senha resetada com sucesso', {
      username: userSecrets.username,
      cpf: resetTokenInfo.cpf.substring(0, 3) + '***',
    });

    // TODO: Enviar notificação ao usuário (email/SMS)
    // await notifyPasswordChanged(userSecrets.email);

    res.json({
      success: true,
      message: 'Senha alterada com sucesso! Você já pode fazer login com a nova senha.',
    });
  } catch (error: any) {
    logger.error('Erro ao resetar senha', { error: error.message });
    next(error);
  }
};
