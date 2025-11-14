import { Router } from 'express';
import { register } from '../utils/metrics';
import recoveryRoutes from './recovery.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Métricas Prometheus
router.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Rotas de recuperação
router.use('/api', recoveryRoutes);

export default router;
