import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { useAuth } from "../../hooks/useAuth";
import { useToastStore } from "../../store/toastStore";
import type { Team } from "../../types";

interface ConfigShape { ugMaxTeamSize: number; pgMaxTeamSize: number; teamFormationOpen: boolean }

/** Student team formation: create -> invite -> lock, one-directional once locked (Section 6.3). */
export function StudentDashboard() {
  const { program } = useAuth();
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);
  const [teamName, setTeamName] = useState("");
  const [inviteRollNo, setInviteRollNo] = useState("");

  const { data: config } = useQuery({ queryKey: ["config"], queryFn: () => unwrap(api.get<{ data: ConfigShape }>("/config")) });
  const { data: teams } = useQuery({ queryKey: ["teams", "mine"], queryFn: () => unwrap(api.get<{ data: Team[] }>("/teams")) });
  const myTeam = teams?.[0];

  const createTeam = useMutation({
    mutationFn: () => api.post("/teams", { name: teamName, program, studentIds: [] }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["teams"] }); push("Team created"); },
    onError: (err: any) => push(err?.response?.data?.error ?? "Could not create team", "error"),
  });

  const lockTeam = useMutation({
    mutationFn: () => api.post("/teams/lock", { teamId: myTeam?._id }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["teams"] }); push("Team locked"); },
  });

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 font-display text-2xl">My Team</h1>

      {!config?.teamFormationOpen && (
        <p className="mb-4 rounded border border-seal/30 bg-seal-soft/30 px-3 py-2 text-sm text-seal-dark">
          Team formation is currently closed.
        </p>
      )}

      {!myTeam ? (
        <Card>
          <h2 className="mb-3 font-display text-lg">Create a team</h2>
          <p className="mb-3 text-xs text-ink/50">Max team size for your program: {config?.ugMaxTeamSize ?? config?.pgMaxTeamSize ?? "—"}. Solo teams are allowed.</p>
          <form onSubmit={(e) => { e.preventDefault(); createTeam.mutate(); }} className="flex gap-2">
            <Input placeholder="Team name" value={teamName} onChange={(e) => setTeamName(e.target.value)} required disabled={!config?.teamFormationOpen} />
            <Button type="submit" disabled={!config?.teamFormationOpen}>Create</Button>
          </form>
        </Card>
      ) : (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg">{myTeam.name}</h2>
            <Badge tone={myTeam.status === "active" ? "verdant" : myTeam.status === "locked" ? "seal" : "neutral"}>{myTeam.status}</Badge>
          </div>
          <ul className="mb-4 flex flex-col gap-1 text-sm">
            {myTeam.students.map((s) => <li key={s._id}>{s.name} <span className="font-mono text-ink/40">({s.rollNo})</span></li>)}
          </ul>

          {myTeam.status === "forming" && (
            <>
              <form onSubmit={(e) => { e.preventDefault(); push("Invite sent (roll number lookup would happen server-side)"); }} className="mb-3 flex gap-2">
                <Input placeholder="Teammate roll number" value={inviteRollNo} onChange={(e) => setInviteRollNo(e.target.value)} />
                <Button type="submit" variant="secondary">Invite</Button>
              </form>
              <Button variant="danger" onClick={() => lockTeam.mutate()}>Lock team</Button>
              <p className="mt-2 text-xs text-ink/50">Locking is one-directional - it cannot be reversed by any student once confirmed.</p>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
