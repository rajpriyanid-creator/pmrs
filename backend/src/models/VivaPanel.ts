import { Schema, model, Types } from "mongoose";

export interface IExternalMember {
  name: string;
  affiliation: string;
  email: string;
  externalFacultyId?: Types.ObjectId; // links to a self-registered Faculty(memberType:external) when one exists
}

export interface IVivaPanel {
  _id: Types.ObjectId;
  program: Types.ObjectId;
  coordinatorId: Types.ObjectId;
  internalMembers: Types.ObjectId[]; // must be a superset of the coordinators ReviewPanel members - locked, see 6.8
  externalMembers: IExternalMember[]; // freely add/remove
  teamIds: Types.ObjectId[];
}

const ExternalMemberSchema = new Schema<IExternalMember>(
  {
    name: { type: String, required: true, trim: true },
    affiliation: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    externalFacultyId: { type: Schema.Types.ObjectId, ref: "Faculty" },
  },
  { _id: false },
);

const VivaPanelSchema = new Schema<IVivaPanel>(
  {
    program: { type: Schema.Types.ObjectId, ref: "Program", required: true },
    coordinatorId: { type: Schema.Types.ObjectId, ref: "Faculty", required: true },
    internalMembers: [{ type: Schema.Types.ObjectId, ref: "Faculty" }],
    externalMembers: { type: [ExternalMemberSchema], default: [] },
    teamIds: [{ type: Schema.Types.ObjectId, ref: "Team" }],
  },
  { timestamps: true },
);

VivaPanelSchema.index({ coordinatorId: 1, program: 1 }, { unique: true });

export const VivaPanel = model<IVivaPanel>("VivaPanel", VivaPanelSchema);
