import { Schema, model, Types } from 'mongoose';

export interface IReviewPanel {
  _id: Types.ObjectId;
  program: Types.ObjectId;
  coordinatorId: Types.ObjectId;
  memberIds: Types.ObjectId[];
  teamIds: Types.ObjectId[];
}

const reviewPanelSchema = new Schema<IReviewPanel>(
  {
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    coordinatorId: { type: Schema.Types.ObjectId, ref: 'Faculty', required: true },
    memberIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Faculty' }],
      default: [],
      validate: {
        validator: (arr: Types.ObjectId[]) => arr.length <= 4,
        message: 'Review panels are capped at 4 members.',
      },
    },
    teamIds: { type: [{ type: Schema.Types.ObjectId, ref: 'Team' }], default: [] },
  },
  { timestamps: true }
);

reviewPanelSchema.index({ program: 1 });
reviewPanelSchema.index({ coordinatorId: 1, program: 1 });

export const ReviewPanel = model<IReviewPanel>('ReviewPanel', reviewPanelSchema);

export interface IExternalMember {
  name: string;
  affiliation: string;
  email: string;
}

export interface IVivaPanel {
  _id: Types.ObjectId;
  program: Types.ObjectId;
  coordinatorId: Types.ObjectId;
  internalMembers: Types.ObjectId[];
  externalMembers: IExternalMember[];
  teamIds: Types.ObjectId[];
}

const vivaPanelSchema = new Schema<IVivaPanel>(
  {
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    coordinatorId: { type: Schema.Types.ObjectId, ref: 'Faculty', required: true },
    internalMembers: { type: [{ type: Schema.Types.ObjectId, ref: 'Faculty' }], default: [] },
    externalMembers: {
      type: [
        {
          name: { type: String, required: true, trim: true, maxlength: 120 },
          affiliation: { type: String, required: true, trim: true, maxlength: 160 },
          email: { type: String, required: true, trim: true, lowercase: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        },
      ],
      default: [],
    },
    teamIds: { type: [{ type: Schema.Types.ObjectId, ref: 'Team' }], default: [] },
  },
  { timestamps: true }
);

vivaPanelSchema.index({ coordinatorId: 1, program: 1 }, { unique: true });

export const VivaPanel = model<IVivaPanel>('VivaPanel', vivaPanelSchema);
