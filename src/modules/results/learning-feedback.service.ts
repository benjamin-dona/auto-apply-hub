import { pool } from '../../lib/db.js';
import { logger } from '../../lib/logger.js';

export class LearningFeedbackService {
  /**
   * Adjust rule weights and analysis signals based on historical outcomes.
   * Current implementation: heuristic adjustment of perfil_operativo risk thresholds.
   */
  async runFeedbackCycle(site: string): Promise<void> {
    const log = logger.child({ service: 'learning-feedback', site });

    // Calculate win rate per skill_tag using recent attempts
    const stats = await pool.query<{
      skill_tag: string;
      total: string;
      won: string;
    }>(
      `SELECT
         po.skill_tag,
         COUNT(*)::text as total,
         COUNT(*) FILTER (WHERE rp.outcome = 'won')::text as won
       FROM auto_apply.intento_postulacion ip
       JOIN auto_apply.oferta_proyecto op ON op.id = ip.offer_id
       JOIN auto_apply.resultado_postulacion rp ON rp.attempt_id = ip.id
       JOIN auto_apply.perfil_operativo po
         ON po.skill_tag = ANY(op.skills::text[])
       WHERE ip.created_at >= now() - INTERVAL '30 days'
         AND ip.mode = 'real'
       GROUP BY po.skill_tag`,
    );

    for (const row of stats.rows) {
      const total = parseInt(row.total, 10);
      const won = parseInt(row.won, 10);
      if (total < 5) continue; // Not enough data

      const winRate = won / total;

      // Increase risk_threshold if win rate is low (be more conservative)
      // Decrease risk_threshold if win rate is high (be more aggressive)
      const adjustment = winRate < 0.3 ? 0.05 : winRate > 0.6 ? -0.05 : 0;

      if (adjustment !== 0) {
        await pool.query(
          `UPDATE auto_apply.perfil_operativo
           SET risk_threshold = GREATEST(0.1, LEAST(0.9, risk_threshold + $1)),
               updated_at = now()
           WHERE skill_tag = $2 AND active = true`,
          [adjustment, row.skill_tag],
        );
        log.info({ skill_tag: row.skill_tag, win_rate: winRate, adjustment }, 'Risk threshold adjusted');
      }
    }

    log.info('Feedback cycle complete');
  }
}
