import type { SiteRule } from './rule-catalog.service.js';
import type { Offer } from '../../api/schemas/offer.schema.js';

export interface ComplianceResult {
  compliant: boolean;
  violations: string[];
}

export class RuleComplianceService {
  checkEligibility(offer: Offer, rule: SiteRule): ComplianceResult {
    const def = rule.definition as {
      min_budget?: number;
      required_skills?: string[];
      exclude_keywords?: string[];
    };
    const violations: string[] = [];

    if (def.min_budget != null) {
      const budget = offer.budget_max ?? offer.budget_min ?? 0;
      if (budget < def.min_budget) {
        violations.push(`Budget ${budget} below minimum ${def.min_budget}`);
      }
    }

    if (def.required_skills?.length) {
      const offerSkills = offer.skills.map((s) => s.toLowerCase());
      for (const skill of def.required_skills) {
        if (!offerSkills.includes(skill.toLowerCase())) {
          violations.push(`Missing required skill: ${skill}`);
        }
      }
    }

    if (def.exclude_keywords?.length) {
      const text = `${offer.title} ${offer.description}`.toLowerCase();
      for (const kw of def.exclude_keywords) {
        if (text.includes(kw.toLowerCase())) {
          violations.push(`Excluded keyword found: "${kw}"`);
        }
      }
    }

    return { compliant: violations.length === 0, violations };
  }

  checkAllRules(offer: Offer, rules: SiteRule[]): ComplianceResult {
    const allViolations: string[] = [];

    for (const rule of rules) {
      if (rule.rule_type === 'eligibility') {
        const result = this.checkEligibility(offer, rule);
        allViolations.push(...result.violations);
      }
    }

    return { compliant: allViolations.length === 0, violations: allViolations };
  }
}
