import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import MemberSearchInput from '../../components/finance/MemberSearchInput';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import RouteModal from '../../components/ui/RouteModal';
import { getCurrentTenant } from '../../api/endpoints/tenants';
import { getUsers } from '../../api/endpoints/users';
import { registerVolunteer } from '../../api/endpoints/volunteers';
import useVolunteersAccess from '../../hooks/useVolunteersAccess';
import { volunteerDayKeys, volunteerDayLabels, volunteerSkillSuggestions } from '../../utils/volunteers';

const createInitialForm = () => ({
  memberId: '',
  memberName: '',
  memberPhone: '',
  primaryDepartment: '',
  departments: [],
  skills: [],
  supervisorId: '',
  availability: volunteerDayKeys.reduce((acc, key) => ({ ...acc, [key]: false }), {
    sunday: true,
    notes: '',
  }),
  notes: '',
  manualName: '',
  manualPhone: '',
});

export default function RegisterVolunteerPage() {
  const navigate = useNavigate();
  const { canCreateVolunteers } = useVolunteersAccess();
  const [form, setForm] = useState(createInitialForm());
  const [skillDraft, setSkillDraft] = useState('');

  const tenantQuery = useQuery({
    queryKey: ['volunteer-register-settings'],
    queryFn: getCurrentTenant,
    enabled: canCreateVolunteers,
  });
  const usersQuery = useQuery({
    queryKey: ['volunteer-register-users'],
    queryFn: () => getUsers(),
    enabled: canCreateVolunteers,
  });

  const mutation = useMutation({
    mutationFn: registerVolunteer,
    onSuccess: (result) => {
      navigate(`/volunteers/${result._id || result.id || result.memberId}`);
    },
  });

  const content = tenantQuery.data?.content || {};
  const supervisors = (usersQuery.data || []).filter((user) =>
    ['volunteer_leader', 'head_pastor', 'associate_pastor', 'branch_pastor'].includes(user.role),
  );
  const selectedMember = useMemo(
    () => (form.memberId ? { memberId: form.memberId, memberName: form.memberName } : null),
    [form.memberId, form.memberName],
  );

  const toggleDepartment = (department) => {
    setForm((current) => {
      const departments = current.departments.includes(department)
        ? current.departments.filter((item) => item !== department)
        : [...current.departments, department];

      return {
        ...current,
        departments,
        primaryDepartment: current.primaryDepartment || department,
      };
    });
  };

  const addSkill = (value) => {
    const nextSkill = String(value || '').trim();
    if (!nextSkill) {
      return;
    }

    setForm((current) => ({
      ...current,
      skills: [...new Set([...current.skills, nextSkill])],
    }));
    setSkillDraft('');
  };

  return (
    <RouteModal
      title="Register Volunteer"
      description="Link an existing member profile to volunteer service, departments, skills, and availability."
      fallbackPath="/volunteers/list"
      size="xl"
    >
      {!canCreateVolunteers ? (
        <AppShell>
          <Card>
            <p className="text-sm uppercase tracking-[0.22em] text-accent">Volunteers</p>
            <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
            <p className="mt-3 text-sm text-white/60">
              Your account does not currently have permission to register volunteers.
            </p>
          </Card>
        </AppShell>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-accent">Volunteer Identity</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Link a member profile</h2>
              </div>
              <MemberSearchInput
                value={selectedMember}
                onSelect={({ memberId, memberName, member }) =>
                  setForm((current) => ({
                    ...current,
                    memberId,
                    memberName,
                    memberPhone: member?.phone || '',
                  }))
                }
                onClear={() =>
                  setForm((current) => ({
                    ...current,
                    memberId: '',
                    memberName: '',
                  }))
                }
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Manual Name"
                  value={form.manualName}
                  onChange={(event) => setForm((current) => ({ ...current, manualName: event.target.value }))}
                  placeholder="Used as a prep note"
                />
                <Input
                  label="Manual Phone"
                  value={form.manualPhone}
                  onChange={(event) => setForm((current) => ({ ...current, manualPhone: event.target.value }))}
                  placeholder="Used as a prep note"
                />
              </div>
              <p className="text-xs text-white/45">
                Volunteer registration currently requires an existing member profile on the backend. If the person is new,
                create the member record first, then attach them here.
              </p>

              <label className="space-y-2">
                <span className="text-sm font-medium text-white/80">Primary Department</span>
                <select
                  value={form.primaryDepartment}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, primaryDepartment: event.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
                >
                  <option value="">Select primary department</option>
                  {(content.departments || []).map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-2">
                <span className="text-sm font-medium text-white/80">All Departments</span>
                <div className="flex flex-wrap gap-2">
                  {(content.departments || []).map((department) => (
                    <button
                      key={department}
                      type="button"
                      onClick={() => toggleDepartment(department)}
                      className={`rounded-full px-3 py-1.5 text-sm ${
                        form.departments.includes(department)
                          ? 'bg-accent text-primary'
                          : 'border border-white/10 bg-white/5 text-white/70'
                      }`}
                    >
                      {department}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium text-white/80">Skills</span>
                <div className="flex flex-wrap gap-2">
                  {volunteerSkillSuggestions.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => addSkill(skill)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={skillDraft}
                    onChange={(event) => setSkillDraft(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
                    placeholder="Add custom skill"
                  />
                  <Button variant="subtle" onClick={() => addSkill(skillDraft)}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.skills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          skills: current.skills.filter((item) => item !== skill),
                        }))
                      }
                      className="rounded-full bg-accent/10 px-3 py-1.5 text-sm text-accent"
                    >
                      {skill} x
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-accent">Availability</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Schedule and supervision</h2>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-medium text-white/80">Supervisor</span>
                <select
                  value={form.supervisorId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, supervisorId: event.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
                >
                  <option value="">Select supervisor</option>
                  {supervisors.map((user) => (
                    <option key={user._id || user.id} value={user._id || user.id}>
                      {user.fullName || user.username}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-4 gap-2 md:grid-cols-7">
                {volunteerDayKeys.map((dayKey, index) => (
                  <button
                    key={dayKey}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        availability: {
                          ...current.availability,
                          [dayKey]: !current.availability[dayKey],
                        },
                      }))
                    }
                    className={`rounded-2xl px-3 py-3 text-sm font-semibold ${
                      form.availability[dayKey]
                        ? 'bg-accent text-primary'
                        : 'border border-white/10 bg-white/5 text-white/65'
                    }`}
                  >
                    {volunteerDayLabels[index]}
                  </button>
                ))}
              </div>

              <label className="space-y-2">
                <span className="text-sm font-medium text-white/80">Availability Notes</span>
                <textarea
                  rows={4}
                  value={form.availability.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      availability: {
                        ...current.availability,
                        notes: event.target.value,
                      },
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none"
                  placeholder="Special constraints, transport notes, rehearsal timing, or serving preferences"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-white/80">Notes</span>
                <textarea
                  rows={6}
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none"
                  placeholder="General volunteer notes"
                />
              </label>
            </Card>
          </div>

          {mutation.error ? <p className="text-sm text-rose-300">{mutation.error.message}</p> : null}

          <div className="flex justify-end gap-2">
            <Button variant="subtle" onClick={() => navigate('/volunteers/list')}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              disabled={!form.memberId || !form.primaryDepartment || mutation.isPending}
              onClick={() =>
                mutation.mutate({
                  memberId: form.memberId,
                  primaryDepartment: form.primaryDepartment,
                  departments: [...new Set([form.primaryDepartment, ...form.departments])],
                  skills: form.skills,
                  supervisorId: form.supervisorId || undefined,
                  availability: form.availability,
                  notes: form.notes,
                })
              }
            >
              Register as Volunteer
            </Button>
          </div>
        </div>
      )}
    </RouteModal>
  );
}
