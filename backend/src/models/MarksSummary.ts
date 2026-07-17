import { Schema, model, Types } from "mongoose";

export interface IRoleBreakdown {
  role: "guide" | "panel" | "coordinator";
  score: number;
}

export interface IMarksSummary {
  _id: Types.ObjectId;
  teamId: Types.ObjectId;
  studentId: Types.ObjectId;
  reviewId: Types.ObjectId;
  average: number;
  breakdown: IRoleBreakdown[];
  updatedAt: Date;
}

const RoleBreakdownSchema = new Schema<IRoleBreakdown>(
  { role: { type: String, enum: ["guide", "panel", "coordinator"], required: true }, score: { type: Number, required: true } },
  { _id: false },
);

const MarksSummarySchema = new Schema<IMarksSummary>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    reviewId: { type: Schema.Types.ObjectId, ref: "Review", required: true },
    average: { type: Number, required: true },
    breakdown: { type: [RoleBreakdownSchema], default: [] },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

MarksSummarySchema.index({ teamId: 1, studentId: 1, reviewId: 1 }, { unique: true });

export const MarksSummary = model<IMarksSummary>("MarksSummary", MarksSummarySchema);
