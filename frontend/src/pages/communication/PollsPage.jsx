import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import PollResultsBar from '../../components/communication/PollResultsBar';
import { closePoll, getPolls, voteOnPoll } from '../../api/endpoints/communication';
import { useCommunicationAccess } from '../../hooks/useCommunicationAccess';
import { formatDate } from '../../utils/formatDate';

export default function PollsPage() {
  const queryClient = useQueryClient();
  const { canViewPolls, canCreatePolls, canModifyPolls } = useCommunicationAccess();
  const pollsQuery = useQuery({
    queryKey: ['communication-polls'],
    queryFn: () => getPolls(),
  });

  const voteMutation = useMutation({
    mutationFn: ({ pollId, optionId }) => voteOnPoll(pollId, optionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communication-polls'] }),
  });

  const closeMutation = useMutation({
    mutationFn: (pollId) => closePoll(pollId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communication-polls'] }),
  });

  if (!canViewPolls) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.22em] text-accent">Communication</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm text-white/60">
            Your account does not currently have access to polls.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Polls"
          action={
            canCreatePolls ? (
              <Link to="/communication/polls/new">
                <Button variant="secondary">+ New Poll</Button>
              </Link>
            ) : null
          }
        />

        <Card className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-white/50">Active Polls</p>
          </div>
          <div className="space-y-4">
            {(pollsQuery.data?.active || []).map((poll) => (
              <Card key={poll._id} className="rounded-2xl bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{poll.question}</h3>
                    <p className="mt-2 text-sm text-white/55">{poll.totalVotes || 0} total votes</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="accent">{String(poll.audience?.type || 'all_members').replaceAll('_', ' ')}</Badge>
                    {poll.expiresAt ? <Badge tone="primary">Expires {formatDate(poll.expiresAt)}</Badge> : null}
                  </div>
                </div>

                <div className="mt-4">
                  <PollResultsBar options={poll.options || []} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(poll.options || []).map((option) => (
                    <Button
                      key={option.id}
                      variant="ghost"
                      onClick={() => voteMutation.mutate({ pollId: poll._id, optionId: option.id })}
                    >
                      Vote {option.text}
                    </Button>
                  ))}
                  {canModifyPolls ? (
                    <Button variant="secondary" onClick={() => closeMutation.mutate(poll._id)}>
                      Close Poll
                    </Button>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <p className="text-sm uppercase tracking-[0.22em] text-white/50">Closed Polls</p>
          <div className="space-y-3">
            {(pollsQuery.data?.closed || []).map((poll) => (
              <div key={poll._id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{poll.question}</p>
                  <span className="text-xs uppercase tracking-[0.18em] text-white/40">{formatDate(poll.closedAt || poll.createdAt)}</span>
                </div>
                <div className="mt-3">
                  <PollResultsBar options={poll.options || []} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
