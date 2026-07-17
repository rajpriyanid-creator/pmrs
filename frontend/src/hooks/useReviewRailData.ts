import { useMemo } from "react";
import { REVIEW_SEQUENCE, type Review, type RailNodeStatus } from "../types";
import type { RailNode } from "../components/ReviewRail";

const LABELS: Record<string, string> = {
  review0: "Review 0",
  review1: "Review 1",
  review2: "Review 2",
  review3: "Review 3",
  viva: "Viva Voce",
};

/**
 * Derives each Review Rail node's status from the underlying Review record:
 * locked (prerequisite not yet complete) -> scheduled -> attended (has
 * attendance on file) -> scored (marks submitted, not yet all-confirmed) ->
 * complete. review0 skips "scored" since it never carries marks.
 */
export function useReviewRailData(
  reviews: Review[] | undefined,
  attendanceByReview: Record<string, boolean> = {},
  marksByReview: Record<string, "none" | "partial" | "complete"> = {},
): RailNode[] {
  return useMemo(() => {
    if (!reviews) return [];
    const byType = new Map(reviews.map((r) => [r.type, r]));

    return REVIEW_SEQUENCE.map((type, i): RailNode => {
      const review = byType.get(type);
      const label = LABELS[type];
      if (!review || review.status === "pending") {
        const prereq = i === 0 ? null : byType.get(REVIEW_SEQUENCE[i - 1]);
        const locked = i > 0 && prereq?.status !== "completed";
        return { type, label, status: locked ? "locked" : "scheduled", sublabel: locked ? "awaiting prior stage" : undefined };
      }

      const attended = attendanceByReview[review._id];
      const marksState = marksByReview[review._id] ?? "none";

      let status: RailNodeStatus = "scheduled";
      if (review.status === "completed") status = "complete";
      else if (marksState === "complete") status = "scored";
      else if (attended) status = "attended";

      return {
        type,
        label,
        status,
        sublabel: review.scheduledDate ? new Date(review.scheduledDate).toLocaleDateString() : undefined,
      };
    });
  }, [reviews, attendanceByReview, marksByReview]);
}
