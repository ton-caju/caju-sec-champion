import fs from 'fs/promises';
import path from 'path';
import { UserSecrets, SecretQuestion } from '../types';
import { logger } from '../utils/logger';

const SECRETS_PATH = process.env.SECRETS_PATH || '../Lab-v4/uploads';

/**
 * Carrega perguntas secretas de um usuário pelo CPF
 */
export const loadSecretsByCPF = async (cpf: string): Promise<UserSecrets | null> => {
  try {
    // Normalizar CPF (remover formatação)
    const cpfNormalized = cpf.replace(/\D/g, '');

    // Listar todos os arquivos na pasta de secrets
    const files = await fs.readdir(SECRETS_PATH);

    // Procurar arquivo que corresponda ao CPF
    for (const file of files) {
      if (file.endsWith('_secrets.json')) {
        const filePath = path.join(SECRETS_PATH, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const userData: UserSecrets = JSON.parse(content);

        // Comparar CPF normalizado
        if (userData.cpf.replace(/\D/g, '') === cpfNormalized) {
          logger.info('Perguntas secretas carregadas', {
            username: userData.username,
            totalPerguntas: userData.total_perguntas,
          });
          return userData;
        }
      }
    }

    logger.warn('Nenhum arquivo de secrets encontrado para o CPF', {
      cpf: cpf.substring(0, 3) + '***',
    });
    return null;
  } catch (error: any) {
    logger.error('Erro ao carregar secrets', {
      error: error.message,
      cpf: cpf.substring(0, 3) + '***',
    });
    return null;
  }
};

/**
 * Seleciona 5 perguntas principais de um usuário
 * Em produção, poderia selecionar aleatoriamente de um pool maior
 */
export const selectQuestions = (userSecrets: UserSecrets): SecretQuestion[] => {
  // Por enquanto, retorna as 5 perguntas principais
  // Em produção, poderia randomizar ou selecionar baseado em critérios
  return userSecrets.perguntas_principais.slice(0, 5);
};

/**
 * Remove respostas e hashes das perguntas antes de enviar ao frontend
 * Frontend só recebe as perguntas, não as respostas
 */
export const sanitizeQuestionsForFrontend = (
  questions: SecretQuestion[]
): Partial<SecretQuestion>[] => {
  return questions.map((q) => ({
    id: q.id,
    pergunta: q.pergunta,
    tipo: q.tipo,
    // NÃO envia resposta nem hash para o frontend
  }));
};
