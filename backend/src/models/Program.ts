import { Schema, model, Types } from 'mongoose';

export interface IProgram {
  _id: Types.ObjectId;
  name: string;
  type: 'UG' | 'PG';
  code: string;
  maxTeamSize: number;
}

const programSchema = new Schema<IProgram>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    type: { type: String, enum: ['UG', 'PG'], required: true },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 20, unique: true },
    maxTeamSize: { type: Number, default: 4, min: 1, max: 10 },
  },
  { timestamps: true }
);

programSchema.index({ type: 1 });

export const Program = model<IProgram>('Program', programSchema);
