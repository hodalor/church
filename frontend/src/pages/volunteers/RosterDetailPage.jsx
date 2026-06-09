import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { format, isBefore, startOfDay } from 'date-fns';
import { Link, useParams } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import AvailabilityDots from '../../components/volunteers/AvailabilityDots';
import VolunteerPickerModal from '../../components/volunteers/VolunteerPickerModal';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import {
  addAssignment,
  getRosterById,
  markAttendance,
  publishRoster,
  removeAssignment,
  updateAssignment,
} from '../../api/endpoints/rosters';
import { getCurrentTenant } from '../../api/endpoints/tenants';
import { getAvailableVolunteers } from '../../api/endpoints/volunteers';
import useVolunteersAccess from '../../hooks/useVolunteersAccess';
import { assignmentStatuses } from '../../utils/volunteers';

const createAutoCounts = (departments = []) =>
  departments.reduce((acc, department) => ({ ...acc, [department]: 0 }), {});

const reorderList = (list, startIndex, endIndex) => {
  const next = [...list];
  const [removed] = next.splice(startIndex, 1);
  next.splice(endIndex, 0, removed);
  return next;
};

export default function RosterDetailPage() {
  const queryClient = useQueryClient();
  const { rosterId } = useParams();
  const {
    canViewRosters,
    canModifyRosters,
    canPublishRosters,
  } = useVolunteersAccess();
  const [orderedAssignments, setOrderedAssignments] = useState([]);
  const [pickerDepartment, setPickerDepartment] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [attendanceMode, setAttendanceMode] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');
  const [autoCounts, setAutoCounts] = useState({});
  const [autoPreview, setAutoPreview] = useState([]);

  const rosterQuery = useQuery({
    queryKey: ['roster-detail', rosterId],
    queryFn: () => getRosterById(rosterId),
    enabled: canViewRosters,
  });
  const tenantQuery = useQuery({
    queryKey: ['roster-detail-tenant'],
    queryFn: getCurrentTenant,
    enabled: canViewRosters,
  });

  useEffect(() => {
    const roster = rosterQuery.data;
    if (roster?.assignments) {
      setOrderedAssignments(roster.assignments);
    }
  }, [rosterQuery.data]);

  useEffect(() => {
    const departments = tenantQuery.data?.content?.departments || [];
    setAutoCounts((current) => {
      const next = createAutoCounts(departments);
      Object.keys(current).forEach((key) => {
        if (next[key] !== undefined) {
          next[key] = current[key];
        }
      });
      return next;
    });
  }, [tenantQuery.data?.content?.departments]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['roster-detail', rosterId] });
    queryClient.invalidateQueries({ queryKey: ['volunteer-rosters-page'] });
    queryClient.invalidateQueries({ queryKey: ['volunteers-dashboard-upcoming-rosters'] });
    queryClient.invalidateQueries({ queryKey: ['volunteer-detail-rosters'] });
    queryClient.invalidateQueries({ queryKey: ['volunteers-dashboard-stats'] });
  };

  const addMutation = useMutation({
    mutationFn: (payload) => addAssignment(rosterId, payload),
    onSuccess: () => {
      setShowPicker(false);
      invalidate();
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ assignmentId, payload }) => updateAssignment(rosterId, assignmentId, payload),
    onSuccess: invalidate,
  });
  const removeMutation = useMutation({
    mutationFn: (assignmentId) => removeAssignment(rosterId, assignmentId),
    onSuccess: invalidate,
  });
  const publishMutation = useMutation({
    mutationFn: () => publishRoster(rosterId),
    onSuccess: (result) => {
      setShowPublishModal(false);
      setSuccessBanner(`Roster published and ${result.assignments?.length || 0} volunteers notified.`);
      invalidate();
    },
  });
  const attendanceMutation = useMutation({
    mutationFn: async ({ assignmentIds, status }) => {
      for (const assignmentId of assignmentIds) {
        await markAttendance(rosterId, assignmentId, status);
      }
    },
    onSuccess: invalidate,
  });
  const autoPreviewMutation = useMutation({
    mutationFn: async () => {
      const entries = Object.entries(autoCounts).filter(([, count]) => Number(count || 0) > 0);
      const previewGroups = await Promise.all(
        entries.map(async ([department, count]) => {
          const items = await getAvailableVolunteers({
            department,
            date: roster.date,
            limit: Number(count || 0),
          });
          const volunteers = (items?.items || items || []).slice(0, Number(count || 0));
          return { department, volunteers };
        }),
      );
      return previewGroups;
    },
    onSuccess: (previewGroups) => setAutoPreview(previewGroups),
  });
  const autoApplyMutation = useMutation({
    mutationFn: async () => {
      for (const group of autoPreview) {
        for (const volunteer of group.volunteers) {
          await addAssignment(rosterId, {
            volunteerId: volunteer._id || volunteer.id,
            department: group.department,
            role: `${group.department} volunteer`,
          });
        }
      }
    },
    onSuccess: () => {
      setShowAutoModal(false);
      setAutoPreview([]);
      invalidate();
    },
  });

  const roster = rosterQuery.data || {};
  const departments = useMemo(() => {
    const tenantDepartments = tenantQuery.data?.content?.departments || [];
    const assignmentDepartments = orderedAssignments.map((item) => item.department).filter(Boolean);
    return [...new Set([...tenantDepartments, ...assignmentDepartments])];
  }, [orderedAssignments, tenantQuery.data?.content?.departments]);

  const groupedAssignments = useMemo(
    () =>
      departments.map((department) => ({
        department,
        items: orderedAssignments.filter((assignment) => assignment.department === department),
      })),
    [departments, orderedAssignments],
  );

  const rosterDate = roster.date ? new Date(roster.date) : null;
  const canMarkAttendance = rosterDate ? isBefore(rosterDate, startOfDay(new Date())) : false;
  const assignedVolunteerIds = orderedAssignments.map((item) => item.volunteerId).filter(Boolean);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceDepartment = source.droppableId;
    const destinationDepartment = destination.droppableId;

    if (sourceDepartment === destinationDepartment) {
      const sameDepartmentItems = orderedAssignments.filter(
        (assignment) => assignment.department === sourceDepartment,
      );
      const reordered = reorderList(sameDepartmentItems, source.index, destination.index);
      const others = orderedAssignments.filter((assignment) => assignment.department !== sourceDepartment);
      setOrderedAssignments(
        departments.flatMap((department) =>
          department === sourceDepartment
            ? reordered
            : others.filter((assignment) => assignment.department === department),
        ),
      );
      return;
    }

    setOrderedAssignments((current) =>
      current.map((assignment) =>
        assignment.assignmentId === draggableId
          ? { ...assignment, department: destinationDepartment }
          : assignment,
      ),
    );
    updateMutation.mutate({
      assignmentId: draggableId,
      payload: { department: destinationDepartment },
    });
  };

  if (!canViewRosters) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.22em] text-accent">Roster Detail</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm text-white/60">
            Your account does not currently have permission to open this roster.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {successBanner ? (
          <div className="rounded-[20px] border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {successBanner}
          </div>
        ) : null}

        <Card className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/45">Roster Detail</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">{roster.title || 'Duty roster'}</h1>
              <p className="mt-2 text-sm text-white/55">
                {rosterDate ? format(rosterDate, 'PPP') : 'Date TBD'} •{' '}
                {roster.serviceId ? (
                  <span>Service: {roster.serviceId}</span>
                ) : roster.eventId ? (
                  <span>Event: {roster.eventId}</span>
                ) : (
                  <span>General roster</span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full px-3 py-2 text-xs font-semibold ${
                  roster.isPublished
                    ? 'border border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                    : 'border border-slate-400/30 bg-slate-500/15 text-slate-300'
                }`}
              >
                {roster.isPublished ? 'Published' : 'Draft'}
              </span>
              <Button variant="ghost" onClick={() => setShowAutoModal(true)} disabled={!canModifyRosters}>
                Auto-Generate
              </Button>
              {!roster.isPublished && canPublishRosters ? (
                <Button variant="secondary" onClick={() => setShowPublishModal(true)}>
                  Publish Roster
                </Button>
              ) : null}
              {canMarkAttendance ? (
                <Button
                  variant={attendanceMode ? 'secondary' : 'subtle'}
                  onClick={() => setAttendanceMode((current) => !current)}
                >
                  Mark Attendance
                </Button>
              ) : null}
            </div>
          </div>

          {canMarkAttendance && attendanceMode ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                disabled={attendanceMutation.isPending}
                onClick={() =>
                  attendanceMutation.mutate({
                    assignmentIds: orderedAssignments.map((item) => item.assignmentId),
                    status: 'attended',
                  })
                }
              >
                Mark All Present
              </Button>
              <Button
                variant="subtle"
                disabled={attendanceMutation.isPending}
                onClick={() =>
                  attendanceMutation.mutate({
                    assignmentIds: orderedAssignments.map((item) => item.assignmentId),
                    status: 'absent',
                  })
                }
              >
                Mark All Absent
              </Button>
            </div>
          ) : null}
        </Card>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="space-y-5">
            {groupedAssignments.map((group) => (
              <Card key={group.department} className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{group.department}</h2>
                    <p className="mt-1 text-sm text-white/45">{group.items.length} volunteers assigned</p>
                  </div>
                  {canModifyRosters ? (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setPickerDepartment(group.department);
                        setShowPicker(true);
                      }}
                    >
                      + Add Volunteer
                    </Button>
                  ) : null}
                </div>

                <Droppable droppableId={group.department}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                      {group.items.map((assignment, index) => (
                        <Draggable
                          key={assignment.assignmentId}
                          draggableId={assignment.assignmentId}
                          index={index}
                          isDragDisabled={!canModifyRosters}
                        >
                          {(dragProvided) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-4"
                            >
                              <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr_0.9fr_0.5fr]">
                                <div className="flex items-center gap-3">
                                  {assignment.memberPhoto ? (
                                    <img
                                      src={assignment.memberPhoto}
                                      alt={assignment.memberName}
                                      className="h-12 w-12 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                                      {String(assignment.memberName || 'V').slice(0, 1).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-semibold text-white">{assignment.memberName}</p>
                                    <p className="text-sm text-white/45">{assignment.role}</p>
                                    <div className="mt-2">
                                      <AvailabilityDots availability={assignment.availability} />
                                    </div>
                                  </div>
                                </div>

                                <label className="space-y-1.5">
                                  <span className="text-[12px] font-medium text-white/55">Role</span>
                                  <Input
                                    value={assignment.role || ''}
                                    onChange={(event) =>
                                      setOrderedAssignments((current) =>
                                        current.map((item) =>
                                          item.assignmentId === assignment.assignmentId
                                            ? { ...item, role: event.target.value }
                                            : item,
                                        ),
                                      )
                                    }
                                    onBlur={(event) =>
                                      updateMutation.mutate({
                                        assignmentId: assignment.assignmentId,
                                        payload: { role: event.target.value },
                                      })
                                    }
                                  />
                                </label>

                                <label className="space-y-1.5">
                                  <span className="text-[12px] font-medium text-white/55">Status</span>
                                  <select
                                    value={assignment.status || 'assigned'}
                                    onChange={(event) =>
                                      updateMutation.mutate({
                                        assignmentId: assignment.assignmentId,
                                        payload: { status: event.target.value },
                                      })
                                    }
                                    className="w-full rounded-xl border border-white/10 bg-[#0b1120] px-3.5 py-2.5 text-sm text-white"
                                  >
                                    {assignmentStatuses.map((status) => (
                                      <option key={status} value={status}>
                                        {status.replaceAll('_', ' ')}
                                      </option>
                                    ))}
                                  </select>
                                  {attendanceMode ? (
                                    <div className="flex gap-2">
                                      <Button
                                        variant="ghost"
                                        className="flex-1"
                                        onClick={() =>
                                          attendanceMutation.mutate({
                                            assignmentIds: [assignment.assignmentId],
                                            status: 'attended',
                                          })
                                        }
                                      >
                                        Attended
                                      </Button>
                                      <Button
                                        variant="subtle"
                                        className="flex-1"
                                        onClick={() =>
                                          attendanceMutation.mutate({
                                            assignmentIds: [assignment.assignmentId],
                                            status: 'absent',
                                          })
                                        }
                                      >
                                        Absent
                                      </Button>
                                    </div>
                                  ) : null}
                                </label>

                                <div className="flex items-center justify-end">
                                  {canModifyRosters ? (
                                    <Button
                                      variant="subtle"
                                      onClick={() => {
                                        if (window.confirm('Remove this assignment?')) {
                                          removeMutation.mutate(assignment.assignmentId);
                                        }
                                      }}
                                    >
                                      Remove
                                    </Button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {!group.items.length ? (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-[#101827] px-4 py-8 text-center text-sm text-white/45">
                          No volunteers assigned to {group.department} yet.
                        </div>
                      ) : null}
                    </div>
                  )}
                </Droppable>
              </Card>
            ))}
          </div>
        </DragDropContext>

        <div className="flex justify-between">
          <Link to="/volunteers/rosters">
            <Button variant="subtle">Back to Rosters</Button>
          </Link>
          <Link to="/volunteers/list">
            <Button variant="ghost">Open Volunteer Registry</Button>
          </Link>
        </div>
      </div>

      <VolunteerPickerModal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        title={`Add Volunteer to ${pickerDepartment}`}
        department={pickerDepartment}
        date={roster.date}
        selectedVolunteerIds={assignedVolunteerIds}
        multiSelect
        onConfirm={(selectedIds) => {
          selectedIds.forEach((volunteerId) => {
            addMutation.mutate({
              volunteerId,
              department: pickerDepartment,
              role: `${pickerDepartment} volunteer`,
            });
          });
        }}
      />

      <Modal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        title="Publish Roster"
        description={`This will notify ${orderedAssignments.length} volunteers of their assignments.`}
      >
        <div className="space-y-4">
          <p className="text-sm text-white/60">
            Confirm publishing to lock in the current assignments and notify the team.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="subtle" onClick={() => setShowPublishModal(false)}>
              Cancel
            </Button>
            <Button variant="secondary" disabled={publishMutation.isPending} onClick={() => publishMutation.mutate()}>
              Confirm &amp; Notify
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAutoModal}
        onClose={() => {
          setShowAutoModal(false);
          setAutoPreview([]);
        }}
        title="Auto-Generate Roster"
        description="Choose how many volunteers you need in each department, preview the selection, then confirm."
        size="lg"
      >
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            {departments.map((department) => (
              <Input
                key={department}
                label={department}
                type="number"
                min="0"
                value={autoCounts[department] || 0}
                onChange={(event) =>
                  setAutoCounts((current) => ({
                    ...current,
                    [department]: event.target.value,
                  }))
                }
              />
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              disabled={autoPreviewMutation.isPending}
              onClick={() => autoPreviewMutation.mutate()}
            >
              Generate Preview
            </Button>
            <Button
              variant="secondary"
              disabled={!autoPreview.length || autoApplyMutation.isPending}
              onClick={() => autoApplyMutation.mutate()}
            >
              Confirm Selection
            </Button>
          </div>

          {autoPreview.length ? (
            <div className="space-y-3">
              {autoPreview.map((group) => (
                <div key={group.department} className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-4">
                  <p className="font-semibold text-white">{group.department}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.volunteers.map((volunteer) => (
                      <span
                        key={volunteer._id || volunteer.id}
                        className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent"
                      >
                        {volunteer.memberName}
                      </span>
                    ))}
                    {!group.volunteers.length ? (
                      <span className="text-sm text-white/45">No available volunteers found.</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </Modal>
    </AppShell>
  );
}
