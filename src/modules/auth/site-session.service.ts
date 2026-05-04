import { pool } from '../../lib/db.js';
import { logger } from '../../lib/logger.js';

export interface SiteSession {
  account_id: string;
  site: string;
  alias: string;
  credential_secret_ref: string;
  username_ref: string;
}

export class SiteSessionService {
  /**
   * Retrieve an active account session for a given site.
   * Does NOT return actual credentials — only references to secrets.
   */
  async getActiveSession(site: string, accountId?: string): Promise<SiteSession | null> {
    const query = accountId
      ? `SELECT id, site, account_alias, credential_secret_ref, username_ref
         FROM auto_apply.cuenta_sitio
         WHERE site = $1 AND id = $2 AND status = 'active'
         LIMIT 1`
      : `SELECT id, site, account_alias, credential_secret_ref, username_ref
         FROM auto_apply.cuenta_sitio
         WHERE site = $1 AND status = 'active'
         ORDER BY health_score DESC
         LIMIT 1`;

    const params = accountId ? [site, accountId] : [site];
    const result = await pool.query<{
      id: string;
      site: string;
      account_alias: string;
      credential_secret_ref: string;
      username_ref: string;
    }>(query, params);

    const row = result.rows[0];
    if (!row) return null;

    return {
      account_id: row.id,
      site: row.site,
      alias: row.account_alias,
      credential_secret_ref: row.credential_secret_ref,
      username_ref: row.username_ref,
    };
  }

  async markCooldown(accountId: string): Promise<void> {
    await pool.query(
      `UPDATE auto_apply.cuenta_sitio SET status = 'cooldown', updated_at = now() WHERE id = $1`,
      [accountId],
    );
    logger.warn({ accountId }, 'Account set to cooldown');
  }

  async updateHealthScore(accountId: string, delta: number): Promise<void> {
    await pool.query(
      `UPDATE auto_apply.cuenta_sitio
       SET health_score = GREATEST(0, LEAST(100, health_score + $1)), updated_at = now()
       WHERE id = $2`,
      [delta, accountId],
    );
  }
}
