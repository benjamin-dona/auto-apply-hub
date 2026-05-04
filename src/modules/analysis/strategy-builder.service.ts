import { pool } from '../../lib/db.js';
import type { Offer } from '../../api/schemas/offer.schema.js';
import type { SiteSession } from '../auth/site-session.service.js';

export interface Strategy {
  id: string;
  offer_id: string;
  analysis_id: string;
  site: string;
  recommended_price: number;
  min_price_floor: number;
  proposal_template_id: string;
  suggested_send_at: Date;
  rationale: Record<string, unknown>;
}

export class StrategyBuilderService {
  async build(offer: Offer, analysisId: string, account: SiteSession): Promise<Strategy> {
    // Lookup min_price_floor from perfil_operativo by skill match
    const primarySkill = offer.skills[0]?.toLowerCase() ?? 'general';
    const profileResult = await pool.query<{ min_price_floor: string }>(
      `SELECT min_price_floor FROM auto_apply.perfil_operativo
       WHERE skill_tag = $1 AND active = true
       UNION ALL
       SELECT min_price_floor FROM auto_apply.perfil_operativo
       WHERE skill_tag = 'general' AND active = true
       LIMIT 1`,
      [primarySkill],
    );

    const minFloor = parseFloat(profileResult.rows[0]?.min_price_floor ?? '15');
    const budget = offer.budget_min ?? offer.budget_max ?? minFloor * 2;
    const recommendedPrice = Math.max(minFloor, Math.round(budget * 0.88)); // 12% below budget

    const suggestedSendAt = new Date(Date.now() + 2 * 3_600_000); // +2h
    const rationale = {
      account_alias: account.alias,
      skill_matched: primarySkill,
      min_floor: minFloor,
      budget_signal: budget,
      strategy: 'competitive_low',
    };

    const result = await pool.query<{ id: string }>(
      `INSERT INTO auto_apply.estrategia_postulacion
        (offer_id, analysis_id, site, recommended_price, min_price_floor,
         proposal_template_id, suggested_send_at, rationale, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now())
       RETURNING id`,
      [
        offer.id,
        analysisId,
        offer.source_site,
        recommendedPrice,
        minFloor,
        'default-proposal-v1',
        suggestedSendAt,
        JSON.stringify(rationale),
      ],
    );

    const id = result.rows[0]?.id ?? '';
    return {
      id,
      offer_id: offer.id,
      analysis_id: analysisId,
      site: offer.source_site,
      recommended_price: recommendedPrice,
      min_price_floor: minFloor,
      proposal_template_id: 'default-proposal-v1',
      suggested_send_at: suggestedSendAt,
      rationale,
    };
  }
}
