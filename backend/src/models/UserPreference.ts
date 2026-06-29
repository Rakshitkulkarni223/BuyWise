import { Schema, model, InferSchemaType, Types } from 'mongoose';

const preferenceSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    defaultCategory: { type: String, default: 'electronics' },
    enabledSuppliers: { type: [String], default: [] },
    sortPreference: {
      type: String,
      enum: ['lowest_price', 'highest_rating', 'fastest_delivery', 'highest_discount'],
      default: 'lowest_price',
    },
    weightProfile: {
      type: String,
      enum: ['balanced', 'startup', 'hospital', 'restaurant'],
      default: 'balanced',
    },
    businessType: { type: String, default: 'general' },
  },
  { timestamps: true },
);

preferenceSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export type PreferenceDoc = InferSchemaType<typeof preferenceSchema> & { userId: Types.ObjectId };
export const UserPreference = model('UserPreference', preferenceSchema);
