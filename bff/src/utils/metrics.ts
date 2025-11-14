import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

// Coletar métricas padrão do Node.js
collectDefaultMetrics({ register });

// Contador de requisições HTTP
export const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total de requisições HTTP',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Histograma de duração de requisições
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// Contador de tentativas de recuperação
export const recoveryAttemptsCounter = new Counter({
  name: 'recovery_attempts_total',
  help: 'Total de tentativas de recuperação de senha',
  labelNames: ['result'], // 'success' ou 'failure'
  registers: [register],
});

// Contador de bloqueios de conta
export const accountLockoutCounter = new Counter({
  name: 'account_lockout_total',
  help: 'Total de bloqueios de conta',
  labelNames: ['tier'], // '15min', '1hour', '24hours', 'permanent'
  registers: [register],
});

// Contador de validações de CAPTCHA
export const captchaValidationCounter = new Counter({
  name: 'captcha_validation_total',
  help: 'Total de validações de CAPTCHA',
  labelNames: ['version', 'result'], // version: 'v2' ou 'v3', result: 'success' ou 'failure'
  registers: [register],
});

// Contador de rate limiting
export const rateLimitCounter = new Counter({
  name: 'rate_limit_hits_total',
  help: 'Total de hits de rate limiting',
  labelNames: ['type'], // 'ip', 'cpf', 'session'
  registers: [register],
});

// Export register para endpoint /metrics
export { register };
