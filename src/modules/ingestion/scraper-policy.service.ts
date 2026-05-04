import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';

export class ScraperPolicyService {
  private readonly rateLimitMs: number;
  private lastRequestAt = 0;

  constructor() {
    this.rateLimitMs = Math.ceil(1000 / env.SCRAPER_RATE_LIMIT_RPS);
  }

  async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestAt;
    if (elapsed < this.rateLimitMs) {
      const wait = this.rateLimitMs - elapsed;
      await new Promise<void>((resolve) => setTimeout(resolve, wait));
    }
    this.lastRequestAt = Date.now();
  }

  /**
   * Exponential backoff for 429 / 5xx responses — constitución Principio III.
   */
  async handleRateLimitResponse(attempt: number): Promise<void> {
    const baseDelay = 5_000;
    const maxDelay = 120_000;
    const delay = Math.min(baseDelay * 2 ** attempt, maxDelay);
    logger.warn({ attempt, delayMs: delay }, 'Rate limit hit — backing off');
    await new Promise<void>((resolve) => setTimeout(resolve, delay));
  }
}
