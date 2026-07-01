import { historyRepository } from '../repositories/HistoryRepository';

export class HistoryService {
  static list(userId: string) {
    try {
      return historyRepository.listByUser(userId);
    } catch (e) {
      throw e;
    }
  }

  static paginated(userId: string, page: number, limit: number) {
    try {
      return historyRepository.paginatedByUser(userId, page, limit);
    } catch (e) {
      throw e;
    }
  }

  static remove(userId: string, id: string) {
    try {
      return historyRepository.deleteById(userId, id);
    } catch (e) {
      throw e;
    }
  }
}
