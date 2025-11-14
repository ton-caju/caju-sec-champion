import winston from 'winston';
import path from 'path';

// Formato customizado para logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Formato para console (desenvolvimento)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Criar logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console transport (sempre ativo)
    new winston.transports.Console({
      format: consoleFormat,
    }),

    // File transport para erros
    new winston.transports.File({
      filename: path.join(process.env.LOG_FILE_PATH || './logs/bff.log'),
      level: 'error',
      maxsize: parseInt(process.env.LOG_MAX_SIZE || '10485760', 10), // 10MB
      maxFiles: parseInt(process.env.LOG_MAX_FILES || '7', 10),
    }),

    // File transport para todos os logs
    new winston.transports.File({
      filename: path.join(process.env.LOG_FILE_PATH || './logs/bff.log').replace('.log', '-combined.log'),
      maxsize: parseInt(process.env.LOG_MAX_SIZE || '10485760', 10), // 10MB
      maxFiles: parseInt(process.env.LOG_MAX_FILES || '7', 10),
    }),
  ],
});

// Log de inicialização
logger.info('📝 Logger inicializado', {
  level: process.env.LOG_LEVEL || 'info',
  environment: process.env.NODE_ENV || 'development',
});
