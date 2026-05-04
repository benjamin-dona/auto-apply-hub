import type { FastifyInstance } from 'fastify';
import { checkDbConnection } from '../../lib/db.js';

export async function healthRoute(app: FastifyInstance): Promise<void> {
  app.get('/', async (_req, reply) => {
    const dbOk = await checkDbConnection();
    const status = dbOk ? 'ok' : 'degraded';
    return reply.status(dbOk ? 200 : 503).send({
      status,
      timestamp: new Date().toISOString(),
      checks: { database: dbOk ? 'ok' : 'unreachable' },
    });
  });
}
