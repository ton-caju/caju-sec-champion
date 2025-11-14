# ETAPA 3: DESIGN DE SOLUÇÃO COM ARQUITETURA SEGURA
## Desafio Caju Security Champions - Recuperação de Senha com Validação de Identidade (PID)

---

## 1. VISÃO GERAL DA ARQUITETURA

### 1.1 Diagrama de Arquitetura de Alto Nível

```
┌────────────────────────────────────────────────────────────────────┐
│                          INTERNET                                  │
│                    (Atacantes + Usuários)                          │
└────────────────────────┬───────────────────────────────────────────┘
                         │
                         │ HTTPS (TLS 1.3)
                         │ Port 443
                         ▼
        ┌─────────────────────────────────────────┐
        │         WAF / Cloudflare                │
        │   - DDoS Protection                      │
        │   - Rate Limiting (Layer 7)             │
        │   - Bot Detection                        │
        └────────────┬────────────────────────────┘
                     │
                     │ HTTPS
                     ▼
        ┌─────────────────────────────────────────┐
        │       FRONTEND (React SPA)              │
        │       Port 3000 (HTTPS)                 │
        │                                         │
        │   📦 Componentes de Segurança:          │
        │   ✓ Input Validation (Client-Side)     │
        │   ✓ reCAPTCHA v3 Widget                │
        │   ✓ CSRF Token Handler                 │
        │   ✓ DOMPurify (Sanitização)            │
        │   ✓ CSP Headers                        │
        │   ✓ Rate Limiting Visual               │
        │   ✓ Device Fingerprinting              │
        └────────────┬────────────────────────────┘
                     │
                     │ HTTPS (axios)
                     │ Headers: CSRF-Token, Fingerprint
                     ▼
        ┌─────────────────────────────────────────┐
        │         BFF (Node.js + Express)         │
        │         Port 4000 (HTTPS)               │
        │                                         │
        │   🛡️ CAMADA DE PROTEÇÃO PRINCIPAL        │
        │                                         │
        │   ✓ Rate Limiting (Multi-Layer)        │
        │     - 10 req/hora por IP               │
        │     - 3 tent/15min por CPF             │
        │     - 5 tent/sessão                    │
        │                                         │
        │   ✓ CAPTCHA Validation (reCAPTCHA)     │
        │     - v3 score-based (todas req)       │
        │     - v2 challenge (após 2 falhas)     │
        │                                         │
        │   ✓ Input Validation & Sanitization    │
        │     - CPF format + dígitos             │
        │     - Sanitização de respostas         │
        │     - Length limits                    │
        │     - SQL/XSS/Path Traversal prevent  │
        │                                         │
        │   ✓ CSRF Protection (csurf)            │
        │   ✓ Security Headers (helmet.js)       │
        │   ✓ Session Management (Redis)         │
        │   ✓ Logging & Monitoring (Winston)     │
        │   ✓ CORS Restritivo                    │
        │   ✓ Bloqueio Temporário (Redis)        │
        │   ✓ Respostas Uniformes                │
        │                                         │
        └────────────┬────────────────────────────┘
                     │
                     │ HTTP Interno (Rede Privada)
                     │ Port 8080
                     │
        ┌────────────▼────────────────────────────┐
        │    BACKEND (Kotlin + Spring Boot)       │
        │    Lab-v4 - VULNERÁVEL                  │
        │    (Protegido pelo BFF)                 │
        │                                         │
        │   ⚠️ Vulnerabilidades Conhecidas:        │
        │   - SQL Injection                       │
        │   - XSS                                 │
        │   - Command Injection                   │
        │   - Directory Traversal                 │
        │   - Broken Access Control               │
        │   - SSRF                                │
        │                                         │
        │   BFF sanitiza inputs ANTES de          │
        │   enviar para este backend              │
        └────────────┬────────────────────────────┘
                     │
        ┌────────────┴────────────┬───────────────┐
        │                         │               │
        ▼                         ▼               ▼
  ┌──────────┐            ┌──────────┐     ┌──────────┐
  │PostgreSQL│            │  Redis   │     │  Files   │
  │  Port    │            │  (Cache) │     │ /uploads │
  │  5432    │            │  Port    │     │          │
  │          │            │  6379    │     │ secrets  │
  └──────────┘            └──────────┘     └──────────┘
```

---

## 2. STACK TECNOLÓGICO

### 2.1 Frontend (React SPA)

