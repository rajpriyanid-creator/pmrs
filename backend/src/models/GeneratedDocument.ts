import { Schema, model, Types } from "mongoose";

export interface IGeneratedDocument {
  _id: Types.ObjectId;
  templateId: Types.ObjectId;
  teamId?: Types.ObjectId;
  generatedBy: Types.ObjectId; // Faculty._id (coordinator)
  data: Record<string, unknown>;
  filePath: string;
  editedLive: boolean; // true if it went through the DOCX->HTML->CKEditor->DOCX round trip
}

const GeneratedDocumentSchema = new Schema<IGeneratedDocument>(
  {
    templateId: { type: Schema.Types.ObjectId, ref: "DocumentTemplate", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    generatedBy: { type: Schema.Types.ObjectId, ref: "Faculty", required: true },
    data: { type: Schema.Types.Mixed, required: true },
    filePath: { type: String, required: true },
    editedLive: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const GeneratedDocument = model<IGeneratedDocument>("GeneratedDocument", GeneratedDocumentSchema);
