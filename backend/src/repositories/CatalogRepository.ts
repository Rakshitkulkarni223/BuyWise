import { Category } from '../models/Category';
import { Supplier } from '../models/Supplier';

export class CatalogRepository {
  listCategories() {
    return Category.find({ enabled: true }).sort({ name: 1 });
  }

  getCategory(slug: string) {
    return Category.findOne({ slug });
  }

  listSuppliers() {
    return Supplier.find().sort({ category: 1, name: 1 });
  }

  suppliersByCategory(category: string) {
    return Supplier.find({ category }).sort({ name: 1 });
  }

  findSupplier(id: string) {
    return Supplier.findById(id);
  }
}

export const catalogRepository = new CatalogRepository();
