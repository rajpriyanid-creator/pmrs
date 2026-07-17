import { Schema, model, Types } from 'mongoose';
import type { ReviewType } from './Review';

export interface IScheduledSlot {
  _id: Types.ObjectId;
  teamId: Types.ObjectId;
  reviewType: ReviewType;
  facultyIds: Types.ObjectId[];
  startTime: Date;
  endTime: Date;
  periodLabel: string;
  notified: boolean;
  assignedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const scheduledSlotSchema = new Schema<IScheduledSlot>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    reviewType: {
      type: String,
      enum: ['review0', 'review1', 'review2', 'review3', 'viva'],
      required: true,
    },
    facultyIds: { type: [{ type: Schema.Types.ObjectId, ref: 'Faculty' }], default: [] },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    periodLabel: { type: String, required: true, trim: true, maxlength: 120 },
    notified: { type: Boolean, default: false },
    assignedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

scheduledSlotSchema.index({ teamId: 1, reviewType: 1 });
scheduledSlotSchema.index({ facultyIds: 1, startTime: 1 });

export const ScheduledSlot = model<IScheduledSlot>('ScheduledSlot', scheduledSlotSchema);
