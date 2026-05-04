import { pool } from '../lib/db.js';
import { logger } from '../lib/logger.js';
import { AccountAssignmentService } from '../modules/auth/account-assignment.service.js';
import { StrategyBuilderService } from '../modules/analysis/strategy-builder.service.js';
import type { Offer } from '../api/schemas/offer.schema.js';

const assignment = new AccountAssignmentService();
const strategyBuilder = new StrategyBuilderService();

export async function runApplyWorker(): Promise<void> {
  const log = logger.child({ worker: 'apply' });
  log.info('Starting apply worker run');

  // Find offers that have an analysis recommending 'apply' but no attempt yet
  const result = await pool.query<Offer & { analysis_id: string }>(
    `SELECT o.*, a.id as analysis_id
     FROM auto_apply.oferta_proyecto o
     JOIN auto_apply.analisis_oferta a ON a.offer_id = o.id
     WHERE o.status = 'open'
       AND a.score >= 70
       AND o.id NOT IN (
         SELECT DISTINCT offer_id FROM auto_apply.intento_postulacion
       )
     ORDER BY a.score DESC
     LIMIT 20`,
  );

  for (const offer of result.rows) {
    try {
      const account = await assignment.assignAccount(offer);
      if (!account) {
        log.warn({ offer_id: offer.id }, 'No active account available — skipping');
        continue;
      }

      const strategy = await strategyBuilder.build(offer, offer.analysis_id, account);
      log.info({ offer_id: offer.id, strategy_id: strategy.id }, 'Strategy built — queued for submission');
      // Actual submission delegated to simulate/real apply services via API endpoint
    } catch (err) {
      log.error({ err, offer_id: offer.id }, 'Apply worker failed for offer');
    }
  }

  log.info({ processed: result.rows.length }, 'Apply worker run complete');
}
