import { Schema, model, Types } from 'mongoose';

export interface ISignature {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  ownerModel: 'Faculty';
  role: string;
  label?: string;
  imageBase64: string; // data-URL stored as base64
  filename: string;
  createdAt: Date;
  updatedAt: Date;
}

const signatureSchema = new Schema<ISignature>(
  {
    ownerId: { type: Schema.Types.ObjectId, refPath: 'ownerModel', required: true },
    ownerModel: { type: String, enum: ['Faculty'], default: 'Faculty' },
    role: { type: String, required: true, trim: true, maxlength: 80 },
    label: { type: String, trim: true, maxlength: 80 },
    imageBase64: { type: String, required: true },
    filename: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

signatureSchema.index({ ownerId: 1 });

export const Signature = model<ISignature>('Signature', signatureSchema);
