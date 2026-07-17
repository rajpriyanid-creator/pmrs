import { AuditLog } from '../models/AuditLog';
import { AuthContext } from '../middleware/auth';
import { logger } from '../config/logger';
import { Types } from 'mongoose';

export async function recordAudit(
  auth: AuthContext,
  action: string,
  entityType: string,
  entityId: Types.ObjectId | string,
  diff: Record<string, unknown> = {}
): Promise<void> {
  try {
    await AuditLog.create({
      actorId: auth.userId,
      actorModel: auth.userModel,
      action,
      entityType,
      entityId,
      diff,
      timestamp: new Date(),
    });
  } catch (err) {
    // Audit logging must never block or fail the primary write path.
    logger.error(`Audit log write failed: ${(err as Error).message}`);
  }
}
