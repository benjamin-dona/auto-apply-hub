import { pool } from '../../lib/db.js';
import type { SiteSession } from './site-session.service.js';
import type { Offer } from '../../api/schemas/offer.schema.js';

export class AccountAssignmentService {
  /**
   * Select the best account for the given offer using assignment rules.
   * Falls back to highest-health-score active account if no rule matches.
   */
  async assignAccount(offer: Offer): Promise<SiteSession | null> {
    // Fetch all active assignment rules for the site, ordered by priority
    const rulesResult = await pool.query<{
      id: string;
      condition_expr: Record<string, unknown>;
      account_site_id: string;
    }>(
      `SELECT r.id, r.condition_expr, r.account_site_id
       FROM auto_apply.regla_asignacion_cuenta r
       JOIN auto_apply.cuenta_sitio c ON c.id = r.account_site_id
       WHERE r.site = $1 AND r.active = true AND c.status = 'active'
       ORDER BY r.priority ASC`,
      [offer.source_site],
    );

    for (const rule of rulesResult.rows) {
      if (this.evaluateCondition(rule.condition_expr, offer)) {
        const accountResult = await pool.query<{
          id: string;
          site: string;
          account_alias: string;
          credential_secret_ref: string;
          username_ref: string;
        }>(
          `SELECT id, site, account_alias, credential_secret_ref, username_ref
           FROM auto_apply.cuenta_sitio WHERE id = $1`,
          [rule.account_site_id],
        );
        const row = accountResult.rows[0];
        if (!row) continue;
        return {
          account_id: row.id,
          site: row.site,
          alias: row.account_alias,
          credential_secret_ref: row.credential_secret_ref,
          username_ref: row.username_ref,
        };
      }
    }

    // Fallback: best available account
    const fallback = await pool.query<{
      id: string;
      site: string;
      account_alias: string;
      credential_secret_ref: string;
      username_ref: string;
    }>(
      `SELECT id, site, account_alias, credential_secret_ref, username_ref
       FROM auto_apply.cuenta_sitio
       WHERE site = $1 AND status = 'active'
       ORDER BY health_score DESC LIMIT 1`,
      [offer.source_site],
    );

    const row = fallback.rows[0];
    if (!row) return null;
    return {
      account_id: row.id,
      site: row.site,
      alias: row.account_alias,
      credential_secret_ref: row.credential_secret_ref,
      username_ref: row.username_ref,
    };
  }

  private evaluateCondition(condition: Record<string, unknown>, offer: Offer): boolean {
    // Minimal rule evaluator: supports { min_budget, max_budget, skills_match }
    if (typeof condition['min_budget'] === 'number') {
      const budget = offer.budget_max ?? offer.budget_min ?? 0;
      if (budget < condition['min_budget']) return false;
    }
    if (typeof condition['max_budget'] === 'number') {
      const budget = offer.budget_min ?? offer.budget_max ?? Infinity;
      if (budget > condition['max_budget']) return false;
    }
    return true;
  }
}
