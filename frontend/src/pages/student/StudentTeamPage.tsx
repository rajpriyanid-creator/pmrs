import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';
import { ReviewRail } from '@/components/reviewrail/ReviewRail';
import { EmptyState } from '@/components/ui/Table';
import { Lock, UserPlus, Check, X } from 'lucide-react';
import { useTeamList, useCreateTeam, useInviteToTeam, useLockTeam, useMyInvites, useRespondToInvite } from '@/api/teams';
import { useTeamReviews } from '@/api/reviews';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';
import { apiErrorMessage } from '@/api/client';
import { Student } from '@/types';

export function StudentTeamPage() {
  const profile = useAuthStore((s) => s.profile);
  const { data: teamsData, isLoading } = useTeamList();
  const myTeam = teamsData?.items[0];
  const { data: invites } = useMyInvites();
  const respondInvite = useRespondToInvite();

  async function handleRespond(id: string, accept: boolean) {
    try {
      await respondInvite.mutateAsync({ inviteId: id, accept });
      toast.success(accept ? 'Joined the team.' : 'Invite declined.');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <AppShell title="My Team">
      <PageHeader title="My Team" />

      {invites && invites.length > 0 && (
        <Card className="mb-6">
          <CardHeader title="Pending Invites" />
          <div className="divide-y divide-[var(--color-ink)]/8">
            {invites.map((inv) => (
              <div key={inv._id} className="flex items-center justify-between px-6 py-4">
                <p className="text-sm text-[var(--color-ink)]">
                  <span className="font-medium">{inv.fromStudent.name}</span> invited you to join{' '}
                  <span className="font-medium">{inv.teamId.name}</span>
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="success" onClick={() => handleRespond(inv._id, true)}>
                    <Check size={14} /> Accept
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleRespond(inv._id, false)}>
                    <X size={14} /> Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="h-52 animate-pulse bg-[var(--color-ink)]/5 rounded-xl" />
      ) : !myTeam ? (
        <CreateTeamCard programId={profile?.programId ?? ''} />
      ) : (
        <TeamDetail team={myTeam} />
      )}
    </AppShell>
  );
}

function CreateTeamCard({ programId }: { programId: string }) {
  const [name, setName] = useState('');
  const createMutation = useCreateTeam();
  const profile = useAuthStore((s) => s.profile);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    try {
      await createMutation.mutateAsync({ name, program: programId, studentIds: [profile.userId] });
      toast.success('Team created — invite your teammates next.');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <Card className="max-w-md">
      <CardHeader title="Create Your Team" subtitle="You'll be added as the first member" />
      <form onSubmit={handleCreate} className="p-6 space-y-4">
        <Field label="Team name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Team Vega" />
        </Field>
        <Button type="submit" loading={createMutation.isPending}>
          Create Team
        </Button>
      </form>
    </Card>
  );
}

function TeamDetail({ team }: { team: import('@/types').Team }) {
  const { data: reviews } = useTeamReviews(team._id);
  const inviteMutation = useInviteToTeam();
  const lockMutation = useLockTeam();
  const [inviteId, setInviteId] = useState('');

  const students = (team.students as Student[]) ?? [];
  const guideName = typeof team.guideId === 'object' && team.guideId ? team.guideId.name : null;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    try {
      await inviteMutation.mutateAsync({ teamId: team._id, toStudentId: inviteId });
      toast.success('Invite sent.');
      setInviteId('');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleLock() {
    if (!confirm('Locking your team is permanent and cannot be undone by members. Continue?')) return;
    try {
      await lockMutation.mutateAsync(team._id);
      toast.success('Team locked.');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={team.name}
          subtitle={guideName ? `Guided by ${guideName}` : 'No guide assigned yet'}
          action={<Badge tone={team.status === 'forming' ? 'seal' : 'verdant'}>{team.status}</Badge>}
        />
        <div className="p-6">
          <p className="text-xs font-medium text-[var(--color-ink-faint)] uppercase tracking-wide mb-2">Members</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {students.map((s) => (
              <Badge key={s._id}>{s.name}</Badge>
            ))}
          </div>

          {reviews && (
            <>
              <p className="text-xs font-medium text-[var(--color-ink-faint)] uppercase tracking-wide mb-3">Review Progress</p>
              <ReviewRail reviews={reviews} />
            </>
          )}
        </div>
      </Card>

      {team.status === 'forming' && (
        <Card className="max-w-md">
          <CardHeader title="Invite Teammates" />
          <form onSubmit={handleInvite} className="p-6 space-y-4">
            <Field label="Student ID" hint="Ask your teammate for their account ID">
              <Input value={inviteId} onChange={(e) => setInviteId(e.target.value)} required />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" variant="secondary" loading={inviteMutation.isPending}>
                <UserPlus size={15} /> Send Invite
              </Button>
              <Button type="button" variant="danger" onClick={handleLock} loading={lockMutation.isPending}>
                <Lock size={15} /> Lock Team
              </Button>
            </div>
          </form>
        </Card>
      )}

      {!reviews && <EmptyState title="Review schedule not yet published" />}
    </div>
  );
}
