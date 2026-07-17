import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { TeamRailLayout } from "../../components/layout/TeamRailLayout";
import { useReviewRailData } from "../../hooks/useReviewRailData";
import type { Team, Review } from "../../types";

export function StudentReviews() {
  const { data: teams } = useQuery({ queryKey: ["teams", "mine"], queryFn: () => unwrap(api.get<{ data: Team[] }>("/teams")) });
  const myTeam = teams?.[0];
  const { data: reviews } = useQuery({
    queryKey: ["reviews", myTeam?._id],
    queryFn: () => unwrap(api.get<{ data: Review[] }>(`/reviews?teamId=${myTeam?._id}`)),
    enabled: Boolean(myTeam),
  });
  const nodes = useReviewRailData(reviews);

  if (!myTeam) return <p className="text-sm text-ink/50">You're not on a team yet.</p>;

  return (
    <TeamRailLayout nodes={nodes} title="Review Progress">
      <div className="flex flex-col gap-3">
        {(reviews ?? []).map((r) => (
          <div key={r._id} className="rounded-lg border border-ink/10 p-4">
            <p className="font-display capitalize">{r.type}</p>
            <p className="text-sm text-ink/60">
              {r.scheduledDate ? `${new Date(r.scheduledDate).toLocaleDateString()} at ${r.scheduledTime}` : "Not yet scheduled"}
            </p>
          </div>
        ))}
      </div>
    </TeamRailLayout>
  );
}
