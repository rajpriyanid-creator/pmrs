import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';
import { isProd } from '../config/env';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.originalUrl}` } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) logger.error(err.message, { stack: err.stack });
    else logger.debug(err.message);
    return res.status(err.statusCode).json({
      error: { message: err.message, details: err.details },
    });
  }

  logger.error(err instanceof Error ? err.message : 'Unknown error', {
    stack: err instanceof Error ? err.stack : undefined,
  });

  return res.status(500).json({
    error: { message: isProd ? 'Internal server error' : String(err instanceof Error ? err.message : err) },
  });
}
