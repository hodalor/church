import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import AppShell from '../../components/layout/AppShell';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Input from '../../components/ui/Input';
import { AnalyticsPage, FilterTabs } from '../../components/analytics/AnalyticsWidgets';
import {
  generateAnnouncement,
  generateDevotional,
  generateGrowthAnalysis,
  generateMeetingSummary,
  generateMemberNarrative,
  generatePrayerPoints,
  generateSermonDraft,
  getAIHistory,
} from '../../api/endpoints/ai';
import useAnalyticsAccess from '../../hooks/useAnalyticsAccess';
import { showErrorToast, showInfoToast, showSuccessToast } from '../../utils/toast';

const tools = [
  { key: 'sermon', label: 'Sermon Draft', section: 'Sermons' },
  { key: 'announcement', label: 'Announcement Writer', section: 'Communication' },
  { key: 'prayer', label: 'Prayer Points', section: 'Communication' },
  { key: 'devotional', label: 'Daily Devotional', section: 'Communication' },
  { key: 'meeting', label: 'Meeting Summary', section: 'Administration' },
  { key: 'member', label: 'Member Report Narrative', section: 'Administration' },
  { key: 'growth', label: 'Growth Analysis Narrative', section: 'Analytics' },
];

const historyFeatureMap = {
  sermon: 'sermon_draft',
  announcement: 'announcement_draft',
  prayer: 'prayer_points',
  devotional: 'devotional',
  meeting: 'meeting_summary',
  member: 'member_report_narrative',
  growth: 'growth_analysis_narrative',
};

const initialForms = {
  sermon: {
    topic: '',
    scripture: '',
    sermonType: 'Expository',
    targetAudience: 'General',
    duration: '30',
    churchContext: '',
  },
  announcement: {
    eventTitle: '',
    date: '',
    venue: '',
    keyDetails: '',
    tone: 'Formal',
    channels: ['SMS', 'Email'],
  },
  prayer: { theme: '', context: '', audience: 'Congregation' },
  devotional: { theme: '', scripture: '', audience: 'Monday' },
  meeting: { meetingTitle: '', meetingNotes: '', attendees: '', desiredTone: 'Formal' },
  member: { memberName: '', memberSummary: '', careContext: '' },
  growth: { targetPeriod: 'This month', analyticsSummary: '' },
};

