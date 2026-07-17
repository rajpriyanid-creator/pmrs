import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "../lib/socket";
import { useToastStore } from "../store/toastStore";

/** Subscribes to the socket events in Section 8's event map and reflects them as toasts + cache invalidation. */
export function useNotifications() {
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNotification = (payload: { type: string }) => {
      push(humanize(payload.type));
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };
    const onAttendance = () => queryClient.invalidateQueries({ queryKey: ["attendance"] });
    const onMarks = () => { queryClient.invalidateQueries({ queryKey: ["marks"] }); push("Marks published"); };
    const onAllocation = () => queryClient.invalidateQueries({ queryKey: ["assignments"] });
    const onSchedule = () => { queryClient.invalidateQueries({ queryKey: ["reviews"] }); push("Schedule generated"); };
    const onDocument = () => push("Document ready to download");

    socket.on("notification:new", onNotification);
    socket.on("attendance:updated", onAttendance);
    socket.on("marks:published", onMarks);
    socket.on("allocation:updated", onAllocation);
    socket.on("schedule:generated", onSchedule);
    socket.on("document:generated", onDocument);

    return () => {
      socket.off("notification:new", onNotification);
      socket.off("attendance:updated", onAttendance);
      socket.off("marks:published", onMarks);
      socket.off("allocation:updated", onAllocation);
      socket.off("schedule:generated", onSchedule);
      socket.off("document:generated", onDocument);
    };
  }, [queryClient, push]);
}

function humanize(type: string): string {
  const map: Record<string, string> = {
    "invite:sent": "New team invite received",
    "invite:accepted": "Your invite was accepted",
    "invite:declined": "Your invite was declined",
    "guideRequest:accepted": "Guide request accepted",
    "guideRequest:rejected": "Guide request declined",
    "team:locked": "Your team has been locked",
    "report:approved": "Final report approved",
  };
  return map[type] ?? type;
}
