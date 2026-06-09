import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Expand, Minimize, Search } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { checkInToEvent, getEventById, getEventRegistrations, getRegistrationStats } from '../../api/endpoints/events';
import useEventsAccess from '../../hooks/useEventsAccess';

const tabs = [
  { label: 'QR Scan', value: 'qr' },
  { label: 'Manual Search', value: 'manual' },
];

const parseRegistrationId = (payload) => {
  try {
    const decoded = JSON.parse(atob(payload));
    return decoded.registrationId || payload;
  } catch (_) {
    return payload;
  }
};

export default function EventCheckInPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { eventId } = useParams();
  const { canViewRegistrations, canCheckInRegistrations } = useEventsAccess();
  const scannerRef = useRef(null);
  const [activeTab, setActiveTab] = useState('qr');
  const [search, setSearch] = useState('');
  const [manualEntry, setManualEntry] = useState('');
  const [feedback, setFeedback] = useState(null);

  const eventQuery = useQuery({
    queryKey: ['event-checkin-event', eventId],
    queryFn: () => getEventById(eventId),
    enabled: canViewRegistrations,
  });
  const registrationsQuery = useQuery({
    queryKey: ['event-checkin-registrations', eventId],
    queryFn: () => getEventRegistrations(eventId, { limit: 200 }),
    enabled: canViewRegistrations,
    refetchInterval: 5000,
  });
  const statsQuery = useQuery({
    queryKey: ['event-checkin-stats', eventId],
    queryFn: () => getRegistrationStats(eventId),
    enabled: canViewRegistrations,
    refetchInterval: 5000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['event-checkin-registrations', eventId] });
    queryClient.invalidateQueries({ queryKey: ['event-checkin-stats', eventId] });
    queryClient.invalidateQueries({ queryKey: ['event-detail-stats', eventId] });
    queryClient.invalidateQueries({ queryKey: ['event-detail-registrations', eventId] });
    queryClient.invalidateQueries({ queryKey: ['event-registrations-list', eventId] });
    queryClient.invalidateQueries({ queryKey: ['event-registrations-stats', eventId] });
  };

  const checkInMutation = useMutation({
    mutationFn: ({ regId, method }) => checkInToEvent(eventId, regId, { method }),
    onSuccess: (result) => {
      setFeedback({
        variant: 'success',
        message: `${result.memberName || result.externalName || 'Registrant'} checked in successfully.`,
      });
      invalidate();
    },
    onError: (error) => {
      setFeedback({
        variant: 'error',
        message: error.message || 'Check-in failed.',
      });
    },
  });

  useEffect(() => {
    if (activeTab !== 'qr') {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
      return undefined;
    }

    let disposed = false;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (disposed) {
          return;
        }

        const scanner = new Html5Qrcode('event-qr-reader');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 260 },
          (decodedText) => {
            const regId = parseRegistrationId(decodedText);
            checkInMutation.mutate({ regId, method: 'qr_scan' });
          },
          () => {},
        );
      } catch (_) {
        setFeedback({
          variant: 'error',
          message: 'Camera scanner is unavailable. Use manual search or manual code entry.',
        });
      }
    };

    startScanner();

    return () => {
      disposed = true;
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [activeTab, checkInMutation]);

  const event = eventQuery.data || {};
  const registrations = useMemo(() => registrationsQuery.data?.items || [], [registrationsQuery.data]);
  const liveItems = [...registrations]
    .filter((item) => item.checkedInAt)
    .sort((left, right) => new Date(right.checkedInAt) - new Date(left.checkedInAt))
    .slice(0, 10);
  const filteredResults = useMemo(() => {
    const lowered = search.trim().toLowerCase();
    return registrations.filter((item) =>
      lowered
        ? [item.memberName, item.externalName, item.phone, item.email]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(lowered))
        : true,
    );
  }, [registrations, search]);

  const handleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      return;
    }
    await document.exitFullscreen();
  };

  if (!canViewRegistrations || !canCheckInRegistrations) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#081125] p-6 text-white">
        <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-[#0b1120] p-8">
          <p className="text-sm uppercase tracking-[0.22em] text-accent">Event Check-In</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm text-white/60">
            Your account does not currently have permission to run event check-in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#081125] text-white">
      <div className="flex h-full flex-col">
        <header className="border-b border-white/10 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={() => navigate(`/events/${eventId}`)}
                className="text-sm font-semibold text-accent"
              >
                Back to Event
              </button>
              <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                {event.title || 'Event Check-In'}
              </h1>
              <p className="mt-1 text-sm text-white/55">
                {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD'}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-white/55">Live count</p>
              <p className="mt-1 text-4xl font-semibold text-white">{statsQuery.data?.attended || 0}</p>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <main className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    activeTab === tab.value
                      ? 'bg-accent text-primary'
                      : 'border border-white/10 bg-white/5 text-white/70'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {feedback ? (
              <div
                className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                  feedback.variant === 'success'
                    ? 'border border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                    : 'border border-rose-400/30 bg-rose-500/10 text-rose-200'
                }`}
              >
                {feedback.message}
              </div>
            ) : null}

            <div className="mt-4 min-h-0 flex-1 rounded-[28px] border border-white/10 bg-[#0b1120] p-4 sm:p-6">
              {activeTab === 'qr' ? (
                <div className="grid h-full gap-4 lg:grid-rows-[1fr_auto]">
                  <div className="relative flex min-h-[420px] items-center justify-center rounded-[28px] border-2 border-emerald-400/40 bg-[#07101f]">
                    <div id="event-qr-reader" className="w-full max-w-[640px]" />
                    <div className="pointer-events-none absolute inset-x-10 top-1/2 h-[2px] -translate-y-1/2 bg-emerald-400/70 shadow-[0_0_18px_rgba(16,185,129,0.8)]" />
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={manualEntry}
                      onChange={(event) => setManualEntry(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && manualEntry.trim()) {
                          checkInMutation.mutate({
                            regId: parseRegistrationId(manualEntry.trim()),
                            method: 'manual',
                          });
                          setManualEntry('');
                        }
                      }}
                      className="w-full rounded-2xl border border-white/10 bg-[#081125] px-4 py-4 text-lg text-white"
                      placeholder="Manual registration ID / QR payload"
                    />
                    <Button
                      variant="secondary"
                      onClick={() => {
                        if (manualEntry.trim()) {
                          checkInMutation.mutate({
                            regId: parseRegistrationId(manualEntry.trim()),
                            method: 'manual',
                          });
                          setManualEntry('');
                        }
                      }}
                    >
                      Check In
                    </Button>
                  </div>
                </div>
              ) : null}

              {activeTab === 'manual' ? (
                <div className="mx-auto max-w-3xl space-y-5">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
                    <input
                      autoFocus
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#081125] px-12 py-4 text-lg text-white"
                      placeholder="Search name, phone, or email"
                    />
                  </div>
                  <div className="space-y-3">
                    {filteredResults.map((registration) => (
                      <div
                        key={registration.registrationId || registration._id}
                        className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#081125] px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
                      >
                        <div>
                          <p className="text-lg font-semibold text-white">
                            {registration.memberName || registration.externalName || 'Registrant'}
                          </p>
                          <p className="text-sm text-white/55">
                            {registration.tierName || 'General'} • {registration.phone || registration.email || 'No contact'}
                          </p>
                          <p className="mt-1 text-xs text-white/35">
                            {registration.checkedInAt
                              ? `Checked in at ${new Date(registration.checkedInAt).toLocaleTimeString()}`
                              : 'Not checked in yet'}
                          </p>
                        </div>
                        <Button
                          variant="secondary"
                          disabled={Boolean(registration.checkedInAt)}
                          onClick={() =>
                            checkInMutation.mutate({
                              regId: registration.registrationId || registration._id,
                              method: 'manual',
                            })
                          }
                        >
                          {registration.checkedInAt ? 'Checked In' : 'Check In'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </main>

          <aside className="hidden w-[360px] shrink-0 border-l border-white/10 bg-[#09101c] p-4 xl:block">
            <div className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-white/45">Live Sidebar</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Last 10 check-ins</h2>
              </div>
              <div className="max-h-[calc(100vh-220px)] space-y-3 overflow-y-auto pr-1">
                {liveItems.map((item) => (
                  <div
                    key={item.registrationId || item._id}
                    className="rounded-[18px] border border-white/8 bg-[#0b1120] px-3 py-3"
                  >
                    <p className="font-semibold text-white">{item.memberName || item.externalName || 'Registrant'}</p>
                    <p className="mt-1 text-xs text-white/45">
                      {item.checkedInAt ? new Date(item.checkedInAt).toLocaleTimeString() : ''}
                    </p>
                    <p className="mt-1 text-xs text-accent">{item.tierName || 'General'}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <footer className="border-t border-white/10 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                Registered: {statsQuery.data?.registered || 0}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                Confirmed: {statsQuery.data?.confirmed || 0}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                Attended: {statsQuery.data?.attended || 0}
              </span>
            </div>
            <Button variant="subtle" onClick={handleFullscreen}>
              {document.fullscreenElement ? <Minimize className="mr-2 h-4 w-4" /> : <Expand className="mr-2 h-4 w-4" />}
              Full Screen
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
