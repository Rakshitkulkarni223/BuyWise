import { preferenceRepository } from '../repositories/PreferenceRepository';
import { WEIGHT_PROFILES } from '../config/data';

export class PreferenceService {
  static async get(userId: string) {
    let pref = await preferenceRepository.getByUser(userId);
    if (!pref) pref = await preferenceRepository.upsert(userId, {});
    return pref;
  }

  static async update(userId: string, data: Record<string, unknown>) {
    const allowed = ['defaultCategory', 'enabledSuppliers', 'sortPreference', 'weightProfile', 'businessType'];
    const clean: Record<string, unknown> = {};
    for (const key of allowed) {
      if (data[key] !== undefined) clean[key] = data[key];
    }
    return preferenceRepository.upsert(userId, clean);
  }

  static weightProfiles() {
    return Object.values(WEIGHT_PROFILES);
  }
}
