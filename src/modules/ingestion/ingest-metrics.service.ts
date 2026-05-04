import { pool } from '../../lib/db.js';
import { logger } from '../../lib/logger.js';

export interface IngestMetricsSummary {
  site: string;
  inserted: number;
  skipped: number;
  failed: number;
  recorded_at: Date;
}

export class IngestMetricsService {
  async record(metrics: IngestMetricsSummary): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO auto_apply.ingest_metrics_log
          (site, inserted, skipped, failed, recorded_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [
          metrics.site,
          metrics.inserted,
          metrics.skipped,
          metrics.failed,
          metrics.recorded_at,
        ],
      );
    } catch (err) {
      // Non-critical: log but don't crash ingestion
      logger.warn({ err }, 'Failed to record ingest metrics');
    }
  }
}
