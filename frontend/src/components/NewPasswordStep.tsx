import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const passwordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, 'Senha deve ter no mínimo 8 caracteres')
      .max(128, 'Senha muito longa')
      .regex(/[a-z]/, 'Deve conter pelo menos uma letra minúscula')
      .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
      .regex(/[0-9]/, 'Deve conter pelo menos um número')
      .regex(/[^a-zA-Z0-9]/, 'Deve conter pelo menos um caractere especial'),
    confirm_password: z.string().min(1, 'Confirmação obrigatória'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'As senhas não coincidem',
    path: ['confirm_password'],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

interface NewPasswordStepProps {
  resetToken: string;
  onSubmit: (password: string) => void;
  loading: boolean;
  error?: string;
}

const NewPasswordStep: React.FC<NewPasswordStepProps> = ({
  resetToken,
  onSubmit,
  loading,
  error,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const newPassword = watch('new_password') || '';

  const getPasswordStrength = (password: string): { strength: string; color: string } => {
    if (password.length === 0) return { strength: '', color: '' };
    if (password.length < 8) return { strength: 'Muito fraca', color: '#e74c3c' };

    let score = 0;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;

    if (score <= 2) return { strength: 'Fraca', color: '#f39c12' };
    if (score <= 4) return { strength: 'Média', color: '#f1c40f' };
    if (score <= 5) return { strength: 'Forte', color: '#2ecc71' };
    return { strength: 'Muito forte', color: '#27ae60' };
  };

  const strengthInfo = getPasswordStrength(newPassword);

  const handleFormSubmit = (data: PasswordFormData) => {
    onSubmit(data.new_password);
  };

  return (
    <div className="new-password-step">
      <div className="success-icon">✅</div>
      <h2>Identidade Validada com Sucesso!</h2>
      <p className="subtitle">Agora você pode definir uma nova senha para sua conta</p>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="password-form">
        <div className="form-group">
          <label htmlFor="new_password">Nova Senha</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="new_password"
              {...register('new_password')}
              placeholder="Digite sua nova senha"
              className={errors.new_password ? 'error' : ''}
              disabled={loading}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {errors.new_password && (
            <span className="error-message">{errors.new_password.message}</span>
          )}

          {newPassword && (
            <div className="password-strength">
              <div className="strength-bar">
                <div
                  className="strength-fill"
                  style={{
                    width: strengthInfo.strength
                      ? `${(strengthInfo.strength === 'Muito forte' ? 100 : strengthInfo.strength === 'Forte' ? 75 : strengthInfo.strength === 'Média' ? 50 : 25)}%`
                      : '0%',
                    backgroundColor: strengthInfo.color,
                  }}
                ></div>
              </div>
              <span className="strength-label" style={{ color: strengthInfo.color }}>
                {strengthInfo.strength}
              </span>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirm_password">Confirme a Nova Senha</label>
          <div className="password-input-wrapper">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirm_password"
              {...register('confirm_password')}
              placeholder="Digite novamente sua senha"
              className={errors.confirm_password ? 'error' : ''}
              disabled={loading}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {errors.confirm_password && (
            <span className="error-message">{errors.confirm_password.message}</span>
          )}
        </div>

        <div className="password-requirements">
          <p className="requirements-title">
            <strong>Requisitos de senha:</strong>
          </p>
          <ul>
            <li className={newPassword.length >= 8 ? 'valid' : ''}>
              {newPassword.length >= 8 ? '✓' : '○'} Mínimo 8 caracteres
            </li>
            <li className={/[a-z]/.test(newPassword) ? 'valid' : ''}>
              {/[a-z]/.test(newPassword) ? '✓' : '○'} Uma letra minúscula
            </li>
            <li className={/[A-Z]/.test(newPassword) ? 'valid' : ''}>
              {/[A-Z]/.test(newPassword) ? '✓' : '○'} Uma letra maiúscula
            </li>
            <li className={/[0-9]/.test(newPassword) ? 'valid' : ''}>
              {/[0-9]/.test(newPassword) ? '✓' : '○'} Um número
            </li>
            <li className={/[^a-zA-Z0-9]/.test(newPassword) ? 'valid' : ''}>
              {/[^a-zA-Z0-9]/.test(newPassword) ? '✓' : '○'} Um caractere especial (!@#$%^&*)
            </li>
          </ul>
        </div>

        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? (
            <>
              <span className="spinner"></span>
              <span>Redefinindo...</span>
            </>
          ) : (
            'Redefinir Senha'
          )}
        </button>
      </form>
    </div>
  );
};

export default NewPasswordStep;
