import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Expand, Minimize, Search, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import AttendanceCounter from '../../components/attendance/AttendanceCounter';
import CheckInSuccessOverlay from '../../components/attendance/CheckInSuccessOverlay';
import Button from '../../components/ui/Button';
import {
  checkInByQr,
  childCheckIn,
  getLiveCheckIns,
  getServiceById,
  manualMemberCheckIn,
  toggleServiceCheckIn,
  visitorCheckIn,
} from '../../api/endpoints/attendance';
import { searchMembers } from '../../api/endpoints/members';
import useAttendanceAccess from '../../hooks/useAttendanceAccess';
import useDebounce from '../../hooks/useDebounce';
import {
  formatLongDate,
  formatTimeRange,
  getAttendanceTypeStyles,
} from '../../utils/attendance';

const tabs = [
  { label: 'QR Scan', value: 'qr' },
  { label: 'Manual Search', value: 'manual' },
  { label: 'Visitor Check-In', value: 'visitor' },
  { label: 'Child Check-In', value: 'child' },
];

const createVisitorForm = () => ({
  name: '',
  phone: '',
  email: '',
  firstTimer: true,
});

export default function CheckInConsolePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canViewServices, canCheckInServices, canModifyServices } = useAttendanceAccess();
  const { serviceId } = useParams();
  const scannerRef = useRef(null);
  const printRef = useRef(null);
  const [activeTab, setActiveTab] = useState('qr');
  const [qrMode, setQrMode] = useState('camera');
  const [overlayState, setOverlayState] = useState(null);
  const [manualSearch, setManualSearch] = useState('');
  const [childParentSearch, setChildParentSearch] = useState('');
  const [selectedParent, setSelectedParent] = useState(null);
  const [visitorForm, setVisitorForm] = useState(createVisitorForm());
  const [childForm, setChildForm] = useState({ childName: '', childAge: 7 });
  const [pickupCodeState, setPickupCodeState] = useState(null);
  const debouncedManualSearch = useDebounce(manualSearch, 350);
  const debouncedParentSearch = useDebounce(childParentSearch, 350);

  const serviceQuery = useQuery({
    queryKey: ['attendance-checkin-service', serviceId],
    queryFn: () => getServiceById(serviceId),
  });

  const liveQuery = useQuery({
    queryKey: ['attendance-live-checkins', serviceId],
    queryFn: () => getLiveCheckIns(serviceId, { limit: 10 }),
    enabled: Boolean(serviceId),
    refetchInterval: 5000,
  });

  const manualSearchQuery = useQuery({
    queryKey: ['attendance-checkin-search', debouncedManualSearch],
    queryFn: () => searchMembers({ search: debouncedManualSearch, limit: 8 }),
    enabled: debouncedManualSearch.trim().length >= 2,
  });

  const childParentQuery = useQuery({
    queryKey: ['attendance-child-parent-search', debouncedParentSearch],
    queryFn: () => searchMembers({ search: debouncedParentSearch, limit: 6 }),
    enabled: debouncedParentSearch.trim().length >= 2,
  });

  const service = serviceQuery.data?.service || serviceQuery.data || {};
  const summary = liveQuery.data?.summary || service.stats || {};
  const liveItems = liveQuery.data?.items || liveQuery.data?.checkIns || [];

  const invalidateAttendance = () => {
    queryClient.invalidateQueries({ queryKey: ['attendance-live-checkins', serviceId] });
    queryClient.invalidateQueries({ queryKey: ['attendance-checkin-service', serviceId] });
    queryClient.invalidateQueries({ queryKey: ['attendance-service-checkins', serviceId] });
  };

  const showOverlay = (variant, payload) => {
    setOverlayState({
      variant,
      member: {
        name: payload?.name || payload?.memberName || payload?.visitorName || 'Guest',
        photoUrl: payload?.photoUrl,
        timeLabel: payload?.checkedInAt
          ? `Checked in at ${new Date(payload.checkedInAt).toLocaleTimeString()}`
          : payload?.message || '',
      },
    });
  };

  const qrMutation = useMutation({
    mutationFn: (qrCode) => checkInByQr(serviceId, { qrCode }),
    onSuccess: (data) => {
      invalidateAttendance();
      if (data?.alreadyCheckedIn) {
        showOverlay('warning', { name: data.memberName, message: 'Already checked in earlier' });
      } else {
        showOverlay('success', data);
      }
    },
    onError: (error) => showOverlay('error', { name: 'Check-in error', message: error.message }),
  });

  const memberMutation = useMutation({
    mutationFn: (memberId) => manualMemberCheckIn(serviceId, { memberId }),
    onSuccess: (data) => {
      invalidateAttendance();
      showOverlay(data?.alreadyCheckedIn ? 'warning' : 'success', data);
    },
    onError: (error) => showOverlay('error', { name: 'Check-in error', message: error.message }),
  });

  const visitorMutation = useMutation({
    mutationFn: (payload) => visitorCheckIn(serviceId, payload),
    onSuccess: (data) => {
      invalidateAttendance();
      setVisitorForm(createVisitorForm());
      showOverlay('success', {
        name: data?.visitorName || data?.name || 'Visitor',
        message: 'Visitor checked in successfully',
      });
    },
    onError: (error) => showOverlay('error', { name: 'Visitor check-in error', message: error.message }),
  });

  const childMutation = useMutation({
    mutationFn: (payload) => childCheckIn(serviceId, payload),
    onSuccess: (data) => {
      invalidateAttendance();
      setChildForm({ childName: '', childAge: 7 });
      setPickupCodeState({
        pickupCode: data?.pickupCode || '0000',
        childName: data?.childName || 'Child',
        parentName: data?.parentName || selectedParent?.firstName || 'Parent',
      });
    },
    onError: (error) => showOverlay('error', { name: 'Child check-in error', message: error.message }),
  });

  const toggleMutation = useMutation({
    mutationFn: (nextState) => toggleServiceCheckIn(serviceId, nextState),
    onSuccess: () => {
      invalidateAttendance();
    },
  });

  useEffect(() => {
    if (activeTab !== 'qr' || qrMode !== 'camera') {
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

        const scanner = new Html5Qrcode('attendance-qr-reader');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 260 },
          (decodedText) => {
            qrMutation.mutate(decodedText);
          },
          () => {},
        );
      } catch (_) {
        // Keep manual entry available when camera setup is unavailable.
      }
    };

    startScanner();

    return () => {
      disposed = true;
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [activeTab, qrMode, qrMutation]);

  const manualResults = manualSearchQuery.data?.members || [];
  const parentResults = childParentQuery.data?.members || [];

  const handleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      return;
    }

    await document.exitFullscreen();
  };

  const printPickupLabel = async () => {
    if (!printRef.current) {
      window.print();
      return;
    }

    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(printRef.current);
    const url = canvas.toDataURL('image/png');
    const popup = window.open('', '_blank', 'width=420,height=640');
    if (!popup) {
      return;
    }

    popup.document.write(
      `<html><body style="margin:0;display:flex;align-items:center;justify-content:center;background:#fff;"><img src="${url}" style="max-width:100%;" /></body></html>`,
    );
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const breakdownPills = useMemo(
    () => [
      ['Members', summary.members || 0],
      ['Visitors', summary.visitors || 0],
      ['Children', summary.children || 0],
      ['Online', summary.online || 0],
      ['Total', summary.total || 0],
    ],
    [summary.children, summary.members, summary.online, summary.total, summary.visitors],
  );

  if (!canViewServices || !canCheckInServices) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#081125] p-6 text-white">
        <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-[#0b1120] p-8">
          <p className="text-sm uppercase tracking-[0.22em] text-accent">Attendance</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm text-white/60">
            Your account does not currently have permission to run service check-in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#081125] text-white">
      {overlayState ? (
        <CheckInSuccessOverlay
          variant={overlayState.variant}
          member={overlayState.member}
          onDismiss={() => setOverlayState(null)}
        />
      ) : null}

      {pickupCodeState ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#020617]/86 px-6">
          <div
            ref={printRef}
            className="w-full max-w-lg rounded-[26px] border border-white/10 bg-[#0b1120] p-8 text-center shadow-2xl"
          >
            <p className="text-[11px] uppercase tracking-[0.24em] text-accent/80">Pickup Code</p>
            <p className="mt-3 text-6xl font-semibold text-white">{pickupCodeState.pickupCode}</p>
            <p className="mt-4 text-lg font-semibold text-white">{pickupCodeState.childName}</p>
            <p className="mt-1 text-sm text-white/55">
              Show this code to parent for pickup. Parent: {pickupCodeState.parentName}
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Button variant="secondary" onClick={printPickupLabel}>
                Print Label
              </Button>
              <Button variant="subtle" onClick={() => setPickupCodeState(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex h-full flex-col">
        <header className="border-b border-white/10 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={() => navigate(`/attendance/services/${serviceId}`)}
                className="text-sm font-semibold text-accent"
              >
                Back to Service
              </button>
              <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                {service.title || 'Service Check-in'}
              </h1>
              <p className="mt-1 text-sm text-white/55">
                {formatLongDate(service.date)} • {formatTimeRange(service.startTime, service.endTime)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <AttendanceCounter count={summary.total || 0} />
              <div className="text-right">
                <p className="text-sm text-white/55">{new Date().toLocaleTimeString()}</p>
                <p className="mt-1 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  Check-in OPEN
                </p>
              </div>
              {canModifyServices ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (window.confirm('Close check-in for this service?')) {
                      toggleMutation.mutate(false);
                    }
                  }}
                >
                  Close Check-in
                </Button>
              ) : null}
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

            <div className="mt-4 min-h-0 flex-1 rounded-[28px] border border-white/10 bg-[#0b1120] p-4 sm:p-6">
              {activeTab === 'qr' ? (
                <div className="grid h-full gap-4 lg:grid-rows-[auto_1fr]">
                  <div className="flex gap-2">
                    <Button
                      variant={qrMode === 'camera' ? 'secondary' : 'subtle'}
                      onClick={() => setQrMode('camera')}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Camera
                    </Button>
                    <Button
                      variant={qrMode === 'manual' ? 'secondary' : 'subtle'}
                      onClick={() => setQrMode('manual')}
                    >
                      Manual Entry
                    </Button>
                  </div>

                  {qrMode === 'camera' ? (
                    <div className="relative flex min-h-[420px] items-center justify-center rounded-[28px] border-2 border-emerald-400/40 bg-[#07101f]">
                      <div id="attendance-qr-reader" className="w-full max-w-[640px]" />
                      <div className="pointer-events-none absolute inset-x-10 top-1/2 h-[2px] -translate-y-1/2 bg-emerald-400/70 shadow-[0_0_18px_rgba(16,185,129,0.8)]" />
                    </div>
                  ) : (
                    <div className="mx-auto flex h-full w-full max-w-2xl flex-col justify-center">
                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-white/70">Enter QR Code / Member ID</span>
                        <input
                          className="w-full rounded-2xl border border-white/10 bg-[#081125] px-4 py-4 text-lg text-white"
                          placeholder="Scan unavailable? Enter code manually"
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' && event.currentTarget.value.trim()) {
                              qrMutation.mutate(event.currentTarget.value.trim());
                              event.currentTarget.value = '';
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              ) : null}

              {activeTab === 'manual' ? (
                <div className="mx-auto max-w-3xl space-y-5">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />
                    <input
                      autoFocus
                      value={manualSearch}
                      onChange={(event) => setManualSearch(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#081125] px-12 py-4 text-lg text-white"
                      placeholder="Type member name, ID, or phone"
                    />
                  </div>
                  <div className="space-y-3">
                    {manualResults.map((member) => {
                      const fullName = [member.firstName, member.lastName].filter(Boolean).join(' ');
                      return (
                        <button
                          key={member.memberId}
                          type="button"
                          onClick={() => memberMutation.mutate(member.memberId)}
                          className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-[#081125] px-4 py-4 text-left transition hover:border-accent/40"
                        >
                          {member.photoUrl ? (
                            <img src={member.photoUrl} alt={fullName} className="h-14 w-14 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent">
                              <Users className="h-6 w-6" />
                            </div>
                          )}
                          <div>
                            <p className="text-lg font-semibold text-white">{fullName || member.memberId}</p>
                            <p className="text-sm text-white/55">
                              {member.memberId} • {member.department || 'General'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {activeTab === 'visitor' ? (
                <div className="mx-auto max-w-2xl space-y-4">
                  <input
                    value={visitorForm.name}
                    onChange={(event) => setVisitorForm((current) => ({ ...current, name: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-[#081125] px-4 py-4 text-lg text-white"
                    placeholder="Visitor Name"
                  />
                  <input
                    value={visitorForm.phone}
                    onChange={(event) => setVisitorForm((current) => ({ ...current, phone: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-[#081125] px-4 py-4 text-lg text-white"
                    placeholder="Phone"
                  />
                  <input
                    value={visitorForm.email}
                    onChange={(event) => setVisitorForm((current) => ({ ...current, email: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-[#081125] px-4 py-4 text-lg text-white"
                    placeholder="Email"
                  />
                  <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#081125] px-4 py-4">
                    <span className="text-lg font-semibold text-white">First Timer?</span>
                    <input
                      type="checkbox"
                      checked={visitorForm.firstTimer}
                      onChange={(event) =>
                        setVisitorForm((current) => ({ ...current, firstTimer: event.target.checked }))
                      }
                    />
                  </label>
                  <Button variant="secondary" className="w-full py-4 text-base" onClick={() => visitorMutation.mutate(visitorForm)}>
                    Check In Visitor
                  </Button>
                </div>
              ) : null}

              {activeTab === 'child' ? (
                <div className="mx-auto max-w-2xl space-y-4">
                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-white/70">Parent Member</span>
                    <input
                      value={childParentSearch}
                      onChange={(event) => setChildParentSearch(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#081125] px-4 py-4 text-lg text-white"
                      placeholder="Search parent member"
                    />
                    <div className="space-y-2">
                      {parentResults.map((member) => {
                        const fullName = [member.firstName, member.lastName].filter(Boolean).join(' ');
                        return (
                          <button
                            key={member.memberId}
                            type="button"
                            onClick={() => {
                              setSelectedParent(member);
                              setChildParentSearch(fullName || member.memberId);
                            }}
                            className="block w-full rounded-xl border border-white/10 bg-[#081125] px-4 py-3 text-left text-sm text-white/75"
                          >
                            {fullName || member.memberId}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <input
                    value={childForm.childName}
                    onChange={(event) => setChildForm((current) => ({ ...current, childName: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-[#081125] px-4 py-4 text-lg text-white"
                    placeholder="Child Name"
                  />
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#081125] px-4 py-3">
                    <span className="text-lg font-semibold text-white">Child Age</span>
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setChildForm((current) => ({ ...current, childAge: Math.max(0, current.childAge - 1) }))
                        }
                        className="rounded-full border border-white/10 px-3 py-1 text-lg"
                      >
                        -
                      </button>
                      <span className="w-10 text-center text-lg font-semibold text-white">{childForm.childAge}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setChildForm((current) => ({ ...current, childAge: current.childAge + 1 }))
                        }
                        className="rounded-full border border-white/10 px-3 py-1 text-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    className="w-full py-4 text-base"
                    onClick={() =>
                      childMutation.mutate({
                        parentMemberId: selectedParent?.memberId,
                        childName: childForm.childName,
                        childAge: childForm.childAge,
                      })
                    }
                  >
                    Check In Child
                  </Button>
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
                    key={item.checkInId || item._id}
                    className="rounded-[18px] border border-white/8 bg-[#0b1120] px-3 py-3"
                  >
                    <div className="flex items-center gap-3">
                      {item.photoUrl ? (
                        <img src={item.photoUrl} alt={item.name} className="h-11 w-11 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
                          {String(item.name || 'M').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{item.name || item.memberName || 'Guest'}</p>
                        <p className="text-xs text-white/45">
                          {item.checkedInAt ? new Date(item.checkedInAt).toLocaleTimeString() : ''}
                        </p>
                      </div>
                      <span
                        className={`ml-auto rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${getAttendanceTypeStyles(item.type)}`}
                      >
                        {item.type || 'member'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <footer className="border-t border-white/10 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {breakdownPills.map(([label, value]) => (
                <span
                  key={label}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/70"
                >
                  {label}: {value}
                </span>
              ))}
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
