import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Middleware global de tratamento de erros
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log do erro
  logger.error('Erro não tratado', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // CSRF Error
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      error: 'Token CSRF inválido',
      message: 'Sua sessão pode ter expirado. Recarregue a página e tente novamente.',
    });
  }

  // Validation Error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erro de validação',
      message: err.message,
    });
  }

  // Unauthorized
  if (err.status === 401 || err.statusCode === 401) {
    return res.status(401).json({
      error: 'Não autorizado',
      message: 'Acesso negado.',
    });
  }

  // Forbidden
  if (err.status === 403 || err.statusCode === 403) {
    return res.status(403).json({
      error: 'Proibido',
      message: 'Você não tem permissão para acessar este recurso.',
    });
  }

  // Not Found
  if (err.status === 404 || err.statusCode === 404) {
    return res.status(404).json({
      error: 'Não encontrado',
      message: 'Recurso não encontrado.',
    });
  }

  // Default: Internal Server Error
  res.status(err.status || 500).json({
    error: 'Erro interno do servidor',
    message:
      process.env.NODE_ENV === 'production'
        ? 'Ocorreu um erro. Tente novamente mais tarde.'
        : err.message,
  });
};

/**
 * Middleware para rotas não encontradas (404)
 */
export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn('Rota não encontrada', {
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  res.status(404).json({
    error: 'Rota não encontrada',
    message: `Rota ${req.method} ${req.url} não existe.`,
  });
};
