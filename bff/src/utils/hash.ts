import crypto from 'crypto';

/**
 * Calcula hash SHA-256 de uma string
 * Usado para validar respostas das perguntas secretas
 */
export const sha256Hash = (text: string): string => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

/**
 * Normaliza texto para comparação
 * Remove espaços, lowercase, remove acentos
 */
export const normalizeText = (text: string): string => {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
};

/**
 * Compara hash de resposta com hash esperado
 * Usa timing-safe comparison para prevenir timing attacks
 */
export const compareHash = (received: string, expected: string): boolean => {
  try {
    // Timing-safe comparison
    const receivedBuffer = Buffer.from(received, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');

    if (receivedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
  } catch {
    return false;
  }
};

/**
 * Gera token aleatório seguro
 * Usado para tokens de reset de senha
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};
