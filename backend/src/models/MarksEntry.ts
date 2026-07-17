import { Schema, model, Types } from "mongoose";

/**
 * Rubric model retained per spec 6.15 / 12.5 (proven-in-production choice):
 * marks are per student, four criteria of 0-10 each, summing to a 40-point
 * total expressed as a percentage - not a flat 0-100 team-level score.
 */
export interface ICriterionScore {
  label: string;
  score: number; // 0-10
}

export interface IMarksEntry {
  _id: Types.ObjectId;
  teamId: Types.ObjectId;
  reviewId: Types.ObjectId; // review1|review2|review3|viva only - never review0
  studentId: Types.ObjectId;
  enteredBy: Types.ObjectId; // Faculty._id
  enteredByRole: "guide" | "panel" | "coordinator";
  criteria: ICriterionScore[]; // exactly 4
  totalScore: number; // 0-40, derived
  percentage: number; // 0-100, derived
  confirmed: boolean;
  submittedAt?: Date;
}

const CriterionScoreSchema = new Schema<ICriterionScore>(
  { label: { type: String, required: true }, score: { type: Number, required: true, min: 0, max: 10 } },
  { _id: false },
);

const MarksEntrySchema = new Schema<IMarksEntry>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    reviewId: { type: Schema.Types.ObjectId, ref: "Review", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    enteredBy: { type: Schema.Types.ObjectId, ref: "Faculty", required: true },
    enteredByRole: { type: String, enum: ["guide", "panel", "coordinator"], required: true },
    criteria: {
      type: [CriterionScoreSchema],
      validate: { validator: (v: ICriterionScore[]) => v.length === 4, message: "Exactly 4 rubric criteria are required" },
    },
    totalScore: { type: Number, min: 0, max: 40, required: true },
    percentage: { type: Number, min: 0, max: 100, required: true },
    confirmed: { type: Boolean, default: false },
    submittedAt: { type: Date },
  },
  { timestamps: true },
);

// Hard uniqueness constraint (spec 6.15): one marker cannot double-score the
// same student for the same review stage.
MarksEntrySchema.index({ reviewId: 1, studentId: 1, enteredBy: 1 }, { unique: true });
MarksEntrySchema.index({ teamId: 1, reviewId: 1 });

export const MarksEntry = model<IMarksEntry>("MarksEntry", MarksEntrySchema);
