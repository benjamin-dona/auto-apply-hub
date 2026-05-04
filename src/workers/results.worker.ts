import cron from 'node-cron';
import { LearningFeedbackService } from '../modules/results/learning-feedback.service.js';
import { PrioritizationUpdateService } from '../modules/results/prioritization-update.service.js';
import { logger } from '../lib/logger.js';

const feedback = new LearningFeedbackService();
const prioritization = new PrioritizationUpdateService();

export async function runResultsWorker(): Promise<void> {
  const log = logger.child({ worker: 'results' });
  log.info('Running results + learning cycle');

  try {
    await feedback.runFeedbackCycle('workana');
    await prioritization.updatePriorities('workana');
    log.info('Results worker cycle complete');
  } catch (err) {
    log.error({ err }, 'Results worker failed');
  }
}

export function startResultsWorker(): void {
  // Run once per day at 03:00
  cron.schedule('0 3 * * *', () => {
    void runResultsWorker();
  });
  logger.info('Results worker scheduled: daily at 03:00');
}
