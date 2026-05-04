import cron from 'node-cron';
import { WorkanaConnector } from '../modules/ingestion/connectors/workana.connector.js';
import { OfferNormalizerService } from '../modules/ingestion/offer-normalizer.service.js';
import { OfferRepository } from '../modules/ingestion/offer-repository.js';
import { IngestMetricsService } from '../modules/ingestion/ingest-metrics.service.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';

const connector = new WorkanaConnector();
const normalizer = new OfferNormalizerService();
const repository = new OfferRepository();
const metricsService = new IngestMetricsService();

export async function runIngest(): Promise<void> {
  const log = logger.child({ worker: 'ingest' });
  log.info('Starting ingestion run');

  try {
    const rawOffers = await connector.fetchOffers(1);
    await WorkanaConnector.rateDelay();

    const normalized = rawOffers.map((raw) => normalizer.normalizeWorkana(raw));
    const metrics = await repository.upsertBatch(normalized);

    await metricsService.record({
      site: 'workana',
      ...metrics,
      recorded_at: new Date(),
    });

    log.info(metrics, 'Ingestion run complete');
  } catch (err) {
    log.error({ err }, 'Ingestion run failed');
  }
}

export function startIngestWorker(): void {
  logger.info({ cron: env.INGEST_CRON }, 'Registering ingest worker');
  cron.schedule(env.INGEST_CRON, () => {
    void runIngest();
  });
}
