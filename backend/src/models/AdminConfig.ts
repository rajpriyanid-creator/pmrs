import { Schema, model } from 'mongoose';

export interface IAdminConfig {
  guideSelectionOpen: boolean;
  guideSelectionWindowStart: Date | null;
  guideSelectionWindowEnd: Date | null;
  teamFormationOpen: boolean;
  updatedAt: Date;
}

const adminConfigSchema = new Schema<IAdminConfig>(
  {
    guideSelectionOpen: { type: Boolean, default: false },
    guideSelectionWindowStart: { type: Date, default: null },
    guideSelectionWindowEnd: { type: Date, default: null },
    teamFormationOpen: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const AdminConfig = model<IAdminConfig>('AdminConfig', adminConfigSchema);
