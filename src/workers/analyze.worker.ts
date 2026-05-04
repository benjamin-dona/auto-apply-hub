import { pool } from '../lib/db.js';
import { logger } from '../lib/logger.js';
import { RuleCatalogService } from '../modules/analysis/rule-catalog.service.js';
import { RuleComplianceService } from '../modules/analysis/rule-compliance.service.js';
import { OpportunityScoringService } from '../modules/analysis/opportunity-scoring.service.js';
import { AnalysisExplainerService } from '../modules/analysis/analysis-explainer.service.js';
import { DecisionAuditService } from '../modules/analysis/decision-audit.service.js';
import type { Offer } from '../api/schemas/offer.schema.js';

const ruleCatalog = new RuleCatalogService();
const compliance = new RuleComplianceService();
const scoring = new OpportunityScoringService();
const explainer = new AnalysisExplainerService();
const audit = new DecisionAuditService();

export async function analyzeOffer(offer: Offer): Promise<string> {
  const log = logger.child({ worker: 'analyze', offer_id: offer.id });

  const rules = await ruleCatalog.getActiveRules(offer.source_site);
  const ruleVersions = await ruleCatalog.getRuleVersionsMap(offer.source_site);
  const complianceResult = compliance.checkAllRules(offer, rules);
  const scoringResult = scoring.score(offer, rules, complianceResult);
  const explanation = explainer.explain(scoringResult, complianceResult);

  // Persist analysis
  const result = await pool.query<{ id: string }>(
    `INSERT INTO auto_apply.analisis_oferta
      (offer_id, site, score, confidence, reasons, rule_versions, analyzed_at)
     VALUES ($1, $2, $3, $4, $5, $6, now())
     RETURNING id`,
    [
      offer.id,
      offer.source_site,
      scoringResult.score,
      scoringResult.confidence,
      JSON.stringify(scoringResult.reasons),
      JSON.stringify(ruleVersions),
    ],
  );

  const analysisId = result.rows[0]?.id ?? 'unknown';

  await audit.record({
    offer_id: offer.id,
    action: explanation.recommendation,
    reason: explanation.summary,
    score: scoringResult.score,
    rule_versions: ruleVersions,
  });

  log.info({ analysisId, score: scoringResult.score, recommendation: explanation.recommendation }, 'Offer analyzed');
  return analysisId;
}

export async function runAnalyzeWorker(): Promise<void> {
  const log = logger.child({ worker: 'analyze' });
  log.info('Starting analysis run for pending offers');

  const result = await pool.query<Offer>(
    `SELECT * FROM auto_apply.oferta_proyecto
     WHERE status = 'open'
       AND id NOT IN (SELECT DISTINCT offer_id FROM auto_apply.analisis_oferta)
     ORDER BY published_at DESC
     LIMIT 50`,
  );

  for (const offer of result.rows) {
    try {
      await analyzeOffer(offer);
    } catch (err) {
      log.error({ err, offer_id: offer.id }, 'Failed to analyze offer');
    }
  }

  log.info({ processed: result.rows.length }, 'Analysis run complete');
}
