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

const extractMutationErrorMessage = (mutationError, fallbackMessage) => {
  const responseData = mutationError?.response?.data;
  const validationMessage = responseData?.errors?.[0]?.msg;
  return validationMessage || responseData?.message || mutationError?.message || fallbackMessage;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+()\-\s\d]{7,20}$/;
const pinPattern = /^\d{4,6}$/;

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
  const branchOptions = useMemo(
    () => [...new Set([...(user?.assignedBranches || []), ...availableBranches])],
    [availableBranches, user?.assignedBranches],
  );
  const isEditing = Boolean(user?._id);
  const [form, setForm] = useState(
    buildInitialState(normalizedAllowedCapabilities, defaultRole, user),
  );
  const [error, setError] = useState('');
  const lightInputProps = { labelClassName: 'text-slate-700' };

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
      setError(extractMutationErrorMessage(
        mutationError,
        `Unable to ${isEditing ? 'update' : 'create'} user right now.`,
      ));
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

    if (form.pin.trim() && !pinPattern.test(form.pin.trim())) {
      setError('PIN must be 4 to 6 digits only.');
      return;
    }

    if (form.email.trim() && !emailPattern.test(form.email.trim())) {
      setError('Email must be a valid email address.');
      return;
    }

    if (form.phone.trim() && !phonePattern.test(form.phone.trim())) {
      setError('Phone number format is invalid.');
      return;
    }

    if (form.photoUrl.trim()) {
      try {
        // Match backend URL validation before sending the request.
        // eslint-disable-next-line no-new
        new URL(form.photoUrl.trim());
      } catch {
        setError('Photo URL must be a valid full link.');
        return;
      }
    }

    if (!form.allBranches && !form.assignedBranches.length) {
      setError('Select at least one assigned branch or enable all branches.');
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
      tone="light"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="space-y-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-accent">User Details</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">Staff account profile</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Full Name"
                value={form.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
                placeholder="Pastor Michael Doe"
                {...lightInputProps}
              />
              <Input
                label="Username"
                value={form.username}
                onChange={(event) => updateField('username', event.target.value)}
                placeholder="michael"
                {...lightInputProps}
              />
              <Input
                label="PIN"
                value={form.pin}
                onChange={(event) => updateField('pin', event.target.value)}
                placeholder={isEditing ? 'Leave blank to keep current PIN' : '0903'}
                {...lightInputProps}
              />
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Role</span>
                <select
                  value={form.role}
                  onChange={(event) => handleRoleChange(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-accent"
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
                {...lightInputProps}
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                placeholder="+233..."
                {...lightInputProps}
              />
              <label className="block space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Branch Scope</span>
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="flex items-center gap-3 text-sm text-slate-700">
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
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Assigned Branches
                    </span>
                    <select
                      multiple
                      disabled={form.allBranches || !branchOptions.length}
                      value={form.assignedBranches}
                      onChange={(event) =>
                        updateField(
                          'assignedBranches',
                          Array.from(event.target.selectedOptions, (option) => option.value),
                        )
                      }
                      className="min-h-[120px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-accent disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      {!branchOptions.length ? (
                        <option value="">No live branches created yet</option>
                      ) : null}
                      {branchOptions.map((branch) => (
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
                {...lightInputProps}
              />
              <Input
                label="Photo URL"
                value={form.photoUrl}
                onChange={(event) => updateField('photoUrl', event.target.value)}
                placeholder="https://..."
                {...lightInputProps}
              />
            </div>
          </div>

          <CapabilityMatrix
            title="User Capabilities"
            description="Choose what this user can open and what actions they can perform."
            value={form.capabilities}
            onChange={(nextValue) => updateField('capabilities', nextValue)}
            allowedCapabilities={normalizedAllowedCapabilities}
            tone="light"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          {error ? <p className="text-sm text-red-600">{error}</p> : <p className="text-sm text-slate-500">User capabilities cannot exceed the church tenant permissions.</p>}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            >
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
