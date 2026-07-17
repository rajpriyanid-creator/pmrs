import { Schema, model, Types } from 'mongoose';

export interface ITeamInvite {
  _id: Types.ObjectId;
  teamId: Types.ObjectId;
  fromStudent: Types.ObjectId;
  toStudent: Types.ObjectId;
  status: 'pending' | 'accepted' | 'declined';
}

const teamInviteSchema = new Schema<ITeamInvite>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    fromStudent: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    toStudent: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  },
  { timestamps: true }
);

teamInviteSchema.index({ toStudent: 1, status: 1 });
teamInviteSchema.index({ teamId: 1 });

export const TeamInvite = model<ITeamInvite>('TeamInvite', teamInviteSchema);
