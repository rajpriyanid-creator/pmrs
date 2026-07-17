import { Schema, model, Types } from 'mongoose';

export type SlotType = 'review1' | 'review2' | 'review3' | 'viva';

export interface IMarksEntry {
  _id: Types.ObjectId;
  teamId: Types.ObjectId;
  reviewId: Types.ObjectId;
  studentId: Types.ObjectId; // per-student marks
  enteredBy: Types.ObjectId;
  role: 'guide' | 'panel' | 'coordinator';
  slotType: SlotType;
  // Rubric: 4 criteria, each 0-10 → total 0-40 → percentage
  mark1: number;
  mark2: number;
  mark3: number;
  mark4: number;
  confirmed: boolean;
  submittedAt: Date | null;
}

const marksEntrySchema = new Schema<IMarksEntry>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    reviewId: { type: Schema.Types.ObjectId, ref: 'Review', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    enteredBy: { type: Schema.Types.ObjectId, ref: 'Faculty', required: true },
    role: { type: String, enum: ['guide', 'panel', 'coordinator'], required: true },
    slotType: { type: String, enum: ['review1', 'review2', 'review3', 'viva'], required: true },
    mark1: { type: Number, required: true, min: 0, max: 10, default: 0 },
    mark2: { type: Number, required: true, min: 0, max: 10, default: 0 },
    mark3: { type: Number, required: true, min: 0, max: 10, default: 0 },
    mark4: { type: Number, required: true, min: 0, max: 10, default: 0 },
    confirmed: { type: Boolean, default: false },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Enforce one mark-entry per (student, team, review, marker, slotType)
marksEntrySchema.index(
  { studentId: 1, teamId: 1, reviewId: 1, enteredBy: 1, slotType: 1 },
  { unique: true }
);

// Virtual: raw total out of 40
marksEntrySchema.virtual('total').get(function (this: IMarksEntry) {
  return this.mark1 + this.mark2 + this.mark3 + this.mark4;
});

// Virtual: percentage (total/40 * 100)
marksEntrySchema.virtual('percentage').get(function (this: IMarksEntry) {
  return Math.round(((this.mark1 + this.mark2 + this.mark3 + this.mark4) / 40) * 10000) / 100;
});

export const MarksEntry = model<IMarksEntry>('MarksEntry', marksEntrySchema);

export interface IMarksSummary {
  _id: Types.ObjectId;
  teamId: Types.ObjectId;
  reviewId: Types.ObjectId;
  average: number; // average percentage across all confirmed entries
  breakdown: { role: string; studentId: string; percentage: number }[];
  updatedAt: Date;
}

const marksSummarySchema = new Schema<IMarksSummary>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    reviewId: { type: Schema.Types.ObjectId, ref: 'Review', required: true },
    average: { type: Number, required: true },
    breakdown: {
      type: [
        {
          role: { type: String, required: true },
          studentId: { type: String, required: true },
          percentage: { type: Number, required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

marksSummarySchema.index({ teamId: 1, reviewId: 1 }, { unique: true });

export const MarksSummary = model<IMarksSummary>('MarksSummary', marksSummarySchema);
