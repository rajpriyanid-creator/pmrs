export { initSocket, getIO } from '../services/socketService';

export const emitNotificationNew = (_userId: string, _payload: unknown) => {};
export const emitAttendanceUpdated = (_teamId: string, _payload: unknown) => {};
export const emitMarksPublished = (_teamId: string, _payload: unknown) => {};
export const emitAllocationUpdated = (_program: string, _payload: unknown) => {};
export const emitScheduleGenerated = (_program: string, _payload: unknown) => {};
export const emitDocumentGenerated = (_userId: string, _payload: unknown) => {};
