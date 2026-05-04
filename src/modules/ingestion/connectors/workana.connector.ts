import axios, { type AxiosInstance } from 'axios';
import { env } from '../../../config/env.js';
import { logger } from '../../../lib/logger.js';
import type { RawWorkanaOffer } from '../../../api/schemas/offer.schema.js';

const WORKANA_BASE_URL = 'https://www.workana.com';
const WORKANA_PROJECTS_PATH = '/jobs';

export class WorkanaConnector {
  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: WORKANA_BASE_URL,
      headers: {
        'User-Agent': env.SCRAPER_USER_AGENT,
        Accept: 'application/json, text/html',
      },
      timeout: 15_000,
    });
  }

  /**
   * Fetch the first page of open projects from Workana.
   * Respects rate limiting per constitución Principio III.
   */
  async fetchOffers(page = 1): Promise<RawWorkanaOffer[]> {
    await this.checkRobotsTxt();

    const log = logger.child({ connector: 'workana', page });
    log.info('Fetching offers from Workana');

    try {
      const response = await this.http.get<{ jobs?: RawWorkanaOffer[] }>(
        `${WORKANA_PROJECTS_PATH}`,
        {
          params: { page, language: 'es', availability: 'open' },
          headers: { Accept: 'application/json' },
        },
      );

      const offers = response.data.jobs ?? [];
      log.info({ count: offers.length }, 'Fetched offers');
      return offers;
    } catch (err) {
      log.error({ err }, 'Failed to fetch Workana offers');
      throw err;
    }
  }

  /**
   * Verify robots.txt before scraping — constitución Principio III.
   * Logs a warning if unable to verify; never bypasses.
   */
  private async checkRobotsTxt(): Promise<void> {
    try {
      const resp = await this.http.get<string>('/robots.txt');
      if (resp.data.includes('Disallow: /jobs')) {
        throw new Error('robots.txt disallows scraping /jobs on Workana');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('robots.txt disallows')) throw err;
      logger.warn({ err }, 'Could not verify robots.txt — proceeding with caution');
    }
  }

  /**
   * Rate-limit delay helper — 1 RPS per domain (constitución Principio III).
   */
  static async rateDelay(): Promise<void> {
    const delayMs = Math.ceil(1000 / env.SCRAPER_RATE_LIMIT_RPS);
    await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
  }
}
