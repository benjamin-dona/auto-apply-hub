import { pool } from '../../lib/db.js';
import { logger } from '../../lib/logger.js';
import type { Offer } from '../../api/schemas/offer.schema.js';

export interface IngestMetrics {
  inserted: number;
  skipped: number;
  failed: number;
}

export class OfferRepository {
  /**
   * Upsert a batch of offers using ON CONFLICT to deduplicate by (source_site, source_offer_id).
   */
  async upsertBatch(offers: Offer[]): Promise<IngestMetrics> {
    const metrics: IngestMetrics = { inserted: 0, skipped: 0, failed: 0 };

    for (const offer of offers) {
      try {
        const result = await pool.query<{ xmax: string }>(
          `INSERT INTO auto_apply.oferta_proyecto
            (id, source_site, source_offer_id, title, description, skills,
             budget_min, budget_max, currency, published_at, expires_at,
             status, raw_payload, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,now(),now())
           ON CONFLICT (source_site, source_offer_id)
             DO UPDATE SET
               title       = EXCLUDED.title,
               description = EXCLUDED.description,
               skills      = EXCLUDED.skills,
               budget_min  = EXCLUDED.budget_min,
               budget_max  = EXCLUDED.budget_max,
               status      = EXCLUDED.status,
               raw_payload = EXCLUDED.raw_payload,
               updated_at  = now()
           RETURNING xmax`,
          [
            offer.id,
            offer.source_site,
            offer.source_offer_id,
            offer.title,
            offer.description,
            offer.skills,
            offer.budget_min,
            offer.budget_max,
            offer.currency,
            offer.published_at,
            offer.expires_at,
            offer.status,
            JSON.stringify(offer.raw_payload),
          ],
        );

        // xmax=0 means INSERT, >0 means UPDATE (duplicate)
        const row = result.rows[0];
        if (row && row.xmax === '0') {
          metrics.inserted++;
        } else {
          metrics.skipped++;
        }
      } catch (err) {
        metrics.failed++;
        logger.error({ err, offer_id: offer.id }, 'Failed to upsert offer');
      }
    }

    return metrics;
  }

  async findById(id: string): Promise<Offer | null> {
    const result = await pool.query<Offer>(
      'SELECT * FROM auto_apply.oferta_proyecto WHERE id = $1',
      [id],
    );
    return result.rows[0] ?? null;
  }
}
