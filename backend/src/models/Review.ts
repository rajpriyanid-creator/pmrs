import { Schema, model, Types } from 'mongoose';

export type ReviewType = 'review0' | 'review1' | 'review2' | 'review3' | 'viva';

export const REVIEW_ORDER: ReviewType[] = ['review0', 'review1', 'review2', 'review3', 'viva'];

export interface IReview {
  _id: Types.ObjectId;
  teamId: Types.ObjectId;
  type: ReviewType;
  scheduledDate: Date | null;
  scheduledTime: string | null; // HH:mm
  durationMinutes: number | null;
  hasMarks: boolean;
  closed: boolean;
}

const reviewSchema = new Schema<IReview>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    type: { type: String, enum: REVIEW_ORDER, required: true },
    scheduledDate: { type: Date, default: null },
    scheduledTime: { type: String, default: null },
    durationMinutes: { type: Number, default: null, min: 5, max: 240 },
    hasMarks: { type: Boolean, default: true },
    closed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ teamId: 1, type: 1 }, { unique: true });

// Review 0 never carries marks per spec 6.5 / 6.7.
reviewSchema.pre('validate', function (next) {
  if (this.type === 'review0') this.hasMarks = false;
  next();
});

export const Review = model<IReview>('Review', reviewSchema);
