import { Schema, model, Types } from "mongoose";

/**
 * Admin is a small, global-scope collection (not program-scoped like
 * Faculty). Kept separate from Faculty per Section 4 - admin is not one of
 * the program-scoped role x program login contexts.
 */
export interface IAdmin {
  _id: Types.ObjectId;
  name: string;
  username: string;
  passwordHash: string;
  email: string;
  mustChangePassword: boolean;
  tokenVersion: number;
}

const AdminSchema = new Schema<IAdmin>(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    mustChangePassword: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Admin = model<IAdmin>("Admin", AdminSchema);
