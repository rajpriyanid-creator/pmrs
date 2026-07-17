import { Schema, model, Types } from 'mongoose';

export type ReportStatus = 'uploaded' | 'approved';

export interface IFinalReport {
  _id: Types.ObjectId;
  teamId: Types.ObjectId;
  uploadedBy: Types.ObjectId; // Student._id
  filePath: string;
  filename: string;
  mimeType: string;
  status: ReportStatus;
  approvedBy: Types.ObjectId | null; // Faculty._id (guide)
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const finalReportSchema = new Schema<IFinalReport>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    filePath: { type: String, required: true },
    filename: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    status: { type: String, enum: ['uploaded', 'approved'], default: 'uploaded' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'Faculty', default: null },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

finalReportSchema.index({ teamId: 1 }, { unique: true });

export const FinalReport = model<IFinalReport>('FinalReport', finalReportSchema);
