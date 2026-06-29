import { Request, Response } from 'express';
import { asyncHandler, ok } from '../utils/http';
import { DashboardService } from '../services/DashboardService';

export const DashboardController = {
  summary: asyncHandler(async (req: Request, res: Response) => {
    return ok(res, await DashboardService.summary(req.user!.sub));
  }),

  spend: asyncHandler(async (req: Request, res: Response) => {
    return ok(res, await DashboardService.spend(req.user!.sub));
  }),

  savings: asyncHandler(async (req: Request, res: Response) => {
    return ok(res, await DashboardService.savings(req.user!.sub));
  }),

  insights: asyncHandler(async (req: Request, res: Response) => {
    return ok(res, await DashboardService.insights(req.user!.sub));
  }),
};
