import { catalogRepository } from '../repositories/CatalogRepository';
import { ApiError } from '../utils/http';

export class CatalogService {
  static listCategories() {
    return catalogRepository.listCategories();
  }

  static async suppliersForCategory(slug: string) {
    const category = await catalogRepository.getCategory(slug);
    if (!category) throw new ApiError(404, `Category not found: ${slug}`);
    return catalogRepository.suppliersByCategory(slug);
  }

  static listSuppliers() {
    return catalogRepository.listSuppliers();
  }

  static async toggleSupplier(id: string, enabled?: boolean) {
    const supplier = await catalogRepository.findSupplier(id);
    if (!supplier) throw new ApiError(404, 'Supplier not found');
    supplier.enabled = typeof enabled === 'boolean' ? enabled : !supplier.enabled;
    await supplier.save();
    return supplier;
  }
}
