import { Link } from "react-router-dom";
import { Bell, Moon, Sun, LogOut, HelpCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useUiStore } from "../../store/uiStore";
import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import type { Notification } from "../../types";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin", coordinator: "Coordinator", guide: "Guide", panel: "Panel Member", assistant: "Assistant", student: "Student",
};

export function Header() {
  const { role, programName, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useUiStore();

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => unwrap(api.get<{ data: Notification[] }>("/notifications?limit=5")),
  });
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <header className="flex items-center justify-between border-b border-ink/10 bg-paper px-6 py-3">
      <div>
        <p className="font-display text-lg leading-none">PRMS</p>
        <p className="text-xs text-ink/50">{role ? ROLE_LABEL[role] : ""}{programName ? ` · ${programName}` : ""}</p>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/help" aria-label="Help center" className="rounded p-2 hover:bg-ink/5"><HelpCircle size={18} /></Link>
        <button onClick={toggleDarkMode} aria-label="Toggle dark mode" className="rounded p-2 hover:bg-ink/5">
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <Link to="/notifications" aria-label="Notifications" className="relative rounded p-2 hover:bg-ink/5">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-flag text-[10px] text-paper">
              {unreadCount}
            </span>
          )}
        </Link>
        <button onClick={logout} aria-label="Log out" className="rounded p-2 hover:bg-ink/5"><LogOut size={18} /></button>
      </div>
    </header>
  );
}
