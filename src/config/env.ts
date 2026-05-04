import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  DB_SCHEMA: z.string().min(1).default('auto_apply'),

  DEFAULT_SIMULATE: z
    .string()
    .transform((v) => v !== 'false')
    .default('true'),

  SCRAPER_USER_AGENT: z.string().min(1),
  SCRAPER_RATE_LIMIT_RPS: z.coerce.number().positive().default(1),

  INGEST_CRON: z.string().default('*/30 * * * *'),

  JWT_SECRET: z.string().min(32),

  OPENAI_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${errors}`);
  }
  return result.data;
}

export const env: Env = loadEnv();
