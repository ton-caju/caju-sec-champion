// Pergunta secreta (versão frontend - sem hash)
export interface SecretQuestion {
  id: number;
  pergunta: string;
  tipo: 'texto' | 'numerico' | 'data';
}

// Payload para iniciar recuperação
export interface InitRecoveryPayload {
  cpf: string;
  recaptcha_token: string;
  device_fingerprint?: string;
}

// Resposta de inicialização
export interface InitRecoveryResponse {
  success: boolean;
  message: string;
  questions: SecretQuestion[];
}

// Payload para validar respostas
export interface ValidateAnswersPayload {
  cpf: string;
  respostas: string[];
  recaptcha_token: string;
  recaptcha_v2_token?: string;
}

// Resposta de validação
export interface ValidateAnswersResponse {
  success: boolean;
  message: string;
  reset_token?: string;
  attempts?: number;
  failures?: number;
}

// Payload para reset de senha
export interface ResetPasswordPayload {
  reset_token: string;
  new_password: string;
}

// Resposta de reset
export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

// Erro da API
export interface ApiError {
  error: string;
  message?: string;
  details?: any;
  blocked?: boolean;
  retry_after?: number;
  require_captcha_v2?: boolean;
}

// CSRF Token response
export interface CsrfTokenResponse {
  csrfToken: string;
}
