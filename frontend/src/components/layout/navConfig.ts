import {
  LayoutDashboard,
  Users,
  UserCog,
  GitBranch,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  Gavel,
  Download,
  Bell,
  Settings,
  FileText,
  CalendarRange,
  Upload,
  Shield,
  BookOpen,
} from 'lucide-react';
import { ScopedRole } from '@/types';

export interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
}

export const NAV_BY_ROLE: Record<ScopedRole, NavItem[]> = {
  admin: [
    { label: 'Overview', to: '/admin', icon: LayoutDashboard },
    { label: 'Faculty', to: '/admin/faculty', icon: UserCog },
    { label: 'Students', to: '/admin/students', icon: Users },
    { label: 'Allocations', to: '/admin/allocations', icon: GitBranch },
    { label: 'Attendance', to: '/admin/attendance', icon: ClipboardCheck },
    { label: 'Marks', to: '/admin/marks', icon: ClipboardList },
    { label: 'Documents', to: '/admin/documents', icon: FileText },
    { label: 'System Config', to: '/admin/config', icon: Settings },
  ],
  coordinator: [
    { label: 'Overview', to: '/coordinator', icon: LayoutDashboard },
    { label: 'Review Scheduling', to: '/coordinator/reviews', icon: CalendarClock },
    { label: 'Attendance', to: '/coordinator/attendance', icon: ClipboardCheck },
    { label: 'Viva Panel', to: '/coordinator/viva', icon: Gavel },
    { label: 'Marks', to: '/coordinator/marks', icon: ClipboardList },
    { label: 'Auto-Schedule', to: '/coordinator/scheduling', icon: CalendarRange },
    { label: 'Letters', to: '/coordinator/letters', icon: FileText },
  ],
  guide: [
    { label: 'My Teams', to: '/guide', icon: LayoutDashboard },
    { label: 'Guide Requests', to: '/guide/requests', icon: Users },
    { label: 'Marks Entry', to: '/guide/marks', icon: ClipboardList },
    { label: 'My Availability', to: '/guide/availability', icon: CalendarRange },
    { label: 'Final Reports', to: '/guide/reports', icon: Upload },
  ],
  panel: [
    { label: 'Assigned Teams', to: '/panel', icon: LayoutDashboard },
    { label: 'Marks Entry', to: '/panel/marks', icon: ClipboardList },
    { label: 'My Availability', to: '/panel/availability', icon: CalendarRange },
  ],
  assistant: [
    { label: 'Faculty', to: '/assistant/faculty', icon: UserCog },
    { label: 'Attendance', to: '/assistant/attendance', icon: ClipboardCheck },
    { label: 'Marks', to: '/assistant/marks', icon: ClipboardList },
    { label: 'Exports', to: '/assistant/exports', icon: Download },
  ],
  student: [
    { label: 'My Team', to: '/student', icon: LayoutDashboard },
    { label: 'Find a Guide', to: '/student/guides', icon: Users },
    { label: 'Reviews & Marks', to: '/student/reviews', icon: ClipboardList },
    { label: 'My Panel', to: '/student/my-panel', icon: Shield },
    { label: 'Final Report', to: '/student/report', icon: Upload },
    { label: 'Notifications', to: '/student/notifications', icon: Bell },
  ],
};
