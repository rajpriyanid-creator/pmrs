import { ReviewRail, ReviewRailCompact, type RailNode } from "../ReviewRail";
import type { ReviewType } from "../../types";

/**
 * Team-context layout per Section 9's layout concept: Review Rail sticky
 * left on desktop, compact horizontal strip on mobile (coordinators and
 * guides genuinely use this from a phone between classes).
 */
export function TeamRailLayout({
  nodes, activeType, title, children,
}: { nodes: RailNode[]; activeType?: ReviewType; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-4 md:hidden">
        <h1 className="mb-2 font-display text-xl">{title}</h1>
        <div className="rounded-lg border border-ink/10 bg-paper">
          <ReviewRailCompact nodes={nodes} activeType={activeType} />
        </div>
      </div>
      <div className="flex gap-8">
        <div className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-6 rounded-lg border border-ink/10 bg-paper p-4 shadow-rail">
            <ReviewRail nodes={nodes} activeType={activeType} />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="mb-6 hidden font-display text-2xl md:block">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
