import { Request, Response } from 'express';
import { asyncHandler, ok } from '../utils/http';
import { DashboardService, DateRange } from '../services/DashboardService';

function parseDateRange(query: Record<string, unknown>): DateRange | undefined {
  try {
    const from = query.from ? new Date(String(query.from)) : undefined;
    const to = query.to ? new Date(String(query.to)) : undefined;
    if (!from && !to) return undefined;
    if (to) to.setHours(23, 59, 59, 999);
    return { from: from && !isNaN(from.getTime()) ? from : undefined, to: to && !isNaN(to.getTime()) ? to : undefined };
  } catch {
    return undefined;
  }
}

export const DashboardController = {
  summary: asyncHandler(async (req: Request, res: Response) => {
    const range = parseDateRange(req.query);
    return ok(res, await DashboardService.summary(req.user!.sub, range));
  }),

  spend: asyncHandler(async (req: Request, res: Response) => {
    const range = parseDateRange(req.query);
    return ok(res, await DashboardService.spend(req.user!.sub, range));
  }),

  savings: asyncHandler(async (req: Request, res: Response) => {
    const range = parseDateRange(req.query);
    return ok(res, await DashboardService.savings(req.user!.sub, range));
  }),

  insights: asyncHandler(async (req: Request, res: Response) => {
    const range = parseDateRange(req.query);
    return ok(res, await DashboardService.insights(req.user!.sub, range));
  }),

  businessImpact: asyncHandler(async (req: Request, res: Response) => {
    const range = parseDateRange(req.query);
    return ok(res, await DashboardService.businessImpact(req.user!.sub, range));
  }),
};
