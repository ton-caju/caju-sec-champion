import helmet from 'helmet';

// Configuração do Helmet para Security Headers
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: process.env.HELMET_CSP_ENABLED === 'true'
    ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Necessário para reCAPTCHA
            'https://www.google.com',
            'https://www.gstatic.com',
          ],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: [
            'https://www.google.com', // reCAPTCHA frame
          ],
        },
      }
    : false,

  // Strict Transport Security (HSTS)
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true,
  },

  // X-Frame-Options
  frameguard: {
    action: 'deny', // Previne clickjacking
  },

  // X-Content-Type-Options
  noSniff: true,

  // X-XSS-Protection (legacy, mas ainda útil)
  xssFilter: true,

  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // X-Permitted-Cross-Domain-Policies
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },

  // X-Download-Options
  ieNoOpen: true,

  // X-DNS-Prefetch-Control
  dnsPrefetchControl: {
    allow: false,
  },
});
