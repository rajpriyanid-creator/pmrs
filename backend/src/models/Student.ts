import { Schema, model, Types } from 'mongoose';

export interface IStudent {
  _id: Types.ObjectId;
  name: string;
  rollNo: string;
  program: Types.ObjectId;
  email: string;
  username: string;
  passwordHash: string;
  mustChangePassword: boolean;
  refreshTokenVersion: number;
}

const studentSchema = new Schema<IStudent>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    rollNo: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    username: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 60 },
    passwordHash: { type: String, required: true, select: false },
    mustChangePassword: { type: Boolean, default: false },
    refreshTokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

studentSchema.index({ rollNo: 1, program: 1 }, { unique: true });
studentSchema.index({ program: 1 });

export const Student = model<IStudent>('Student', studentSchema);
