import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, THead, TH, TR, TD, EmptyState, TableSkeleton } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Card';
import { useGuideAvailability } from '@/api/students';
import { useCreateGuideRequest } from '@/api/guideRequests';
import { useTeamList } from '@/api/teams';
import { toast } from '@/components/ui/Toast';
import { apiErrorMessage } from '@/api/client';
import { Send } from 'lucide-react';

export function StudentGuidesPage() {
  const { data, isLoading } = useGuideAvailability();
  const { data: teamsData } = useTeamList();
  const myTeam = teamsData?.items[0];
  const requestMutation = useCreateGuideRequest();

  async function handleRequest(guideId: string) {
    if (!myTeam) {
      toast.error('Create your team first.');
      return;
    }
    try {
      await requestMutation.mutateAsync({ teamId: myTeam._id, guideId });
      toast.success('Guide request sent.');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <AppShell title="Find a Guide">
      <PageHeader title="Find a Guide" description={data ? `Maximum team size for your program: ${data.maxTeamSize}` : undefined} />

      <Card>
        {isLoading ? (
          <TableSkeleton cols={3} />
        ) : !data || data.guides.length === 0 ? (
          <EmptyState title="No guides available" />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Name</TH>
                <TH>Designation</TH>
                <TH>Availability</TH>
                <TH></TH>
              </tr>
            </THead>
            <tbody>
              {data.guides.map((g) => (
                <TR key={g.guideId}>
                  <TD className="font-medium">{g.name}</TD>
                  <TD>{g.designation}</TD>
                  <TD>
                    <Badge tone={g.remaining > 0 ? 'verdant' : 'flag'}>
                      {g.remaining} of {g.limit} slots open
                    </Badge>
                  </TD>
                  <TD>
                    <Button size="sm" onClick={() => handleRequest(g.guideId)} disabled={g.remaining === 0} loading={requestMutation.isPending}>
                      <Send size={13} /> Request
                    </Button>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </AppShell>
  );
}
