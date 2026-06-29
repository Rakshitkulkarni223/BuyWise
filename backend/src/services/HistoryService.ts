import { historyRepository } from '../repositories/HistoryRepository';

export class HistoryService {
  static list(userId: string) {
    return historyRepository.listByUser(userId);
  }

  static remove(userId: string, id: string) {
    return historyRepository.deleteById(userId, id);
  }
}
