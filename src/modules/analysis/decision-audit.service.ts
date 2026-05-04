import { pool } from '../../lib/db.js';
import { logger } from '../../lib/logger.js';
import type { Offer } from '../../api/schemas/offer.schema.js';

export interface AuditDecision {
  offer_id: string;
  action: 'apply' | 'skip' | 'review';
  reason: string;
  score: number;
  rule_versions: Record<string, number>;
}

export class DecisionAuditService {
  async record(decision: AuditDecision): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO auto_apply.decision_audit_log
          (offer_id, action, reason, score, rule_versions, recorded_at)
         VALUES ($1, $2, $3, $4, $5, now())`,
        [
          decision.offer_id,
          decision.action,
          decision.reason,
          decision.score,
          JSON.stringify(decision.rule_versions),
        ],
      );
    } catch (err) {
      logger.warn({ err, offer_id: decision.offer_id }, 'Failed to write decision audit log');
    }
  }
}
