import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/http';
import { logger } from '../utils/logger';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ success: false, error: 'Resource not found' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      error: 'Validation failed',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, error: err.message, details: err.details });
  }

  // Mongo duplicate key
  if (typeof err === 'object' && err && (err as any).code === 11000) {
    return res.status(409).json({ success: false, error: 'Duplicate entry' });
  }

  logger.error('Unhandled error', err);
  return res.status(500).json({ success: false, error: 'Internal server error' });
}
