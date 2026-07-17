import type { Role } from "../../types";

export const NAV_BY_ROLE: Record<Role, { to: string; label: string }[]> = {
  admin: [
    { to: "/admin", label: "Dashboard" },
    { to: "/admin/faculty", label: "Faculty" },
    { to: "/admin/students", label: "Students" },
    { to: "/admin/assignments", label: "Assignments" },
    { to: "/admin/panels", label: "Review Panels" },
    { to: "/admin/documents", label: "Document Templates" },
    { to: "/admin/analytics", label: "Analytics" },
    { to: "/admin/config", label: "Config" },
    { to: "/admin/danger-zone", label: "Danger Zone" },
  ],
  coordinator: [
    { to: "/coordinator", label: "Dashboard" },
    { to: "/coordinator/teams", label: "Teams" },
    { to: "/coordinator/reviews", label: "Schedule Reviews" },
    { to: "/coordinator/attendance", label: "Attendance" },
    { to: "/coordinator/viva-panel", label: "Viva Panel" },
    { to: "/coordinator/documents", label: "Documents & Letters" },
    { to: "/coordinator/analytics", label: "Analytics" },
  ],
  guide: [
    { to: "/guide", label: "Dashboard" },
    { to: "/guide/requests", label: "Guide Requests" },
    { to: "/guide/availability", label: "Availability" },
    { to: "/guide/marks", label: "Marks" },
    { to: "/guide/reports", label: "Final Reports" },
  ],
  panel: [
    { to: "/panel", label: "Dashboard" },
    { to: "/panel/teams", label: "Assigned Teams" },
    { to: "/panel/availability", label: "Availability" },
    { to: "/panel/marks", label: "Marks" },
  ],
  assistant: [
    { to: "/assistant", label: "Assignments" },
    { to: "/assistant/attendance", label: "Attendance" },
    { to: "/assistant/marks", label: "Marks" },
  ],
  student: [
    { to: "/student", label: "My Team" },
    { to: "/student/reviews", label: "Review Progress" },
    { to: "/student/marks", label: "My Marks" },
    { to: "/student/report", label: "Final Report" },
  ],
};