export default function AIPastorAssistant() {
  const { canViewAI, canUseAI, canViewAIHistory } = useAnalyticsAccess();
  const [activeTool, setActiveTool] = useState('sermon');
  const [forms, setForms] = useState(initialForms);
  const [result, setResult] = useState('');
  const [streamText, setStreamText] = useState('');

  const historyQuery = useQuery({
    queryKey: ['ai-history', activeTool],
    queryFn: () => getAIHistory({ limit: 5, feature: historyFeatureMap[activeTool] }),
    enabled: canViewAIHistory,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = forms[activeTool];
      switch (activeTool) {
        case 'announcement':
          return generateAnnouncement({ ...payload, channels: payload.channels.join(', ') });
        case 'prayer':
          return generatePrayerPoints(payload);
        case 'devotional':
          return generateDevotional(payload);
        case 'meeting':
          return generateMeetingSummary(payload);
        case 'member':
          return generateMemberNarrative(payload);
        case 'growth':
          return generateGrowthAnalysis(payload);
        default:
          return generateSermonDraft(payload);
      }
    },
    onSuccess: (response) => {
      const text = response.text || '';
      setResult(text);
      setStreamText('');
      let index = 0;
      const interval = window.setInterval(() => {
        index += 2;
        setStreamText(text.slice(0, index));
        if (index >= text.length) {
          window.clearInterval(interval);
        }
      }, 8);
      showSuccessToast('AI draft ready.');
    },
    onError: (error) => {
      showErrorToast(
        error.message || 'AI service unavailable. Please check your API key settings.',
      );
    },
  });

  useEffect(() => {
    setResult('');
    setStreamText('');
  }, [activeTool]);

  const groupedTools = useMemo(
    () =>
      tools.reduce((acc, tool) => {
        acc[tool.section] = [...(acc[tool.section] || []), tool];
        return acc;
      }, {}),
    [],
  );

  const updateField = (tool, key, value) => {
    setForms((current) => ({
      ...current,
      [tool]: { ...current[tool], [key]: value },
    }));
  };

  if (!canViewAI) {
    return (
      <AppShell>
        <EmptyState
          icon="AI"
          title="AI assistant unavailable"
          message="Your role does not currently have access to the AI Pastor Assistant."
        />
      </AppShell>
    );
  }

  const form = forms[activeTool];
  const history = historyQuery.data?.items || [];

  return (
    <AppShell>
      <AnalyticsPage
        title="AI Pastor Assistant"
        subtitle="Generate sermons, communication drafts, summaries, prayer points, devotionals, and analytics narratives in one focused writing workspace."
      >
        <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
          <div className="rounded-[24px] border border-white/8 bg-[#0b1120] p-4 text-white">
            {Object.entries(groupedTools).map(([section, items]) => (
              <div key={section} className="mb-5">
                <p className="text-[11px] uppercase tracking-[0.24em] text-accent">{section}</p>
                <div className="mt-3 space-y-2">
                  {items.map((tool) => (
                    <button
                      key={tool.key}
                      type="button"
                      onClick={() => setActiveTool(tool.key)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        activeTool === tool.key
                          ? 'border-accent bg-accent/15 text-accent'
                          : 'border-white/10 bg-white/[0.03] text-white/70 hover:text-white'
                      }`}
                    >
                      {tool.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-8">
              <p className="text-[11px] uppercase tracking-[0.24em] text-accent">Recent Requests</p>
              <div className="mt-3 space-y-2">
                {history.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left text-sm text-white/70"
                    onClick={() => {
                      setResult(item.response || '');
                      setStreamText(item.response || '');
                    }}
                  >
                    <p className="font-medium text-white">{item.feature.replaceAll('_', ' ')}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-white/50">{item.prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-[24px] border border-white/8 bg-white p-5 text-[#1E2A4A]">
            <FilterTabs tabs={tools.map((tool) => ({ label: tool.label, value: tool.key }))} value={activeTool} onChange={setActiveTool} />

            {activeTool === 'sermon' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Topic" value={form.topic} onChange={(event) => updateField('sermon', 'topic', event.target.value)} />
                <Input label="Key Scripture" value={form.scripture} onChange={(event) => updateField('sermon', 'scripture', event.target.value)} />
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[#1E2A4A]">Sermon Type</span>
                  <select className="w-full rounded-xl border border-slate-200 px-3 py-2.5" value={form.sermonType} onChange={(event) => updateField('sermon', 'sermonType', event.target.value)}>
                    {['Expository', 'Topical', 'Narrative', 'Evangelistic'].map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[#1E2A4A]">Target Audience</span>
                  <select className="w-full rounded-xl border border-slate-200 px-3 py-2.5" value={form.targetAudience} onChange={(event) => updateField('sermon', 'targetAudience', event.target.value)}>
                    {['General', 'Youth', 'Men', 'Women', 'Children'].map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[#1E2A4A]">Duration</span>
                  <select className="w-full rounded-xl border border-slate-200 px-3 py-2.5" value={form.duration} onChange={(event) => updateField('sermon', 'duration', event.target.value.replace('min', ''))}>
                    {['20min', '30min', '45min', '60min'].map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
                <label className="block space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-[#1E2A4A]">Additional Context</span>
                  <textarea className="min-h-[120px] w-full rounded-xl border border-slate-200 px-3 py-2.5" value={form.churchContext} onChange={(event) => updateField('sermon', 'churchContext', event.target.value)} />
                </label>
              </div>
            ) : activeTool === 'announcement' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Event Title" value={form.eventTitle} onChange={(event) => updateField('announcement', 'eventTitle', event.target.value)} />
                <Input label="Date + Time" value={form.date} onChange={(event) => updateField('announcement', 'date', event.target.value)} />
                <Input label="Venue" value={form.venue} onChange={(event) => updateField('announcement', 'venue', event.target.value)} />
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[#1E2A4A]">Tone</span>
                  <select className="w-full rounded-xl border border-slate-200 px-3 py-2.5" value={form.tone} onChange={(event) => updateField('announcement', 'tone', event.target.value)}>
                    {['Formal', 'Casual', 'Exciting', 'Urgent'].map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
                <label className="block space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-[#1E2A4A]">Key Details</span>
                  <textarea className="min-h-[120px] w-full rounded-xl border border-slate-200 px-3 py-2.5" value={form.keyDetails} onChange={(event) => updateField('announcement', 'keyDetails', event.target.value)} />
                </label>
              </div>
            ) : activeTool === 'prayer' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Theme" value={form.theme} onChange={(event) => updateField('prayer', 'theme', event.target.value)} />
                <Input label="Congregation Context" value={form.audience} onChange={(event) => updateField('prayer', 'audience', event.target.value)} />
                <label className="block space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-[#1E2A4A]">Specific Needs</span>
                  <textarea className="min-h-[120px] w-full rounded-xl border border-slate-200 px-3 py-2.5" value={form.context} onChange={(event) => updateField('prayer', 'context', event.target.value)} />
                </label>
              </div>
            ) : activeTool === 'devotional' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Topic" value={form.theme} onChange={(event) => updateField('devotional', 'theme', event.target.value)} />
                <Input label="Key Scripture" value={form.scripture} onChange={(event) => updateField('devotional', 'scripture', event.target.value)} />
                <Input label="Day of Week" value={form.audience} onChange={(event) => updateField('devotional', 'audience', event.target.value)} />
              </div>
            ) : activeTool === 'meeting' ? (
              <div className="grid gap-4">
                <Input label="Meeting Type" value={form.meetingTitle} onChange={(event) => updateField('meeting', 'meetingTitle', event.target.value)} />
                <Input label="Attendees" value={form.attendees} onChange={(event) => updateField('meeting', 'attendees', event.target.value)} />
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[#1E2A4A]">Meeting Notes</span>
                  <textarea className="min-h-[160px] w-full rounded-xl border border-slate-200 px-3 py-2.5" value={form.meetingNotes} onChange={(event) => updateField('meeting', 'meetingNotes', event.target.value)} />
                </label>
              </div>
            ) : activeTool === 'member' ? (
              <div className="grid gap-4">
                <Input label="Member Name" value={form.memberName} onChange={(event) => updateField('member', 'memberName', event.target.value)} />
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[#1E2A4A]">Member Summary</span>
                  <textarea className="min-h-[140px] w-full rounded-xl border border-slate-200 px-3 py-2.5" value={form.memberSummary} onChange={(event) => updateField('member', 'memberSummary', event.target.value)} />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[#1E2A4A]">Care Context</span>
                  <textarea className="min-h-[120px] w-full rounded-xl border border-slate-200 px-3 py-2.5" value={form.careContext} onChange={(event) => updateField('member', 'careContext', event.target.value)} />
                </label>
              </div>
            ) : (
              <div className="grid gap-4">
                <Input label="Target Period" value={form.targetPeriod} onChange={(event) => updateField('growth', 'targetPeriod', event.target.value)} />
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[#1E2A4A]">Analytics Summary</span>
                  <textarea className="min-h-[180px] w-full rounded-xl border border-slate-200 px-3 py-2.5" value={form.analyticsSummary} onChange={(event) => updateField('growth', 'analyticsSummary', event.target.value)} />
                </label>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" disabled={!canUseAI || mutation.isPending} onClick={() => mutation.mutate()}>
                {mutation.isPending ? `Writing your ${tools.find((tool) => tool.key === activeTool)?.label || 'draft'}...` : `Generate ${tools.find((tool) => tool.key === activeTool)?.label || 'Draft'}`}
              </Button>
              <Button variant="ghost" onClick={() => showInfoToast('Refine flow can reuse the same prompt with additional instructions.')}>
                Refine
              </Button>
              <Button variant="ghost" onClick={() => navigator.clipboard.writeText(streamText || result)}>
                Copy
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  localStorage.setItem(`ai-library-${activeTool}`, streamText || result);
                  showSuccessToast('Saved locally to your AI library.');
                }}
              >
                Save to My Library
              </Button>
              <Button variant="ghost" onClick={() => showInfoToast('Send to Team can be connected to the communication draft flow.')}>
                Send to Team
              </Button>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-semibold text-[#1E2A4A]">Generated Output</h3>
              <pre className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {streamText || result || 'Your generated response will appear here.'}
              </pre>
            </div>
          </div>
        </div>
      </AnalyticsPage>
    </AppShell>
  );
}
