import { Schema, model, Types } from 'mongoose';

export type TeamStatus = 'forming' | 'locked' | 'active';

export interface ITeam {
  _id: Types.ObjectId;
  name: string;
  program: Types.ObjectId;
  students: Types.ObjectId[];
  guideId: Types.ObjectId | null;
  status: TeamStatus;
  lockInitiatedBy: Types.ObjectId | null;
  lockConfirmedAt: Date | null;
}

const teamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    students: { type: [{ type: Schema.Types.ObjectId, ref: 'Student' }], default: [], validate: {
      validator: (arr: Types.ObjectId[]) => arr.length >= 1,
      message: 'A team must have at least one student (solo teams are allowed).',
    } },
    guideId: { type: Schema.Types.ObjectId, ref: 'Faculty', default: null },
    status: { type: String, enum: ['forming', 'locked', 'active'], default: 'forming' },
    lockInitiatedBy: { type: Schema.Types.ObjectId, ref: 'Student', default: null },
    lockConfirmedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

teamSchema.index({ program: 1, status: 1 });
teamSchema.index({ guideId: 1, program: 1 });

export const Team = model<ITeam>('Team', teamSchema);
