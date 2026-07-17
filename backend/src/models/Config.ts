import { Schema, model, Types } from "mongoose";

/**
 * Global singleton configuration document. Always fetched/updated via
 * Config.getSingleton() to guarantee exactly one row ever exists.
 */
export interface IConfig {
  _id: Types.ObjectId;
  ugMaxTeamSize: number;
  pgMaxTeamSize: number;
  ugGuideCap: number;
  pgGuideCap: number;
  guideSelectionStartDate?: Date;
  guideSelectionEndDate?: Date;
  reviewPeriodStartDate?: Date;
  reviewPeriodEndDate?: Date;
  teamFormationOpen: boolean;
}

const ConfigSchema = new Schema<IConfig>(
  {
    ugMaxTeamSize: { type: Number, default: 4, min: 1 },
    pgMaxTeamSize: { type: Number, default: 3, min: 1 },
    ugGuideCap: { type: Number, default: 6, min: 0 },
    pgGuideCap: { type: Number, default: 4, min: 0 },
    guideSelectionStartDate: { type: Date },
    guideSelectionEndDate: { type: Date },
    reviewPeriodStartDate: { type: Date },
    reviewPeriodEndDate: { type: Date },
    teamFormationOpen: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const ConfigModel = model<IConfig>("Config", ConfigSchema);

async function getSingleton() {
  let doc = await ConfigModel.findOne();
  if (!doc) doc = await ConfigModel.create({});
  return doc;
}

export const Config = Object.assign(ConfigModel, { getSingleton });
