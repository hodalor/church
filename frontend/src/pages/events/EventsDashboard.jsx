import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import EventCard from '../../components/events/EventCard';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import { getAllEvents, getEventStats, getUpcomingEvents } from '../../api/endpoints/events';
import useEventsAccess from '../../hooks/useEventsAccess';
import useCurrency from '../../hooks/useCurrency';

const statTones = [
  'border-cyan-400/18 bg-[linear-gradient(135deg,rgba(34,211,238,0.14),rgba(13,19,32,0.98))]',
  'border-violet-400/18 bg-[linear-gradient(135deg,rgba(167,139,250,0.16),rgba(13,19,32,0.98))]',
  'border-emerald-400/18 bg-[linear-gradient(135deg,rgba(16,185,129,0.15),rgba(13,19,32,0.98))]',
  'border-amber-300/20 bg-[linear-gradient(135deg,rgba(244,201,93,0.18),rgba(13,19,32,0.98))]',
];

const panelClass =
  'border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(8,13,24,0.98))]';

export default function EventsDashboard() {
  const { canViewEvents, canCreateEvents } = useEventsAccess();
  const { formatCurrency } = useCurrency();
  const [monthCursor, setMonthCursor] = useState(new Date());

  const statsQuery = useQuery({
    queryKey: ['events-dashboard-stats'],
    queryFn: getEventStats,
    enabled: canViewEvents,
  });
  const upcomingQuery = useQuery({
    queryKey: ['events-dashboard-upcoming'],
    queryFn: () => getUpcomingEvents({ limit: 6 }),
    enabled: canViewEvents,
  });
  const monthEventsQuery = useQuery({
    queryKey: ['events-dashboard-month-events', format(monthCursor, 'yyyy-MM')],
    queryFn: () =>
      getAllEvents({
        from: startOfMonth(monthCursor).toISOString(),
        to: endOfMonth(monthCursor).toISOString(),
        limit: 100,
      }),
    enabled: canViewEvents,
  });

  const stats = statsQuery.data || {};
  const upcomingEvents = upcomingQuery.data?.items || upcomingQuery.data || [];
  const monthEvents = useMemo(
    () => monthEventsQuery.data?.items || monthEventsQuery.data || [],
    [monthEventsQuery.data],
  );
  const monthGrid = eachDayOfInterval({
    start: startOfWeek(startOfMonth(monthCursor)),
    end: endOfWeek(endOfMonth(monthCursor)),
  });
  const chartData = (stats.upcomingHighlights || []).map((event) => ({
    name: event.title,
    revenue: Number(event.revenue || 0),
  }));
  const statsCards = [
    { label: 'Upcoming Events', value: stats.upcoming || 0 },
    { label: 'Total Registrations', value: stats.totalRegistrations || 0 },
    { label: 'Avg Attendance Rate', value: `${Math.round(stats.avgAttendanceRate || 0)}%` },
    { label: 'Revenue This Month', value: formatCurrency(stats.revenue?.thisMonth || 0) },
  ];

  const eventsByDay = useMemo(() => {
    const map = new Map();
    monthEvents.forEach((event) => {
      const key = format(new Date(event.startDate), 'yyyy-MM-dd');
      map.set(key, [...(map.get(key) || []), event]);
    });
    return map;
  }, [monthEvents]);

  if (!canViewEvents) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.22em] text-accent">Events</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm text-white/60">
            Your account does not currently have access to event management.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Events"
          subtitle="Create events, manage registrations, and monitor attendance and revenue."
          action={
            canCreateEvents ? (
              <Link to="/events/new">
                <Button variant="secondary">Create New Event</Button>
              </Link>
            ) : null
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statsCards.map((card, index) => (
            <Card key={card.label} className={`min-h-[102px] p-3.5 ${statTones[index] || ''}`}>
              <p className="inline-flex rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-white/72">
                {card.label}
              </p>
              <h2 className="mt-3 text-[1.95rem] font-semibold leading-none text-white">{card.value}</h2>
            </Card>
          ))}
        </div>

        <Card className={`space-y-4 ${panelClass}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/55">Upcoming Events</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Your next major gatherings</h2>
            </div>
            <Link to="/events/new">
              <Button variant="ghost">Create New Event</Button>
            </Link>
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            {upcomingEvents.slice(0, 3).map((event) => (
              <EventCard key={event.eventId || event._id} event={event} />
            ))}
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card className={`space-y-4 ${panelClass}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-white/55">Calendar</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{format(monthCursor, 'MMMM yyyy')}</h2>
              </div>
              <div className="flex gap-2">
                <Button variant="subtle" onClick={() => setMonthCursor((current) => addMonths(current, -1))}>
                  Prev
                </Button>
                <Button variant="subtle" onClick={() => setMonthCursor((current) => addMonths(current, 1))}>
                  Next
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-[0.2em] text-white/35">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {monthGrid.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                const dayEvents = eventsByDay.get(key) || [];

                return (
                  <div
                    key={key}
                    className="min-h-[84px] rounded-[18px] border border-cyan-400/12 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(16,24,39,0.98))] p-2.5"
                  >
                    <div className="text-sm font-semibold text-white">{format(day, 'd')}</div>
                    <div className="mt-2 space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <Link
                          key={event.eventId || event._id}
                          to={`/events/${event.eventId || event._id}`}
                          className="block rounded-lg bg-accent/10 px-2 py-1 text-[11px] text-accent"
                        >
                          {event.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className={`space-y-4 ${panelClass}`}>
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/55">Revenue Chart</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Revenue per recent event</h2>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#94a3b8" hide />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#C9A84C" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
