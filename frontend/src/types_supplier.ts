export interface SupplierHubSupplier {
  id: string;
  userId: string;
  name: string;
  supplierType: string;
  businessName?: string;
  gstNumber?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  deliveryDays?: number;
  creditPeriod?: number;
  minimumOrderQuantity?: number;
  deliveryCharges?: number;
  paymentTerms?: string;
  reliabilityScore?: number;
  preferredCategories: string[];
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierHubProduct {
  id: string;
  supplierId: string;
  productName: string;
  brand?: string;
  category?: string;
  unit?: string;
  currentPrice?: number;
  moq?: number;
  availability?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierHubIntelligence {
  totalSuppliers: number;
  activeSuppliers: number;
  inactiveSuppliers: number;
  supplierTypes: Record<string, number>;
  preferredCategories: Record<string, number>;
  avgCreditPeriod: number;
  avgReliability: number;
}

export const SUPPLIER_TYPE_LABELS: Record<string, string> = {
  marketplace: 'Marketplace',
  quick_commerce: 'Quick Commerce',
  manufacturer: 'Manufacturer',
  distributor: 'Distributor',
  wholesaler: 'Wholesaler',
  local_vendor: 'Local Vendor',
  farmer_fpo: 'Farmer / FPO',
  custom: 'Custom Supplier',
};

export const SUPPLIER_TYPE_OPTIONS = Object.entries(SUPPLIER_TYPE_LABELS).map(([value, label]) => ({ value, label }));
