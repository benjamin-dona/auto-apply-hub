import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { pool } from '../../lib/db.js';
import { analyzeOffer } from '../../workers/analyze.worker.js';
import type { Offer } from '../../api/schemas/offer.schema.js';

const ParamsSchema = z.object({ offerId: z.string().min(1) });

export async function offersAnalyzeRoute(app: FastifyInstance): Promise<void> {
  app.post<{ Params: { offerId: string } }>('/:offerId/analyze', async (req, reply) => {
    const params = ParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'Invalid offer ID' });
    }

    const result = await pool.query<Offer>(
      'SELECT * FROM auto_apply.oferta_proyecto WHERE id = $1',
      [params.data.offerId],
    );

    const offer = result.rows[0];
    if (!offer) {
      return reply.status(404).send({ error: 'Offer not found' });
    }

    const analysisId = await analyzeOffer(offer);
    return reply.status(201).send({ analysis_id: analysisId, offer_id: offer.id });
  });
}
