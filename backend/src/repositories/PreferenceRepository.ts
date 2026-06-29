import { UserPreference } from '../models/UserPreference';

export class PreferenceRepository {
  getByUser(userId: string) {
    return UserPreference.findOne({ userId });
  }

  upsert(userId: string, data: Record<string, unknown>) {
    return UserPreference.findOneAndUpdate(
      { userId },
      { $set: data },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }
}

export const preferenceRepository = new PreferenceRepository();
