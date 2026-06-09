import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import AvailabilityDots from '../../components/volunteers/AvailabilityDots';
import BadgeChip from '../../components/volunteers/BadgeChip';
import ReliabilityScore from '../../components/volunteers/ReliabilityScore';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import SearchInput from '../../components/ui/SearchInput';
import { addAssignment, getUpcomingRosters } from '../../api/endpoints/rosters';
import {
  getAllVolunteers,
  removeVolunteer,
  updateVolunteerStatus,
} from '../../api/endpoints/volunteers';
import { getCurrentTenant } from '../../api/endpoints/tenants';
import useVolunteersAccess from '../../hooks/useVolunteersAccess';
import { getReliabilityClasses } from '../../utils/volunteers';

export default function VolunteersListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    canViewVolunteers,
    canModifyVolunteers,
    canDeleteVolunteers,
    canCreateRosters,
  } = useVolunteersAccess();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedIds, setSelectedIds] = useState([]);
  const [assignRosterId, setAssignRosterId] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [statusEditing, setStatusEditing] = useState(null);

  const page = Number(searchParams.get('page') || 1);
  const filters = {
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    department: searchParams.get('department') || '',
    skills: searchParams.get('skills') || '',
    date: searchParams.get('availability') || '',
  };
  const reliabilityFilter = searchParams.get('reliability') || 'all';

  const volunteersQuery = useQuery({
    queryKey: ['volunteers-list-page', page, filters],
    queryFn: () =>
      getAllVolunteers({
        page,
        limit: 10,
        search: filters.search || undefined,
        status: filters.status || undefined,
        department: filters.department || undefined,
        skills: filters.skills || undefined,
        date: filters.date || undefined,
      }),
    enabled: canViewVolunteers,
  });
  const tenantQuery = useQuery({
    queryKey: ['volunteers-list-settings'],
    queryFn: getCurrentTenant,
    enabled: canViewVolunteers,
  });
  const rostersQuery = useQuery({
    queryKey: ['volunteers-list-upcoming-rosters'],
    queryFn: () => getUpcomingRosters({ limit: 20 }),
    enabled: showAssignModal,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['volunteers-list-page'] });
    queryClient.invalidateQueries({ queryKey: ['volunteers-dashboard-stats'] });
  };

  const deleteMutation = useMutation({
    mutationFn: removeVolunteer,
    onSuccess: refresh,
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateVolunteerStatus(id, status),
    onSuccess: () => {
      setStatusEditing(null);
      refresh();
    },
  });
  const assignMutation = useMutation({
    mutationFn: async () => {
      const rosterId = assignRosterId;
      const selected = items.filter((item) => selectedIds.includes(item._id || item.id));

      for (const volunteer of selected) {
        await addAssignment(rosterId, {
          volunteerId: volunteer._id || volunteer.id,
          department: volunteer.primaryDepartment || volunteer.departments?.[0] || 'volunteer',
          role: `${volunteer.primaryDepartment || 'Volunteer'} assignment`,
        });
      }
    },
    onSuccess: () => {
      setSelectedIds([]);
      setAssignRosterId('');
      setShowAssignModal(false);
    },
  });

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    if (key !== 'page') {
      next.set('page', '1');
    }
    setSearchParams(next);
  };

  const allItems = volunteersQuery.data?.items || [];
  const items = allItems.filter((item) => {
    const score = Number(item.performance?.reliabilityScore || 0);
    if (reliabilityFilter === 'high') return score > 80;
    if (reliabilityFilter === 'medium') return score >= 60 && score <= 80;
    if (reliabilityFilter === 'low') return score < 60;
    return true;
  });
  const content = tenantQuery.data?.content || {};
  const rosters = rostersQuery.data?.items || rostersQuery.data || [];

  const columns = [
    {
      key: 'name',
      header: 'Photo + Name',
      render: (volunteer) => (
        <div className="flex items-center gap-3">
          {volunteer.memberPhoto ? (
            <img src={volunteer.memberPhoto} alt={volunteer.memberName} className="h-11 w-11 rounded-full object-cover" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
              {(volunteer.memberName || 'V').slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-white">{volunteer.memberName}</p>
            <p className="text-xs text-white/45">{volunteer.memberId}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'departments',
      header: 'Departments',
      render: (volunteer) => (
        <div className="flex flex-wrap gap-1.5">
          {(volunteer.departments || []).map((department) => (
            <span key={department} className="rounded-full bg-accent/10 px-2 py-1 text-xs text-accent">
              {department}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'skills',
      header: 'Skills',
      render: (volunteer) => (
        <div className="flex flex-wrap gap-1.5">
          {(volunteer.skills || []).slice(0, 3).map((skill) => (
            <span key={skill} className="rounded-full bg-white/5 px-2 py-1 text-xs text-white/70">
              {skill}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'availability',
      header: 'Availability',
      render: (volunteer) => <AvailabilityDots availability={volunteer.availability} />,
    },
    {
      key: 'reliability',
      header: 'Reliability',
      render: (volunteer) => (
        <div className="w-28">
          <div
            className={`mb-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getReliabilityClasses(
              volunteer.performance?.reliabilityScore || 0,
            )}`}
          >
            {Math.round(volunteer.performance?.reliabilityScore || 0)}%
          </div>
          <ReliabilityScore score={volunteer.performance?.reliabilityScore || 0} />
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (volunteer) => (
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/75">
          {String(volunteer.status || 'active').replaceAll('_', ' ')}
        </span>
      ),
    },
    {
      key: 'badges',
      header: 'Badges',
      render: (volunteer) => (
        <div className="flex flex-wrap gap-1.5">
          {(volunteer.performance?.badges || []).slice(0, 2).map((badge) => (
            <BadgeChip key={badge} badge={badge} />
          ))}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (volunteer) => (
        <div className="flex flex-wrap gap-2">
          <Link to={`/volunteers/${volunteer._id || volunteer.id}`}>
            <Button variant="subtle">View</Button>
          </Link>
          {canModifyVolunteers ? (
            <Button variant="ghost" onClick={() => setStatusEditing(volunteer)}>
              Change Status
            </Button>
          ) : null}
          {canDeleteVolunteers ? (
            <Button
              variant="subtle"
              onClick={() => {
                if (window.confirm('Remove this volunteer?')) {
                  deleteMutation.mutate(volunteer._id || volunteer.id);
                }
              }}
            >
              Remove
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  if (!canViewVolunteers) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.22em] text-accent">Volunteers</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm text-white/60">
            Your account does not currently have access to the volunteer registry.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">Volunteers</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Volunteer Registry</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {canCreateRosters ? (
              <Button variant="ghost" onClick={() => setShowAssignModal(true)} disabled={!selectedIds.length}>
                Bulk Assign To Roster
              </Button>
            ) : null}
            <Button
              variant="subtle"
              disabled={!selectedIds.length}
              onClick={() =>
                navigate(
                  `/communication/broadcasts/new?module=volunteers&ids=${selectedIds.join(',')}`,
                )
              }
            >
              Bulk Notify
            </Button>
            <Link to="/volunteers/new">
              <Button variant="secondary">Register Volunteer</Button>
            </Link>
          </div>
        </div>

        <Card className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <SearchInput
              value={filters.search}
              onChange={(event) => updateParam('search', event.target.value)}
              placeholder="Search volunteer"
            />
            <select
              value={filters.department}
              onChange={(event) => updateParam('department', event.target.value)}
              className="rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
            >
              <option value="">All Departments</option>
              {(content.departments || []).map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(event) => updateParam('status', event.target.value)}
              className="rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
              <option value="suspended">Suspended</option>
            </select>
            <input
              value={filters.skills}
              onChange={(event) => updateParam('skills', event.target.value)}
              placeholder="Skills"
              className="rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30"
            />
            <input
              type="date"
              value={filters.date}
              onChange={(event) => updateParam('availability', event.target.value)}
              className="rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
            />
            <select
              value={reliabilityFilter}
              onChange={(event) => updateParam('reliability', event.target.value)}
              className="rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
            >
              <option value="all">All Reliability</option>
              <option value="high">High &gt; 80</option>
              <option value="medium">Medium 60 - 80</option>
              <option value="low">Low &lt; 60</option>
            </select>
          </div>
        </Card>

        <Card className="space-y-4">
          <DataTable columns={columns} data={items} />
          <Pagination
            currentPage={volunteersQuery.data?.page || 1}
            totalPages={volunteersQuery.data?.totalPages || 1}
            onPageChange={(nextPage) => updateParam('page', String(nextPage))}
          />
        </Card>
      </div>

      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Bulk Assign To Roster"
        description="Assign the selected volunteers to an upcoming roster."
      >
        <div className="space-y-4">
          <select
            value={assignRosterId}
            onChange={(event) => setAssignRosterId(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
          >
            <option value="">Select roster</option>
            {rosters.map((roster) => (
              <option key={roster.rosterId || roster._id} value={roster.rosterId || roster._id}>
                {roster.title}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <Button variant="subtle" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            <Button variant="secondary" disabled={!assignRosterId} onClick={() => assignMutation.mutate()}>
              Assign Selected
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(statusEditing)}
        onClose={() => setStatusEditing(null)}
        title="Change Volunteer Status"
        description="Update the volunteer's current status."
      >
        <div className="space-y-4">
          <select
            defaultValue={statusEditing?.status || 'active'}
            onChange={(event) =>
              setStatusEditing((current) => ({ ...current, nextStatus: event.target.value }))
            }
            className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
            <option value="suspended">Suspended</option>
          </select>
          <div className="flex justify-end gap-2">
            <Button variant="subtle" onClick={() => setStatusEditing(null)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                statusMutation.mutate({
                  id: statusEditing?._id || statusEditing?.id,
                  status: statusEditing?.nextStatus || statusEditing?.status || 'active',
                })
              }
            >
              Update Status
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
