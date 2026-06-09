import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import SearchInput from '../ui/SearchInput';
import ReliabilityScore from './ReliabilityScore';
import { getAvailableVolunteers } from '../../api/endpoints/volunteers';
import { buildVolunteerName } from '../../utils/volunteers';

export default function VolunteerPickerModal({
  isOpen,
  onClose,
  title = 'Select Volunteers',
  department,
  date,
  selectedVolunteerIds = [],
  multiSelect = false,
  onConfirm,
}) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const volunteersQuery = useQuery({
    queryKey: ['volunteer-picker', department, date],
    queryFn: () =>
      getAvailableVolunteers({
        department: department || undefined,
        date: date || undefined,
      }),
    enabled: isOpen,
  });

  const items = useMemo(() => {
    const baseItems = volunteersQuery.data?.items || volunteersQuery.data || [];
    return baseItems.filter((item) =>
      buildVolunteerName(item).toLowerCase().includes(search.trim().toLowerCase()),
    );
  }, [search, volunteersQuery.data]);

  const toggleVolunteer = (volunteerId) => {
    if (!multiSelect) {
      setSelectedIds([volunteerId]);
      return;
    }

    setSelectedIds((current) =>
      current.includes(volunteerId)
        ? current.filter((id) => id !== volunteerId)
        : [...current, volunteerId],
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description="Available volunteers are sorted by reliability score."
      size="lg"
    >
      <div className="space-y-4">
        <SearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search volunteer"
        />

        <div className="space-y-3">
          {items.map((volunteer) => {
            const volunteerId = volunteer._id || volunteer.id;
            const disabled = selectedVolunteerIds.includes(volunteerId);
            const active = selectedIds.includes(volunteerId);

            return (
              <button
                key={volunteerId}
                type="button"
                disabled={disabled}
                onClick={() => toggleVolunteer(volunteerId)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                  disabled
                    ? 'cursor-not-allowed border-white/5 bg-white/5 text-white/25'
                    : active
                      ? 'border-accent/40 bg-accent/10 text-white'
                      : 'border-white/10 bg-[#101827] text-white/80 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  {volunteer.memberPhoto ? (
                    <img
                      src={volunteer.memberPhoto}
                      alt={buildVolunteerName(volunteer)}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                      {buildVolunteerName(volunteer).slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-white">{buildVolunteerName(volunteer)}</p>
                    <p className="text-xs text-white/45">
                      {(volunteer.departments || []).join(', ') || volunteer.primaryDepartment || 'Volunteer'}
                    </p>
                  </div>
                </div>
                <div className="w-24">
                  <ReliabilityScore score={volunteer.performance?.reliabilityScore || 0} />
                </div>
              </button>
            );
          })}

          {!items.length ? (
            <div className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-8 text-center text-sm text-white/45">
              No available volunteers found.
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            disabled={!selectedIds.length}
            onClick={() => {
              onConfirm?.(selectedIds);
              setSelectedIds([]);
            }}
          >
            Add Volunteer{selectedIds.length > 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
