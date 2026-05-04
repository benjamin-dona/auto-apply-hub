import Fastify from 'fastify';
import cors from '@fastify/cors';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';
import { redactionPlugin } from './plugins/redaction.plugin.js';
import { healthRoute } from './routes/health.route.js';
import { offersIngestRoute } from './routes/offers-ingest.route.js';
import { offersAnalyzeRoute } from './routes/offers-analyze.route.js';
import { applicationsStrategyRoute } from './routes/applications-strategy.route.js';
import { applicationsSubmitRoute } from './routes/applications-submit.route.js';
import { resultsSyncRoute } from './routes/results-sync.route.js';

export async function buildServer(): Promise<ReturnType<typeof Fastify>> {
  const app = Fastify({
    logger,
    trustProxy: true,
  });

  await app.register(cors, { origin: false });
  await app.register(redactionPlugin);

  // Routes
  await app.register(healthRoute, { prefix: '/health' });
  await app.register(offersIngestRoute, { prefix: '/offers' });
  await app.register(offersAnalyzeRoute, { prefix: '/offers' });
  await app.register(applicationsStrategyRoute, { prefix: '/applications' });
  await app.register(applicationsSubmitRoute, { prefix: '/applications' });
  await app.register(resultsSyncRoute, { prefix: '/results' });

  return app;
}

export async function startServer(): Promise<void> {
  const app = await buildServer();
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
}
