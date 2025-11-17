import session from 'express-session';
import RedisStore from 'connect-redis';
import { redisClient } from './redis';
import crypto from 'crypto';

// Configuração de sessão com Redis Store
export const sessionConfig = session({
  store: new RedisStore({
    client: redisClient,
    prefix: 'sess:',
  }),

  secret: process.env.SESSION_SECRET || 'CHANGE_THIS_IN_PRODUCTION',

  resave: false,
  saveUninitialized: false,

  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only em produção
    httpOnly: true, // Não acessível via JavaScript
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '900000', 10), // 15 minutos
    sameSite: 'lax', // Permite cookies em navegação cross-site (localhost:3000 -> localhost:4000)
    domain: process.env.COOKIE_DOMAIN || undefined,
  },

  name: 'sessionId', // Nome customizado (não 'connect.sid')

  rolling: true, // Renovar expiração a cada request

  // Regenerar session ID em eventos críticos
  genid: () => {
    return crypto.randomBytes(32).toString('hex');
  },
});

// Middleware para regenerar sessão após login/recuperação
export const regenerateSession = (req: any, res: any, next: any) => {
  const oldSessionData = { ...req.session };

  req.session.regenerate((err: any) => {
    if (err) {
      return next(err);
    }

    // Restaurar dados da sessão antiga
    Object.assign(req.session, oldSessionData);

    req.session.save((err: any) => {
      if (err) return next(err);
      next();
    });
  });
};
