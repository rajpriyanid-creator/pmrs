import { Schema, model, Types } from 'mongoose';

export interface IAvailabilitySlot {
  _id: Types.ObjectId;
  facultyId: Types.ObjectId;
  role: 'guide' | 'panel' | 'coordinator';
  periodLabel: string; // e.g. "Review 1 Window"
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

const availabilitySlotSchema = new Schema<IAvailabilitySlot>(
  {
    facultyId: { type: Schema.Types.ObjectId, ref: 'Faculty', required: true },
    role: { type: String, enum: ['guide', 'panel', 'coordinator'], required: true },
    periodLabel: { type: String, required: true, trim: true, maxlength: 120 },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
  },
  { timestamps: true }
);

availabilitySlotSchema.index({ facultyId: 1, startTime: 1 });
availabilitySlotSchema.index({ role: 1, periodLabel: 1 });

export const AvailabilitySlot = model<IAvailabilitySlot>('AvailabilitySlot', availabilitySlotSchema);
