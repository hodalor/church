import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Fingerprint, Search, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getFamilyGroup,
  getMemberById,
  getMemberQrCode,
  recalculateHealthScore,
  restoreMember,
  searchMembers,
  softDeleteMember,
  updateMember,
  updateMemberPhoto,
} from '../../api/endpoints/members';
import { getAllAppointments, getMemberCases, getMemberDiscipleship } from '../../api/endpoints/pastoral';
import { getCurrentTenant, getTenantById } from '../../api/endpoints/tenants';
import AppShell from '../../components/layout/AppShell';
import SuperAdminShell from '../../components/layout/SuperAdminShell';
import AppointmentStatusBadge from '../../components/pastoral/AppointmentStatusBadge';
import CaseStatusBadge from '../../components/pastoral/CaseStatusBadge';
import DiscipleshipProgressRing from '../../components/pastoral/DiscipleshipProgressRing';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ConfirmModal from '../../components/ui/ConfirmModal';
import GroupingPathSelector from '../../components/ui/GroupingPathSelector';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import useBranchOptions from '../../hooks/useBranchOptions';
import useMinistryOptions from '../../hooks/useMinistryOptions';
import { useCapabilities } from '../../hooks/useCapabilities';
import { supabaseUpload, DEFAULT_SUPABASE_BUCKET } from '../../utils/supabaseUpload';
import {
  enrollFingerprint,
  extractFingerprintDeviceMeta,
  extractFingerprintMessage,
  extractFingerprintTemplateId,
  getBiometricBridgeStatus,
} from '../../utils/biometricBridge';
import { formatDate } from '../../utils/formatDate';
import { buildGroupingPathLabels, sanitizeGroupingPath } from '../../utils/groupings';
import { formatPastoralLabel } from '../../utils/pastoral';
import { showErrorToast, showInfoToast, showSuccessToast } from '../../utils/toast';

const membershipOptions = ['visitor', 'new_convert', 'member', 'worker', 'leader', 'clergy'];
const genderOptions = ['male', 'female', 'other'];
const personCategoryOptions = ['adult', 'child'];
const maritalStatusOptions = ['single', 'married', 'divorced', 'widowed'];
const baptismOptions = ['not_baptised', 'water', 'holy_spirit', 'both'];
const biometricStatusOptions = ['not_enrolled', 'pending_capture', 'enrolled', 'disabled'];
const fingerOptions = [
  'right-thumb',
  'right-index',
  'left-thumb',
  'left-index',
  'right-middle',
  'left-middle',
];
const RELATIONSHIP_OPTIONS = [
  'spouse',
  'wife',
  'husband',
  'parent',
  'mother',
  'father',
  'child',
  'son',
  'daughter',
  'sibling',
  'brother',
  'sister',
  'grandparent',
  'grandchild',
  'aunt',
  'uncle',
  'niece',
  'nephew',
  'cousin',
  'in-law',
  'mother-in-law',
  'father-in-law',
  'son-in-law',
  'daughter-in-law',
  'brother-in-law',
  'sister-in-law',
  'guardian',
  'ward',
  'other',
];

