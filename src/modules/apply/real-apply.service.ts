import { pool } from '../../lib/db.js';
import { logger } from '../../lib/logger.js';
import { env } from '../../config/env.js';
import { RuleComplianceService } from '../analysis/rule-compliance.service.js';
import { RuleCatalogService } from '../analysis/rule-catalog.service.js';
import { RetryPolicyService } from './retry-policy.service.js';
import type { Strategy } from '../analysis/strategy-builder.service.js';
import type { Offer } from '../../api/schemas/offer.schema.js';
import type { AttemptRecord } from './simulate-apply.service.js';

const compliance = new RuleComplianceService();
const catalog = new RuleCatalogService();
const retryPolicy = new RetryPolicyService();

export class RealApplyService {
  async apply(offer: Offer, strategy: Strategy, accountSiteId: string): Promise<AttemptRecord> {
    if (env.DEFAULT_SIMULATE) {
      throw new Error(
        'Real apply blocked: DEFAULT_SIMULATE=true. Set DEFAULT_SIMULATE=false to enable real submissions.',
      );
    }

    const log = logger.child({ service: 'real-apply', offer_id: offer.id });

    // Pre-check: validate compliance before sending — FR-009
    const rules = await catalog.getActiveRules(offer.source_site);
    const check = compliance.checkAllRules(offer, rules);
    if (!check.compliant) {
      throw new Error(`Cannot submit: compliance violations — ${check.violations.join('; ')}`);
    }

    const sentPayload = {
      offer_id: offer.id,
      strategy_id: strategy.id,
      price: strategy.recommended_price,
      template: strategy.proposal_template_id,
    };

    // Insert in 'queued' status first
    const insertResult = await pool.query<{ id: string }>(
      `INSERT INTO auto_apply.intento_postulacion
        (offer_id, strategy_id, account_site_id, mode, status, sent_payload, created_at)
       VALUES ($1,$2,$3,'real','queued',$4,now())
       RETURNING id`,
      [offer.id, strategy.id, accountSiteId, JSON.stringify(sentPayload)],
    );

    const attemptId = insertResult.rows[0]?.id ?? '';

    try {
      // Real submission (placeholder — integrate site-specific client here)
      await retryPolicy.execute(async () => {
        log.info({ attempt_id: attemptId }, 'Submitting real application (stub)');
        // TODO: call site-specific apply client
      });

      await pool.query(
        `UPDATE auto_apply.intento_postulacion
         SET status = 'sent', sent_at = now() WHERE id = $1`,
        [attemptId],
      );

      log.info({ attempt_id: attemptId }, 'Real application sent');
      return { id: attemptId, mode: 'real', status: 'sent' };
    } catch (err) {
      await pool.query(
        `UPDATE auto_apply.intento_postulacion SET status = 'failed' WHERE id = $1`,
        [attemptId],
      );
      log.error({ err, attempt_id: attemptId }, 'Real application failed');
      throw err;
    }
  }
}
