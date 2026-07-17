import { Schema, model, Types } from "mongoose";

export interface IReviewPanel {
  _id: Types.ObjectId;
  program: Types.ObjectId;
  coordinatorId: Types.ObjectId;
  memberIds: Types.ObjectId[]; // hard cap of 4, enforced in controller + validator
  teamIds: Types.ObjectId[];
}

const ReviewPanelSchema = new Schema<IReviewPanel>(
  {
    program: { type: Schema.Types.ObjectId, ref: "Program", required: true },
    coordinatorId: { type: Schema.Types.ObjectId, ref: "Faculty", required: true },
    memberIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Faculty" }],
      validate: {
        validator: (v: Types.ObjectId[]) => v.length <= 4,
        message: "A review panel may have at most 4 members (spec 6.8 / 12.2)",
      },
    },
    teamIds: [{ type: Schema.Types.ObjectId, ref: "Team" }],
  },
  { timestamps: true },
);

ReviewPanelSchema.index({ program: 1 });

export const ReviewPanel = model<IReviewPanel>("ReviewPanel", ReviewPanelSchema);