export default function MemberDetailPage() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const { hasCapability } = useCapabilities();
  const isSuperAdmin = role === 'super_admin';
  const Shell = isSuperAdmin ? SuperAdminShell : AppShell;
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const photoInputRef = useRef(null);
  const [activeFamilySearch, setActiveFamilySearch] = useState({ index: -1, value: '' });
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    otherName: '',
    email: '',
    phone: '',
    altPhone: '',
    gender: '',
    personCategory: 'adult',
    dateOfBirth: '',
    membershipStatus: 'member',
    membershipDate: '',
    baptismStatus: 'not_baptised',
    baptismDate: '',
    maritalStatus: '',
    branch: '',
    department: '',
    ministry: '',
    groupingIds: [],
    cell_group: '',
    occupation: '',
    employer: '',
    familyGroupId: '',
    spouseMemberId: '',
    address: '',
    city: '',
    country: '',
    photoUrl: '',
    biometrics: {
      enabled: false,
      modality: 'fingerprint',
      provider: 'ZKTeco',
      deviceModel: '',
      templateId: '',
      fingerLabel: 'right-thumb',
      status: 'not_enrolled',
      enrolledAt: '',
      notes: '',
    },
    tags: '',
    notes: '',
    familyRelationships: [],
  });

  const memberQuery = useQuery({
    queryKey: ['member-detail', memberId],
    queryFn: () => getMemberById(memberId),
  });

  const qrCodeQuery = useQuery({
    queryKey: ['member-qr-code', memberId],
    queryFn: () => getMemberQrCode(memberId),
    enabled: showQrModal,
  });

  const targetTenantId = isSuperAdmin ? memberQuery.data?.tenantId : null;
  const tenantSettingsQuery = useQuery({
    queryKey: ['member-detail-tenant-settings', targetTenantId],
    queryFn: () => (isSuperAdmin ? getTenantById(targetTenantId) : getCurrentTenant()),
    enabled: !isSuperAdmin || Boolean(targetTenantId),
  });

  const familyGroupId = memberQuery.data?.familyGroupId;
  const familyQuery = useQuery({
    queryKey: ['member-family-group', familyGroupId],
    queryFn: () => getFamilyGroup(familyGroupId),
    enabled: Boolean(familyGroupId),
  });
  const familySearchQuery = useQuery({
    queryKey: ['member-family-search-edit', memberId, activeFamilySearch.value],
    queryFn: () => searchMembers({ search: activeFamilySearch.value, limit: 10 }),
    enabled: Boolean(activeFamilySearch.value && activeFamilySearch.index >= 0) && activeFamilySearch.value.length >= 2,
  });

  const filteredFamilyMembers = useMemo(() => {
    const raw = familySearchQuery.data?.members || [];
    const term = (activeFamilySearch.value || '').trim().toLowerCase();
    if (!term) return raw;
    return raw.filter((m) => {
      const fullName = [m.firstName, m.otherName, m.lastName].filter(Boolean).join(' ').toLowerCase();
      const idMatch = (m.memberId || '').toLowerCase().includes(term);
      const nameMatch = fullName.includes(term);
      const phoneMatch = String(m.phone || '').toLowerCase().includes(term);
      const emailMatch = String(m.email || '').toLowerCase().includes(term);
      return idMatch || nameMatch || phoneMatch || emailMatch;
    });
  }, [activeFamilySearch.value, familySearchQuery.data?.members]);

  const updateFamilyRelationship = (index, patch) => {
    setForm((current) => ({
      ...current,
      familyRelationships: current.familyRelationships.map((item, idx) =>
        idx === index ? { ...item, ...patch } : item,
      ),
    }));
  };

  const removeFamilyRelationship = (index) => {
    setForm((current) => ({
      ...current,
      familyRelationships: current.familyRelationships.filter((_, idx) => idx !== index),
    }));
  };

  const addFamilyRelationship = () => {
    setForm((current) => ({
      ...current,
      familyRelationships: [
        ...(current.familyRelationships || []),
        { memberId: '', relationship: '', search: '' },
      ],
    }));
  };
  const canViewPastoralActivity = role !== 'member' && (isSuperAdmin || hasCapability('pastoral.view'));
  const pastoralCasesQuery = useQuery({
    queryKey: ['member-pastoral-cases', memberId],
    queryFn: () => getMemberCases(memberId),
    enabled: canViewPastoralActivity,
  });
  const pastoralAppointmentsQuery = useQuery({
    queryKey: ['member-pastoral-appointments', memberId],
    queryFn: () => getAllAppointments({ memberId, limit: 100 }),
    enabled: canViewPastoralActivity,
  });
  const discipleshipQuery = useQuery({
    queryKey: ['member-pastoral-discipleship', memberId],
    queryFn: () => getMemberDiscipleship(memberId),
    enabled: canViewPastoralActivity,
  });

  useEffect(() => {
    const member = memberQuery.data;
    if (!member) {
      return;
    }

    setForm({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      otherName: member.otherName || '',
      email: member.email || '',
      phone: member.phone || '',
      altPhone: member.altPhone || '',
      gender: member.gender || '',
      personCategory: member.personCategory || 'adult',
      dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().slice(0, 10) : '',
      membershipStatus: member.membershipStatus || 'member',
      membershipDate: member.membershipDate ? new Date(member.membershipDate).toISOString().slice(0, 10) : '',
      baptismStatus: member.baptismStatus || 'not_baptised',
      baptismDate: member.baptismDate ? new Date(member.baptismDate).toISOString().slice(0, 10) : '',
      maritalStatus: member.maritalStatus || '',
      branch: member.branch || '',
      department: Array.isArray(member.department) ? member.department.join(', ') : '',
      ministry: member.ministry || '',
      groupingIds: Array.isArray(member.groupingIds) ? member.groupingIds : [],
      cell_group: member.cell_group || '',
      occupation: member.occupation || '',
      employer: member.employer || '',
      familyGroupId: member.familyGroupId || '',
      spouseMemberId: member.spouseMemberId || '',
      address: member.address || '',
      city: member.city || '',
      country: member.country || '',
      photoUrl: member.photoUrl || '',
      biometrics: {
        enabled: Boolean(member.biometrics?.enabled),
        modality: member.biometrics?.modality || 'fingerprint',
        provider: member.biometrics?.provider || 'ZKTeco',
        deviceModel: member.biometrics?.deviceModel || '',
        templateId: member.biometrics?.templateId || '',
        fingerLabel: member.biometrics?.fingerLabel || 'right-thumb',
        status: member.biometrics?.status || 'not_enrolled',
        enrolledAt: member.biometrics?.enrolledAt
          ? new Date(member.biometrics.enrolledAt).toISOString().slice(0, 10)
          : '',
        notes: member.biometrics?.notes || '',
      },
      tags: Array.isArray(member.tags) ? member.tags.join(', ') : '',
      notes: member.notes || '',
      familyRelationships: Array.isArray(member.linkedFamilyMembers)
        ? member.linkedFamilyMembers
            .filter((item) => item?.memberId && item?.relatedMember?.name)
            .map((item) => ({
              memberId: item.memberId,
              relationship: item.relationship || '',
              search: item.relatedMember?.name || '',
            }))
        : Array.isArray(member.familyRelationships)
          ? member.familyRelationships
              .filter((item) => item?.memberId)
              .map((item) => ({
                memberId: item.memberId,
                relationship: item.relationship || '',
                search: item.memberId,
              }))
          : [],
    });
  }, [memberQuery.data]);

  const refreshMemberQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['member-detail', memberId] });
    queryClient.invalidateQueries({ queryKey: ['members'] });
    queryClient.invalidateQueries({ queryKey: ['member-stats'] });
  };

  const updateMutation = useMutation({
    mutationFn: (payload) => updateMember(memberId, payload),
    onSuccess: () => {
      setIsEditing(false);
      refreshMemberQueries();
    },
  });

  const recalculateMutation = useMutation({
    mutationFn: () => recalculateHealthScore(memberId),
    onSuccess: refreshMemberQueries,
  });

  const deleteMutation = useMutation({
    mutationFn: () => softDeleteMember(memberId),
    onSuccess: () => {
      setShowDeleteModal(false);
      navigate(isSuperAdmin ? '/superadmin/members' : '/members');
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => restoreMember(memberId),
    onSuccess: refreshMemberQueries,
  });
  const photoMutation = useMutation({
    mutationFn: async (file) => {
      const extension = file.name.split('.').pop();
      const url = await supabaseUpload(
        file,
        DEFAULT_SUPABASE_BUCKET,
        `images/members/${memberId}-${Date.now()}.${extension}`,
      );
      return updateMemberPhoto(memberId, url);
    },
    onSuccess: refreshMemberQueries,
  });

  const canViewMembers = isSuperAdmin || hasCapability('members.view');
  const canModifyMembers = isSuperAdmin || hasCapability('members.modify');
  const canDeleteMembers = isSuperAdmin || hasCapability('members.delete');
  const bridgeStatusQuery = useQuery({
    queryKey: ['biometric-bridge-status', memberId],
    queryFn: () => getBiometricBridgeStatus(),
    enabled: isEditing && canModifyMembers,
    retry: false,
    staleTime: 15000,
  });

  const biometricEnrollMutation = useMutation({
    mutationFn: async () => {
      if (!member?.memberId) {
        throw new Error('Member profile is not ready for fingerprint capture yet.');
      }

      if (!form.biometrics?.enabled) {
        throw new Error('Enable fingerprint sign-in first, then capture the member fingerprint.');
      }

      const bridgePayload = await enrollFingerprint({
        memberId: member.memberId,
        memberName: [member.firstName, member.otherName, member.lastName].filter(Boolean).join(' '),
        fingerLabel: form.biometrics?.fingerLabel || 'right-thumb',
        provider: form.biometrics?.provider || 'ZKTeco',
        deviceModel: form.biometrics?.deviceModel || undefined,
      });

      const templateId = extractFingerprintTemplateId(bridgePayload);
      if (!templateId) {
        throw new Error('Scanner bridge did not return a fingerprint template ID.');
      }

      const deviceMeta = extractFingerprintDeviceMeta(bridgePayload);
      const bridgeMessage = extractFingerprintMessage(bridgePayload);
      const enrolledAt = new Date().toISOString().slice(0, 10);
      const nextBiometrics = {
        ...(form.biometrics || {}),
        enabled: true,
        modality: 'fingerprint',
        status: 'enrolled',
        templateId,
        enrolledAt,
        provider: deviceMeta.provider || form.biometrics?.provider || 'ZKTeco',
        deviceModel: deviceMeta.deviceModel || form.biometrics?.deviceModel || '',
        fingerLabel: deviceMeta.fingerLabel || form.biometrics?.fingerLabel || 'right-thumb',
        notes: form.biometrics?.notes || bridgeMessage || '',
      };

      await updateMember(memberId, {
        biometrics: nextBiometrics,
      });

      return {
        templateId,
        bridgeMessage,
        biometrics: nextBiometrics,
      };
    },
    onSuccess: ({ templateId, bridgeMessage, biometrics }) => {
      setForm((current) => ({
        ...current,
        biometrics,
      }));
      refreshMemberQueries();
      showSuccessToast(`Fingerprint enrolled successfully${templateId ? ` (${templateId})` : ''}.`);
      if (bridgeMessage) {
        showInfoToast(bridgeMessage);
      }
    },
    onError: (error) => {
      showErrorToast(error?.response?.data?.message || error.message || 'Unable to capture fingerprint.');
    },
  });

  const member = memberQuery.data;
  const biometricCaptureDisabledReason = !form.biometrics?.enabled
    ? 'Set Fingerprint Enabled to Yes first.'
    : bridgeStatusQuery.isLoading || bridgeStatusQuery.isFetching
      ? 'Checking the local fingerprint bridge...'
      : bridgeStatusQuery.isError
        ? 'Start the local ZKT bridge service, then refresh bridge status.'
        : '';
  const isBiometricCaptureDisabled =
    biometricEnrollMutation.isPending ||
    !form.biometrics?.enabled ||
    bridgeStatusQuery.isLoading ||
    bridgeStatusQuery.isFetching ||
    bridgeStatusQuery.isError;
  const pastoralCases = pastoralCasesQuery.data || [];
  const pastoralAppointments = pastoralAppointmentsQuery.data?.items || [];
  const upcomingAppointments = pastoralAppointments.filter(
    (appointment) => new Date(appointment.scheduledAt) >= new Date(),
  );
  const pastAppointments = pastoralAppointments.filter((appointment) => new Date(appointment.scheduledAt) < new Date());
  const activeEnrollments = (discipleshipQuery.data || []).filter((item) => item.status !== 'completed');
  const completedTracks = (discipleshipQuery.data || []).filter((item) => item.status === 'completed');
  const groupingOptions = useMemo(
    () => tenantSettingsQuery.data?.content?.groupings || [],
    [tenantSettingsQuery.data?.content?.groupings],
  );
  const departmentOptions = useMemo(
    () => tenantSettingsQuery.data?.content?.departments || [],
    [tenantSettingsQuery.data?.content?.departments],
  );
  const groupingPathLabels = useMemo(
    () => buildGroupingPathLabels(groupingOptions, member?.groupingIds || []),
    [groupingOptions, member?.groupingIds],
  );
  const exportFilename = useMemo(() => `${memberId}-member-export.json`, [memberId]);
  const { branchOptions, isLoading: isBranchesLoading, selectPlaceholder: branchSelectPlaceholder } = useBranchOptions({
    tenantId: targetTenantId,
    enabled: !isSuperAdmin || Boolean(targetTenantId),
    includeCurrent: form.branch,
  });
  const { ministryOptions, isLoading: isMinistriesLoading, selectPlaceholder: ministrySelectPlaceholder } = useMinistryOptions({
    tenantId: targetTenantId,
    enabled: !isSuperAdmin || Boolean(targetTenantId),
    includeCurrent: form.ministry,
  });

  if (!canViewMembers) {
    return (
      <Shell>
        <Card>
          <p className="text-sm uppercase tracking-[0.25em] text-accent">Members</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Your account does not have permission to open member profiles.
          </p>
        </Card>
      </Shell>
    );
  }

  const handleSave = () => {
    updateMutation.mutate({
      ...form,
      department: form.department
        ? form.department.split(',').map((item) => item.trim()).filter(Boolean)
        : [],
      groupingIds: sanitizeGroupingPath(groupingOptions, form.groupingIds),
      tags: form.tags ? form.tags.split(',').map((item) => item.trim()).filter(Boolean) : [],
      familyRelationships: Array.isArray(form.familyRelationships)
        ? form.familyRelationships
            .filter((item) => item?.memberId && item?.relationship)
            .map(({ memberId, relationship }) => ({ memberId, relationship }))
        : [],
    });
  };

  const handlePhotoSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    photoMutation.mutate(file);
    event.target.value = '';
  };

  const handleExport = async () => {
    const blob = new Blob([JSON.stringify(member ? [member] : [], null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportFilename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Shell>
      <div className="space-y-6">
        <PageHeader
          title={member ? `${member.firstName} ${member.lastName}` : 'Member Detail'}
          subtitle="Review a member profile, church status, family links, QR identity, and profile health."
          action={
            <div className="flex flex-wrap gap-3">
              <Link to={isSuperAdmin ? '/superadmin/members' : '/members'}>
                <Button variant="ghost">Back to Members</Button>
              </Link>
              <Button variant="subtle" onClick={handleExport}>
                Export Member
              </Button>
              <Button variant="subtle" onClick={() => setShowQrModal(true)}>
                View QR
              </Button>
              {canModifyMembers ? (
                <Button variant={isEditing ? 'ghost' : 'secondary'} onClick={() => setIsEditing((current) => !current)}>
                  {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                </Button>
              ) : null}
            </div>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="space-y-6">
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-white/5">
                {member?.photoUrl ? (
                  <img src={member.photoUrl} alt={member.firstName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-semibold text-accent">
                    {member?.firstName?.slice(0, 1)?.toUpperCase() || 'M'}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold text-white">
                    {[member?.firstName, member?.otherName, member?.lastName].filter(Boolean).join(' ')}
                  </h2>
                  <Badge tone={member?.isDeleted ? 'primary' : 'success'}>
                    {member?.isDeleted ? 'Archived' : member?.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-sm uppercase tracking-[0.25em] text-white/45">{member?.memberId}</p>
                <p className="text-sm text-white/55">{member?.branch || 'Main branch'}</p>
                {canModifyMembers ? (
                  <div>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.ico,.tif,.tiff,.heic,.heif,.avif,.svg"
                      onChange={handlePhotoSelected}
                      className="hidden"
                    />
                    <Button
                      variant="subtle"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={photoMutation.isPending}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      {photoMutation.isPending ? 'Uploading Photo...' : 'Update Photo'}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>

            {isEditing ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="First Name" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} />
                <Input label="Last Name" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} />
                <Input label="Other Name" value={form.otherName} onChange={(event) => setForm((current) => ({ ...current, otherName: event.target.value }))} />
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/80">Gender</span>
                  <select
                    value={form.gender}
                    onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  >
                    <option value="">Select gender</option>
                    {genderOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/80">Person Category</span>
                  <select
                    value={form.personCategory}
                    onChange={(event) => setForm((current) => ({ ...current, personCategory: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  >
                    {personCategoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <Input label="Email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
                <Input label="Phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
                <Input label="Alt Phone" value={form.altPhone} onChange={(event) => setForm((current) => ({ ...current, altPhone: event.target.value }))} />
                <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(event) => setForm((current) => ({ ...current, dateOfBirth: event.target.value }))} />
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/80">Membership Status</span>
                  <select
                    value={form.membershipStatus}
                    onChange={(event) => setForm((current) => ({ ...current, membershipStatus: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  >
                    {membershipOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <Input label="Membership Date" type="date" value={form.membershipDate} onChange={(event) => setForm((current) => ({ ...current, membershipDate: event.target.value }))} />
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/80">Baptism Status</span>
                  <select
                    value={form.baptismStatus}
                    onChange={(event) => setForm((current) => ({ ...current, baptismStatus: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  >
                    {baptismOptions.map((option) => (
                      <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>
                    ))}
                  </select>
                </label>
                <Input label="Baptism Date" type="date" value={form.baptismDate} onChange={(event) => setForm((current) => ({ ...current, baptismDate: event.target.value }))} />
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/80">Marital Status</span>
                  <select
                    value={form.maritalStatus}
                    onChange={(event) => setForm((current) => ({ ...current, maritalStatus: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  >
                    <option value="">Select status</option>
                    {maritalStatusOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/80">Branch</span>
                  <select
                    value={form.branch}
                    onChange={(event) => setForm((current) => ({ ...current, branch: event.target.value }))}
                    disabled={isBranchesLoading || !branchOptions.length}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  >
                    <option value="">{branchSelectPlaceholder}</option>
                    {branchOptions.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-[#1E2A4A]">Department</span>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    {!departmentOptions.length ? (
                      <p className="text-sm text-slate-500">No departments configured yet</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {departmentOptions.map((department) => {
                          const selected = (form.department || '')
                            .split(',')
                            .map((item) => item.trim())
                            .filter(Boolean)
                            .includes(department);
                          return (
                            <button
                              key={department}
                              type="button"
                              onClick={() =>
                                setForm((current) => {
                                  const existing = (current.department || '')
                                    .split(',')
                                    .map((item) => item.trim())
                                    .filter(Boolean);
                                  const next = selected
                                    ? existing.filter((item) => item !== department)
                                    : [...existing, department];
                                  return { ...current, department: next.join(', ') };
                                })
                              }
                              className={
                                selected
                                  ? 'rounded-full border border-transparent bg-accent px-3 py-1.5 text-xs font-semibold text-[#0b1220] shadow-sm transition hover:brightness-105'
                                  : 'rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100'
                              }
                            >
                              {department}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Tap to toggle. Selected departments are saved with this member profile.
                  </p>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/80">Ministry</span>
                  <select
                    value={form.ministry}
                    onChange={(event) => setForm((current) => ({ ...current, ministry: event.target.value }))}
                    disabled={isMinistriesLoading || !ministryOptions.length}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  >
                    <option value="">{ministrySelectPlaceholder}</option>
                    {ministryOptions.map((ministry) => (
                      <option key={ministry} value={ministry}>
                        {ministry}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="md:col-span-2">
                  <GroupingPathSelector
                    groupings={groupingOptions}
                    value={form.groupingIds}
                    onChange={(nextPath) => setForm((current) => ({ ...current, groupingIds: nextPath }))}
                    hint="Select each grouping level in order based on this church's structure."
                    variant="light"
                  />
                </div>
                <Input label="Cell Group" value={form.cell_group} onChange={(event) => setForm((current) => ({ ...current, cell_group: event.target.value }))} />
                <Input label="Occupation" value={form.occupation} onChange={(event) => setForm((current) => ({ ...current, occupation: event.target.value }))} />
                <Input label="Employer" value={form.employer} onChange={(event) => setForm((current) => ({ ...current, employer: event.target.value }))} />
                <Input label="Family Group ID" value={form.familyGroupId} onChange={(event) => setForm((current) => ({ ...current, familyGroupId: event.target.value }))} />
                <Input label="Spouse Member ID" value={form.spouseMemberId} onChange={(event) => setForm((current) => ({ ...current, spouseMemberId: event.target.value }))} />
                <Input label="Address" value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
                <Input label="City" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
                <Input label="Country" value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} />
                <Input label="Photo URL" value={form.photoUrl} onChange={(event) => setForm((current) => ({ ...current, photoUrl: event.target.value }))} />
                <Input label="Tags" value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} />
                <label className="block space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-white/80">Notes</span>
                  <textarea
                    rows={4}
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  />
                </label>
                <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 md:col-span-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-white/55">Biometric Sign-In</p>
                    <p className="mt-2 text-sm text-white/65">
                      Keep the fingerprint enrollment status on the member profile. Use the template ID saved from the ZKT scanner bridge once capture is complete.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-accent/80">Scanner Bridge</p>
                      <p className="mt-1 text-sm text-white/80">
                        {bridgeStatusQuery.isLoading
                          ? 'Checking local fingerprint bridge...'
                          : bridgeStatusQuery.isError
                            ? 'Bridge offline. Start the local ZKT bridge service, then refresh status.'
                            : 'Bridge online and ready for enrollment.'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => bridgeStatusQuery.refetch()}
                        disabled={bridgeStatusQuery.isFetching}
                      >
                        {bridgeStatusQuery.isFetching ? 'Refreshing...' : 'Refresh Bridge'}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => biometricEnrollMutation.mutate()}
                        disabled={isBiometricCaptureDisabled}
                        title={biometricCaptureDisabledReason || 'Capture member fingerprint'}
                      >
                        <Fingerprint className="mr-2 h-4 w-4" />
                        {biometricEnrollMutation.isPending ? 'Capturing...' : 'Capture Fingerprint'}
                      </Button>
                    </div>
                  </div>
                  {biometricCaptureDisabledReason ? (
                    <p className="text-sm text-amber-200">{biometricCaptureDisabledReason}</p>
                  ) : (
                    <p className="text-sm text-emerald-200">
                      Fingerprint capture is ready. Ask the member to place their finger on the scanner.
                    </p>
                  )}
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-white/80">Fingerprint Enabled</span>
                      <select
                        value={form.biometrics?.enabled ? 'yes' : 'no'}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            biometrics: {
                              ...(current.biometrics || {}),
                              enabled: event.target.value === 'yes',
                              status:
                                event.target.value === 'yes'
                                  ? current.biometrics?.status || 'pending_capture'
                                  : 'disabled',
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-white/80">Enrollment Status</span>
                      <select
                        value={form.biometrics?.status || 'not_enrolled'}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            biometrics: {
                              ...(current.biometrics || {}),
                              status: event.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                      >
                        {biometricStatusOptions.map((option) => (
                          <option key={option} value={option}>
                            {option.replaceAll('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Input
                      label="Scanner Provider"
                      value={form.biometrics?.provider || ''}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          biometrics: {
                            ...(current.biometrics || {}),
                            provider: event.target.value,
                          },
                        }))
                      }
                    />
                    <Input
                      label="Scanner Model"
                      value={form.biometrics?.deviceModel || ''}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          biometrics: {
                            ...(current.biometrics || {}),
                            deviceModel: event.target.value,
                          },
                        }))
                      }
                    />
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-white/80">Preferred Finger</span>
                      <select
                        value={form.biometrics?.fingerLabel || 'right-thumb'}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            biometrics: {
                              ...(current.biometrics || {}),
                              fingerLabel: event.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                      >
                        {fingerOptions.map((option) => (
                          <option key={option} value={option}>
                            {option.replaceAll('-', ' ')}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Input
                      label="Template ID"
                      value={form.biometrics?.templateId || ''}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          biometrics: {
                            ...(current.biometrics || {}),
                            templateId: event.target.value,
                          },
                        }))
                      }
                    />
                    <Input
                      label="Enrollment Date"
                      type="date"
                      value={form.biometrics?.enrolledAt || ''}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          biometrics: {
                            ...(current.biometrics || {}),
                            enrolledAt: event.target.value,
                          },
                        }))
                      }
                    />
                    <label className="block space-y-2 md:col-span-2">
                      <span className="text-sm font-medium text-white/80">Biometric Notes</span>
                      <textarea
                        rows={3}
                        value={form.biometrics?.notes || ''}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            biometrics: {
                              ...(current.biometrics || {}),
                              notes: event.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                      />
                    </label>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Button variant="secondary" onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <Detail label="Email" value={member?.email} />
                <Detail label="Phone" value={member?.phone} />
                <Detail label="Alt Phone" value={member?.altPhone} />
                <Detail label="Gender" value={member?.gender} />
                <Detail label="Person Category" value={member?.personCategory} />
                <Detail label="Date of Birth" value={member?.dateOfBirth ? formatDate(member.dateOfBirth) : '—'} />
                <Detail label="Membership Status" value={member?.membershipStatus} />
                <Detail label="Membership Date" value={member?.membershipDate ? formatDate(member.membershipDate) : '—'} />
                <Detail label="Baptism Status" value={member?.baptismStatus?.replaceAll('_', ' ')} />
                <Detail label="Baptism Date" value={member?.baptismDate ? formatDate(member.baptismDate) : '—'} />
                <Detail label="Marital Status" value={member?.maritalStatus} />
                <Detail label="Department" value={member?.department?.join(', ') || '—'} />
                <Detail label="Ministry" value={member?.ministry} />
                <Detail
                  label="Groupings"
                  value={groupingPathLabels.length ? groupingPathLabels.join(' > ') : member?.groupingIds?.join(', ') || '—'}
                />
                <Detail label="Cell Group" value={member?.cell_group} />
                <Detail label="Occupation" value={member?.occupation} />
                <Detail label="Employer" value={member?.employer} />
                <Detail label="Family Group ID" value={member?.familyGroupId} />
                <Detail label="Spouse Member ID" value={member?.spouseMemberId} />
                <Detail label="Address" value={member?.address} />
                <Detail label="City" value={member?.city} />
                <Detail label="Country" value={member?.country} />
                <Detail
                  label="Biometric Status"
                  value={
                    member?.biometrics?.enabled
                      ? `${member.biometrics?.status || 'pending capture'}${member.biometrics?.templateId ? ` · ${member.biometrics.templateId}` : ''}`
                      : 'Disabled'
                  }
                />
                <Detail
                  label="Fingerprint Device"
                  value={
                    [member?.biometrics?.provider, member?.biometrics?.deviceModel]
                      .filter(Boolean)
                      .join(' · ') || '—'
                  }
                />
                <Detail label="Created By" value={member?.createdByName || member?.createdBy} />
                <Detail label="Updated By" value={member?.updatedByName || member?.updatedBy} />
                <Detail label="Created At" value={member?.createdAt ? formatDate(member.createdAt) : '—'} />
                <Detail label="Updated At" value={member?.updatedAt ? formatDate(member.updatedAt) : '—'} />
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 md:col-span-2">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">Notes</p>
                  <p className="mt-2 text-base text-white/80">{member?.notes || 'No notes recorded'}</p>
                </div>
              </div>
            )}
          </Card>

          <div className="space-y-6">
            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-accent">Health</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Engagement score</h3>
                </div>
                <p className="text-3xl font-semibold text-white">{member?.healthScore?.overall ?? 0}/100</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Detail label="Status" value={member?.healthScore?.status} />
                <Detail label="Last Calculated" value={member?.healthScore?.lastCalculated ? formatDate(member.healthScore.lastCalculated) : '—'} />
                <Detail label="Attendance" value={member?.healthScore?.attendance ?? 0} />
                <Detail label="Giving" value={member?.healthScore?.giving ?? 0} />
                <Detail label="Participation" value={member?.healthScore?.participation ?? 0} />
                <Detail label="Involvement" value={member?.healthScore?.involvement ?? 0} />
              </div>
              {canModifyMembers ? (
                <Button variant="secondary" onClick={() => recalculateMutation.mutate()} disabled={recalculateMutation.isPending}>
                  {recalculateMutation.isPending ? 'Recalculating...' : 'Recalculate Health Score'}
                </Button>
              ) : null}
            </Card>

            <Card className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-accent">Family</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    Related members
                  </h3>
                </div>
                {isEditing ? (
                  <Button type="button" variant="secondary" onClick={addFamilyRelationship}>
                    + Add relative
                  </Button>
                ) : null}
              </div>
              {isEditing ? (
                <div className="space-y-4">
                  {!form.familyRelationships?.length ? (
                    <p className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-sm text-white/55">
                      No relatives linked yet. Tap "Add relative" to begin.
                    </p>
                  ) : null}
                  {form.familyRelationships?.map((item, index) => (
                    <div
                      key={`${item.memberId || 'new'}-${index}`}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
                          Relative {index + 1}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeFamilyRelationship(index)}
                          className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-xs font-medium text-white/70 transition hover:bg-white/10"
                        >
                          <X size={12} /> Remove
                        </button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="relative">
                          <label className="mb-2 block text-sm font-medium text-white/80">
                            Search member
                          </label>
                          <div className="relative">
                            <Search
                              size={15}
                              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/45"
                            />
                            <input
                              value={activeFamilySearch.index === index ? activeFamilySearch.value : item.search}
                              onFocus={() =>
                                setActiveFamilySearch({ index, value: item.search || '' })
                              }
                              onChange={(event) =>
                                setActiveFamilySearch({ index, value: event.target.value })
                              }
                              placeholder="Type name, member ID, or phone"
                              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/35 focus:border-accent focus:outline-none"
                            />
                          </div>
                          {activeFamilySearch.index === index ? (
                            filteredFamilyMembers.length ? (
                              <div
                                className="mt-2 rounded-2xl border border-white/10 p-2 shadow-xl"
                                style={{ backgroundColor: '#0b1220' }}
                              >
                                {filteredFamilyMembers.map((searchResult) => (
                                  <button
                                    key={searchResult.memberId}
                                    type="button"
                                    onClick={() => {
                                      updateFamilyRelationship(index, {
                                        memberId: searchResult.memberId,
                                        search: [searchResult.firstName, searchResult.otherName, searchResult.lastName]
                                          .filter(Boolean)
                                          .join(' '),
                                      });
                                      setActiveFamilySearch({ index: -1, value: '' });
                                    }}
                                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-white/10"
                                    style={{ backgroundColor: 'transparent', color: '#f8fafc' }}
                                  >
                                    <span style={{ color: '#f8fafc', fontWeight: 500 }}>
                                      {[searchResult.firstName, searchResult.otherName, searchResult.lastName]
                                        .filter(Boolean)
                                        .join(' ')}
                                    </span>
                                    <span style={{ color: 'rgba(248,250,252,0.55)' }}>
                                      {searchResult.memberId}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            ) : activeFamilySearch.value && activeFamilySearch.value.length >= 2 ? (
                              <div
                                className="mt-2 rounded-2xl border border-white/10 p-5 text-center shadow-xl"
                                style={{ backgroundColor: '#0b1220' }}
                              >
                                <p className="text-sm text-white/40">No members found</p>
                              </div>
                            ) : null
                          ) : null}
                          {item.memberId ? (
                            <p className="mt-1 text-xs text-white/45">Linked: {item.memberId}</p>
                          ) : null}
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-white/80">
                            Relationship
                          </label>
                          <select
                            value={item.relationship}
                            onChange={(event) =>
                              updateFamilyRelationship(index, { relationship: event.target.value })
                            }
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-accent focus:outline-none"
                          >
                            <option value="">Pick a relationship…</option>
                            {RELATIONSHIP_OPTIONS.map((relationship) => (
                              <option key={relationship} value={relationship}>
                                {relationship.toUpperCase()}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : member?.linkedFamilyMembers?.length ? (
                <div className="space-y-3">
                  {member.linkedFamilyMembers.map((relationship) => (
                    <Link
                      key={relationship.memberId}
                      to={`${isSuperAdmin ? '/superadmin' : ''}/members/${relationship.memberId}`}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 transition hover:bg-white/10"
                    >
                      <span>
                        {relationship.relatedMember?.name} ·{' '}
                        <span className="font-semibold tracking-wide">
                          {(relationship.relationship || '').toUpperCase()}
                        </span>
                      </span>
                      <span className="text-white/45">{relationship.memberId}</span>
                    </Link>
                  ))}
                </div>
              ) : familyQuery.data?.members?.length ? (
                <div className="space-y-3">
                  {familyQuery.data.members.map((familyMember) => (
                    <Link
                      key={familyMember.memberId}
                      to={`${isSuperAdmin ? '/superadmin' : ''}/members/${familyMember.memberId}`}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 transition hover:bg-white/10"
                    >
                      <span>
                        {[familyMember.firstName, familyMember.lastName].filter(Boolean).join(' ')}
                      </span>
                      <span className="text-white/45">{familyMember.memberId}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/55">
                  No linked family group found for this member.
                </p>
              )}
            </Card>

            <Card className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-accent">Actions</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Lifecycle controls</h3>
              </div>
              {member?.isDeleted ? (
                <Button variant="secondary" onClick={() => restoreMutation.mutate()} disabled={restoreMutation.isPending}>
                  {restoreMutation.isPending ? 'Restoring...' : 'Restore Member'}
                </Button>
              ) : canDeleteMembers ? (
                <Button variant="ghost" onClick={() => setShowDeleteModal(true)}>
                  Archive Member
                </Button>
              ) : null}
            </Card>
          </div>
        </div>

        {canViewPastoralActivity ? (
          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-accent">Care Cases</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Pastoral follow-up</h3>
                </div>
                <Button variant="secondary" onClick={() => navigate(`/pastoral/cases/new?memberId=${member?.memberId || ''}`)}>
                  Open New Case
                </Button>
              </div>
              <div className="space-y-3">
                {pastoralCases.map((careCase) => (
                  <div key={careCase.caseId} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <CaseStatusBadge status={careCase.status} urgency={careCase.urgency} />
                    <p className="mt-3 font-semibold text-white">{careCase.title}</p>
                    <p className="mt-1 text-sm text-white/55">{formatPastoralLabel(careCase.type)}</p>
                    <p className="mt-2 text-sm text-white/45">
                      Assigned to {careCase.assignedToName || 'Unassigned'} · {Math.max(0, Math.floor((Date.now() - new Date(careCase.createdAt).getTime()) / (1000 * 60 * 60 * 24)))} days open
                    </p>
                    <Link to={`/pastoral/cases/${careCase.caseId}`} className="mt-3 inline-flex text-sm font-semibold text-accent">
                      View Full Case
                    </Link>
                  </div>
                ))}
                {!pastoralCases.length ? (
                  <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/55">
                    No pastoral care cases linked to this member yet.
                  </p>
                ) : null}
              </div>
            </Card>

            <Card className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-accent">Discipleship</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Growth progress</h3>
              </div>
              <div className="space-y-3">
                {activeEnrollments.map((enrollment) => (
                  <div key={enrollment._id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <DiscipleshipProgressRing percent={enrollment.completionPercent} status={enrollment.status} />
                    <div>
                      <p className="font-semibold text-white">{enrollment.trackName}</p>
                      <p className="mt-1 text-sm text-white/55">{formatPastoralLabel(enrollment.status)}</p>
                    </div>
                  </div>
                ))}
                {completedTracks.map((enrollment) => (
                  <div key={enrollment._id} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4">
                    <p className="font-semibold text-white">{enrollment.trackName}</p>
                    <p className="mt-1 text-sm text-emerald-100">
                      Completed {formatDate(enrollment.completedAt || enrollment.updatedAt)}
                    </p>
                  </div>
                ))}
                {!activeEnrollments.length && !completedTracks.length ? (
                  <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/55">
                    No discipleship enrollments found for this member.
                  </p>
                ) : null}
              </div>
            </Card>

            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-accent">Appointments</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Upcoming and past</h3>
                </div>
                <Button
                  variant="ghost"
                  onClick={() =>
                    navigate(
                      `/pastoral/appointments/new?memberId=${member?.memberId || ''}&memberName=${encodeURIComponent(
                        `${member?.firstName || ''} ${member?.lastName || ''}`.trim(),
                      )}`,
                    )
                  }
                >
                  Schedule Appointment
                </Button>
              </div>
              <div className="space-y-3">
                {[...upcomingAppointments.slice(0, 3), ...pastAppointments.slice(0, 2)].map((appointment) => (
                  <div key={appointment._id || appointment.appointmentId} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{appointment.title}</p>
                        <p className="mt-1 text-sm text-white/55">{formatDate(appointment.scheduledAt)}</p>
                      </div>
                      <AppointmentStatusBadge status={appointment.status} />
                    </div>
                  </div>
                ))}
                {!pastoralAppointments.length ? (
                  <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/55">
                    No pastoral appointments are linked to this member.
                  </p>
                ) : null}
              </div>
            </Card>
          </div>
        ) : null}
      </div>

      <Modal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        title="Member QR Code"
        description="Use this QR code for identity or member check-in workflows."
      >
        <div className="space-y-4 text-center">
          {qrCodeQuery.data?.qrCode ? (
            <img src={qrCodeQuery.data.qrCode} alt="Member QR code" className="mx-auto h-72 w-72 rounded-2xl bg-white p-4" />
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-sm text-white/55">
              {qrCodeQuery.isLoading ? 'Loading QR code...' : 'QR code unavailable.'}
            </p>
          )}
          <p className="text-xs uppercase tracking-[0.22em] text-white/45">{member?.memberId}</p>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Archive member"
        message={`Type "${member?.memberId || ''}" to confirm archiving this member record.`}
        confirmText={member?.memberId || ''}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setShowDeleteModal(false)}
        confirmLabel="Archive Member"
      />
    </Shell>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/55">{label}</p>
      <p className="mt-2 text-base font-semibold text-white">{value || '—'}</p>
    </div>
  );
}
