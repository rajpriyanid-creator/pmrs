import { Schema, model, Types } from 'mongoose';

export interface IAuditLog {
  _id: Types.ObjectId;
  actorId: Types.ObjectId;
  actorModel: 'Faculty' | 'Student';
  action: string;
  entityType: string;
  entityId: Types.ObjectId;
  diff: Record<string, unknown>;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, required: true, refPath: 'actorModel' },
    actorModel: { type: String, enum: ['Faculty', 'Student'], required: true },
    action: { type: String, required: true, maxlength: 60 },
    entityType: { type: String, required: true, maxlength: 60 },
    entityId: { type: Schema.Types.ObjectId, required: true },
    diff: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
auditLogSchema.index({ actorId: 1, timestamp: -1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
