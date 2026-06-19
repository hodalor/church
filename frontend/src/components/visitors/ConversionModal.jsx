import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import useBranchOptions from '../../hooks/useBranchOptions';

const membershipOptions = ['visitor', 'new_convert', 'member', 'worker', 'leader', 'clergy'];
const baptismOptions = ['not_baptised', 'water', 'holy_spirit', 'both'];

export default function ConversionModal({ isOpen, visitor, onClose, onConvert, isLoading = false }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    gender: '',
    branch: '',
    membershipStatus: 'member',
    baptismStatus: 'not_baptised',
    salvationDate: '',
  });
  const { branchOptions } = useBranchOptions({ includeCurrent: form.branch });

  useEffect(() => {
    if (!visitor) {
      return;
    }

    setForm({
      firstName: visitor.firstName || '',
      lastName: visitor.lastName || '',
      phone: visitor.phone || '',
      email: visitor.email || '',
      gender: visitor.gender || '',
      branch: visitor.branch || '',
      membershipStatus: 'member',
      baptismStatus: 'not_baptised',
      salvationDate: '',
    });
  }, [visitor]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Convert to Member"
      description="This will create a formal member record and close the visitor profile."
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="First Name" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} />
          <Input label="Last Name" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} />
          <Input label="Phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          <Input label="Email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          <Input label="Gender" value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))} />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">Branch</span>
            <select
              value={form.branch}
              onChange={(event) => setForm((current) => ({ ...current, branch: event.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none"
            >
              <option value="">Select branch</option>
              {branchOptions.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">Membership Status</span>
            <select
              value={form.membershipStatus}
              onChange={(event) => setForm((current) => ({ ...current, membershipStatus: event.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none"
            >
              {membershipOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">Baptism Status</span>
            <select
              value={form.baptismStatus}
              onChange={(event) => setForm((current) => ({ ...current, baptismStatus: event.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none"
            >
              {baptismOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Salvation Date"
            type="date"
            value={form.salvationDate}
            onChange={(event) => setForm((current) => ({ ...current, salvationDate: event.target.value }))}
          />
        </div>

        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/8 px-4 py-3 text-sm text-amber-100">
          This will create a formal member record and close the visitor profile.
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => onConvert?.(form)} disabled={isLoading}>
            {isLoading ? 'Converting...' : 'Convert & Create Member Profile'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
