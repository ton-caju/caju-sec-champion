import React, { useEffect } from 'react';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

interface ReCaptchaV3Props {
  onTokenReceived: (token: string) => void;
  action: string;
}

const ReCaptchaV3: React.FC<ReCaptchaV3Props> = ({ onTokenReceived, action }) => {
  const siteKey = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY;

  useEffect(() => {
    const loadRecaptcha = () => {
      if (window.grecaptcha && window.grecaptcha.ready) {
        window.grecaptcha.ready(() => {
          window.grecaptcha
            .execute(siteKey, { action })
            .then((token: string) => {
              console.log('✅ reCAPTCHA v3 token obtido');
              onTokenReceived(token);
            })
            .catch((error: Error) => {
              console.error('❌ Erro ao obter token reCAPTCHA v3:', error);
            });
        });
      } else {
        // Tentar novamente após 100ms se grecaptcha ainda não estiver carregado
        setTimeout(loadRecaptcha, 100);
      }
    };

    loadRecaptcha();

    // Renovar token a cada 2 minutos (tokens expiram em ~2 minutos)
    const interval = setInterval(() => {
      loadRecaptcha();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [siteKey, action, onTokenReceived]);

  return (
    <div className="recaptcha-v3-badge">
      <small>
        Protegido por reCAPTCHA -{' '}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
          Privacidade
        </a>{' '}
        e{' '}
        <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">
          Termos
        </a>
      </small>
    </div>
  );
};

export default ReCaptchaV3;
