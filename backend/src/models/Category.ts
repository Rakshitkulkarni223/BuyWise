import { Schema, model, InferSchemaType } from 'mongoose';

const categorySchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    icon: { type: String, default: 'Box' },
    description: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categorySchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export type CategoryDoc = InferSchemaType<typeof categorySchema>;
export const Category = model('Category', categorySchema);
