import { Schema, model, Types } from "mongoose";

export interface ISlot {
  startTime: Date;
  endTime: Date;
}

export interface IAvailability {
  _id: Types.ObjectId;
  userId: Types.ObjectId; // Faculty._id
  userRole: "guide" | "panel";
  reviewPeriodStart: Date;
  reviewPeriodEnd: Date;
  availableSlots: ISlot[];
}

const SlotSchema = new Schema<ISlot>(
  { startTime: { type: Date, required: true }, endTime: { type: Date, required: true } },
  { _id: false },
);

const AvailabilitySchema = new Schema<IAvailability>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "Faculty", required: true },
    userRole: { type: String, enum: ["guide", "panel"], required: true },
    reviewPeriodStart: { type: Date, required: true },
    reviewPeriodEnd: { type: Date, required: true },
    availableSlots: { type: [SlotSchema], default: [] },
  },
  { timestamps: true },
);

AvailabilitySchema.index({ userId: 1, reviewPeriodStart: 1, reviewPeriodEnd: 1 }, { unique: true });

export const Availability = model<IAvailability>("Availability", AvailabilitySchema);
