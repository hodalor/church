import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import SuperAdminShell from '../../components/layout/SuperAdminShell';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import GroupingPathSelector from '../../components/ui/GroupingPathSelector';
import Input from '../../components/ui/Input';
import RouteModal from '../../components/ui/RouteModal';
import { createMember, searchMembers } from '../../api/endpoints/members';
import { getAllTenants, getCurrentTenant, getTenantById } from '../../api/endpoints/tenants';
import { useAuth } from '../../hooks/useAuth';
import { useCapabilities } from '../../hooks/useCapabilities';
import { sanitizeGroupingPath } from '../../utils/groupings';

const membershipOptions = ['visitor', 'new_convert', 'member', 'worker', 'leader', 'clergy'];
const genderOptions = ['male', 'female', 'other'];

export default function CreateMemberPage() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { hasCapability } = useCapabilities();
  const isSuperAdmin = role === 'super_admin';
  const [form, setForm] = useState({
    tenantId: '',
    firstName: '',
    lastName: '',
    otherName: '',
    email: '',
    phone: '',
    gender: '',
    membershipStatus: 'member',
    branch: '',
    department: '',
    ministry: '',
    groupingIds: [],
    tags: '',
    address: '',
    city: '',
    country: '',
    membershipDate: '',
    loginUsername: '',
    loginPhone: '',
    loginPin: '',
    familyRelationships: [],
    notes: '',
  });
  const [error, setError] = useState('');
  const [activeFamilySearch, setActiveFamilySearch] = useState({ index: -1, value: '' });

  const tenantsQuery = useQuery({
    queryKey: ['create-member-tenants'],
    queryFn: () => getAllTenants({ page: 1, limit: 100 }),
    enabled: isSuperAdmin,
  });

  const targetTenantId = isSuperAdmin ? form.tenantId : null;
  const tenantSettingsQuery = useQuery({
    queryKey: ['member-form-tenant-settings', targetTenantId],
    queryFn: () => (isSuperAdmin ? getTenantById(targetTenantId) : getCurrentTenant()),
    enabled: !isSuperAdmin || Boolean(targetTenantId),
  });

  const familySearchQuery = useQuery({
    queryKey: ['member-family-search', activeFamilySearch.value],
    queryFn: () =>
      searchMembers({
        search: activeFamilySearch.value,
        page: 1,
        limit: 8,
      }),
    enabled: activeFamilySearch.index >= 0 && activeFamilySearch.value.trim().length >= 2,
  });

  const mutation = useMutation({
    mutationFn: createMember,
    onSuccess: () => {
      navigate(isSuperAdmin ? '/superadmin/members' : '/members', { replace: true });
    },
    onError: (mutationError) => {
      setError(mutationError.response?.data?.message || 'Unable to create member right now.');
    },
  });

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const content = tenantSettingsQuery.data?.content || {};
  const groupingOptions = content.groupings || [];

  const payload = useMemo(
    () => ({
      ...form,
      department: form.department
        ? form.department.split(',').map((item) => item.trim()).filter(Boolean)
        : [],
      groupingIds: sanitizeGroupingPath(groupingOptions, form.groupingIds || []),
      familyRelationships: (form.familyRelationships || [])
        .map((item) => ({
          memberId: item.memberId,
          relationship: item.relationship,
        }))
        .filter((item) => item.memberId && item.relationship),
      tags: form.tags ? form.tags.split(',').map((item) => item.trim()).filter(Boolean) : [],
    }),
    [form, groupingOptions],
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (isSuperAdmin && !form.tenantId) {
      setError('Select a church tenant before creating a member.');
      return;
    }

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }

    mutation.mutate(payload);
  };

  const Shell = isSuperAdmin ? SuperAdminShell : AppShell;
  const backPath = isSuperAdmin ? '/superadmin/members' : '/members';
  const canCreateMembers = isSuperAdmin || hasCapability('members.create');

  const updateFamilyRelationship = (index, nextValue) => {
    setForm((current) => ({
      ...current,
      familyRelationships: current.familyRelationships.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...nextValue } : item,
      ),
    }));
  };

  if (!canCreateMembers) {
    return (
      <Shell>
        <Card>
          <p className="text-sm uppercase tracking-[0.25em] text-accent">Members</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Your account does not have permission to create new member records.
          </p>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <RouteModal
        title="Add Member"
        description="Create a new church member profile with the core identity and church details."
        fallbackPath={backPath}
        size="xl"
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          <Card className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-accent">Section 1</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Personal Information</h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {isSuperAdmin ? (
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/80">Church Tenant</span>
                  <select
                    value={form.tenantId}
                    onChange={(event) => updateField('tenantId', event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
                  >
                    <option value="">Select a church</option>
                    {(tenantsQuery.data?.tenants || []).map((tenant) => (
                      <option key={tenant.tenantId} value={tenant.tenantId}>
                        {tenant.churchName} ({tenant.tenantId})
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <Input
                label="First Name"
                value={form.firstName}
                onChange={(event) => updateField('firstName', event.target.value)}
                placeholder="Amos"
              />
              <Input
                label="Last Name"
                value={form.lastName}
                onChange={(event) => updateField('lastName', event.target.value)}
                placeholder="Darko"
              />
              <Input
                label="Other Name"
                value={form.otherName}
                onChange={(event) => updateField('otherName', event.target.value)}
                placeholder="Kwame"
              />
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/80">Gender</span>
                <select
                  value={form.gender}
                  onChange={(event) => updateField('gender', event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
                >
                  <option value="">Select gender</option>
                  {genderOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="member@church.org"
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                placeholder="+233..."
              />
              <Input
                label="Login Username"
                value={form.loginUsername}
                onChange={(event) => updateField('loginUsername', event.target.value)}
                placeholder="optional member login username"
              />
              <Input
                label="Login Phone"
                value={form.loginPhone}
                onChange={(event) => updateField('loginPhone', event.target.value)}
                placeholder="optional phone login override"
              />
              <Input
                label="Login PIN"
                value={form.loginPin}
                onChange={(event) => updateField('loginPin', event.target.value)}
                placeholder="0903"
              />
            </div>
          </Card>

          <Card className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-accent">Section 2</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Church Information</h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/80">Membership Status</span>
                <select
                  value={form.membershipStatus}
                  onChange={(event) => updateField('membershipStatus', event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
                >
                  {membershipOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                label="Membership Date"
                type="date"
                value={form.membershipDate}
                onChange={(event) => updateField('membershipDate', event.target.value)}
              />
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/80">Branch</span>
                <select
                  value={form.branch}
                  onChange={(event) => updateField('branch', event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
                >
                  <option value="">Select branch</option>
                  {(content.branches || []).map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/80">Department</span>
                <select
                  value={form.department}
                  onChange={(event) => updateField('department', event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
                >
                  <option value="">Select department</option>
                  {(content.departments || []).map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/80">Ministry</span>
                <select
                  value={form.ministry}
                  onChange={(event) => updateField('ministry', event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
                >
                  <option value="">Select ministry</option>
                  {(content.ministries || []).map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <div className="md:col-span-2">
                <GroupingPathSelector
                  groupings={groupingOptions}
                  value={form.groupingIds}
                  onChange={(nextPath) => updateField('groupingIds', nextPath)}
                  hint="Choose the main parent first, then the child, then the grandchild based on this church's hierarchy."
                />
              </div>
              <Input
                label="Tags"
                value={form.tags}
                onChange={(event) => updateField('tags', event.target.value)}
                placeholder="intercessor, musician"
              />
            </div>
          </Card>

          <Card className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-accent">Section 4</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Family Relationships</h2>
              </div>
              <Button
                type="button"
                variant="subtle"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    familyRelationships: [
                      ...current.familyRelationships,
                      { memberId: '', relationship: '', search: '' },
                    ],
                  }))
                }
              >
                Add Family Link
              </Button>
            </div>

            <div className="space-y-4">
              {form.familyRelationships.length ? (
                form.familyRelationships.map((item, index) => (
                  <div
                    key={`${item.memberId || 'family'}-${index}`}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr_auto]">
                      <div className="space-y-2">
                        <Input
                          label="Search Registered Member"
                          value={item.search || ''}
                          onChange={(event) => {
                            const value = event.target.value;
                            updateFamilyRelationship(index, { search: value, memberId: '' });
                            setActiveFamilySearch({ index, value });
                          }}
                          placeholder="Type name, member ID, or phone"
                        />
                        {activeFamilySearch.index === index &&
                        (familySearchQuery.data?.members || []).length ? (
                          <div className="rounded-2xl border border-white/10 bg-[#0f1524] p-2">
                            {(familySearchQuery.data?.members || []).map((member) => (
                              <button
                                key={member.memberId}
                                type="button"
                                onClick={() => {
                                  updateFamilyRelationship(index, {
                                    memberId: member.memberId,
                                    search: `${member.firstName || ''} ${member.lastName || ''}`.trim(),
                                  });
                                  setActiveFamilySearch({ index: -1, value: '' });
                                }}
                                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-white hover:bg-white/5"
                              >
                                <span>
                                  {[member.firstName, member.lastName].filter(Boolean).join(' ')}
                                </span>
                                <span className="text-white/45">{member.memberId}</span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <Input
                        label="Relationship"
                        value={item.relationship}
                        onChange={(event) =>
                          updateFamilyRelationship(index, { relationship: event.target.value })
                        }
                        placeholder="son, wife, father"
                      />
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              familyRelationships: current.familyRelationships.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            }))
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    {item.memberId ? (
                      <p className="mt-3 text-sm text-accent">Selected member: {item.memberId}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-white/45">
                  Add a family member link so profiles can show father, mother, son, wife, and
                  other relationships.
                </p>
              )}
            </div>
          </Card>

          <Card className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-accent">Section 5</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Location & Notes</h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="Address"
                value={form.address}
                onChange={(event) => updateField('address', event.target.value)}
                placeholder="123 church street"
              />
              <Input
                label="City"
                value={form.city}
                onChange={(event) => updateField('city', event.target.value)}
                placeholder="Accra"
              />
              <Input
                label="Country"
                value={form.country}
                onChange={(event) => updateField('country', event.target.value)}
                placeholder="Ghana"
              />
              <label className="block space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-white/80">Notes</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => updateField('notes', event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-accent"
                  placeholder="Optional ministry notes"
                />
              </label>
            </div>

            {error ? <p className="text-sm text-red-500">{error}</p> : null}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => navigate(backPath, { replace: true })}>
                Cancel
              </Button>
              <Button type="submit" variant="secondary" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creating...' : 'Create Member'}
              </Button>
            </div>
          </Card>
        </form>
      </RouteModal>
    </Shell>
  );
}
