import { Router, type Router as RouterType } from 'express';
import { initRecovery, validateAnswers, resetPassword } from '../controllers/recoveryController';
import { getCsrfToken } from '../controllers/csrfController';
import {
  ipRateLimiter,
  cpfRateLimiter,
  sessionRateLimiter,
} from '../middleware/rateLimiting';
import { validateRecaptchaV3 } from '../middleware/captcha';
import { checkAccountLockout } from '../middleware/accountLockout';
import {
  validarInicioRecuperacao,
  validarRespostas,
  validarResetSenha,
} from '../middleware/validation';
import { csrfProtection } from '../middleware/csrf';

const router: RouterType = Router();

/**
 * GET /api/csrf-token
 * Obtém token CSRF (aplica middleware para gerar o token)
 */
router.get('/csrf-token', csrfProtection as any, getCsrfToken);

/**
 * POST /api/recovery/init
 * Inicia recuperação de senha
 *
 * Proteções aplicadas:
 * - Rate Limiting por IP (10/hora)
 * - Rate Limiting por Sessão (5/dia)
 * - Rate Limiting por CPF (3/15min)
 * - reCAPTCHA v3 validation
 * - Verificação de bloqueio de conta
 * - Validação de input (CPF)
 * - CSRF protection
 */
router.post(
  '/recovery/init',
  ipRateLimiter,
  sessionRateLimiter,
  csrfProtection as any,
  validarInicioRecuperacao,
  validateRecaptchaV3,
  cpfRateLimiter,
  checkAccountLockout,
  initRecovery
);

/**
 * POST /api/recovery/validate
 * Valida respostas das perguntas secretas
 *
 * Proteções aplicadas:
 * - Rate Limiting por IP (10/hora)
 * - Rate Limiting por Sessão (5/dia)
 * - Rate Limiting por CPF (3/15min)
 * - reCAPTCHA v3 validation
 * - Verificação de bloqueio de conta
 * - Validação de respostas
 * - CSRF protection
 */
router.post(
  '/recovery/validate',
  ipRateLimiter,
  sessionRateLimiter,
  csrfProtection as any,
  validarRespostas,
  validateRecaptchaV3,
  cpfRateLimiter,
  checkAccountLockout,
  validateAnswers
);

/**
 * POST /api/recovery/reset-password
 * Define nova senha com token de reset
 *
 * Proteções aplicadas:
 * - Rate Limiting por IP (10/hora)
 * - Rate Limiting por Sessão (5/dia)
 * - Validação de senha forte
 * - CSRF protection
 */
router.post(
  '/recovery/reset-password',
  ipRateLimiter,
  sessionRateLimiter,
  csrfProtection as any,
  validarResetSenha,
  resetPassword
);

export default router;
