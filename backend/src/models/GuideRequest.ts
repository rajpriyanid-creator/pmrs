import { Schema, model, Types } from 'mongoose';

export interface IGuideRequest {
  _id: Types.ObjectId;
  teamId: Types.ObjectId;
  guideId: Types.ObjectId;
  program: Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
}

const guideRequestSchema = new Schema<IGuideRequest>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    guideId: { type: Schema.Types.ObjectId, ref: 'Faculty', required: true },
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

guideRequestSchema.index({ guideId: 1, status: 1, program: 1 });
guideRequestSchema.index({ teamId: 1 });

export const GuideRequest = model<IGuideRequest>('GuideRequest', guideRequestSchema);
