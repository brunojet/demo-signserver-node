// Observability module: logs, metrics, tracing
// Integrates with EventBus, WorkerPool, Storage

import winston from 'winston';

export interface Logger {
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
}

export class WinstonLogger implements Logger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console()
      ]
    });
  }

  info(message: string, meta?: Record<string, any>) {
    this.logger.info(message, meta);
  }
  warn(message: string, meta?: Record<string, any>) {
    this.logger.warn(message, meta);
  }
  error(message: string, meta?: Record<string, any>) {
    this.logger.error(message, meta);
  }
  debug(message: string, meta?: Record<string, any>) {
    this.logger.debug(message, meta);
  }
}

export const logger: Logger = new WinstonLogger();

// TODO: Add metrics and tracing interfaces/providers
