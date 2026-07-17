import { Schema, model, Types } from 'mongoose';

export interface IAttendanceRecord {
  studentId: Types.ObjectId;
  present: boolean;
}

export interface IAttendance {
  _id: Types.ObjectId;
  teamId: Types.ObjectId;
  reviewId: Types.ObjectId | null; // null for semester attendance not tied to a single review
  kind: 'review' | 'semester';
  perStudent: IAttendanceRecord[];
  reviewDate: Date | null;
  reviewTime: string | null;
  recordedBy: Types.ObjectId;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    reviewId: { type: Schema.Types.ObjectId, ref: 'Review', default: null },
    kind: { type: String, enum: ['review', 'semester'], required: true },
    perStudent: {
      type: [
        {
          studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
          present: { type: Boolean, required: true },
        },
      ],
      default: [],
    },
    reviewDate: { type: Date, default: null },
    reviewTime: { type: String, default: null },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'Faculty', required: true },
  },
  { timestamps: true }
);

attendanceSchema.index({ teamId: 1, reviewId: 1, kind: 1 }, { unique: true });

export const Attendance = model<IAttendance>('Attendance', attendanceSchema);
