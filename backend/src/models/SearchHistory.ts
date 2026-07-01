import { Schema, model, InferSchemaType } from 'mongoose';

const searchHistorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    query: { type: String, required: true },
    category: { type: String, required: true },
    suppliers: { type: [String], default: [] },
    resultCount: { type: Number, default: 0 },
    recommendedSupplier: { type: String, default: '' },
    bestPrice: { type: Number, default: 0 },
    estimatedSavings: { type: Number, default: 0 },
    weightProfile: { type: String, default: 'balanced' },
  },
  { timestamps: true },
);

searchHistorySchema.index({ userId: 1, createdAt: -1 });

searchHistorySchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export type SearchHistoryDoc = InferSchemaType<typeof searchHistorySchema>;
export const SearchHistory = model('SearchHistory', searchHistorySchema);
