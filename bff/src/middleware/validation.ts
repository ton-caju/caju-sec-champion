import { body, validationResult } from 'express-validator';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';
import { Request, Response, NextFunction } from 'express';

// Configurar DOMPurify com jsdom
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

/**
 * Validação de CPF (com dígitos verificadores)
 */
export const validarCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/\D/g, ''); // Remove formatação

  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // Todos dígitos iguais

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

/**
 * Sanitização de texto (previne XSS, SQLi, Path Traversal)
 */
export const sanitizarTexto = (texto: string): string => {
  if (!texto) return '';

  // Remover caracteres perigosos
  let sanitizado = texto
    .replace(/[<>'";\\\/`]/g, '') // XSS básico
    .replace(/\.\./g, '') // Path traversal
    .replace(/--/g, '') // SQL comment
    .replace(/;/g, '') // SQL delimiter
    .replace(/\\/g, '') // Backslash
    .trim();

  // Limitar tamanho
  if (sanitizado.length > 100) {
    sanitizado = sanitizado.substring(0, 100);
  }

  // Sanitização adicional com DOMPurify
  sanitizado = purify.sanitize(sanitizado, {
    ALLOWED_TAGS: [], // Sem HTML tags
    ALLOWED_ATTR: [],
  });

  return sanitizado;
};

/**
 * Normalizar resposta para comparação (lowercase, trim, sem acentos)
 */
export const normalizarResposta = (resposta: string): string => {
  return resposta
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
};

/**
 * Middleware de validação para iniciar recuperação
 */
export const validarInicioRecuperacao = [
  body('cpf')
    .notEmpty()
    .withMessage('CPF obrigatório')
    .custom((value) => {
      if (!validarCPF(value)) {
        throw new Error('CPF inválido');
      }
      return true;
    }),

  body('recaptcha_token').notEmpty().withMessage('Token reCAPTCHA obrigatório'),

  // Validar e retornar erros
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array(),
      });
    }
    next();
  },
];

/**
 * Middleware de validação para validar respostas
 */
export const validarRespostas = [
  body('cpf')
    .notEmpty()
    .withMessage('CPF obrigatório')
    .custom((value) => validarCPF(value)),

  body('respostas')
    .isArray({ min: 5, max: 5 })
    .withMessage('Exatamente 5 respostas obrigatórias')
    .custom((respostas: string[]) => {
      // Validar cada resposta
      for (const resposta of respostas) {
        if (!resposta || resposta.trim().length === 0) {
          throw new Error('Todas as respostas devem ser preenchidas');
        }
        if (resposta.length > 100) {
          throw new Error('Resposta muito longa (máximo 100 caracteres)');
        }
      }
      return true;
    }),

  body('recaptcha_token').notEmpty(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array(),
      });
    }

    // Sanitizar respostas
    req.body.respostas = req.body.respostas.map(sanitizarTexto);

    next();
  },
];

/**
 * Middleware de validação para reset de senha
 */
export const validarResetSenha = [
  body('reset_token')
    .notEmpty()
    .withMessage('Token de reset obrigatório')
    .isLength({ min: 64, max: 64 })
    .withMessage('Token inválido'),

  body('new_password')
    .notEmpty()
    .withMessage('Nova senha obrigatória')
    .isLength({ min: 8, max: 128 })
    .withMessage('Senha deve ter entre 8 e 128 caracteres')
    .matches(/[a-z]/)
    .withMessage('Senha deve conter pelo menos uma letra minúscula')
    .matches(/[A-Z]/)
    .withMessage('Senha deve conter pelo menos uma letra maiúscula')
    .matches(/[0-9]/)
    .withMessage('Senha deve conter pelo menos um número')
    .matches(/[^a-zA-Z0-9]/)
    .withMessage('Senha deve conter pelo menos um caractere especial'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array(),
      });
    }
    next();
  },
];
