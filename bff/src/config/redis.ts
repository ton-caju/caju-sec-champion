import { createClient } from 'redis';
import { logger } from '../utils/logger';

// Configuração do cliente Redis
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB || '0', 10),
});

// Handlers de eventos
redisClient.on('connect', () => {
  logger.info('✅ Redis: Conectando...');
});

redisClient.on('ready', () => {
  logger.info('✅ Redis: Pronto para uso');
});

redisClient.on('error', (err) => {
  logger.error('❌ Redis: Erro de conexão', { error: err.message });
});

redisClient.on('end', () => {
  logger.warn('⚠️  Redis: Conexão encerrada');
});

// Conectar ao Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('❌ Falha ao conectar ao Redis', { error });
    process.exit(1);
  }
})();

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('🛑 Desconectando do Redis...');
  await redisClient.quit();
  process.exit(0);
});

export { redisClient };
