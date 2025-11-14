import { redisClient } from '../config/redis';
import { CustomRequest, LockoutConfig } from '../types';
import { Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { accountLockoutCounter } from '../utils/metrics';

const LOCKOUT_TIERS: LockoutConfig[] = [
  { attempts: 3, duration: 15 * 60, description: '15 minutos' }, // 3 falhas
  { attempts: 5, duration: 60 * 60, description: '1 hora' }, // 5 falhas
  { attempts: 10, duration: 24 * 60 * 60, description: '24 horas' }, // 10 falhas
  { attempts: 20, duration: -1, description: 'permanente' }, // 20 falhas (requer suporte)
];

/**
 * Verifica se conta está bloqueada
 */
export const checkAccountLockout = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const cpf = req.body.cpf?.replace(/\D/g, '');

  if (!cpf) {
    return res.status(400).json({ error: 'CPF obrigatório' });
  }

  const lockoutKey = `lockout:${cpf}`;
  const failuresKey = `failures:${cpf}`;

  // Verificar se conta está bloqueada
  const lockedUntil = await redisClient.get(lockoutKey);

  if (lockedUntil) {
    if (lockedUntil === 'permanent') {
      logger.error('Tentativa de acesso a conta bloqueada permanentemente', {
        cpf: cpf.substring(0, 3) + '***',
      });

      return res.status(403).json({
        error: 'Conta bloqueada permanentemente',
        message: 'Entre em contato com o suporte para desbloquear.',
        blocked: true,
        permanent: true,
      });
    }

    const ttl = await redisClient.ttl(lockoutKey);

    logger.warn('Tentativa de acesso a conta temporariamente bloqueada', {
      cpf: cpf.substring(0, 3) + '***',
      ttl,
    });

    return res.status(429).json({
      error: 'Conta temporariamente bloqueada',
      message: `Muitas tentativas falhadas. Aguarde ${Math.ceil(ttl / 60)} minutos.`,
      blocked: true,
      retry_after: ttl,
    });
  }

  // Obter número de falhas
  const failures = parseInt((await redisClient.get(failuresKey)) || '0');

  req.accountLockout = {
    failures,
    isLocked: false,
  };

  next();
};

/**
 * Registra tentativa falhada e aplica bloqueio se necessário
 */
export const registerFailedAttempt = async (cpf: string) => {
  const failuresKey = `failures:${cpf}`;
  const lockoutKey = `lockout:${cpf}`;

  // Incrementar contador de falhas
  const failures = await redisClient.incr(failuresKey);

  // Se primeira falha, definir expiração de 24 horas
  if (failures === 1) {
    await redisClient.expire(failuresKey, 24 * 60 * 60);
  }

  logger.warn('Tentativa de recuperação falhada', {
    cpf: cpf.substring(0, 3) + '***',
    failures,
  });

  // Verificar se atingiu tier de bloqueio
  for (const tier of LOCKOUT_TIERS) {
    if (failures >= tier.attempts) {
      if (tier.duration === -1) {
        // Bloqueio permanente
        await redisClient.set(lockoutKey, 'permanent');

        accountLockoutCounter.inc({ tier: 'permanent' });

        // Log de alerta crítico
        logger.error(
          `🚨 ALERTA CRÍTICO: CPF bloqueado permanentemente após ${failures} tentativas`,
          {
            cpf: cpf.substring(0, 3) + '***',
            failures,
          }
        );

        // TODO: Enviar alerta para SOC/Suporte
        // await alertarEquipeSeguranca(cpf, failures);
      } else {
        // Bloqueio temporário
        await redisClient.setex(
          lockoutKey,
          tier.duration,
          new Date(Date.now() + tier.duration * 1000).toISOString()
        );

        accountLockoutCounter.inc({ tier: tier.description });

        logger.warn(
          `⚠️  CPF bloqueado por ${tier.description} após ${failures} tentativas`,
          {
            cpf: cpf.substring(0, 3) + '***',
            failures,
            duration: tier.description,
          }
        );
      }

      break;
    }
  }

  return {
    failures,
    tier: LOCKOUT_TIERS.find((t) => failures >= t.attempts),
  };
};

/**
 * Limpa contador de falhas após sucesso
 */
export const clearFailedAttempts = async (cpf: string) => {
  const failuresKey = `failures:${cpf}`;
  await redisClient.del(failuresKey);

  logger.info('✅ Contador de falhas limpo após recuperação bem-sucedida', {
    cpf: cpf.substring(0, 3) + '***',
  });
};
