import { Request, Response } from 'express';
import { asyncHandler, ok } from '../utils/http';
import { HistoryService } from '../services/HistoryService';

function parsePagination(query: Record<string, unknown>) {
  try {
    const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '20'), 10) || 20));
    return { page, limit };
  } catch (e) {
    return { page: 1, limit: 20 };
  }
}

export const HistoryController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = parsePagination(req.query);
    return ok(res, await HistoryService.paginated(req.user!.sub, page, limit));
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await HistoryService.remove(req.user!.sub, req.params.id);
    return ok(res, { message: 'Deleted' });
  }),
};
