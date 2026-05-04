import { logger } from '../../lib/logger.js';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export class RetryPolicyService {
  private readonly maxAttempts: number;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;

  constructor(options: RetryOptions = {}) {
    this.maxAttempts = options.maxAttempts ?? 3;
    this.baseDelayMs = options.baseDelayMs ?? 1_000;
    this.maxDelayMs = options.maxDelayMs ?? 30_000;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (attempt === this.maxAttempts) break;

        const delay = Math.min(this.baseDelayMs * 2 ** (attempt - 1), this.maxDelayMs);
        logger.warn({ attempt, maxAttempts: this.maxAttempts, delayMs: delay }, 'Retrying after failure');
        await new Promise<void>((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}
