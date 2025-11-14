import cors from 'cors';

// Configuração CORS restritiva
export const corsConfig = cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'X-Device-Fingerprint',
  ],
  exposedHeaders: ['X-CSRF-Token'],
  maxAge: 86400, // 24 horas
  optionsSuccessStatus: 200,
});
