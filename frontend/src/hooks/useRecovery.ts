import { useState, useEffect } from 'react';
import { recoveryService } from '../services/recovery';
import type { SecretQuestion } from '../types';

type RecoveryStep = 'cpf' | 'questions' | 'new-password' | 'success';

interface UseRecoveryReturn {
  step: RecoveryStep;
  loading: boolean;
  error: string | null;
  cpf: string;
  questions: SecretQuestion[];
  resetToken: string;
  attempts?: number;
  failures?: number;
  requireCaptchaV2: boolean;
  initRecovery: (cpf: string, recaptchaToken: string) => Promise<void>;
  validateAnswers: (answers: string[], recaptchaToken: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  clearError: () => void;
}

export const useRecovery = (): UseRecoveryReturn => {
  const [step, setStep] = useState<RecoveryStep>('cpf');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cpf, setCpf] = useState('');
  const [questions, setQuestions] = useState<SecretQuestion[]>([]);
  const [resetToken, setResetToken] = useState('');
  const [attempts, setAttempts] = useState<number | undefined>(undefined);
  const [failures, setFailures] = useState<number | undefined>(undefined);
  const [requireCaptchaV2, setRequireCaptchaV2] = useState(false);

  // Obter CSRF token ao montar
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        await recoveryService.getCsrfToken();
      } catch (err) {
        console.error('Erro ao obter CSRF token:', err);
      }
    };
    fetchCsrfToken();
  }, []);

  const clearError = () => setError(null);

  const initRecovery = async (cpfValue: string, recaptchaToken: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await recoveryService.initRecovery({
        cpf: cpfValue,
        recaptcha_token: recaptchaToken,
      });

      if (response.questions && response.questions.length > 0) {
        setCpf(cpfValue);
        setQuestions(response.questions);
        setAttempts(response.tentativas_restantes);
        setFailures(response.falhas);
        setRequireCaptchaV2(response.require_captcha_v2 || false);
        setStep('questions');
      } else {
        setError('Nenhuma pergunta retornada pelo servidor');
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || err.message || 'Erro ao iniciar recuperação de senha';
      setError(errorMessage);

      // Se recebeu 429 (rate limit), exibir informação sobre retry_after
      if (err.response?.status === 429) {
        const retryAfter = err.response?.data?.retry_after;
        if (retryAfter) {
          const minutes = Math.ceil(retryAfter / 60);
          setError(
            `Limite de tentativas excedido. Aguarde ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} antes de tentar novamente.`
          );
        }
      }

      // Se conta bloqueada
      if (err.response?.data?.blocked) {
        const message = err.response?.data?.message || 'Conta temporariamente bloqueada';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const validateAnswers = async (answers: string[], recaptchaToken: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await recoveryService.validateAnswers({
        cpf,
        respostas: answers,
        recaptcha_token: recaptchaToken,
      });

      if (response.success && response.reset_token) {
        setResetToken(response.reset_token);
        setStep('new-password');
      } else {
        setError(response.error || 'Erro ao validar respostas');
        setAttempts(response.tentativas_restantes);
        setFailures(response.falhas);
        setRequireCaptchaV2(response.require_captcha_v2 || false);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || err.message || 'Erro ao validar respostas';
      setError(errorMessage);

      // Atualizar informações de tentativas
      if (err.response?.data) {
        setAttempts(err.response.data.tentativas_restantes);
        setFailures(err.response.data.falhas);
        setRequireCaptchaV2(err.response.data.require_captcha_v2 || false);
      }

      // Se recebeu 429 (rate limit)
      if (err.response?.status === 429) {
        const retryAfter = err.response?.data?.retry_after;
        if (retryAfter) {
          const minutes = Math.ceil(retryAfter / 60);
          setError(
            `Limite de tentativas excedido. Aguarde ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}.`
          );
        }
      }

      // Se conta bloqueada
      if (err.response?.data?.blocked) {
        const message = err.response?.data?.message || 'Conta bloqueada';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await recoveryService.resetPassword({
        reset_token: resetToken,
        new_password: password,
      });

      if (response.success) {
        setStep('success');
      } else {
        setError(response.error || 'Erro ao redefinir senha');
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || err.message || 'Erro ao redefinir senha';
      setError(errorMessage);

      // Se token inválido ou expirado
      if (err.response?.status === 400 || err.response?.status === 404) {
        setError('Token de recuperação inválido ou expirado. Por favor, inicie o processo novamente.');
        setTimeout(() => {
          setStep('cpf');
          setResetToken('');
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    step,
    loading,
    error,
    cpf,
    questions,
    resetToken,
    attempts,
    failures,
    requireCaptchaV2,
    initRecovery,
    validateAnswers,
    resetPassword,
    clearError,
  };
};
