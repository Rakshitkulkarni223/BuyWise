import { Schema, model, InferSchemaType } from 'mongoose';

const supplierSchema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true, index: true },
    color: { type: String, default: '#64748B' },
    logo: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

supplierSchema.index({ name: 1, category: 1 }, { unique: true });

supplierSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export type SupplierDoc = InferSchemaType<typeof supplierSchema>;
export const Supplier = model('Supplier', supplierSchema);
