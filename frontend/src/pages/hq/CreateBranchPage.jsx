import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import { AnalyticsPage } from '../../components/analytics/AnalyticsWidgets';
import { createBranch, getAllBranches } from '../../api/endpoints/branches';
import { getUsers } from '../../api/endpoints/users';
import useAnalyticsAccess from '../../hooks/useAnalyticsAccess';
import { supabaseUpload } from '../../utils/supabaseUpload';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

const schema = z.object({
  branchName: z.string().min(2, 'Branch name is required.'),
  branchCode: z.string().min(2, 'Branch code is required.'),
  headPastorId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Enter a valid email address.').optional().or(z.literal('')),
  gpsLat: z.string().optional(),
  gpsLng: z.string().optional(),
  establishedDate: z.string().optional(),
  parentBranchId: z.string().optional(),
  isHeadquarters: z.boolean().default(false),
});

export default function CreateBranchPage() {
  const navigate = useNavigate();
  const { canManageBranches } = useAnalyticsAccess();
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      branchName: '',
      branchCode: '',
      headPastorId: '',
      address: '',
      city: '',
      country: '',
      phone: '',
      email: '',
      gpsLat: '',
      gpsLng: '',
      establishedDate: '',
      parentBranchId: '',
      isHeadquarters: false,
    },
  });

  const usersQuery = useQuery({
    queryKey: ['create-branch-users'],
    queryFn: () => getUsers({ limit: 100 }),
    enabled: canManageBranches,
  });
  const branchesQuery = useQuery({
    queryKey: ['create-branch-parent-options'],
    queryFn: () => getAllBranches(),
    enabled: canManageBranches,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createBranch(payload),
    onSuccess: (branch) => {
      showSuccessToast('Branch created successfully.');
      navigate(`/hq/branches/${branch.branchId}`);
    },
    onError: (error) => showErrorToast(error.message || 'Unable to create branch.'),
  });

  const handleLogoUpload = async (file) => {
    if (!file) return;
    try {
      setUploading(true);
      const uploadedUrl = await supabaseUpload(file, 'church-media', `branches/${Date.now()}-${file.name}`);
      setLogoUrl(uploadedUrl);
      showSuccessToast('Branch logo uploaded.');
    } catch (error) {
      showErrorToast(error.message || 'Logo upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = form.handleSubmit((values) => {
    const selectedPastor = (usersQuery.data?.items || usersQuery.data?.users || []).find(
      (user) => String(user.userId || user.id || user._id) === values.headPastorId,
    );
    createMutation.mutate({
      branchName: values.branchName,
      branchCode: values.branchCode,
      headPastorId: values.headPastorId || undefined,
      headPastorName: selectedPastor?.fullName || selectedPastor?.username || '',
      address: values.address,
      city: values.city,
      country: values.country,
      phone: values.phone,
      email: values.email,
      logoUrl,
      gpsCoordinates:
        values.gpsLat || values.gpsLng
          ? { lat: Number(values.gpsLat || 0), lng: Number(values.gpsLng || 0) }
          : undefined,
      establishedDate: values.establishedDate || undefined,
      parentBranchId: values.parentBranchId || undefined,
      isHeadquarters: values.isHeadquarters,
    });
  });

  if (!canManageBranches) {
    return (
      <AppShell>
        <EmptyState
          icon="BR"
          title="Branch creation unavailable"
          message="Your role does not have permission to create or modify branch profiles."
        />
      </AppShell>
    );
  }

  const users = usersQuery.data?.items || usersQuery.data?.users || [];
  const branches = branchesQuery.data?.items || [];

  return (
    <AppShell>
      <AnalyticsPage
        title="Create Branch"
        subtitle="Set up a new branch profile with leadership, contact details, hierarchy, and optional branding."
      >
        <Card>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <Input label="Branch Name" error={form.formState.errors.branchName?.message} {...form.register('branchName')} />
            <Input label="Branch Code" error={form.formState.errors.branchCode?.message} {...form.register('branchCode')} />

            <label className="block space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Head Pastor</span>
              <select className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white" {...form.register('headPastorId')}>
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.userId || user.id || user._id} value={user.userId || user.id || user._id}>
                    {user.fullName || user.username}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Parent Branch</span>
              <select className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white" {...form.register('parentBranchId')}>
                <option value="">None</option>
                {branches.map((branch) => (
                  <option key={branch.branchId} value={branch.branchId}>
                    {branch.branchName}
                  </option>
                ))}
              </select>
            </label>

            <Input label="Address" {...form.register('address')} />
            <Input label="City" {...form.register('city')} />
            <Input label="Country" {...form.register('country')} />
            <Input label="Phone" {...form.register('phone')} />
            <Input label="Email" error={form.formState.errors.email?.message} {...form.register('email')} />
            <Input label="GPS Latitude" {...form.register('gpsLat')} />
            <Input label="GPS Longitude" {...form.register('gpsLng')} />
            <Input label="Established Date" type="date" {...form.register('establishedDate')} />

            <label className="block space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Logo Upload</span>
              <input
                type="file"
                accept="image/*"
                className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
                onChange={(event) => handleLogoUpload(event.target.files?.[0])}
              />
              {logoUrl ? <p className="text-xs text-emerald-300">Logo uploaded successfully.</p> : null}
              {uploading ? <p className="text-xs text-white/55">Uploading...</p> : null}
            </label>

            <label className="mt-6 flex items-center gap-3 text-sm text-white/75">
              <input type="checkbox" className="rounded border-white/10 bg-[#101827]" {...form.register('isHeadquarters')} />
              Mark this branch as headquarters
            </label>

            <div className="md:col-span-2 flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => navigate('/hq/branches')}>
                Cancel
              </Button>
              <Button variant="secondary" type="submit" disabled={createMutation.isPending || uploading}>
                {createMutation.isPending ? 'Creating...' : 'Create Branch'}
              </Button>
            </div>
          </form>
        </Card>
      </AnalyticsPage>
    </AppShell>
  );
}
