import pino from 'pino';
import { env } from '../config/env.js';

// Patterns redacted from all log output to prevent credential leakage
const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'body.password',
  'body.credential_secret_ref',
  'body.username_ref',
  'DATABASE_URL',
  'DB_PASSWORD',
  'OPENAI_API_KEY',
  'JWT_SECRET',
];

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: {
    paths: REDACT_PATHS,
    censor: '[REDACTED]',
  },
  ...(env.NODE_ENV !== 'production'
    ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
    : {}),
});
