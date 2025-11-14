import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

// Configurações
import { helmetConfig } from './config/helmet';
import { corsConfig } from './config/cors';
import { sessionConfig } from './config/session';

// Rotas
import routes from './routes';

// Middleware de erro
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Logger
import { logger } from './utils/logger';

// Métricas
import { httpRequestCounter, httpRequestDuration } from './utils/metrics';

// Criar aplicação Express
const app = express();

// Trust proxy (se atrás de load balancer/nginx)
app.set('trust proxy', 1);

// Middleware de logging HTTP
app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// Middleware de métricas
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestCounter.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode,
      },
      duration
    );
  });

  next();
});

// Security Headers (Helmet)
app.use(helmetConfig);

// CORS
app.use(corsConfig);

// Body Parser
app.use(express.json({ limit: '10kb' })); // Limitar tamanho do body
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie Parser
app.use(cookieParser());

// Session Management
app.use(sessionConfig);

// Sanitização contra NoSQL Injection
app.use(mongoSanitize());

// HTTP Parameter Pollution Protection
app.use(hpp());

// Rotas
app.use(routes);

// Handler de rota não encontrada (404)
app.use(notFoundHandler);

// Handler de erros
app.use(errorHandler);

// Porta e inicialização
const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info(`🚀 BFF iniciado`, {
    port: PORT,
    host: HOST,
    env: process.env.NODE_ENV || 'development',
    backendUrl: process.env.BACKEND_URL || 'http://localhost:8080',
  });
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('🛑 Iniciando graceful shutdown...');

  server.close(() => {
    logger.info('✅ Servidor HTTP encerrado');
    process.exit(0);
  });

  // Force shutdown após 10 segundos
  setTimeout(() => {
    logger.error('❌ Forçando encerramento após timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handler de erros não tratados
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

export default app;
