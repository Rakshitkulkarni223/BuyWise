import { BasketHistory } from '../models/BasketHistory';

export class BasketHistoryRepository {
  create(data: Record<string, unknown>) {
    try {
      return BasketHistory.create(data);
    } catch (e) {
      throw e;
    }
  }

  listByUser(userId: string, limit = 50) {
    try {
      return BasketHistory.find({ userId }).sort({ createdAt: -1 }).limit(limit);
    } catch (e) {
      throw e;
    }
  }

  async paginatedByUser(userId: string, page: number, limit: number) {
    try {
      const skip = (page - 1) * limit;
      const [items, total] = await Promise.all([
        BasketHistory.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
        BasketHistory.countDocuments({ userId }),
      ]);
      return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
    } catch (e) {
      throw e;
    }
  }
}

export const basketHistoryRepository = new BasketHistoryRepository();