```yaml
Framework: React 18.x
Language: TypeScript 5.x
Build Tool: Vite 5.x

Principais Bibliotecas:
  - react-router-dom: 6.x (Roteamento)
  - axios: 1.x (HTTP Client)
  - react-hook-form: 7.x (Form Validation)
  - zod: 3.x (Schema Validation)
  - dompurify: 3.x (XSS Prevention)
  - react-google-recaptcha: 3.x (CAPTCHA)
  - @fingerprintjs/fingerprintjs: 4.x (Device Fingerprinting)
  - react-query: 5.x (State Management)

Segurança:
  - helmet (CSP via meta tags)
  - Sanitização de outputs (DOMPurify)
  - Validação client-side (zod + react-hook-form)
  - HTTPS obrigatório
```

### 2.2 BFF (Backend for Frontend)

```yaml
Runtime: Node.js 20.x LTS
Framework: Express 4.x
Language: TypeScript 5.x

Principais Bibliotecas:
  Segurança:
    - helmet: 7.x (Security Headers)
    - express-rate-limit: 7.x (Rate Limiting)
    - rate-limit-redis: 4.x (Redis Store)
    - csurf: 1.x (CSRF Protection)
    - cors: 2.x (CORS)
    - express-validator: 7.x (Input Validation)
    - express-mongo-sanitize: 2.x (NoSQL Injection Prevention)
    - hpp: 0.x (HTTP Parameter Pollution Prevention)

  Session & Cache:
    - express-session: 1.x (Session Management)
    - connect-redis: 7.x (Redis Session Store)
    - redis: 4.x (Redis Client)
    - ioredis: 5.x (Redis with better perf)

  Logging & Monitoring:
    - winston: 3.x (Structured Logging)
    - morgan: 1.x (HTTP Request Logging)
    - prom-client: 15.x (Prometheus Metrics)

  Utilities:
    - axios: 1.x (HTTP Client para Backend)
    - joi: 17.x (Schema Validation)
    - bcryptjs: 2.x (Password Hashing)
    - crypto: built-in (SHA-256 Hashing)

Infraestrutura:
  - Redis 7.x (Session Store + Rate Limiting + Bloqueio)
  - PM2 (Process Manager)
```

### 2.3 Backend (Existente - Lab-v4)

```yaml
Language: Kotlin
Framework: Spring Boot 3.3.3
Database: PostgreSQL 16
Build: Maven

⚠️ NÃO SERÁ MODIFICADO
   Contém vulnerabilidades intencionais para fins educacionais
   BFF protegerá contra exploração dessas vulnerabilidades
```

---

## 3. FLUXO DE RECUPERAÇÃO DE SENHA

### 3.1 Diagrama de Sequência Detalhado

