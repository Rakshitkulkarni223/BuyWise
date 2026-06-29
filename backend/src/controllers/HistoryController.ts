import { Request, Response } from 'express';
import { asyncHandler, ok } from '../utils/http';
import { HistoryService } from '../services/HistoryService';

export const HistoryController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    return ok(res, await HistoryService.list(req.user!.sub));
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await HistoryService.remove(req.user!.sub, req.params.id);
    return ok(res, { message: 'Deleted' });
  }),
};
