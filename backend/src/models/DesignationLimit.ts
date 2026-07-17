import mongoose, { Schema, Document } from 'mongoose';

export interface IDesignationLimit extends Document {
  designation: string;
  ugLimit: number;
  pgLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

const designationLimitSchema = new Schema<IDesignationLimit>(
  {
    designation: { type: String, required: true, unique: true, trim: true },
    ugLimit: { type: Number, required: true, default: 0, min: 0 },
    pgLimit: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const DesignationLimit = mongoose.model<IDesignationLimit>('DesignationLimit', designationLimitSchema);
