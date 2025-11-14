import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import ReCaptchaV2 from './ReCaptchaV2';
import type { SecretQuestion } from '../types';

interface QuestionsStepProps {
  questions: SecretQuestion[];
  onSubmit: (answers: string[], recaptchaToken: string) => void;
  loading: boolean;
  error?: string;
  cpf: string;
  attempts?: number;
  failures?: number;
  requireCaptchaV2?: boolean;
}

const createQuestionsSchema = (questionsCount: number) => {
  const shape: Record<string, z.ZodString> = {};
  for (let i = 0; i < questionsCount; i++) {
    shape[`answer_${i}`] = z
      .string()
      .min(1, 'Resposta obrigatória')
      .max(100, 'Resposta muito longa');
  }
  return z.object(shape);
};

const QuestionsStep: React.FC<QuestionsStepProps> = ({
  questions,
  onSubmit,
  loading,
  error,
  cpf,
  attempts,
  failures,
  requireCaptchaV2 = false,
}) => {
  const [recaptchaV2Token, setRecaptchaV2Token] = useState<string>('');
  const [showV2Captcha, setShowV2Captcha] = useState<boolean>(requireCaptchaV2);

  const questionsSchema = createQuestionsSchema(questions.length);
  type QuestionsFormData = z.infer<typeof questionsSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuestionsFormData>({
    resolver: zodResolver(questionsSchema),
  });

  const handleFormSubmit = (data: QuestionsFormData) => {
    const answers = questions.map((_, index) => data[`answer_${index}` as keyof QuestionsFormData]);

    if (showV2Captcha && !recaptchaV2Token) {
      alert('Por favor, complete o CAPTCHA de verificação');
      return;
    }

    onSubmit(answers, recaptchaV2Token);
  };

  return (
    <div className="questions-step">
      <div className="header">
        <h2>Perguntas de Segurança</h2>
        <p className="subtitle">Responda as perguntas abaixo para validar sua identidade</p>
        <div className="cpf-display">
          <strong>CPF:</strong> {cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
        </div>
      </div>

      {(attempts !== undefined || failures !== undefined) && (
        <div className="attempts-info">
          {attempts !== undefined && (
            <p>
              <strong>Tentativas restantes:</strong> {attempts}
            </p>
          )}
          {failures !== undefined && failures > 0 && (
            <p className="warning">
              <span className="warning-icon">⚠️</span>
              Você já teve {failures} {failures === 1 ? 'tentativa falha' : 'tentativas falhas'}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="questions-form">
        {questions.map((question, index) => (
          <div key={question.id} className="form-group">
            <label htmlFor={`answer_${index}`}>
              <span className="question-number">{index + 1}.</span> {question.pergunta}
            </label>
            <input
              type="text"
              id={`answer_${index}`}
              {...register(`answer_${index}` as keyof QuestionsFormData)}
              placeholder="Sua resposta"
              className={errors[`answer_${index}` as keyof QuestionsFormData] ? 'error' : ''}
              disabled={loading}
              autoComplete="off"
            />
            {errors[`answer_${index}` as keyof QuestionsFormData] && (
              <span className="error-message">
                {errors[`answer_${index}` as keyof QuestionsFormData]?.message}
              </span>
            )}
          </div>
        ))}

        {showV2Captcha && (
          <div className="captcha-v2-wrapper">
            <p className="captcha-notice">
              <span className="notice-icon">🛡️</span>
              Por questões de segurança, precisamos que você complete a verificação abaixo:
            </p>
            <ReCaptchaV2
              onTokenReceived={setRecaptchaV2Token}
              onExpired={() => setRecaptchaV2Token('')}
              onError={() => setRecaptchaV2Token('')}
            />
          </div>
        )}

        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <button type="submit" disabled={loading || (showV2Captcha && !recaptchaV2Token)} className="submit-button">
          {loading ? (
            <>
              <span className="spinner"></span>
              <span>Validando...</span>
            </>
          ) : (
            'Validar Respostas'
          )}
        </button>
      </form>

      <div className="help-text">
        <p>
          <strong>Dica:</strong> As respostas devem ser exatamente como cadastradas no sistema
          (atenção para espaços e capitalização).
        </p>
      </div>
    </div>
  );
};

export default QuestionsStep;