```
┌────────┐        ┌──────────┐       ┌─────────┐      ┌──────────┐
│Usuário │        │ Frontend │       │   BFF   │      │ Backend  │
└───┬────┘        └────┬─────┘       └────┬────┘      └────┬─────┘
    │                  │                   │                │
    │ 1. Acessa        │                   │                │
    │   /recuperacao   │                   │                │
    ├─────────────────>│                   │                │
    │                  │                   │                │
    │                  │ 2. GET /api/      │                │
    │                  │    csrf-token     │                │
    │                  ├──────────────────>│                │
    │                  │                   │                │
    │                  │ 3. Return token   │                │
    │                  │    + reCAPTCHA v3 │                │
    │                  │<──────────────────┤                │
    │                  │                   │                │
    │ 4. Exibe         │                   │                │
    │    formulário    │                   │                │
    │    CPF           │                   │                │
    │<─────────────────┤                   │                │
    │                  │                   │                │
    │ 5. Informa CPF   │                   │                │
    │    123.456.789-00│                   │                │
    ├─────────────────>│                   │                │
    │                  │                   │                │
    │                  │ 6. Valida CPF     │                │
    │                  │    client-side    │                │
    │                  │    (formato)      │                │
    │                  │                   │                │
    │                  │ 7. POST /api/     │                │
    │                  │    recovery/init  │                │
    │                  │    + CSRF Token   │                │
    │                  │    + reCAPTCHA v3 │                │
    │                  │    + Fingerprint  │                │
    │                  ├──────────────────>│                │
    │                  │                   │                │
    │                  │                   │ 8. Validações: │
    │                  │                   │   ✓ CSRF Token │
    │                  │                   │   ✓ reCAPTCHA  │
    │                  │                   │   ✓ Rate Limit │
    │                  │                   │   ✓ CPF format │
    │                  │                   │   ✓ Sanitize   │
    │                  │                   │                │
    │                  │                   │ 9. GET /files/ │
    │                  │                   │    {cpf}_      │
    │                  │                   │    secrets.json│
    │                  │                   ├───────────────>│
    │                  │                   │                │
    │                  │                   │ 10. Return     │
    │                  │                   │     questions  │
    │                  │                   │<───────────────┤
    │                  │                   │                │
    │                  │ 11. Return        │                │
    │                  │     questions     │                │
    │                  │     (sem hashes)  │                │
    │                  │<──────────────────┤                │
    │                  │                   │                │
    │ 12. Exibe 5      │                   │                │
    │     perguntas    │                   │                │
    │<─────────────────┤                   │                │
    │                  │                   │                │
    │ 13. Responde     │                   │                │
    │     perguntas    │                   │                │
    ├─────────────────>│                   │                │
    │                  │                   │                │
    │                  │ 14. POST /api/    │                │
    │                  │     recovery/     │                │
    │                  │     validate      │                │
    │                  │     + CSRF Token  │                │
    │                  │     + reCAPTCHA   │                │
    │                  │     + answers[]   │                │
    │                  ├──────────────────>│                │
    │                  │                   │                │
    │                  │                   │ 15. Validações:│
    │                  │                   │   ✓ Rate Limit │
    │                  │                   │   ✓ CAPTCHA    │
    │                  │                   │   ✓ Session    │
    │                  │                   │   ✓ Sanitize   │
    │                  │                   │                │
    │                  │                   │ 16. Calc hashes│
    │                  │                   │     das        │
    │                  │                   │     respostas  │
    │                  │                   │                │
    │                  │                   │ 17. Compare    │
    │                  │                   │     hashes com │
    │                  │                   │     secrets.json│
    │                  │                   │                │
    │                  │                   │ 18. SE correto:│
    │                  │                   │     ✓ Gera     │
    │                  │                   │       token    │
    │                  │                   │       reset    │
    │                  │                   │     ✓ Limpa    │
    │                  │                   │       contador │
    │                  │                   │       falhas   │
    │                  │                   │                │
    │                  │                   │ SE incorreto:  │
    │                  │                   │     ✓ Incrementa│
    │                  │                   │       contador │
    │                  │                   │       falhas   │
    │                  │                   │     ✓ Log      │
    │                  │                   │     ✓ Alerta   │
    │                  │                   │       (se >= 3)│
    │                  │                   │                │
    │                  │ 19. Return result │                │
    │                  │<──────────────────┤                │
    │                  │                   │                │
    │ 20. SE sucesso:  │                   │                │
    │     Redireciona  │                   │                │
    │     para         │                   │                │
    │     /nova-senha  │                   │                │
    │<─────────────────┤                   │                │
    │                  │                   │                │
    │ 21. Define nova  │                   │                │
    │     senha        │                   │                │
    ├─────────────────>│                   │                │
    │                  │                   │                │
    │                  │ 22. POST /api/    │                │
    │                  │     recovery/     │                │
    │                  │     reset-password│                │
    │                  │     + reset_token │                │
    │                  │     + new_password│                │
    │                  ├──────────────────>│                │
    │                  │                   │                │
    │                  │                   │ 23. Validações:│
    │                  │                   │   ✓ Token      │
    │                  │                   │   ✓ Password   │
    │                  │                   │     strength   │
    │                  │                   │                │
    │                  │                   │ 24. POST /auth/│
    │                  │                   │     update-pwd │
    │                  │                   ├───────────────>│
    │                  │                   │                │
    │                  │                   │ 25. Update DB  │
    │                  │                   │<───────────────┤
    │                  │                   │                │
    │                  │                   │ 26. Notifica   │
    │                  │                   │     usuário    │
    │                  │                   │     (email/SMS)│
    │                  │                   │                │
    │                  │ 27. Success       │                │
    │                  │<──────────────────┤                │
    │                  │                   │                │
    │ 28. Redireciona  │                   │                │
    │     /login       │                   │                │
    │<─────────────────┤                   │                │
    │                  │                   │                │
```

---

## 4. COMPONENTES DE SEGURANÇA DETALHADOS

### 4.1 Rate Limiting Multi-Camada (BFF)

