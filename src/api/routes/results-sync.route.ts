import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { OutcomeIngestionService } from '../../modules/results/outcome-ingestion.service.js';
import { FailureReasonService } from '../../modules/results/failure-reason.service.js';

const OutcomeSchema = z.object({
  attempt_id: z.string().min(1),
  outcome: z.enum(['won', 'rejected', 'no_response']),
  failure_reason: z.string().optional(),
  outcome_at: z.string().datetime().optional(),
});

const BodySchema = z.object({
  outcomes: z.array(OutcomeSchema).min(1),
});

const outcomeService = new OutcomeIngestionService();
const failureService = new FailureReasonService();

export async function resultsSyncRoute(app: FastifyInstance): Promise<void> {
  app.post('/sync', async (req, reply) => {
    const body = BodySchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid request body', details: body.error.issues });
    }

    const outcomes = body.data.outcomes.map((o) => ({
      attempt_id: o.attempt_id,
      outcome: o.outcome,
      ...(o.failure_reason !== undefined ? { failure_reason: o.failure_reason } : {}),
      ...(o.outcome_at !== undefined ? { outcome_at: new Date(o.outcome_at) } : {}),
    }));

    const synced = await outcomeService.sync(outcomes);

    // Classify failures
    for (const o of outcomes) {
      if (o.outcome !== 'won' && o.failure_reason) {
        await failureService.classify(o.attempt_id, o.failure_reason);
      }
    }

    return reply.status(200).send({ synced, total: outcomes.length });
  });
}
