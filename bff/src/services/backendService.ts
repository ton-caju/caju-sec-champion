import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const BACKEND_TIMEOUT = parseInt(process.env.BACKEND_TIMEOUT || '10000', 10);

/**
 * Cliente HTTP para comunicação com Backend Lab-v4
 */
const backendClient: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: BACKEND_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para log de requisições
backendClient.interceptors.request.use(
  (config) => {
    logger.info('Requisição para backend', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
    });
    return config;
  },
  (error) => {
    logger.error('Erro ao preparar requisição para backend', { error: error.message });
    return Promise.reject(error);
  }
);

// Interceptor para log de respostas
backendClient.interceptors.response.use(
  (response) => {
    logger.info('Resposta do backend', {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  (error) => {
    logger.error('Erro na resposta do backend', {
      status: error.response?.status,
      url: error.config?.url,
      error: error.message,
    });
    return Promise.reject(error);
  }
);

/**
 * Atualiza senha de um usuário no backend
 * Chama endpoint vulnerável do Lab-v4, mas com dados sanitizados
 */
export const updatePassword = async (
  username: string,
  newPassword: string
): Promise<boolean> => {
  try {
    // Sanitização já foi feita pelo BFF antes de chegar aqui
    // Backend Lab-v4 é vulnerável, mas dados já foram sanitizados

    const response = await backendClient.post('/auth/update-password', {
      username,
      password: newPassword,
    });

    return response.status === 200;
  } catch (error: any) {
    logger.error('Erro ao atualizar senha no backend', {
      username,
      error: error.message,
    });
    return false;
  }
};

/**
 * Busca informações de um usuário no backend
 * (se necessário para validações adicionais)
 */
export const getUserInfo = async (cpf: string): Promise<any | null> => {
  try {
    // CPF já foi sanitizado pelo BFF
    const response = await backendClient.get(`/users/by-cpf`, {
      params: { cpf },
    });

    return response.data;
  } catch (error: any) {
    logger.error('Erro ao buscar usuário no backend', {
      cpf: cpf.substring(0, 3) + '***',
      error: error.message,
    });
    return null;
  }
};

export default backendClient;