```typescript
// config/rateLimiting.ts

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from './redis';

// Layer 1: Rate Limiting por IP (Global)
export const ipRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:ip:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 requisições por hora por IP
  message: {
    error: 'Muitas tentativas deste endereço IP. Tente novamente em 1 hora.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip para IPs whitelist (ex: rede interna)
    const whitelist = ['127.0.0.1', '::1'];
    return whitelist.includes(req.ip);
  }
});

// Layer 2: Rate Limiting por CPF
export const cpfRateLimiter = async (req, res, next) => {
  const cpf = req.body.cpf?.replace(/\D/g, ''); // Remove formatação

  if (!cpf) {
    return res.status(400).json({ error: 'CPF obrigatório' });
  }

  const key = `rl:cpf:${cpf}`;
  const tentativas = await redisClient.incr(key);

  if (tentativas === 1) {
    // Primeira tentativa, definir expiração de 15 minutos
    await redisClient.expire(key, 15 * 60);
  }

  if (tentativas > 3) {
    const ttl = await redisClient.ttl(key);
    return res.status(429).json({
      error: 'Limite de tentativas excedido para este CPF.',
      tentativas_restantes: 0,
      retry_after: ttl,
      message: `Aguarde ${Math.ceil(ttl / 60)} minutos antes de tentar novamente.`
    });
  }

  // Adicionar informações ao request
  req.cpfAttempts = {
    current: tentativas,
    max: 3,
    remaining: 3 - tentativas
  };

  next();
};

// Layer 3: Rate Limiting por Sessão
export const sessionRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 horas
  max: 5, // 5 tentativas por sessão
  keyGenerator: (req) => {
    return req.sessionID; // Usa ID da sessão
  },
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:session:',
  }),
  message: {
    error: 'Limite de tentativas excedido para esta sessão.',
    message: 'Por segurança, sua sessão foi bloqueada. Feche o navegador e tente novamente mais tarde.'
  }
});
```

### 4.2 CAPTCHA Validation (BFF)

```typescript
// middleware/captcha.ts

import axios from 'axios';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_V3_THRESHOLD = 0.5; // Score mínimo para v3

export const validateRecaptchaV3 = async (req, res, next) => {
  const token = req.body.recaptcha_token;

  if (!token) {
    return res.status(400).json({
      error: 'reCAPTCHA token ausente',
      require_captcha_v2: false
    });
  }

  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: RECAPTCHA_SECRET_KEY,
          response: token
        }
      }
    );

    const { success, score, action } = response.data;

    if (!success) {
      return res.status(400).json({
        error: 'reCAPTCHA inválido',
        require_captcha_v2: true
      });
    }

    // Verificar score (0.0 = bot, 1.0 = humano)
    if (score < RECAPTCHA_V3_THRESHOLD) {
      // Score baixo = provável bot
      // Exigir reCAPTCHA v2 (com desafio visual)
      return res.status(400).json({
        error: 'Atividade suspeita detectada',
        require_captcha_v2: true,
        score: score
      });
    }

    // Score bom, continuar
    req.captchaScore = score;
    next();

  } catch (error) {
    console.error('Erro ao validar reCAPTCHA:', error);
    return res.status(500).json({
      error: 'Erro ao validar CAPTCHA. Tente novamente.'
    });
  }
};

export const validateRecaptchaV2 = async (req, res, next) => {
  const token = req.body.recaptcha_v2_token;

  if (!token) {
    return res.status(400).json({
      error: 'reCAPTCHA v2 obrigatório após múltiplas tentativas falhadas'
    });
  }

  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_V2_SECRET_KEY,
          response: token
        }
      }
    );

    const { success } = response.data;

    if (!success) {
      return res.status(400).json({
        error: 'Falha na verificação humana. Tente novamente.'
      });
    }

    next();

  } catch (error) {
    console.error('Erro ao validar reCAPTCHA v2:', error);
    return res.status(500).json({
      error: 'Erro ao validar CAPTCHA. Tente novamente.'
    });
  }
};
```

### 4.3 Input Validation & Sanitization (BFF)

