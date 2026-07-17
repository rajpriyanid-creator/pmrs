import { motion } from "framer-motion";
import { Lock, CalendarClock, UserCheck, PenLine, CheckCircle2 } from "lucide-react";
import type { RailNodeStatus, ReviewType } from "../types";

export interface RailNode {
  type: ReviewType;
  label: string;
  status: RailNodeStatus;
  sublabel?: string; // e.g. scheduled date, or "no marks" for review0
}

const STATUS_META: Record<RailNodeStatus, { icon: typeof Lock; tone: string; text: string }> = {
  locked: { icon: Lock, tone: "text-ink/40 border-ink/20", text: "Locked" },
  scheduled: { icon: CalendarClock, tone: "text-seal border-seal", text: "Scheduled" },
  attended: { icon: UserCheck, tone: "text-seal border-seal", text: "Attended" },
  scored: { icon: PenLine, tone: "text-seal border-seal", text: "Scored" },
  complete: { icon: CheckCircle2, tone: "text-verdant border-verdant", text: "Complete" },
};

/**
 * Persistent vertical Review Rail (Section 9): the one wayfinding element
 * every role recognizes. Renders identically for Student/Guide/Coordinator/
 * Admin, scoped to whichever team is in view. The one orchestrated motion
 * moment in the whole app lives here: a node's fill animates pending ->
 * complete when a stage transitions, nothing else in the UI animates
 * incidentally.
 */
export function ReviewRail({ nodes, activeType }: { nodes: RailNode[]; activeType?: ReviewType }) {
  return (
    <nav aria-label="Review progress" className="flex flex-col">
      {nodes.map((node, i) => {
        const meta = STATUS_META[node.status];
        const Icon = meta.icon;
        const isLast = i === nodes.length - 1;
        const isActive = node.type === activeType;

        return (
          <div key={node.type} className="relative flex gap-3 pb-8 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className={`absolute left-[15px] top-8 w-px ${
                  node.status === "complete" ? "bg-verdant" : "bg-ink/15"
                }`}
                style={{ height: "calc(100% - 1rem)" }}
              />
            )}

            <motion.div
              className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-paper ${meta.tone}`}
              initial={false}
              animate={node.status === "complete" ? { scale: [1, 1.15, 1] } : { scale: 1 }}
              transition={{ duration: 0.42, ease: "easeOut" }}
            >
              <Icon size={16} strokeWidth={2.25} />
            </motion.div>

            <div className={`pt-1 ${isActive ? "font-medium" : ""}`}>
              <p className="font-display text-sm leading-tight text-ink">{node.label}</p>
              <p className={`text-xs ${meta.tone.split(" ")[0]}`}>
                {meta.text}
                {node.sublabel ? ` · ${node.sublabel}` : ""}
              </p>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

/** Compact horizontal variant for mobile / narrow viewports (Section 9 accessibility floor: responsive to phone). */
export function ReviewRailCompact({ nodes, activeType }: { nodes: RailNode[]; activeType?: ReviewType }) {
  return (
    <nav aria-label="Review progress" className="flex items-center gap-1 overflow-x-auto px-1 py-2">
      {nodes.map((node, i) => {
        const meta = STATUS_META[node.status];
        const Icon = meta.icon;
        const isActive = node.type === activeType;
        return (
          <div key={node.type} className="flex items-center gap-1">
            <motion.div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 bg-paper ${meta.tone} ${isActive ? "ring-2 ring-seal/30" : ""}`}
              initial={false}
              animate={node.status === "complete" ? { scale: [1, 1.15, 1] } : { scale: 1 }}
              transition={{ duration: 0.42, ease: "easeOut" }}
              title={`${node.label}: ${meta.text}`}
            >
              <Icon size={13} strokeWidth={2.25} />
            </motion.div>
            {i < nodes.length - 1 && <span aria-hidden className={`h-px w-4 ${node.status === "complete" ? "bg-verdant" : "bg-ink/15"}`} />}
          </div>
        );
      })}
    </nav>
  );
}
