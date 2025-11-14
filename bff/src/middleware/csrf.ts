import csrf from 'csurf';

// Configuração de CSRF Protection
export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    key: process.env.CSRF_COOKIE_NAME || '_csrf',
  },
});