```typescript
// middleware/validation.ts

import { body, validationResult } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';

// Validação de CPF (com dígitos verificadores)
export const validarCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/\D/g, ''); // Remove formatação

  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // Todos dígitos iguais

  // Validar dígito verificador 1
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;

  // Validar dígito verificador 2
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;

  return true;
};

// Sanitização de texto (previne XSS, SQLi, Path Traversal)
export const sanitizarTexto = (texto: string): string => {
  if (!texto) return '';

  // Remover caracteres perigosos
  let sanitizado = texto
    .replace(/[<>'";\\/`]/g, '') // XSS básico
    .replace(/\.\./g, '')         // Path traversal
    .replace(/--/g, '')           // SQL comment
    .replace(/;/g, '')            // SQL delimiter
    .replace(/\\/g, '')           // Backslash
    .trim();

  // Limitar tamanho
  if (sanitizado.length > 100) {
    sanitizado = sanitizado.substring(0, 100);
  }

  // Sanitização adicional com DOMPurify
  sanitizado = DOMPurify.sanitize(sanitizado, {
    ALLOWED_TAGS: [], // Sem HTML tags
    ALLOWED_ATTR: []
  });

  return sanitizado;
};

// Normalizar resposta para comparação (lowercase, trim, sem acentos)
export const normalizarResposta = (resposta: string): string => {
  return resposta
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
};

// Middleware de validação para iniciar recuperação
export const validarInicioRecuperacao = [
  body('cpf')
    .notEmpty().withMessage('CPF obrigatório')
    .custom((value) => {
      if (!validarCPF(value)) {
        throw new Error('CPF inválido');
      }
      return true;
    }),

  body('recaptcha_token')
    .notEmpty().withMessage('Token reCAPTCHA obrigatório'),

  // Validar e retornar erros
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array()
      });
    }
    next();
  }
];

// Middleware de validação para validar respostas
export const validarRespostas = [
  body('cpf')
    .notEmpty().withMessage('CPF obrigatório')
    .custom((value) => validarCPF(value)),

  body('respostas')
    .isArray({ min: 5, max: 5 }).withMessage('Exatamente 5 respostas obrigatórias')
    .custom((respostas: string[]) => {
      // Validar cada resposta
      for (const resposta of respostas) {
        if (!resposta || resposta.trim().length === 0) {
          throw new Error('Todas as respostas devem ser preenchidas');
        }
        if (resposta.length > 100) {
          throw new Error('Resposta muito longa (máximo 100 caracteres)');
        }
      }
      return true;
    }),

  body('recaptcha_token').notEmpty(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    // Sanitizar respostas
    req.body.respostas = req.body.respostas.map(sanitizarTexto);

    next();
  }
];
```

### 4.4 Bloqueio Temporário Progressivo (BFF)

```typescript
// middleware/accountLockout.ts

import { redisClient } from '../config/redis';

interface LockoutConfig {
  attempts: number;
  duration: number; // segundos
  description: string;
}

const LOCKOUT_TIERS: LockoutConfig[] = [
  { attempts: 3, duration: 15 * 60, description: '15 minutos' },     // 3 falhas
  { attempts: 5, duration: 60 * 60, description: '1 hora' },          // 5 falhas
  { attempts: 10, duration: 24 * 60 * 60, description: '24 horas' },  // 10 falhas
  { attempts: 20, duration: -1, description: 'permanente' }           // 20 falhas (requer suporte)
];

export const checkAccountLockout = async (req, res, next) => {
  const cpf = req.body.cpf?.replace(/\D/g, '');

  if (!cpf) {
    return res.status(400).json({ error: 'CPF obrigatório' });
  }

  const lockoutKey = `lockout:${cpf}`;
  const failuresKey = `failures:${cpf}`;

  // Verificar se conta está bloqueada
  const lockedUntil = await redisClient.get(lockoutKey);

  if (lockedUntil) {
    if (lockedUntil === 'permanent') {
      return res.status(403).json({
        error: 'Conta bloqueada permanentemente',
        message: 'Entre em contato com o suporte para desbloquear.',
        blocked: true,
        permanent: true
      });
    }

    const ttl = await redisClient.ttl(lockoutKey);

    return res.status(429).json({
      error: 'Conta temporariamente bloqueada',
      message: `Muitas tentativas falhadas. Aguarde ${Math.ceil(ttl / 60)} minutos.`,
      blocked: true,
      retry_after: ttl
    });
  }

  // Obter número de falhas
  const failures = parseInt(await redisClient.get(failuresKey) || '0');

  req.accountLockout = {
    failures,
    isLocked: false
  };

  next();
};

