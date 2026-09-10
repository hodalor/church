import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Download, Expand, Fingerprint, Minimize, Search, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import AttendanceCounter from '../../components/attendance/AttendanceCounter';
import CheckInSuccessOverlay from '../../components/attendance/CheckInSuccessOverlay';
import Button from '../../components/ui/Button';
import {
  checkOutByQr,
  checkInByQr,
  biometricMemberCheckIn,
  biometricMemberCheckOut,
  childCheckIn,
  getLiveCheckIns,
  getServiceById,
  manualMemberCheckIn,
  manualMemberCheckOut,
  toggleServiceCheckIn,
  visitorCheckIn,
} from '../../api/endpoints/attendance';
import { searchMembers } from '../../api/endpoints/members';
import useAttendanceAccess from '../../hooks/useAttendanceAccess';
import useDebounce from '../../hooks/useDebounce';
import {
  extractFingerprintCaptureStats,
  downloadBiometricBridgeWindowsInstaller,
  extractFingerprintDeviceMeta,
  extractFingerprintMemberId,
  extractFingerprintMessage,
  extractFingerprintPreviewImage,
  extractFingerprintTemplateId,
  getBiometricBridgeStatus,
  identifyFingerprint,
} from '../../utils/biometricBridge';
import { showInfoToast } from '../../utils/toast';
import {
  formatLongDate,
  formatTimeRange,
  getAttendanceTypeStyles,
} from '../../utils/attendance';

const tabs = [
  { label: 'QR Scan', value: 'qr' },
  { label: 'Manual Search', value: 'manual' },
  { label: 'Biometric Scan', value: 'biometric' },
  { label: 'Visitor Check-In', value: 'visitor' },
  { label: 'Child Check-In', value: 'child' },
];

const attendanceModes = [
  { label: 'Check In', value: 'check_in' },
  { label: 'Check Out', value: 'check_out' },
];

const createVisitorForm = () => ({
  name: '',
  phone: '',
  email: '',
  firstTimer: true,
});

const getRequestErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export default function CheckInConsolePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canViewServices, canCheckInServices, canModifyServices } = useAttendanceAccess();
  const { serviceId } = useParams();
  const scannerRef = useRef(null);
  const scannerStartingRef = useRef(false);
  const latestQrActionRef = useRef(null);
  const printRef = useRef(null);
  const [activeTab, setActiveTab] = useState('qr');
  const [attendanceMode, setAttendanceMode] = useState('check_in');
  const [qrMode, setQrMode] = useState('camera');
  const [overlayState, setOverlayState] = useState(null);
  const [manualSearch, setManualSearch] = useState('');
  const [childParentSearch, setChildParentSearch] = useState('');
  const [selectedParent, setSelectedParent] = useState(null);
  const [visitorForm, setVisitorForm] = useState(createVisitorForm());
  const [childForm, setChildForm] = useState({ childName: '', childAge: 7 });
  const [pickupCodeState, setPickupCodeState] = useState(null);
  const [lastBiometricMatch, setLastBiometricMatch] = useState(null);
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
  const biometricBridgeQuery = useQuery({
    queryKey: ['attendance-biometric-bridge-status', serviceId],
    queryFn: () => getBiometricBridgeStatus(),
    enabled: activeTab === 'biometric',
    retry: false,
    staleTime: 15000,
  });

  const service = serviceQuery.data?.service || serviceQuery.data || {};
  const summary = liveQuery.data?.summary || service.stats || {};
  const liveItems = liveQuery.data?.items || liveQuery.data?.checkIns || [];
  const isServiceCheckInOpen = service?.checkInOpen === true;
  const isCheckInBlocked = attendanceMode === 'check_in' && !isServiceCheckInOpen;

  const invalidateAttendance = () => {
    queryClient.invalidateQueries({ queryKey: ['attendance-live-checkins', serviceId] });
    queryClient.invalidateQueries({ queryKey: ['attendance-checkin-service', serviceId] });
    queryClient.invalidateQueries({ queryKey: ['attendance-service-checkins', serviceId] });
  };

  const showOverlay = (variant, payload) => {
    const checkedOutAt = payload?.checkedOutAt;
    const checkedInAt = payload?.checkedInAt;
    setOverlayState({
      variant,
      member: {
        name: payload?.name || payload?.memberName || payload?.visitorName || 'Guest',
        photoUrl: payload?.photoUrl,
        timeLabel: checkedOutAt
          ? `Checked out at ${new Date(checkedOutAt).toLocaleTimeString()}`
          : checkedInAt
            ? `Checked in at ${new Date(checkedInAt).toLocaleTimeString()}`
            : payload?.message || '',
      },
    });
  };

  const qrMutation = useMutation({
    mutationFn: (qrCode) => {
      if (isCheckInBlocked) {
        throw new Error(`Check-in is not open for ${service.title || 'this service'}.`);
      }

      return attendanceMode === 'check_out'
        ? checkOutByQr(serviceId, { qrCode })
        : checkInByQr(serviceId, { qrCode });
    },
    onSuccess: (data) => {
      invalidateAttendance();
      if (data?.alreadyCheckedIn || data?.alreadyCheckedOut) {
        showOverlay('warning', data);
      } else {
        showOverlay('success', data);
      }
    },
    onError: (error) =>
      showOverlay('error', {
        name: attendanceMode === 'check_out' ? 'Check-out error' : 'Check-in error',
        message: getRequestErrorMessage(error, 'Unable to complete QR attendance action.'),
      }),
  });

  latestQrActionRef.current = (qrCode) => {
    qrMutation.mutate(qrCode);
  };

  const memberMutation = useMutation({
    mutationFn: (memberId) => {
      if (isCheckInBlocked) {
        throw new Error(`Check-in is not open for ${service.title || 'this service'}.`);
      }

      return attendanceMode === 'check_out'
        ? manualMemberCheckOut(serviceId, { memberId })
        : manualMemberCheckIn(serviceId, { memberId });
    },
    onSuccess: (data) => {
      invalidateAttendance();
      showOverlay(data?.alreadyCheckedIn || data?.alreadyCheckedOut ? 'warning' : 'success', data);
    },
    onError: (error) =>
      showOverlay('error', {
        name: attendanceMode === 'check_out' ? 'Check-out error' : 'Check-in error',
        message: getRequestErrorMessage(error, 'Unable to complete manual attendance action.'),
      }),
  });

  const visitorMutation = useMutation({
    mutationFn: (payload) => {
      if (isCheckInBlocked) {
        throw new Error(`Check-in is not open for ${service.title || 'this service'}.`);
      }

      return visitorCheckIn(serviceId, payload);
    },
    onSuccess: (data) => {
      invalidateAttendance();
      setVisitorForm(createVisitorForm());
      showOverlay('success', {
        name: data?.visitorName || data?.name || 'Visitor',
        message: 'Visitor checked in successfully',
      });
    },
    onError: (error) =>
      showOverlay('error', {
        name: 'Visitor check-in error',
        message: getRequestErrorMessage(error, 'Unable to check in visitor.'),
      }),
  });

  const childMutation = useMutation({
    mutationFn: (payload) => {
      if (isCheckInBlocked) {
        throw new Error(`Check-in is not open for ${service.title || 'this service'}.`);
      }

      return childCheckIn(serviceId, payload);
    },
    onSuccess: (data) => {
      invalidateAttendance();
      setChildForm({ childName: '', childAge: 7 });
      setPickupCodeState({
        pickupCode: data?.pickupCode || '0000',
        childName: data?.childName || 'Child',
        parentName: data?.parentName || selectedParent?.firstName || 'Parent',
      });
    },
    onError: (error) =>
      showOverlay('error', {
        name: 'Child check-in error',
        message: getRequestErrorMessage(error, 'Unable to check in child.'),
      }),
  });

  const biometricMutation = useMutation({
    mutationFn: async () => {
      if (isCheckInBlocked) {
        throw new Error(`Check-in is not open for ${service.title || 'this service'}.`);
      }

      const bridgePayload = await identifyFingerprint({
        serviceId,
        serviceTitle: service.title,
      });

      const templateId = extractFingerprintTemplateId(bridgePayload);
      const memberId = extractFingerprintMemberId(bridgePayload);
      const bridgeMessage = extractFingerprintMessage(bridgePayload);
      const deviceMeta = extractFingerprintDeviceMeta(bridgePayload);
      const previewImage = extractFingerprintPreviewImage(bridgePayload);
      const captureStats = extractFingerprintCaptureStats(bridgePayload);

      if (!templateId && !memberId) {
        throw new Error('Scanner bridge did not return a fingerprint match.');
      }

      const data =
        attendanceMode === 'check_out'
          ? await biometricMemberCheckOut(serviceId, {
              ...(templateId ? { templateId } : {}),
              ...(memberId ? { memberId } : {}),
              ...(deviceMeta.provider ? { provider: deviceMeta.provider } : {}),
              ...(deviceMeta.deviceModel ? { deviceModel: deviceMeta.deviceModel } : {}),
              ...(deviceMeta.fingerLabel ? { fingerLabel: deviceMeta.fingerLabel } : {}),
            })
          : await biometricMemberCheckIn(serviceId, {
              ...(templateId ? { templateId } : {}),
              ...(memberId ? { memberId } : {}),
              ...(deviceMeta.provider ? { provider: deviceMeta.provider } : {}),
              ...(deviceMeta.deviceModel ? { deviceModel: deviceMeta.deviceModel } : {}),
              ...(deviceMeta.fingerLabel ? { fingerLabel: deviceMeta.fingerLabel } : {}),
            });

      return {
        ...data,
        templateId,
        bridgeMessage,
        deviceMeta,
        previewImage,
        captureStats,
      };
    },
    onSuccess: (data) => {
      invalidateAttendance();
      setLastBiometricMatch({
        name: data?.memberName || data?.name || 'Matched member',
        templateId: data?.templateId || '',
        bridgeMessage: data?.bridgeMessage || '',
        previewImage: data?.previewImage || '',
        qualityScore: data?.captureStats?.qualityScore || null,
      });
      showOverlay(data?.alreadyCheckedIn || data?.alreadyCheckedOut ? 'warning' : 'success', {
        ...data,
        message: data?.bridgeMessage || data?.message,
      });
    },
    onError: (error) =>
      showOverlay('error', {
        name: attendanceMode === 'check_out' ? 'Fingerprint check-out error' : 'Fingerprint scan error',
        message: getRequestErrorMessage(error, 'Unable to complete biometric attendance action.'),
      }),
  });

  const toggleMutation = useMutation({
    mutationFn: (nextState) => toggleServiceCheckIn(serviceId, nextState),
    onSuccess: () => {
      invalidateAttendance();
    },
  });

  useEffect(() => {
    const stopScanner = async () => {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      scannerStartingRef.current = false;

      if (!scanner) {
        return;
      }

      try {
        if (scanner.isScanning) {
          await scanner.stop();
        } else if (typeof scanner.clear === 'function') {
          await scanner.clear();
        }
      } catch (_) {
        // Ignore scanner shutdown race conditions and allow the next start attempt.
      }
    };

    if (activeTab !== 'qr' || qrMode !== 'camera') {
      stopScanner();
      return undefined;
    }

    let disposed = false;

    const startScanner = async () => {
      if (scannerRef.current || scannerStartingRef.current) {
        return;
      }

      scannerStartingRef.current = true;

      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (disposed) {
          scannerStartingRef.current = false;
          return;
        }

        const scanner = new Html5Qrcode('attendance-qr-reader');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 260 },
          (decodedText) => {
            latestQrActionRef.current?.(decodedText);
          },
          () => {},
        );
        scannerStartingRef.current = false;
      } catch (_) {
        scannerStartingRef.current = false;
        scannerRef.current = null;
        // Keep manual entry available when camera setup is unavailable.
      }
    };

    startScanner();

    return () => {
      disposed = true;
      stopScanner();
    };
  }, [activeTab, qrMode]);

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
      ['Inside', summary.currentlyInside || 0],
      ['Checked Out', summary.checkedOut || 0],
      ['Total', summary.total || 0],
    ],
    [
      summary.checkedOut,
      summary.children,
      summary.currentlyInside,
      summary.members,
      summary.online,
      summary.total,
      summary.visitors,
    ],
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
                <p
                  className={`mt-1 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                    attendanceMode === 'check_out'
                      ? 'border border-amber-400/30 bg-amber-500/15 text-amber-200'
                      : isServiceCheckInOpen
                        ? 'border border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                        : 'border border-rose-400/30 bg-rose-500/15 text-rose-200'
                  }`}
                >
                  <span
                    className={`h-2 w-2 animate-pulse rounded-full ${
                      attendanceMode === 'check_out'
                        ? 'bg-amber-300'
                        : isServiceCheckInOpen
                          ? 'bg-emerald-400'
                          : 'bg-rose-300'
                    }`}
                  />
                  {attendanceMode === 'check_out'
                    ? 'Check-Out Mode'
                    : isServiceCheckInOpen
                      ? 'Check-In Open'
                      : 'Check-In Closed'}
                </p>
              </div>
              {canModifyServices ? (
                isServiceCheckInOpen ? (
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
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => toggleMutation.mutate(true)}
                    disabled={toggleMutation.isPending}
                  >
                    Re-Open Check-in
                  </Button>
                )
              ) : null}
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <main className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6">
            <div className="flex flex-wrap gap-2">
              {attendanceModes.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setAttendanceMode(mode.value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    attendanceMode === mode.value
                      ? mode.value === 'check_out'
                        ? 'bg-amber-400 text-primary'
                        : 'bg-emerald-400 text-primary'
                      : 'border border-white/10 bg-white/5 text-white/70'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
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
              {isCheckInBlocked ? (
                <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-4 text-sm text-rose-100">
                  Check-in is closed for <span className="font-semibold">{service.title || 'this service'}</span>.
                  Switch to check-out mode or re-open check-in before scanning members, visitors, or children.
                </div>
              ) : null}
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
                          placeholder={
                            attendanceMode === 'check_out'
                              ? 'Scanner unavailable? Enter code to check out'
                              : 'Scan unavailable? Enter code manually'
                          }
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

              {activeTab === 'biometric' ? (
                <div className="mx-auto flex h-full w-full max-w-3xl flex-col justify-center space-y-5">
                  <div className="rounded-[28px] border border-white/10 bg-[#081125] p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-accent/25 bg-[#f6efdc] p-5">
                      <div>
                        <p className="text-sm uppercase tracking-[0.22em] text-[#b68c2c]">Fingerprint Scanner</p>
                        <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                          {attendanceMode === 'check_out'
                            ? 'Biometric member check-out'
                            : 'Biometric member check-in'}
                        </h2>
                        <p className="mt-2 max-w-xl text-sm text-slate-700">
                          {attendanceMode === 'check_out'
                            ? 'Scan a saved fingerprint to find the member and mark them out for this service.'
                            : 'Scan a saved fingerprint to match the member profile and register attendance automatically for this service.'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="subtle"
                          className="border-[#d6bf84] bg-white text-slate-800 hover:border-[#c8a64a] hover:bg-white disabled:opacity-100 disabled:text-slate-500"
                          onClick={() => {
                            downloadBiometricBridgeWindowsInstaller();
                            showInfoToast(
                              'Windows installer downloaded. Run it on the scanner PC, then use Start Prynova Fingerprint Bridge.',
                            );
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download Windows Installer
                        </Button>
                        <Button
                          variant="subtle"
                          className="border-[#d6bf84] bg-white text-slate-800 hover:border-[#c8a64a] hover:bg-white disabled:opacity-100 disabled:text-slate-500"
                          onClick={() => biometricBridgeQuery.refetch()}
                          disabled={biometricBridgeQuery.isFetching}
                        >
                          {biometricBridgeQuery.isFetching ? 'Refreshing...' : 'Refresh Bridge'}
                        </Button>
                        <Button
                          variant="secondary"
                          className="min-h-[48px] px-5 disabled:opacity-90 disabled:bg-slate-300 disabled:text-slate-600"
                          onClick={() => biometricMutation.mutate()}
                          disabled={biometricMutation.isPending || isCheckInBlocked}
                        >
                          <Fingerprint className="mr-2 h-4 w-4" />
                          {biometricMutation.isPending
                            ? attendanceMode === 'check_out'
                              ? 'Checking Out...'
                              : 'Scanning Fingerprint...'
                            : attendanceMode === 'check_out'
                              ? 'Scan to Check Out'
                              : 'Scan Fingerprint'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-[28px] border border-white/10 bg-[#081125] p-6">
                      <p className="text-sm uppercase tracking-[0.22em] text-white/45">Bridge Status</p>
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                        <p className="text-lg font-semibold text-white">
                          {biometricBridgeQuery.isLoading
                            ? 'Checking local scanner bridge...'
                            : biometricBridgeQuery.isError
                              ? 'Bridge offline'
                              : 'Bridge online'}
                        </p>
                        <p className="mt-2 text-sm text-white/60">
                          {biometricBridgeQuery.isError
                            ? biometricBridgeQuery.error?.message ||
                              'On a fresh Windows scanner PC, download the installer, run it once, then launch Start Prynova Fingerprint Bridge and refresh the bridge status.'
                            : 'The scanner bridge is reachable and ready to identify fingerprint matches.'}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-[#081125] p-6">
                      <p className="text-sm uppercase tracking-[0.22em] text-white/45">Last Match</p>
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                        {lastBiometricMatch ? (
                          <div className="space-y-2">
                            {lastBiometricMatch.previewImage ? (
                              <img
                                src={lastBiometricMatch.previewImage}
                                alt="Fingerprint preview"
                                className="h-36 w-full rounded-2xl border border-white/10 bg-white object-contain"
                              />
                            ) : null}
                            <p className="text-lg font-semibold text-white">{lastBiometricMatch.name}</p>
                            <p className="text-sm text-white/60">
                              {lastBiometricMatch.templateId
                                ? `Template ID: ${lastBiometricMatch.templateId}`
                                : 'Fingerprint matched without template ID preview.'}
                            </p>
                            {lastBiometricMatch.qualityScore ? (
                              <p className="text-sm text-white/60">
                                Match score: {lastBiometricMatch.qualityScore}
                              </p>
                            ) : null}
                            {lastBiometricMatch.bridgeMessage ? (
                              <p className="text-sm text-accent/80">{lastBiometricMatch.bridgeMessage}</p>
                            ) : null}
                          </div>
                        ) : (
                          <p className="text-sm text-white/60">
                            No fingerprint has been scanned in this session yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === 'visitor' ? (
                <div className="mx-auto max-w-2xl space-y-4">
                  {attendanceMode === 'check_out' ? (
                    <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-4 text-sm text-amber-100">
                      Visitor check-out is not captured from this screen yet. Use the service detail attendance list to check a visitor out.
                    </div>
                  ) : null}
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
                  <Button
                    variant="secondary"
                    className="w-full py-4 text-base"
                    disabled={attendanceMode === 'check_out' || isCheckInBlocked}
                    onClick={() => visitorMutation.mutate(visitorForm)}
                  >
                    Check In Visitor
                  </Button>
                </div>
              ) : null}

              {activeTab === 'child' ? (
                <div className="mx-auto max-w-2xl space-y-4">
                  {attendanceMode === 'check_out' ? (
                    <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-4 text-sm text-amber-100">
                      Child check-out is handled from the service detail attendance list so pickup records stay clear and controlled.
                    </div>
                  ) : null}
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
                    disabled={attendanceMode === 'check_out' || isCheckInBlocked}
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
                <h2 className="mt-2 text-xl font-semibold text-white">Latest attendance activity</h2>
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
                          {item.checkedOutAt
                            ? `Out ${new Date(item.checkedOutAt).toLocaleTimeString()}`
                            : item.checkedInAt
                              ? `In ${new Date(item.checkedInAt).toLocaleTimeString()}`
                              : ''}
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
