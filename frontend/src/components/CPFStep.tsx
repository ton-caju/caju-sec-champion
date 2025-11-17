import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ReCaptchaV3 from './ReCaptchaV3';

// Validação de CPF
const validarCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

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

const cpfSchema = z.object({
  cpf: z
    .string()
    .min(11, 'CPF deve ter 11 dígitos')
    .refine((val) => validarCPF(val), {
      message: 'CPF inválido',
    }),
});

type CPFFormData = z.infer<typeof cpfSchema>;

interface CPFStepProps {
  onSubmit: (cpf: string, recaptchaToken: string) => void;
  loading: boolean;
  error?: string;
}

const CPFStep: React.FC<CPFStepProps> = ({ onSubmit, loading, error }) => {
  const [recaptchaToken, setRecaptchaToken] = useState<string>('');

  const handleTokenReceived = useCallback((token: string) => {
    setRecaptchaToken(token);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CPFFormData>({
    resolver: zodResolver(cpfSchema),
  });

  const cpfValue = watch('cpf') || '';

  const formatCPF = (value: string): string => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9)
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    e.target.value = formatted;
  };

  const handleFormSubmit = (data: CPFFormData) => {
    if (!recaptchaToken) {
      alert('Aguarde a validação do reCAPTCHA');
      return;
    }

    const cpfNormalized = data.cpf.replace(/\D/g, '');
    onSubmit(cpfNormalized, recaptchaToken);
  };

  return (
    <div className="cpf-step">
      <h2>Recuperação de Senha</h2>
      <p className="subtitle">Informe seu CPF para iniciar o processo de recuperação</p>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="cpf-form">
        <div className="form-group">
          <label htmlFor="cpf">CPF</label>
          <input
            type="text"
            id="cpf"
            {...register('cpf')}
            onChange={handleCPFChange}
            placeholder="000.000.000-00"
            className={errors.cpf ? 'error' : ''}
            disabled={loading}
            maxLength={14}
            autoComplete="off"
          />
          {errors.cpf && <span className="error-message">{errors.cpf.message}</span>}
        </div>

        <ReCaptchaV3 onTokenReceived={handleTokenReceived} action="init_recovery" />

        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <button type="submit" disabled={loading || !recaptchaToken} className="submit-button">
          {loading ? (
            <>
              <span className="spinner"></span>
              <span>Processando...</span>
            </>
          ) : (
            'Continuar'
          )}
        </button>
      </form>

      <div className="help-text">
        <p>
          <strong>Importante:</strong> Você precisará responder perguntas de segurança baseadas em
          informações da sua conta.
        </p>
      </div>
    </div>
  );
};

export default CPFStep;
