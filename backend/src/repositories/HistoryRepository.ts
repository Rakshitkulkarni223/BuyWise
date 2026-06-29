import { SearchHistory } from '../models/SearchHistory';

export class HistoryRepository {
  create(data: Record<string, unknown>) {
    return SearchHistory.create(data);
  }

  listByUser(userId: string, limit = 50) {
    return SearchHistory.find({ userId }).sort({ createdAt: -1 }).limit(limit);
  }

  deleteById(userId: string, id: string) {
    return SearchHistory.findOneAndDelete({ _id: id, userId });
  }

  countByUser(userId: string) {
    return SearchHistory.countDocuments({ userId });
  }

  allByUser(userId: string) {
    return SearchHistory.find({ userId }).sort({ createdAt: -1 });
  }
}

export const historyRepository = new HistoryRepository();
