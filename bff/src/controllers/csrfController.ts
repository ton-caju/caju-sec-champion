import { Request, Response } from 'express';

/**
 * GET /api/csrf-token
 * Retorna token CSRF para o frontend
 */
export const getCsrfToken = (req: Request, res: Response) => {
  res.json({
    csrfToken: (req as any).csrfToken(),
  });
};
