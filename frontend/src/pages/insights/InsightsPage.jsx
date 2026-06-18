import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AppShell from '../../components/layout/AppShell';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { AnalyticsPage, FilterTabs, InsightCard } from '../../components/analytics/AnalyticsWidgets';
import {
  generateInsights,
  getAllInsights,
  markInsightActioned,
  markInsightRead,
} from '../../api/endpoints/insights';
import useAnalyticsAccess from '../../hooks/useAnalyticsAccess';
import { showErrorToast, showInfoToast, showSuccessToast } from '../../utils/toast';

const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'Warnings', value: 'warning' },
  { label: 'Info', value: 'info' },
  { label: 'Actioned', value: 'actioned' },
];
const panelClass =
  'rounded-[18px] border border-violet-400/18 bg-[linear-gradient(135deg,rgba(167,139,250,0.16),rgba(13,19,32,0.98))] p-3.5 text-white shadow-[0_12px_28px_rgba(0,0,0,0.18)]';

export default function InsightsPage() {
  const queryClient = useQueryClient();
  const { canViewInsights, canManageInsights, canGenerateInsights } = useAnalyticsAccess();
  const [tab, setTab] = useState('all');

  const insightsQuery = useQuery({
    queryKey: ['insights-page', tab],
    queryFn: () =>
      getAllInsights({
        limit: 100,
        ...(tab === 'actioned' ? { isActioned: true } : {}),
        ...(tab !== 'all' && tab !== 'actioned' ? { severity: tab } : {}),
      }),
    enabled: canViewInsights,
  });

  const readMutation = useMutation({
    mutationFn: (insight) => markInsightRead(insight._id || insight.id),
    onSuccess: () => {
      showSuccessToast('Insight marked as read.');
      queryClient.invalidateQueries({ queryKey: ['insights-page'] });
    },
    onError: (error) => showErrorToast(error.message || 'Unable to mark insight as read.'),
  });
  const actionMutation = useMutation({
    mutationFn: (insight) => markInsightActioned(insight._id || insight.id),
    onSuccess: () => {
      showSuccessToast('Insight moved to actioned.');
      queryClient.invalidateQueries({ queryKey: ['insights-page'] });
    },
    onError: (error) => showErrorToast(error.message || 'Unable to mark insight as actioned.'),
  });
  const generateMutation = useMutation({
    mutationFn: () => generateInsights(),
    onSuccess: () => {
      showSuccessToast('Insights regenerated.');
      queryClient.invalidateQueries({ queryKey: ['insights-page'] });
    },
    onError: (error) => showErrorToast(error.message || 'Unable to regenerate insights.'),
  });

  const insights = useMemo(() => insightsQuery.data?.items || [], [insightsQuery.data]);
  const unreadCount = insights.filter((item) => !item.isRead).length;
  const chartData = useMemo(() => {
    const counts = insights.reduce(
      (acc, item) => ({ ...acc, [item.severity || 'info']: (acc[item.severity || 'info'] || 0) + 1 }),
      {},
    );
    return ['critical', 'warning', 'info'].map((name) => ({ name, value: counts[name] || 0 }));
  }, [insights]);

  if (!canViewInsights) {
    return (
      <AppShell>
        <EmptyState
          icon="AI"
          title="AI insights unavailable"
          message="Your current role does not have access to the insights feed."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AnalyticsPage
        title="AI Insights"
        subtitle="Review generated intelligence, prioritize critical issues, and move findings into action."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                insights.filter((item) => !item.isRead).forEach((item) => readMutation.mutate(item));
              }}
              disabled={!canManageInsights}
            >
              Mark All Read
            </Button>
            <Button variant="secondary" onClick={() => generateMutation.mutate()} disabled={!canGenerateInsights}>
              Regenerate Insights
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FilterTabs tabs={tabs} value={tab} onChange={setTab} />
              <p className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/65">
                {unreadCount} unread
              </p>
            </div>

            {insightsQuery.isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <CardSkeleton key={index} />
                ))}
              </div>
            ) : insights.length ? (
              <div className="grid gap-4">
                {insights.map((insight) => (
                  <InsightCard
                    key={insight._id || insight.id}
                    insight={insight}
                    onRead={canManageInsights ? (item) => readMutation.mutate(item) : undefined}
                    onAction={canManageInsights ? (item) => actionMutation.mutate(item) : undefined}
                    actionLabel={tab === 'actioned' ? 'Actioned' : 'Mark Actioned'}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="AI"
                title="No insights in this filter"
                message="Run the generator again or switch tabs to review another severity group."
              />
            )}
          </div>

          <div className={panelClass}>
            <h3 className="text-lg font-semibold text-white">Insight type breakdown</h3>
            <div className="mt-4 h-[210px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" stroke="#94A3B8" />
                  <YAxis dataKey="name" type="category" stroke="#94A3B8" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#A78BFA" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {chartData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm text-white/65">
                  <span>{item.name}</span>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-violet-300/15 bg-violet-400/10 p-3.5">
              <h4 className="font-medium text-white">Team sharing</h4>
              <p className="mt-2 text-sm text-white/58">
                Share any insight with your team from the card actions. Team notification wiring can reuse the existing notification and communication flows.
              </p>
              <Button variant="ghost" className="mt-4 w-full" onClick={() => showInfoToast('Use the insight cards to share with your team.')}>
                Share with Team
              </Button>
            </div>
          </div>
        </div>
      </AnalyticsPage>
    </AppShell>
  );
}
