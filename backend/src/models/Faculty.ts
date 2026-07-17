import { Schema, model, Types } from 'mongoose';

export interface IFaculty {
  _id: Types.ObjectId;
  name: string;
  username: string;
  passwordHash: string;
  email: string;
  designation: string;
  seniority: number;
  guideLimits: { ug: number; pg: number };
  isAdmin: boolean;
  isAssistant: boolean;
  isActive: boolean;
  mustChangePassword: boolean;
  otpHash: string | null;
  otpExpiresAt: Date | null;
  memberType: 'internal' | 'external' | null; // for panel member self-registration
  refreshTokenVersion: number; // bumped to invalidate all outstanding refresh tokens
  createdAt: Date;
  updatedAt: Date;
}

const facultySchema = new Schema<IFaculty>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    username: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 60 },
    passwordHash: { type: String, required: true, select: false },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    designation: { type: String, required: true, trim: true, maxlength: 80 },
    seniority: { type: Number, required: true, min: 1 },
    guideLimits: {
      ug: { type: Number, default: 0, min: 0 },
      pg: { type: Number, default: 0, min: 0 },
    },
    isAdmin: { type: Boolean, default: false },
    isAssistant: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },
    otpHash: { type: String, default: null, select: false },
    otpExpiresAt: { type: Date, default: null, select: false },
    memberType: { type: String, enum: ['internal', 'external', null], default: null },
    refreshTokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

facultySchema.index({ username: 1 }, { unique: true });
facultySchema.index({ email: 1 }, { unique: true });
facultySchema.index({ seniority: 1 });

export const Faculty = model<IFaculty>('Faculty', facultySchema);
