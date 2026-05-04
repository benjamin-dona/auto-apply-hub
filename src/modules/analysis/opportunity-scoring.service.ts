import type { Offer } from '../../api/schemas/offer.schema.js';
import type { SiteRule } from './rule-catalog.service.js';
import type { ComplianceResult } from './rule-compliance.service.js';

export interface ScoringResult {
  score: number; // 0–100
  confidence: number; // 0–1
  reasons: string[];
}

export class OpportunityScoringService {
  score(offer: Offer, rules: SiteRule[], compliance: ComplianceResult): ScoringResult {
    if (!compliance.compliant) {
      return {
        score: 0,
        confidence: 1,
        reasons: [`Offer does not comply with site rules: ${compliance.violations.join('; ')}`],
      };
    }

    let score = 50; // base
    const reasons: string[] = [];

    // Budget signal
    const budget = offer.budget_max ?? offer.budget_min;
    if (budget != null && budget > 0) {
      const budgetBonus = Math.min(20, Math.floor(budget / 50));
      score += budgetBonus;
      reasons.push(`Budget signal +${budgetBonus} (budget: ${budget})`);
    }

    // Skills match signal
    const pricingRule = rules.find((r) => r.rule_type === 'pricing');
    if (pricingRule) {
      score += 10;
      reasons.push('Pricing rule available +10');
    }

    // Recency signal: offers published within 24h get a boost
    const ageHours = (Date.now() - offer.published_at.getTime()) / 3_600_000;
    if (ageHours < 24) {
      score += 15;
      reasons.push(`Recent offer (<24h) +15`);
    } else if (ageHours > 72) {
      score -= 10;
      reasons.push(`Stale offer (>72h) -10`);
    }

    score = Math.max(0, Math.min(100, score));
    const confidence = offer.skills.length > 0 ? 0.8 : 0.5;

    return { score, confidence, reasons };
  }
}
