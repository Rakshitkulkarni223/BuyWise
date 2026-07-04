import { SearchHistory } from '../models/SearchHistory';

export class HistoryRepository {
  create(data: Record<string, unknown>) {
    try {
      return SearchHistory.create(data);
    } catch (e) {
      throw e;
    }
  }

  listByUser(userId: string, limit = 50) {
    try {
      return SearchHistory.find({ userId }).sort({ createdAt: -1 }).limit(limit);
    } catch (e) {
      throw e;
    }
  }

  async paginatedByUser(userId: string, page: number, limit: number) {
    try {
      const skip = (page - 1) * limit;
      const [items, total] = await Promise.all([
        SearchHistory.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
        SearchHistory.countDocuments({ userId }),
      ]);
      return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
    } catch (e) {
      throw e;
    }
  }

  deleteById(userId: string, id: string) {
    try {
      return SearchHistory.findOneAndDelete({ _id: id, userId });
    } catch (e) {
      throw e;
    }
  }

  countByUser(userId: string) {
    try {
      return SearchHistory.countDocuments({ userId });
    } catch (e) {
      throw e;
    }
  }

  allByUser(userId: string, from?: Date, to?: Date) {
    try {
      const filter: Record<string, unknown> = { userId };
      if (from || to) {
        const dateFilter: Record<string, Date> = {};
        if (from) dateFilter.$gte = from;
        if (to) dateFilter.$lte = to;
        filter.createdAt = dateFilter;
      }
      return SearchHistory.find(filter).sort({ createdAt: -1 });
    } catch (e) {
      throw e;
    }
  }
}

export const historyRepository = new HistoryRepository();
