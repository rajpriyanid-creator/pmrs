import { Notification } from '../models/Notification';
import { emitToUser } from './socketService';
import { UserModel } from '../utils/jwt';

export async function notify(userModel: UserModel, userId: string, type: string, message: string): Promise<void> {
  const doc = await Notification.create({ userId, userModel, type, message });
  emitToUser(userModel, userId, 'notification:new', {
    id: doc._id,
    type: doc.type,
    message: doc.message,
    read: doc.read,
    createdAt: doc.createdAt,
  });
}

export async function notifyMany(
  recipients: { userModel: UserModel; userId: string }[],
  type: string,
  message: string
): Promise<void> {
  await Promise.all(recipients.map((r) => notify(r.userModel, r.userId, type, message)));
}
