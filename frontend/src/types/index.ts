export type ScopedRole = 'admin' | 'coordinator' | 'guide' | 'panel' | 'assistant' | 'student';

export interface RoleOption {
  role: ScopedRole;
  programId: string | null;
  programLabel: string;
}

export interface AuthProfile {
  userId: string;
  name: string;
  role: ScopedRole;
  programId: string | null;
}

export interface Program {
  _id: string;
  name: string;
  type: 'UG' | 'PG';
  code: string;
  maxTeamSize: number;
}

export interface Faculty {
  _id: string;
  name: string;
  username: string;
  email: string;
  designation: string;
  seniority: number;
  guideLimits: { ug: number; pg: number };
  isAdmin: boolean;
  isAssistant: boolean;
  isActive: boolean;
}

export interface Student {
  _id: string;
  name: string;
  rollNo: string;
  program: string;
  email: string;
  username: string;
}

export type TeamStatus = 'forming' | 'locked' | 'active';

export interface Team {
  _id: string;
  name: string;
  program: string;
  students: Student[] | string[];
  guideId: { _id: string; name: string } | string | null;
  status: TeamStatus;
}

export type ReviewType = 'review0' | 'review1' | 'review2' | 'review3' | 'viva';

export const REVIEW_ORDER: ReviewType[] = ['review0', 'review1', 'review2', 'review3', 'viva'];
export const REVIEW_LABELS: Record<ReviewType, string> = {
  review0: 'Review 0',
  review1: 'Review 1',
  review2: 'Review 2',
  review3: 'Review 3',
  viva: 'Viva',
};

export interface Review {
  _id: string;
  teamId: string;
  type: ReviewType;
  scheduledDate: string | null;
  scheduledTime: string | null;
  durationMinutes: number | null;
  hasMarks: boolean;
  closed: boolean;
}

export interface AttendanceRecord {
  studentId: { _id: string; name: string; rollNo: string } | string;
  present: boolean;
}

export interface Attendance {
  _id: string;
  teamId: string;
  reviewId: string | null;
  kind: 'review' | 'semester';
  perStudent: AttendanceRecord[];
  reviewDate: string | null;
  reviewTime: string | null;
}

export interface MarksEntry {
  _id: string;
  teamId: string;
  reviewId: string;
  enteredBy: { _id: string; name: string } | string;
  role: 'guide' | 'panel' | 'coordinator';
  score: number;
  confirmed: boolean;
}

export interface MarksSummary {
  teamId: string;
  reviewId: { _id: string; type: ReviewType } | string;
  average: number;
  breakdown: { role: string; score: number }[];
}

export interface NotificationItem {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
