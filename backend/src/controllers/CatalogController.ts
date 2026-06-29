import { Request, Response } from 'express';
import { asyncHandler, ok } from '../utils/http';
import { CatalogService } from '../services/CatalogService';

export const CatalogController = {
  listCategories: asyncHandler(async (_req: Request, res: Response) => {
    return ok(res, await CatalogService.listCategories());
  }),

  suppliersForCategory: asyncHandler(async (req: Request, res: Response) => {
    return ok(res, await CatalogService.suppliersForCategory(req.params.id));
  }),

  listSuppliers: asyncHandler(async (_req: Request, res: Response) => {
    return ok(res, await CatalogService.listSuppliers());
  }),

  toggleSupplier: asyncHandler(async (req: Request, res: Response) => {
    const { enabled } = req.body || {};
    return ok(res, await CatalogService.toggleSupplier(req.params.id, enabled));
  }),
};
