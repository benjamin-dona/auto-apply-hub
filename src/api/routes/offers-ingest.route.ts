import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { runIngest } from '../../workers/ingest.worker.js';

const TriggerBodySchema = z.object({
  site: z.enum(['workana']).default('workana'),
});

export async function offersIngestRoute(app: FastifyInstance): Promise<void> {
  app.post('/ingest', async (req, reply) => {
    const body = TriggerBodySchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid request body', details: body.error.issues });
    }

    // Fire-and-forget; ingest runs asynchronously
    void runIngest();

    return reply.status(202).send({
      message: 'Ingestion triggered',
      site: body.data.site,
    });
  });
}
