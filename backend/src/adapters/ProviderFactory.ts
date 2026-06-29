import { ProviderAdapter } from '../interfaces/ProviderAdapter';
import { MockProviderAdapter } from './MockProviderAdapter';
import { SUPPLIER_PROFILES } from '../config/data';

/**
 * Factory Pattern: resolves the correct adapter for a supplier by name, with no
 * provider-specific switch statements leaking into the Search Service. Adding a
 * real provider later is a config entry + one adapter class registration here.
 */
export class ProviderFactory {
  static create(supplierName: string): ProviderAdapter | null {
    const profile = SUPPLIER_PROFILES[supplierName];
    if (!profile) return null;
    return new MockProviderAdapter(profile);
  }

  static isKnown(supplierName: string): boolean {
    return Boolean(SUPPLIER_PROFILES[supplierName]);
  }
}
