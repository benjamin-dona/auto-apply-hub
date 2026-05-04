import { pool } from '../../lib/db.js';
import { logger } from '../../lib/logger.js';

export interface OutcomeSync {
  attempt_id: string;
  outcome: 'won' | 'rejected' | 'no_response';
  failure_reason?: string;
  outcome_at?: Date;
}

export class OutcomeIngestionService {
  async sync(outcomes: OutcomeSync[]): Promise<number> {
    let synced = 0;
    const log = logger.child({ service: 'outcome-ingestion' });

    for (const o of outcomes) {
      try {
        await pool.query(
          `INSERT INTO auto_apply.resultado_postulacion
            (attempt_id, outcome, failure_reason, outcome_at, created_at)
           VALUES ($1::bigint, $2, $3, $4, now())
           ON CONFLICT (attempt_id) DO UPDATE SET
             outcome        = EXCLUDED.outcome,
             failure_reason = EXCLUDED.failure_reason,
             outcome_at     = EXCLUDED.outcome_at`,
          [o.attempt_id, o.outcome, o.failure_reason ?? null, o.outcome_at ?? new Date()],
        );
        synced++;
      } catch (err) {
        log.error({ err, attempt_id: o.attempt_id }, 'Failed to sync outcome');
      }
    }

    log.info({ synced, total: outcomes.length }, 'Outcome sync complete');
    return synced;
  }
}
