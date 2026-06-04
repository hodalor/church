import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import CapabilityMatrix from '../access/CapabilityMatrix';
import { createUser, updateUser } from '../../api/endpoints/users';
import {
  getRoleDefaultCapabilities,
  normalizeCapabilities,
  userRoleOptions,
} from '../../constants/capabilities';

const buildInitialState = (allowedCapabilities = [], defaultRole = 'associate_pastor', user = null) => {
  const nextRole = user?.role || defaultRole;
  const normalizedAllowedCapabilities = normalizeCapabilities(allowedCapabilities);

  return {
    username: user?.username || '',
    pin: '',
    role: nextRole,
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    allBranches: user?.allBranches !== false,
    assignedBranches: user?.assignedBranches || [],
    memberId: user?.memberId || '',
    photoUrl: user?.photoUrl || '',
    capabilities: normalizeCapabilities(
      user?.capabilities || getRoleDefaultCapabilities(nextRole),
      normalizedAllowedCapabilities,
    ).filter((capability) => normalizedAllowedCapabilities.includes(capability)),
  };
};

export default function UserFormModal({
  isOpen,
  onClose,
  onCreated,
  tenantId,
  allowedCapabilities,
  title = 'Add Staff User',
  description = 'Create a staff account and choose exactly what they can do.',
  defaultRole = 'associate_pastor',
  availableBranches = [],
  user = null,
  onSaved,
}) {
  const normalizedAllowedCapabilities = useMemo(
    () => normalizeCapabilities(allowedCapabilities),
    [allowedCapabilities],
  );
  const isEditing = Boolean(user?._id);
  const [form, setForm] = useState(
    buildInitialState(normalizedAllowedCapabilities, defaultRole, user),
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setError('');
      return;
    }

    setForm(buildInitialState(normalizedAllowedCapabilities, defaultRole, user));
    setError('');
  }, [defaultRole, isOpen, normalizedAllowedCapabilities, user]);

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEditing
        ? updateUser(user._id, payload, tenantId ? { tenantId } : undefined)
        : createUser(payload),
    onSuccess: (data) => {
      onCreated?.(data);
      onSaved?.(data);
      onClose();
    },
    onError: (mutationError) => {
      setError(
        mutationError.response?.data?.message ||
          `Unable to ${isEditing ? 'update' : 'create'} user right now.`,
      );
    },
  });

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleRoleChange = (nextRole) => {
    updateField('role', nextRole);
    updateField(
      'capabilities',
      normalizeCapabilities(getRoleDefaultCapabilities(nextRole), normalizedAllowedCapabilities).filter(
        (capability) => normalizedAllowedCapabilities.includes(capability),
      ),
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!tenantId) {
      setError('Select a tenant before creating a user.');
      return;
    }

    if (!form.username.trim()) {
      setError('Username is required.');
      return;
    }

    if (!isEditing && !form.pin.trim()) {
      setError('PIN is required for new users.');
      return;
    }

    if (!form.capabilities.length) {
      setError('Select at least one user capability.');
      return;
    }

    const payload = {
      ...form,
      capabilities: normalizeCapabilities(form.capabilities, normalizedAllowedCapabilities),
    };

    if (!isEditing) {
      payload.tenantId = tenantId;
    }

    if (isEditing && !form.pin.trim()) {
      delete payload.pin;
    }

    mutation.mutate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="xl"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="space-y-4 rounded-[24px] border border-white/10 bg-[#101827] p-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-accent">User Details</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Staff account profile</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Full Name"
                value={form.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
                placeholder="Pastor Michael Doe"
              />
              <Input
                label="Username"
                value={form.username}
                onChange={(event) => updateField('username', event.target.value)}
                placeholder="michael"
              />
              <Input
                label="PIN"
                value={form.pin}
                onChange={(event) => updateField('pin', event.target.value)}
                placeholder={isEditing ? 'Leave blank to keep current PIN' : '0903'}
              />
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/80">Role</span>
                <select
                  value={form.role}
                  onChange={(event) => handleRoleChange(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none focus:border-accent"
                >
                  {userRoleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                label="Email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="pastor@church.org"
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                placeholder="+233..."
              />
              <label className="block space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-white/80">Branch Scope</span>
                <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0b1120] p-4">
                  <label className="flex items-center gap-3 text-sm text-white/75">
                    <input
                      type="checkbox"
                      checked={form.allBranches}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          allBranches: event.target.checked,
                          assignedBranches: event.target.checked ? [] : current.assignedBranches,
                        }))
                      }
                    />
                    Access all branches in this church
                  </label>
                  <label className="block space-y-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-white/45">
                      Assigned Branches
                    </span>
                    <select
                      multiple
                      disabled={form.allBranches}
                      value={form.assignedBranches}
                      onChange={(event) =>
                        updateField(
                          'assignedBranches',
                          Array.from(event.target.selectedOptions, (option) => option.value),
                        )
                      }
                      className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none focus:border-accent disabled:opacity-50"
                    >
                      {availableBranches.map((branch) => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </label>
              <Input
                label="Member ID"
                value={form.memberId}
                onChange={(event) => updateField('memberId', event.target.value)}
                placeholder="calvary-000001"
              />
              <Input
                label="Photo URL"
                value={form.photoUrl}
                onChange={(event) => updateField('photoUrl', event.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <CapabilityMatrix
            title="User Capabilities"
            description="Choose what this user can open and what actions they can perform."
            value={form.capabilities}
            onChange={(nextValue) => updateField('capabilities', nextValue)}
            allowedCapabilities={normalizedAllowedCapabilities}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          {error ? <p className="text-sm text-red-400">{error}</p> : <p className="text-sm text-white/45">User capabilities cannot exceed the church tenant permissions.</p>}
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" disabled={mutation.isPending}>
              {mutation.isPending
                ? isEditing
                  ? 'Saving...'
                  : 'Creating...'
                : isEditing
                  ? 'Save Staff User'
                  : 'Create Staff User'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
