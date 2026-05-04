import type { ScoringResult } from './opportunity-scoring.service.js';
import type { ComplianceResult } from './rule-compliance.service.js';

export interface ExplainedAnalysis {
  summary: string;
  recommendation: 'apply' | 'skip' | 'review';
  detail: string[];
}

export class AnalysisExplainerService {
  explain(scoring: ScoringResult, compliance: ComplianceResult): ExplainedAnalysis {
    if (!compliance.compliant) {
      return {
        summary: 'Offer does not meet site requirements — skip.',
        recommendation: 'skip',
        detail: compliance.violations,
      };
    }

    let recommendation: ExplainedAnalysis['recommendation'];
    let summary: string;

    if (scoring.score >= 70) {
      recommendation = 'apply';
      summary = `High opportunity score (${scoring.score}/100) — recommend applying.`;
    } else if (scoring.score >= 40) {
      recommendation = 'review';
      summary = `Moderate opportunity score (${scoring.score}/100) — manual review suggested.`;
    } else {
      recommendation = 'skip';
      summary = `Low opportunity score (${scoring.score}/100) — skip.`;
    }

    return { summary, recommendation, detail: scoring.reasons };
  }
}
