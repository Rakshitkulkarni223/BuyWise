import { Request, Response } from 'express';
import { asyncHandler, ok } from '../utils/http';
import { BasketOptimizationService } from '../services/BasketOptimizationService';
import { basketHistoryRepository } from '../repositories/BasketHistoryRepository';
import { basketSchema } from '../validators/schemas';

function parsePagination(query: Record<string, unknown>) {
  try {
    const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '20'), 10) || 20));
    return { page, limit };
  } catch (e) {
    return { page: 1, limit: 20 };
  }
}

export const BasketController = {
  optimize: asyncHandler(async (req: Request, res: Response) => {
    const input = basketSchema.parse(req.body);
    const result = await BasketOptimizationService.optimize(req.user!.sub, input);
    return ok(res, result);
  }),

  history: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = parsePagination(req.query);
    return ok(res, await basketHistoryRepository.paginatedByUser(req.user!.sub, page, limit));
  }),
};
