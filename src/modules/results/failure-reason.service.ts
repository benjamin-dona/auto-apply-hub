import { pool } from '../../lib/db.js';

export interface FailureClassification {
  attempt_id: string;
  category: 'rule_violation' | 'low_score' | 'account_issue' | 'site_error' | 'unknown';
  detail: string;
}

export class FailureReasonService {
  async classify(attemptId: string, failureReason: string): Promise<FailureClassification> {
    const reason = failureReason.toLowerCase();

    let category: FailureClassification['category'] = 'unknown';

    if (reason.includes('rule') || reason.includes('compliance') || reason.includes('format')) {
      category = 'rule_violation';
    } else if (reason.includes('score') || reason.includes('budget') || reason.includes('eligib')) {
      category = 'low_score';
    } else if (reason.includes('account') || reason.includes('login') || reason.includes('session')) {
      category = 'account_issue';
    } else if (reason.includes('timeout') || reason.includes('503') || reason.includes('429')) {
      category = 'site_error';
    }

    // Store classification in learned_features of resultado_postulacion
    await pool.query(
      `UPDATE auto_apply.resultado_postulacion
       SET learned_features = jsonb_set(
         COALESCE(learned_features, '{}'),
         '{failure_category}',
         $1::jsonb
       )
       WHERE attempt_id = $2::bigint`,
      [JSON.stringify(category), attemptId],
    );

    return { attempt_id: attemptId, category, detail: failureReason };
  }
}
