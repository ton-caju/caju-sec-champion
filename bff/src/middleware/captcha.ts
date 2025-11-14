import axios from 'axios';
import { CustomRequest } from '../types';
import { Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { captchaValidationCounter } from '../utils/metrics';

const RECAPTCHA_V3_SECRET_KEY = process.env.RECAPTCHA_V3_SECRET_KEY;
const RECAPTCHA_V2_SECRET_KEY = process.env.RECAPTCHA_V2_SECRET_KEY;
const RECAPTCHA_V3_THRESHOLD = parseFloat(process.env.RECAPTCHA_V3_THRESHOLD || '0.5');

/**
 * Valida reCAPTCHA v3 (invisível, score-based)
 */
export const validateRecaptchaV3 = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.body.recaptcha_token;

  if (!token) {
    return res.status(400).json({
      error: 'reCAPTCHA token ausente',
      require_captcha_v2: false,
    });
  }

  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: RECAPTCHA_V3_SECRET_KEY,
          response: token,
        },
      }
    );

    const { success, score, action } = response.data;

    if (!success) {
      captchaValidationCounter.inc({ version: 'v3', result: 'failure' });
      logger.warn('reCAPTCHA v3 validation failed', {
        success,
        score,
        action,
      });

      return res.status(400).json({
        error: 'reCAPTCHA inválido',
        require_captcha_v2: true,
      });
    }

    // Verificar score (0.0 = bot, 1.0 = humano)
    if (score < RECAPTCHA_V3_THRESHOLD) {
      captchaValidationCounter.inc({ version: 'v3', result: 'low_score' });
      logger.warn('reCAPTCHA v3 score baixo - possível bot', {
        score,
        threshold: RECAPTCHA_V3_THRESHOLD,
        action,
      });

      // Score baixo = provável bot
      // Exigir reCAPTCHA v2 (com desafio visual)
      return res.status(400).json({
        error: 'Atividade suspeita detectada',
        require_captcha_v2: true,
        score: score,
      });
    }

    // Score bom, continuar
    captchaValidationCounter.inc({ version: 'v3', result: 'success' });
    req.captchaScore = score;
    logger.info('reCAPTCHA v3 validado com sucesso', { score, action });
    next();
  } catch (error: any) {
    logger.error('Erro ao validar reCAPTCHA v3', { error: error.message });
    return res.status(500).json({
      error: 'Erro ao validar CAPTCHA. Tente novamente.',
    });
  }
};

/**
 * Valida reCAPTCHA v2 (desafio visual)
 * Usado quando v3 falha ou retorna score baixo
 */
export const validateRecaptchaV2 = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.body.recaptcha_v2_token;

  if (!token) {
    return res.status(400).json({
      error: 'reCAPTCHA v2 obrigatório após múltiplas tentativas falhadas',
    });
  }

  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: RECAPTCHA_V2_SECRET_KEY,
          response: token,
        },
      }
    );

    const { success } = response.data;

    if (!success) {
      captchaValidationCounter.inc({ version: 'v2', result: 'failure' });
      logger.warn('reCAPTCHA v2 validation failed', response.data);

      return res.status(400).json({
        error: 'Falha na verificação humana. Tente novamente.',
      });
    }

    captchaValidationCounter.inc({ version: 'v2', result: 'success' });
    logger.info('reCAPTCHA v2 validado com sucesso');
    next();
  } catch (error: any) {
    logger.error('Erro ao validar reCAPTCHA v2', { error: error.message });
    return res.status(500).json({
      error: 'Erro ao validar CAPTCHA. Tente novamente.',
    });
  }
};
