import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, ImagePlus, UserRoundCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import AppShell from '../../components/layout/AppShell';
import MemberSearchInput from '../../components/finance/MemberSearchInput';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { getCurrentTenant } from '../../api/endpoints/tenants';
import {
  checkVisitorDuplicateByPhone,
  recordVisitorReturnVisit,
  registerVisitor,
} from '../../api/endpoints/visitors';
import useDebounce from '../../hooks/useDebounce';
import {
  AGE_GROUP_OPTIONS,
  GENDER_OPTIONS,
  HEAR_ABOUT_OPTIONS,
  INTEREST_SUGGESTIONS,
} from '../../utils/visitors';

const getToday = () => new Date().toISOString().slice(0, 10);

export default function RegisterVisitorPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    gender: 'male',
    ageGroup: 'adult',
    heardAboutUs: HEAR_ABOUT_OPTIONS[0].value,
    referredByMember: null,
    branch: '',
    firstVisitDate: getToday(),
    interests: [],
    interestDraft: '',
    prayerRequest: '',
    notes: '',
    photoUrl: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const debouncedPhone = useDebounce(form.phone, 450);

  const tenantQuery = useQuery({
    queryKey: ['visitor-register-tenant'],
    queryFn: getCurrentTenant,
  });

  const duplicateQuery = useQuery({
    queryKey: ['visitor-duplicate-check', debouncedPhone],
    queryFn: () => checkVisitorDuplicateByPhone(debouncedPhone),
    enabled: debouncedPhone.trim().length >= 7,
  });

  const registerMutation = useMutation({
    mutationFn: (payload) => registerVisitor(payload),
    onSuccess: (data) => {
      setSuccess(data);
      setError('');
    },
    onError: (mutationError) => {
      setError(mutationError.message || 'Unable to register visitor right now.');
    },
  });

  const returnVisitMutation = useMutation({
    mutationFn: (visitorId) =>
      recordVisitorReturnVisit(visitorId, {
        date: form.firstVisitDate,
        serviceName: 'Return Visit Service',
        notes: form.notes || 'Return visit registered from fast visitor form.',
      }),
    onSuccess: (visitor) => {
      setSuccess({
        visitor,
        assignedCareLeader: visitor.assignedTo,
      });
      setError('');
    },
  });

  useEffect(() => {
    if (!cameraOpen || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return undefined;
    }

    let active = true;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' } })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        setCameraOpen(false);
      });

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [cameraOpen]);

  useEffect(() => {
    if (tenantQuery.data?.content?.branches?.length && !form.branch) {
      setForm((current) => ({
        ...current,
        branch: tenantQuery.data.content.branches[0],
      }));
    }
  }, [form.branch, tenantQuery.data]);

  const duplicateVisitor = duplicateQuery.data;
  const availableBranches = tenantQuery.data?.content?.branches || [];

  const heardAboutOptions = useMemo(
    () =>
      HEAR_ABOUT_OPTIONS.map((item) => ({
        ...item,
        display: `${item.label}`,
      })),
    [],
  );

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const addInterest = (value) => {
    const nextValue = String(value || '').trim();
    if (!nextValue) {
      return;
    }

    setForm((current) => ({
      ...current,
      interests: [...new Set([...current.interests, nextValue])],
      interestDraft: '',
    }));
  };

  const handleCapture = () => {
    if (!videoRef.current) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 320;
    canvas.height = videoRef.current.videoHeight || 320;
    const context = canvas.getContext('2d');
    context?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    updateField('photoUrl', canvas.toDataURL('image/png'));
    setCameraOpen(false);
  };

  const handlePhotoFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateField('photoUrl', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }

    registerMutation.mutate({
      ...form,
      interests: form.interests,
    });
  };

  if (success?.visitor) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Card className="mx-auto max-w-3xl space-y-5 border-accent/20 bg-[linear-gradient(180deg,#111827_0%,#0d1320_100%)] p-6">
            <div className="flex items-center gap-3 text-accent">
              <UserRoundCheck className="h-8 w-8" />
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-accent/80">Visitor Registered</p>
                <h1 className="text-2xl font-semibold text-white">
                  {success.visitor.fullName || `${success.visitor.firstName} ${success.visitor.lastName}`}
                </h1>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <StatCard label="Visitor ID" value={success.visitor.visitorId} />
              <StatCard label="Pipeline Stage" value="Assimilation pipeline started automatically" />
              <StatCard label="Assigned Care Leader" value={success.assignedCareLeader?.name || 'Pending assignment'} />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setSuccess(null);
                  setForm({
                    firstName: '',
                    lastName: '',
                    phone: '',
                    email: '',
                    gender: 'male',
                    ageGroup: 'adult',
                    heardAboutUs: HEAR_ABOUT_OPTIONS[0].value,
                    referredByMember: null,
                    branch: availableBranches[0] || '',
                    firstVisitDate: getToday(),
                    interests: [],
                    interestDraft: '',
                    prayerRequest: '',
                    notes: '',
                    photoUrl: '',
                  });
                }}
              >
                Register Another
              </Button>
              <Link to={`/visitors/${success.visitor.id}`}>
                <Button variant="ghost">View Profile</Button>
              </Link>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">Visitors</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Register Visitor</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/55">
            Fast single-page registration flow optimized for tablet use at the church entrance.
          </p>
        </div>

        {duplicateVisitor ? (
          <Card className="border-amber-400/20 bg-amber-500/8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-100">A visitor with this phone already exists.</p>
                <p className="mt-1 text-sm text-amber-50/80">
                  {duplicateVisitor.fullName} • {duplicateVisitor.visitorId}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to={`/visitors/${duplicateVisitor.id}`}>
                  <Button variant="ghost">View Existing</Button>
                </Link>
                <Button
                  variant="secondary"
                  onClick={() => returnVisitMutation.mutate(duplicateVisitor.id)}
                  disabled={returnVisitMutation.isPending}
                >
                  {returnVisitMutation.isPending ? 'Recording...' : 'Register as Return Visit'}
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <Card className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="space-y-4">
                <Input
                  label="First Name*"
                  value={form.firstName}
                  onChange={(event) => updateField('firstName', event.target.value)}
                  className="text-base"
                  placeholder="First name"
                />
                <Input
                  label="Last Name*"
                  value={form.lastName}
                  onChange={(event) => updateField('lastName', event.target.value)}
                  className="text-base"
                  placeholder="Last name"
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  className="text-base"
                  placeholder="+233..."
                />
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="optional"
                />

                <div className="space-y-2">
                  <p className="text-sm font-medium text-white/80">Gender</p>
                  <div className="grid grid-cols-2 gap-3">
                    {GENDER_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateField('gender', option.value)}
                        className={`rounded-2xl border px-4 py-4 text-left text-sm font-semibold ${
                          form.gender === option.value
                            ? 'border-accent/40 bg-accent/15 text-accent'
                            : 'border-white/10 bg-white/5 text-white/70'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-white/80">Age Group</p>
                  <div className="grid grid-cols-2 gap-3">
                    {AGE_GROUP_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateField('ageGroup', option.value)}
                        className={`rounded-2xl border px-4 py-4 text-left text-sm font-semibold ${
                          form.ageGroup === option.value
                            ? 'border-accent/40 bg-accent/15 text-accent'
                            : 'border-white/10 bg-white/5 text-white/70'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/80">How did you hear about us?</span>
                  <select
                    value={form.heardAboutUs}
                    onChange={(event) => updateField('heardAboutUs', event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none"
                  >
                    {heardAboutOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.display}
                      </option>
                    ))}
                  </select>
                </label>

                <MemberSearchInput
                  value={form.referredByMember}
                  placeholder="Search member who invited them"
                  onSelect={(value) => updateField('referredByMember', value)}
                  onClear={() => updateField('referredByMember', null)}
                />

                {availableBranches.length ? (
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-white/80">Branch</span>
                    <select
                      value={form.branch}
                      onChange={(event) => updateField('branch', event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none"
                    >
                      {availableBranches.map((branch) => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <Input
                    label="Branch"
                    value={form.branch}
                    onChange={(event) => updateField('branch', event.target.value)}
                    placeholder="Main Branch"
                  />
                )}

                <Input
                  label="First Visit Date"
                  type="date"
                  value={form.firstVisitDate}
                  onChange={(event) => updateField('firstVisitDate', event.target.value)}
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-white/80">Interests</span>
                    <span className="text-xs text-white/40">Press Enter to add</span>
                  </div>
                  <div className="flex gap-3">
                    <input
                      value={form.interestDraft}
                      onChange={(event) => updateField('interestDraft', event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          addInterest(form.interestDraft);
                        }
                      }}
                      placeholder="choir, bible study, youth..."
                      className="w-full rounded-xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                    />
                    <Button type="button" variant="secondary" onClick={() => addInterest(form.interestDraft)}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.interests.map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() =>
                          updateField(
                            'interests',
                            form.interests.filter((item) => item !== interest),
                          )
                        }
                        className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-sm text-accent"
                      >
                        {interest} x
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => addInterest(suggestion)}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/65"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/80">Prayer Request</span>
                  <textarea
                    rows={3}
                    value={form.prayerRequest}
                    onChange={(event) => updateField('prayerRequest', event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/80">Notes</span>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(event) => updateField('notes', event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none"
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-6 border-t border-white/8 pt-5 lg:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-center gap-3">
                {form.photoUrl ? (
                  <img src={form.photoUrl} alt="Visitor preview" className="h-28 w-28 rounded-full object-cover" />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border border-dashed border-white/10 bg-white/5 text-sm text-white/40">
                    No photo
                  </div>
                )}
                <div className="flex flex-wrap justify-center gap-2">
                  <Button type="button" variant="subtle" onClick={() => setCameraOpen((current) => !current)}>
                    <Camera className="mr-2 h-4 w-4" />
                    Take Photo
                  </Button>
                  <label className="inline-flex cursor-pointer items-center rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.08]">
                    <ImagePlus className="mr-2 h-4 w-4" />
                    Upload
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoFile} />
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                {cameraOpen ? (
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-[#101827] p-4">
                    <video ref={videoRef} autoPlay playsInline muted className="max-h-[280px] w-full rounded-2xl object-cover" />
                    <div className="flex gap-3">
                      <Button type="button" variant="secondary" onClick={handleCapture}>
                        Capture
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setCameraOpen(false)}>
                        Close Camera
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-6 text-sm text-white/45">
                    Optional photo capture using browser camera or file upload.
                  </div>
                )}

                {error ? <p className="text-sm text-rose-300">{error}</p> : null}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="secondary"
                    className="min-w-[220px] py-3 text-base"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? 'Registering...' : 'Register Visitor'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/45">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
