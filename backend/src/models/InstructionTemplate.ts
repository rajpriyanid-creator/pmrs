import { Schema, model, Types } from 'mongoose';

export interface IInstructionTemplate {
  _id: Types.ObjectId;
  program: string; // e.g. UG, MEAI
  title: string;
  instructions: string;
  filePath?: string;
  fileName?: string;
  uploadedBy: Types.ObjectId; // Faculty._id (coordinator)
  createdAt: Date;
  updatedAt: Date;
}

const instructionTemplateSchema = new Schema<IInstructionTemplate>(
  {
    program: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    instructions: { type: String, default: '' },
    filePath: { type: String, default: '' },
    fileName: { type: String, default: '' },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'Faculty', required: true },
  },
  { timestamps: true }
);

export const InstructionTemplate = model<IInstructionTemplate>('InstructionTemplate', instructionTemplateSchema);