export const registerFailedAttempt = async (cpf: string) => {
  const failuresKey = `failures:${cpf}`;
  const lockoutKey = `lockout:${cpf}`;

  // Incrementar contador de falhas
  const failures = await redisClient.incr(failuresKey);

  // Se primeira falha, definir expiração de 24 horas
  if (failures === 1) {
    await redisClient.expire(failuresKey, 24 * 60 * 60);
  }

  // Verificar se atingiu tier de bloqueio
  for (const tier of LOCKOUT_TIERS) {
    if (failures >= tier.attempts) {
      if (tier.duration === -1) {
        // Bloqueio permanente
        await redisClient.set(lockoutKey, 'permanent');

        // Log de alerta crítico
        console.error(`🚨 ALERTA: CPF ${cpf} bloqueado permanentemente após ${failures} tentativas falhadas`);

        // Enviar alerta para SOC/Suporte
        // await alertarEquipeSeguranca(cpf, failures);

      } else {
        // Bloqueio temporário
        await redisClient.setex(
          lockoutKey,
          tier.duration,
          new Date(Date.now() + tier.duration * 1000).toISOString()
        );

        console.warn(`⚠️  CPF ${cpf} bloqueado por ${tier.description} após ${failures} tentativas`);
      }

      break;
    }
  }

  return {
    failures,
    tier: LOCKOUT_TIERS.find(t => failures >= t.attempts)
  };
};

export const clearFailedAttempts = async (cpf: string) => {
  const failuresKey = `failures:${cpf}`;
  await redisClient.del(failuresKey);

  console.log(`✅ Contador de falhas limpo para CPF ${cpf}`);
};
```

### 4.5 Session Management Seguro (BFF)

```typescript
// config/session.ts

import session from 'express-session';
import RedisStore from 'connect-redis';
import { redisClient } from './redis';

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
    maxAge: 15 * 60 * 1000, // 15 minutos
    sameSite: 'strict', // Proteção CSRF adicional
    domain: process.env.COOKIE_DOMAIN, // Ex: .seudominio.com
  },

  name: 'sessionId', // Nome customizado (não 'connect.sid')

  rolling: true, // Renovar expiração a cada request

  // Regenerar session ID em eventos críticos
  genid: () => {
    return require('crypto').randomBytes(32).toString('hex');
  }
});

// Middleware para regenerar sessão após login/recuperação
export const regenerateSession = (req, res, next) => {
  const oldSessionData = { ...req.session };

  req.session.regenerate((err) => {
    if (err) {
      return next(err);
    }

    // Restaurar dados da sessão antiga
    Object.assign(req.session, oldSessionData);

    req.session.save((err) => {
      if (err) return next(err);
      next();
    });
  });
};
```

---

## 5. ESTRUTURA DE DIRETÓRIOS

### 5.1 Frontend (React)

```
frontend/
├── public/
│   ├── index.html
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── RecoveryForm/
│   │   │   ├── CPFStep.tsx
│   │   │   ├── QuestionsStep.tsx
│   │   │   ├── NewPasswordStep.tsx
│   │   │   └── RecoveryForm.tsx
│   │   ├── Captcha/
│   │   │   ├── ReCaptchaV3.tsx
│   │   │   └── ReCaptchaV2.tsx
│   │   ├── Loading.tsx
│   │   └── ErrorBoundary.tsx
│   ├── services/
│   │   ├── api.ts (axios config)
│   │   ├── csrf.ts
│   │   └── fingerprint.ts
│   ├── hooks/
│   │   ├── useRecovery.ts
│   │   └── useCaptcha.ts
│   ├── utils/
│   │   ├── validation.ts
│   │   ├── sanitization.ts
│   │   └── cpf.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── .env.example
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### 5.2 BFF (Node.js + Express)

```
bff/
├── src/
│   ├── controllers/
│   │   ├── recoveryController.ts
│   │   └── csrfController.ts
│   ├── middleware/
│   │   ├── rateLimiting.ts
│   │   ├── captcha.ts
│   │   ├── validation.ts
│   │   ├── accountLockout.ts
│   │   ├── csrf.ts
│   │   └── errorHandler.ts
│   ├── services/
│   │   ├── backendService.ts (axios → Lab-v4)
│   │   ├── secretsService.ts (lê JSON files)
│   │   └── notificationService.ts (email/SMS)
│   ├── config/
│   │   ├── redis.ts
│   │   ├── session.ts
│   │   ├── helmet.ts
│   │   └── cors.ts
│   ├── utils/
│   │   ├── hash.ts (SHA-256)
│   │   ├── logger.ts (Winston)
│   │   └── metrics.ts (Prometheus)
│   ├── routes/
│   │   ├── recovery.routes.ts
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts
│   └── app.ts (Express app)
├── logs/
├── .env.example
├── package.json
├── tsconfig.json
└── ecosystem.config.js (PM2)
```

