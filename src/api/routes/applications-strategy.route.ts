import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { pool } from '../../lib/db.js';
import { AccountAssignmentService } from '../../modules/auth/account-assignment.service.js';
import { StrategyBuilderService } from '../../modules/analysis/strategy-builder.service.js';
import type { Offer } from '../../api/schemas/offer.schema.js';

const BodySchema = z.object({
  offer_id: z.string().min(1),
  analysis_id: z.string().uuid(),
});

const assignment = new AccountAssignmentService();
const strategyBuilder = new StrategyBuilderService();

export async function applicationsStrategyRoute(app: FastifyInstance): Promise<void> {
  app.post('/strategy', async (req, reply) => {
    const body = BodySchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid request body', details: body.error.issues });
    }

    const offerResult = await pool.query<Offer>(
      'SELECT * FROM auto_apply.oferta_proyecto WHERE id = $1',
      [body.data.offer_id],
    );
    const offer = offerResult.rows[0];
    if (!offer) {
      return reply.status(404).send({ error: 'Offer not found' });
    }

    const account = await assignment.assignAccount(offer);
    if (!account) {
      return reply.status(422).send({ error: 'No active account available for this site' });
    }

    const strategy = await strategyBuilder.build(offer, body.data.analysis_id, account);
    return reply.status(201).send(strategy);
  });
}
