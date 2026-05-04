import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { pool } from '../../lib/db.js';
import { env } from '../../config/env.js';
import { SimulateApplyService } from '../../modules/apply/simulate-apply.service.js';
import { RealApplyService } from '../../modules/apply/real-apply.service.js';
import type { Offer } from '../../api/schemas/offer.schema.js';
import type { Strategy } from '../../modules/analysis/strategy-builder.service.js';

const BodySchema = z.object({
  offer_id: z.string().min(1),
  strategy_id: z.string().uuid(),
  account_site_id: z.string().uuid(),
  mode: z.enum(['simulate', 'real']).default('simulate'),
});

const simulate = new SimulateApplyService();
const realApply = new RealApplyService();

export async function applicationsSubmitRoute(app: FastifyInstance): Promise<void> {
  app.post('/submit', async (req, reply) => {
    const body = BodySchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid request body', details: body.error.issues });
    }

    // Enforce DEFAULT_SIMULATE — constitución Principio IV
    const effectiveMode = env.DEFAULT_SIMULATE ? 'simulate' : body.data.mode;

    const offerResult = await pool.query<Offer>(
      'SELECT * FROM auto_apply.oferta_proyecto WHERE id = $1',
      [body.data.offer_id],
    );
    const offer = offerResult.rows[0];
    if (!offer) return reply.status(404).send({ error: 'Offer not found' });

    const strategyResult = await pool.query<Strategy>(
      'SELECT * FROM auto_apply.estrategia_postulacion WHERE id = $1',
      [body.data.strategy_id],
    );
    const strategy = strategyResult.rows[0];
    if (!strategy) return reply.status(404).send({ error: 'Strategy not found' });

    let attempt;
    if (effectiveMode === 'simulate') {
      attempt = await simulate.apply(offer, strategy, body.data.account_site_id);
    } else {
      attempt = await realApply.apply(offer, strategy, body.data.account_site_id);
    }

    return reply.status(201).send({ ...attempt, effective_mode: effectiveMode });
  });
}
