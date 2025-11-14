import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface SuccessStepProps {
  redirectDelay?: number;
}

const SuccessStep: React.FC<SuccessStepProps> = ({ redirectDelay = 5 }) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = React.useState(redirectDelay);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="success-step">
      <div className="success-animation">
        <div className="checkmark">✓</div>
      </div>

      <h2>Senha Redefinida com Sucesso!</h2>
      <p className="subtitle">Sua senha foi alterada e você já pode fazer login</p>

      <div className="redirect-info">
        <p>
          Você será redirecionado para a página de login em <strong>{countdown}</strong>{' '}
          {countdown === 1 ? 'segundo' : 'segundos'}...
        </p>
      </div>

      <button onClick={() => navigate('/login')} className="primary-button">
        Ir para Login Agora
      </button>

      <div className="security-notice">
        <p>
          <strong>⚠️ Importante:</strong>
        </p>
        <ul>
          <li>Use uma senha forte e única</li>
          <li>Não compartilhe sua senha com ninguém</li>
          <li>Se você não solicitou esta alteração, entre em contato com o suporte imediatamente</li>
        </ul>
      </div>
    </div>
  );
};

export default SuccessStep;
