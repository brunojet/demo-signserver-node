// Middleware de observabilidade para Express
import { Request, Response, NextFunction } from 'express';
import { logger } from './observability';

export function httpObservabilityMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  });
  next();
}
