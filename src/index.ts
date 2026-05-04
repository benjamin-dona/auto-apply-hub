import { startServer } from './api/server.js';
import { logger } from './lib/logger.js';

startServer().catch((err: unknown) => {
  logger.error({ err }, 'Fatal error starting server');
  process.exit(1);
});
