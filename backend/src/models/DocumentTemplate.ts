import { Schema, model, Types } from "mongoose";

export interface IPlaceholder {
  field: string;
  label: string;
  required: boolean;
}

export interface IDocumentTemplate {
  _id: Types.ObjectId;
  name: string;
  filename: string; // stored file key (S3 or local uploads dir)
  type: "viva" | "internalExaminer" | "externalExaminer" | "chairmanLetter";
  placeholderMap: IPlaceholder[]; // auto-detected on upload, see 6.13
  preparationGuideMd?: string; // bundled human-readable guide, surfaced in Help Center (6.20)
}

const PlaceholderSchema = new Schema<IPlaceholder>(
  { field: { type: String, required: true }, label: { type: String, required: true }, required: { type: Boolean, default: true } },
  { _id: false },
);

const DocumentTemplateSchema = new Schema<IDocumentTemplate>(
  {
    name: { type: String, required: true },
    filename: { type: String, required: true },
    type: { type: String, enum: ["viva", "internalExaminer", "externalExaminer", "chairmanLetter"], required: true },
    placeholderMap: { type: [PlaceholderSchema], default: [] },
    preparationGuideMd: { type: String },
  },
  { timestamps: true },
);

export const DocumentTemplate = model<IDocumentTemplate>("DocumentTemplate", DocumentTemplateSchema);
