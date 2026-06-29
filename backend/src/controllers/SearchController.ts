import { Request, Response } from 'express';
import { asyncHandler, ok } from '../utils/http';
import { SearchService } from '../services/SearchService';
import { RecommendationService } from '../services/RecommendationService';
import { searchSchema, recommendationSchema } from '../validators/schemas';

export const SearchController = {
  search: asyncHandler(async (req: Request, res: Response) => {
    const input = searchSchema.parse(req.body);
    const result = await SearchService.search(req.user!.sub, input);
    return ok(res, result);
  }),

  recommend: asyncHandler(async (req: Request, res: Response) => {
    const { products, weightProfile } = recommendationSchema.parse(req.body);
    const recommendation = RecommendationService.recommend(products as any, weightProfile);
    return ok(res, { recommendation });
  }),
};
