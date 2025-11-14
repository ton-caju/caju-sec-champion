import { Request } from 'express';

// Extend Express Request para incluir propriedades customizadas
export interface CustomRequest extends Request {
  cpfAttempts?: {
    current: number;
    max: number;
    remaining: number;
  };
  captchaScore?: number;
  accountLockout?: {
    failures: number;
    isLocked: boolean;
  };
  sessionID: string;
}

// Estrutura de pergunta secreta
export interface SecretQuestion {
  id: number;
  pergunta: string;
  resposta?: string; // Apenas para referência, não usado em produção
  resposta_hash: string;
  tipo: 'texto' | 'numerico' | 'data';
  entropia: 'alta' | 'muito_alta';
  justificativa: string;
  categoria: 'financeiro' | 'transacional' | 'profissional' | 'cadastral' | 'seguranca';
}

// Estrutura do arquivo de secrets de um usuário
export interface UserSecrets {
  username: string;
  cpf: string;
  email: string;
  perguntas_principais: SecretQuestion[];
  perguntas_alternativas: SecretQuestion[];
  total_perguntas: number;
  metadata: {
    data_geracao: string;
    versao: string;
    entropia_media: string;
    observacoes: string;
  };
}

// Payload de inicialização de recuperação
export interface RecoveryInitPayload {
  cpf: string;
  recaptcha_token: string;
  device_fingerprint?: string;
}

// Payload de validação de respostas
export interface RecoveryValidatePayload {
  cpf: string;
  respostas: string[];
  recaptcha_token: string;
  recaptcha_v2_token?: string;
}

// Payload de reset de senha
export interface ResetPasswordPayload {
  reset_token: string;
  new_password: string;
}

// Configuração de bloqueio (lockout tier)
export interface LockoutConfig {
  attempts: number;
  duration: number; // segundos (-1 = permanente)
  description: string;
}

// Resposta de erro padrão
export interface ErrorResponse {
  error: string;
  message?: string;
  details?: any;
  blocked?: boolean;
  retry_after?: number;
  require_captcha_v2?: boolean;
}

// Resposta de sucesso padrão
export interface SuccessResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Informações de sessão de recuperação
export interface RecoverySession {
  cpf: string;
  questions: SecretQuestion[];
  attempts: number;
  started_at: number;
  expires_at: number;
}

// Token de reset
export interface ResetToken {
  cpf: string;
  email: string;
  token: string;
  created_at: number;
  expires_at: number;
}
