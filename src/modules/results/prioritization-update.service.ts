import { pool } from '../../lib/db.js';
import { logger } from '../../lib/logger.js';

export class PrioritizationUpdateService {
  /**
   * Re-score offers similar to historically won cases (SC-006: ≥80% of similar offers get high priority).
   * Implemented as a tag on analisis_oferta.reasons for the next analysis pass.
   */
  async updatePriorities(site: string): Promise<void> {
    const log = logger.child({ service: 'prioritization-update', site });

    // Find skill tags with high win rate
    const winningSkills = await pool.query<{ skills: string[] }>(
      `SELECT DISTINCT op.skills
       FROM auto_apply.oferta_projeto op
       JOIN auto_apply.intento_postulacion ip ON ip.offer_id = op.id
       JOIN auto_apply.resultado_postulacion rp ON rp.attempt_id = ip.id
       WHERE rp.outcome = 'won'
         AND op.source_site = $1
         AND ip.created_at >= now() - INTERVAL '60 days'
       LIMIT 50`,
      [site],
    );

    const skillSet = new Set(winningSkills.rows.flatMap((r) => r.skills));
    if (skillSet.size === 0) {
      log.info('No winning skills found yet — skipping priority update');
      return;
    }

    // Mark open offers with matching skills as high-priority via a priority signal
    const updated = await pool.query<{ id: string }>(
      `UPDATE auto_apply.oferta_proyecto
       SET raw_payload = jsonb_set(
         raw_payload,
         '{priority_signal}',
         '"high"'
       ),
       updated_at = now()
       WHERE source_site = $1
         AND status = 'open'
         AND skills && $2
       RETURNING id`,
      [site, Array.from(skillSet)],
    );

    log.info({ updated: updated.rowCount }, 'Priority signals updated');
  }
}
