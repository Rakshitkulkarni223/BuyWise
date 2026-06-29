import { Request, Response } from 'express';
import { asyncHandler, ok } from '../utils/http';
import { PreferenceService } from '../services/PreferenceService';
import { preferenceSchema } from '../validators/schemas';

export const PreferenceController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    return ok(res, await PreferenceService.get(req.user!.sub));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const input = preferenceSchema.parse(req.body);
    return ok(res, await PreferenceService.update(req.user!.sub, input));
  }),

  weightProfiles: asyncHandler(async (_req: Request, res: Response) => {
    return ok(res, PreferenceService.weightProfiles());
  }),
};
