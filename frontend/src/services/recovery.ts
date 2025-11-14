import { api } from './api';
import {
  InitRecoveryPayload,
  InitRecoveryResponse,
  ValidateAnswersPayload,
  ValidateAnswersResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
  CsrfTokenResponse,
} from '../types';

export const recoveryService = {
  /**
   * Obtém token CSRF do servidor
   */
  getCsrfToken: async (): Promise<string> => {
    const response = await api.get<CsrfTokenResponse>('/api/csrf-token');
    const token = response.data.csrfToken;
    sessionStorage.setItem('csrf_token', token);
    return token;
  },

  /**
   * Inicia processo de recuperação de senha
   */
  initRecovery: async (payload: InitRecoveryPayload): Promise<InitRecoveryResponse> => {
    const response = await api.post<InitRecoveryResponse>('/api/recovery/init', payload);
    return response.data;
  },

  /**
   * Valida respostas das perguntas secretas
   */
  validateAnswers: async (payload: ValidateAnswersPayload): Promise<ValidateAnswersResponse> => {
    const response = await api.post<ValidateAnswersResponse>('/api/recovery/validate', payload);
    return response.data;
  },

  /**
   * Define nova senha com token de reset
   */
  resetPassword: async (payload: ResetPasswordPayload): Promise<ResetPasswordResponse> => {
    const response = await api.post<ResetPasswordResponse>('/api/recovery/reset-password', payload);
    return response.data;
  },
};