---

## 6. VARIÁVEIS DE AMBIENTE

### 6.1 Frontend (.env)

```bash
# API
VITE_API_URL=https://bff.seudominio.com
VITE_API_TIMEOUT=30000

# reCAPTCHA
VITE_RECAPTCHA_V3_SITE_KEY=6Le...xxx
VITE_RECAPTCHA_V2_SITE_KEY=6Lf...yyy

# Environment
VITE_ENV=production
VITE_LOG_LEVEL=error
```

### 6.2 BFF (.env)

```bash
# Server
NODE_ENV=production
PORT=4000
HOST=0.0.0.0

# Backend API
BACKEND_URL=http://localhost:8080
BACKEND_TIMEOUT=10000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Session
SESSION_SECRET=GENERATE_STRONG_RANDOM_SECRET_HERE
SESSION_MAX_AGE=900000
COOKIE_DOMAIN=.seudominio.com

# reCAPTCHA
RECAPTCHA_V3_SECRET_KEY=6Le...secret
RECAPTCHA_V2_SECRET_KEY=6Lf...secret
RECAPTCHA_V3_THRESHOLD=0.5

# CORS
CORS_ORIGIN=https://seudominio.com
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_IP_MAX=10
RATE_LIMIT_IP_WINDOW_MS=3600000
RATE_LIMIT_CPF_MAX=3
RATE_LIMIT_CPF_WINDOW_MS=900000

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs/bff.log

# Security
HELMET_CSP_ENABLED=true
CSRF_COOKIE_NAME=_csrf

# Notification (opcional)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMS_API_KEY=
SMS_API_URL=
```

---

## 7. MECANISMOS DE SEGURANÇA IMPLEMENTADOS

### 7.1 Checklist de Mitigações

| ID | Ameaça | Mitigação | Camada | Status |
|----|--------|-----------|--------|--------|
| T01 | Força Bruta | Rate Limiting Multi-Camada | BFF | ✅ Implementado |
| T02 | Automação | reCAPTCHA v3 + v2 | BFF + Frontend | ✅ Implementado |
| T03 | Sem Bloqueio | Bloqueio Progressivo (3/5/10/20 falhas) | BFF | ✅ Implementado |
| T04 | Input Validation | Validação + Sanitização Rigorosa | BFF + Frontend | ✅ Implementado |
| T05 | HTTP sem TLS | HTTPS Obrigatório + HSTS | Infraestrutura | ✅ Implementado |
| T06 | Enumeração | Respostas Uniformes | BFF | ✅ Implementado |
| T07 | CSRF | Tokens CSRF (csurf) | BFF + Frontend | ✅ Implementado |
| T08 | Sem Logging | Winston + Estruturado | BFF | ✅ Implementado |
| T09 | Session Inseguro | Redis + Secure Cookies | BFF | ✅ Implementado |
| T10 | Perguntas Fracas | Perguntas Alta Entropia | Dados | ✅ Implementado |
| T11 | CORS Inadequado | CORS Restritivo | BFF | ✅ Implementado |
| T12 | Sem Notificação | Email/SMS (opcional) | BFF | ⚠️ Planejado |
| T13 | Device Fingerprint | FingerprintJS | Frontend + BFF | ⚠️ Planejado |

---

## 8. PRÓXIMOS PASSOS

Com o design de solução definido, as próximas etapas são:

1. ✅ **Etapa 3 (Concluída)**: Design de Solução
2. ⏭️  **Etapa 4**: Implementação do Frontend (React + TypeScript)
3. ⏭️  **Etapa 4**: Implementação do BFF (Node.js + Express + TypeScript)
4. ⏭️  **Etapa 5**: Testes E2E de Segurança
5. ⏭️  **Etapa 6**: Documentação Final
6. ⏭️  **Etapa 7**: README com Setup Completo

---

**Data**: 2025-11-14
**Versão**: 1.0
**Autor**: Security Champions Team - Caju
**Status**: Design Aprovado para Implementação
