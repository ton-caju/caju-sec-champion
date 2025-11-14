import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

interface ReCaptchaV2Props {
  onTokenReceived: (token: string) => void;
  onExpired?: () => void;
  onError?: () => void;
}

const ReCaptchaV2: React.FC<ReCaptchaV2Props> = ({ onTokenReceived, onExpired, onError }) => {
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const siteKey = import.meta.env.VITE_RECAPTCHA_V2_SITE_KEY;

  useEffect(() => {
    const loadRecaptcha = () => {
      if (window.grecaptcha && window.grecaptcha.ready && recaptchaRef.current) {
        window.grecaptcha.ready(() => {
          try {
            widgetIdRef.current = window.grecaptcha.render(recaptchaRef.current, {
              sitekey: siteKey,
              callback: (token: string) => {
                console.log('✅ reCAPTCHA v2 resolvido');
                onTokenReceived(token);
              },
              'expired-callback': () => {
                console.warn('⚠️ reCAPTCHA v2 expirado');
                if (onExpired) onExpired();
              },
              'error-callback': () => {
                console.error('❌ Erro no reCAPTCHA v2');
                if (onError) onError();
              },
            });
          } catch (error) {
            console.error('❌ Erro ao renderizar reCAPTCHA v2:', error);
          }
        });
      } else {
        // Tentar novamente após 100ms
        setTimeout(loadRecaptcha, 100);
      }
    };

    loadRecaptcha();

    // Cleanup ao desmontar
    return () => {
      if (widgetIdRef.current !== null && window.grecaptcha) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
        } catch (error) {
          console.error('Erro ao limpar reCAPTCHA:', error);
        }
      }
    };
  }, [siteKey, onTokenReceived, onExpired, onError]);

  return (
    <div className="recaptcha-v2-container">
      <div ref={recaptchaRef}></div>
    </div>
  );
};

export default ReCaptchaV2;
