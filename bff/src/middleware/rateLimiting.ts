import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis';
import { CustomRequest } from '../types';
import { Response, NextFunction } from 'express';
import { rateLimitCounter } from '../utils/metrics';

// Layer 1: Rate Limiting por IP (Global)
export const ipRateLimiter = rateLimit({
  store: new RedisStore({
    // @ts-ignore - RedisStore aceita client do redis v4
    client: redisClient,
    prefix: 'rl:ip:',
  }),
  windowMs: parseInt(process.env.RATE_LIMIT_IP_WINDOW_MS || '3600000', 10), // 1 hora
  max: parseInt(process.env.RATE_LIMIT_IP_MAX || '10', 10), // 10 requisições por hora por IP
  message: {
    error: 'Muitas tentativas deste endereço IP. Tente novamente em 1 hora.',
    retryAfter: 3600,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip para IPs whitelist (ex: rede interna)
    const whitelist = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
    return whitelist.includes(req.ip || '');
  },
  handler: (req, res) => {
    rateLimitCounter.inc({ type: 'ip' });
    res.status(429).json({
      error: 'Muitas tentativas deste endereço IP',
      message: 'Tente novamente em 1 hora.',
      retryAfter: 3600,
    });
  },
});

// Layer 2: Rate Limiting por CPF
export const cpfRateLimiter = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const cpf = req.body.cpf?.replace(/\D/g, ''); // Remove formatação

  if (!cpf) {
    return res.status(400).json({ error: 'CPF obrigatório' });
  }

  const key = `rl:cpf:${cpf}`;
  const tentativas = await redisClient.incr(key);

  if (tentativas === 1) {
    // Primeira tentativa, definir expiração
    const windowMs = parseInt(process.env.RATE_LIMIT_CPF_WINDOW_MS || '900000', 10); // 15 minutos
    await redisClient.expire(key, Math.floor(windowMs / 1000));
  }

  const maxAttempts = parseInt(process.env.RATE_LIMIT_CPF_MAX || '3', 10);

  if (tentativas > maxAttempts) {
    rateLimitCounter.inc({ type: 'cpf' });
    const ttl = await redisClient.ttl(key);
    return res.status(429).json({
      error: 'Limite de tentativas excedido para este CPF.',
      tentativas_restantes: 0,
      retry_after: ttl,
      message: `Aguarde ${Math.ceil(ttl / 60)} minutos antes de tentar novamente.`,
    });
  }

  // Adicionar informações ao request
  req.cpfAttempts = {
    current: tentativas,
    max: maxAttempts,
    remaining: maxAttempts - tentativas,
  };

  next();
};

// Layer 3: Rate Limiting por Sessão
export const sessionRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 horas
  max: 5, // 5 tentativas por sessão
  keyGenerator: (req: any) => {
    return req.sessionID; // Usa ID da sessão
  },
  store: new RedisStore({
    // @ts-ignore
    client: redisClient,
    prefix: 'rl:session:',
  }),
  message: {
    error: 'Limite de tentativas excedido para esta sessão.',
    message:
      'Por segurança, sua sessão foi bloqueada. Feche o navegador e tente novamente mais tarde.',
  },
  handler: (req, res) => {
    rateLimitCounter.inc({ type: 'session' });
    res.status(429).json({
      error: 'Limite de tentativas excedido para esta sessão',
      message:
        'Por segurança, sua sessão foi bloqueada. Feche o navegador e tente novamente mais tarde.',
    });
  },
});
