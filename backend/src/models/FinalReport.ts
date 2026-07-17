import { Schema, model, Types } from 'mongoose';

export type ReportStatus = 'uploaded' | 'approved' | 'rejected';

export interface IRejectionHistory {
  filePath: string;
  filename: string;
  remarks: string;
  rejectedBy?: Types.ObjectId;
  rejectedAt: Date;
}

export interface IFinalReport {
  _id: Types.ObjectId;
  teamId: Types.ObjectId;
  uploadedBy: Types.ObjectId; // Student._id
  filePath: string;
  filename: string;
  mimeType: string;
  status: ReportStatus;
  remarks?: string;
  rejections: IRejectionHistory[];
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
    status: { type: String, enum: ['uploaded', 'approved', 'rejected'], default: 'uploaded' },
    remarks: { type: String, default: '' },
    rejections: [
      {
        filePath: { type: String, required: true },
        filename: { type: String, required: true },
        remarks: { type: String, default: '' },
        rejectedBy: { type: Schema.Types.ObjectId, ref: 'Faculty', default: null },
        rejectedAt: { type: Date, default: Date.now },
      },
    ],
    approvedBy: { type: Schema.Types.ObjectId, ref: 'Faculty', default: null },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

finalReportSchema.index({ teamId: 1 }, { unique: true });

export const FinalReport = model<IFinalReport>('FinalReport', finalReportSchema);
