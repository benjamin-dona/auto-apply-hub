import { pool } from '../../lib/db.js';
import { logger } from '../../lib/logger.js';
import { RuleComplianceService } from '../analysis/rule-compliance.service.js';
import { RuleCatalogService } from '../analysis/rule-catalog.service.js';
import type { Strategy } from '../analysis/strategy-builder.service.js';
import type { Offer } from '../../api/schemas/offer.schema.js';

const compliance = new RuleComplianceService();
const catalog = new RuleCatalogService();

export interface AttemptRecord {
  id: string;
  mode: 'simulate' | 'real';
  status: string;
}

export class SimulateApplyService {
  async apply(offer: Offer, strategy: Strategy, accountSiteId: string): Promise<AttemptRecord> {
    const log = logger.child({ service: 'simulate-apply', offer_id: offer.id });

    // Pre-check: validate rule compliance before simulating — FR-009
    const rules = await catalog.getActiveRules(offer.source_site);
    const check = compliance.checkAllRules(offer, rules);
    if (!check.compliant) {
      log.warn({ violations: check.violations }, 'Pre-check failed — offer does not comply');
    }

    const sentPayload = {
      offer_id: offer.id,
      strategy_id: strategy.id,
      price: strategy.recommended_price,
      template: strategy.proposal_template_id,
      pre_check_compliant: check.compliant,
      pre_check_violations: check.violations,
    };

    const result = await pool.query<{ id: string }>(
      `INSERT INTO auto_apply.intento_postulacion
        (offer_id, strategy_id, account_site_id, mode, status, sent_payload, created_at)
       VALUES ($1,$2,$3,'simulate','simulated',$4,now())
       RETURNING id`,
      [offer.id, strategy.id, accountSiteId, JSON.stringify(sentPayload)],
    );

    const id = result.rows[0]?.id ?? '';
    log.info({ attempt_id: id }, 'Simulated application recorded');
    return { id, mode: 'simulate', status: 'simulated' };
  }
}
