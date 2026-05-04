import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

const SENSITIVE_KEYS = new Set([
  'password',
  'credential_secret_ref',
  'username_ref',
  'authorization',
  'cookie',
  'token',
  'secret',
  'api_key',
]);

function redactObject(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(redactObject);
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    result[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? '[REDACTED]' : redactObject(value);
  }
  return result;
}

async function plugin(app: FastifyInstance): Promise<void> {
  app.addHook('onSend', async (_req, reply, payload) => {
    if (reply.getHeader('content-type')?.toString().includes('application/json')) {
      try {
        const parsed: unknown = JSON.parse(payload as string);
        return JSON.stringify(redactObject(parsed));
      } catch {
        return payload;
      }
    }
    return payload;
  });
}

export const redactionPlugin = fp(plugin, { name: 'redaction' });
