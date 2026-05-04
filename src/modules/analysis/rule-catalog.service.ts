import { pool } from '../../lib/db.js';
import { logger } from '../../lib/logger.js';

export interface SiteRule {
  id: string;
  site: string;
  rule_type: 'eligibility' | 'format' | 'timing' | 'pricing';
  version: number;
  definition: Record<string, unknown>;
  active: boolean;
  effective_from: Date;
  effective_to: Date | null;
}

export class RuleCatalogService {
  async getActiveRules(site: string): Promise<SiteRule[]> {
    const result = await pool.query<SiteRule>(
      `SELECT * FROM auto_apply.regla_sitio
       WHERE site = $1
         AND active = true
         AND effective_from <= now()
         AND (effective_to IS NULL OR effective_to > now())
       ORDER BY rule_type, version DESC`,
      [site],
    );
    return result.rows;
  }

  async getLatestRuleVersion(site: string, ruleType: SiteRule['rule_type']): Promise<SiteRule | null> {
    const result = await pool.query<SiteRule>(
      `SELECT * FROM auto_apply.regla_sitio
       WHERE site = $1 AND rule_type = $2 AND active = true
       ORDER BY version DESC
       LIMIT 1`,
      [site, ruleType],
    );
    return result.rows[0] ?? null;
  }

  async getRuleVersionsMap(site: string): Promise<Record<string, number>> {
    const rules = await this.getActiveRules(site);
    return Object.fromEntries(rules.map((r) => [r.rule_type, r.version]));
  }

  async seedDefaultRules(site: string): Promise<void> {
    const log = logger.child({ site });
    const defaultRules: Array<{ rule_type: SiteRule['rule_type']; definition: Record<string, unknown> }> = [
      {
        rule_type: 'eligibility',
        definition: {
          min_budget: 10,
          required_skills: [],
          exclude_keywords: ['urgente solo local', 'presencial obligatorio'],
        },
      },
      {
        rule_type: 'format',
        definition: {
          max_proposal_chars: 2000,
          required_sections: ['introduction', 'approach', 'price'],
        },
      },
      {
        rule_type: 'timing',
        definition: {
          submit_within_hours: 6,
          avoid_weekends: false,
        },
      },
      {
        rule_type: 'pricing',
        definition: {
          price_strategy: 'competitive_low',
          discount_pct_vs_budget: 10,
        },
      },
    ];

    for (const rule of defaultRules) {
      await pool.query(
        `INSERT INTO auto_apply.regla_sitio
          (site, rule_type, version, definition, active, effective_from)
         VALUES ($1, $2, 1, $3, true, now())
         ON CONFLICT (site, rule_type, version) DO NOTHING`,
        [site, rule.rule_type, JSON.stringify(rule.definition)],
      );
    }
    log.info('Default rules seeded');
  }
}
