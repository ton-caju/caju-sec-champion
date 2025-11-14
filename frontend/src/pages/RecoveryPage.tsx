import React from 'react';
import { useRecovery } from '../hooks/useRecovery';
import CPFStep from '../components/CPFStep';
import QuestionsStep from '../components/QuestionsStep';
import NewPasswordStep from '../components/NewPasswordStep';
import SuccessStep from '../components/SuccessStep';
import './RecoveryPage.css';

const RecoveryPage: React.FC = () => {
  const {
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
  } = useRecovery();

  return (
    <div className="recovery-page">
      <div className="recovery-container">
        <div className="recovery-card">
          {/* Stepper */}
          <div className="stepper">
            <div className={`step ${step === 'cpf' ? 'active' : step !== 'cpf' ? 'completed' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">CPF</div>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step === 'questions' ? 'active' : step === 'new-password' || step === 'success' ? 'completed' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Perguntas</div>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step === 'new-password' ? 'active' : step === 'success' ? 'completed' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Nova Senha</div>
            </div>
          </div>

          {/* Content */}
          <div className="recovery-content">
            {step === 'cpf' && (
              <CPFStep onSubmit={initRecovery} loading={loading} error={error || undefined} />
            )}

            {step === 'questions' && (
              <QuestionsStep
                questions={questions}
                onSubmit={validateAnswers}
                loading={loading}
                error={error || undefined}
                cpf={cpf}
                attempts={attempts}
                failures={failures}
                requireCaptchaV2={requireCaptchaV2}
              />
            )}

            {step === 'new-password' && (
              <NewPasswordStep
                resetToken={resetToken}
                onSubmit={resetPassword}
                loading={loading}
                error={error || undefined}
              />
            )}

            {step === 'success' && <SuccessStep redirectDelay={5} />}
          </div>
        </div>

        {/* Security Notice */}
        <div className="security-notice-footer">
          <p>
            🔒 Suas informações são protegidas por criptografia de ponta a ponta e múltiplas
            camadas de segurança
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecoveryPage;
