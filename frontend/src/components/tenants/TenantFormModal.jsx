import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import PinInput from '../ui/PinInput';
import CapabilityMatrix from '../access/CapabilityMatrix';
import { createTenant } from '../../api/endpoints/tenants';
import {
  allCapabilities,
  getRoleDefaultCapabilities,
  normalizeCapabilities,
} from '../../constants/capabilities';
import { useBrandingStore } from '../../stores/brandingStore';
import { getCountryOptionByName, normalizeEligibleCountries } from '../../utils/platformConfig';
import { supabaseUpload } from '../../utils/supabaseUpload';

const plans = [
  { id: 'small', title: 'Small', description: 'For growing churches managing core operations.' },
  { id: 'medium', title: 'Medium', description: 'For multi-team churches with expanded reporting needs.' },
  { id: 'mega', title: 'Mega', description: 'For enterprise-scale churches and large ministry networks.' },
];

const buildInitialState = (eligibleCountries) => {
  const countryOption = getCountryOptionByName(eligibleCountries);

  return {
    tenantId: '',
    churchName: '',
    email: '',
    phone: '',
    country: countryOption?.name || '',
    subscriptionPlan: 'small',
    logoUrl: '',
    initialFullName: '',
    initialUsername: '',
    initialPin: '',
    confirmPin: '',
    capabilities: [...allCapabilities],
    initialUserCapabilities: normalizeCapabilities(
      getRoleDefaultCapabilities('head_pastor'),
      allCapabilities,
    ),
  };
};

export default function TenantFormModal({ isOpen, onClose, onCreated }) {
  const platformConfig = useBrandingStore((state) => state.platformConfig);
  const eligibleCountries = useMemo(
    () => normalizeEligibleCountries(platformConfig.eligibleCountries),
    [platformConfig.eligibleCountries],
  );
  const [form, setForm] = useState(buildInitialState(eligibleCountries));
  const [filePreview, setFilePreview] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setForm(buildInitialState(eligibleCountries));
      setFilePreview('');
      setError('');
    }
  }, [eligibleCountries, isOpen]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      initialUserCapabilities: normalizeCapabilities(current.capabilities, current.capabilities),
    }));
  }, [form.capabilities]);

  const tenantIdValidation = useMemo(() => {
    if (!form.tenantId) {
      return null;
    }

    return /^[a-z0-9-]{3,20}$/.test(form.tenantId)
      ? { valid: true, message: 'Tenant ID looks good.' }
      : { valid: false, message: 'Use 3-20 lowercase letters, numbers, or hyphens.' };
  }, [form.tenantId]);

  const mutation = useMutation({
    mutationFn: createTenant,
    onSuccess: (data) => {
      onCreated?.(data);
      onClose();
    },
    onError: (mutationError) => {
      const responseData = mutationError.response?.data;
      const validationMessage = responseData?.errors?.[0]?.msg;
      setError(
        validationMessage ||
          responseData?.message ||
          'Unable to register church right now.',
      );
    },
  });

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const extension = file.name.split('.').pop();
      const filePath = `${form.tenantId || 'tenant'}/logo.${extension}`;
      const url = await supabaseUpload(file, 'church-media', filePath);
      setFilePreview(URL.createObjectURL(file));
      updateField('logoUrl', url);
    } catch {
      setError('Unable to upload the church logo right now.');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!tenantIdValidation?.valid) {
      setError('Please provide a valid tenant ID slug.');
      return;
    }

    if (form.initialPin !== form.confirmPin) {
      setError('PIN confirmation does not match.');
      return;
    }

    if (!form.capabilities.length) {
      setError('Select at least one church capability.');
      return;
    }

    const selectedCountry = getCountryOptionByName(eligibleCountries, form.country);
    const payload = {
      tenantId: form.tenantId,
      churchName: form.churchName,
      email: form.email,
      phone: form.phone,
      country: form.country,
      financial: {
        currencyCode: selectedCountry?.currencyCode || 'USD',
        currencySymbol: selectedCountry?.currencySymbol || '$',
      },
      subscriptionPlan: form.subscriptionPlan,
      initialFullName: form.initialFullName,
      initialUsername: form.initialUsername,
      initialPin: form.initialPin,
      capabilities: normalizeCapabilities(form.capabilities, allCapabilities),
      initialUserCapabilities: normalizeCapabilities(form.capabilities, form.capabilities),
      ...(form.logoUrl ? { logoUrl: form.logoUrl } : {}),
    };

    mutation.mutate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Church"
      description="Create the tenant, choose enabled modules, and set the first church admin access."
      size="xl"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="space-y-4 rounded-[24px] border border-white/10 bg-[#101827] p-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-accent">Church Details</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Tenant profile</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Input
                  label="Tenant ID"
                  value={form.tenantId}
                  onChange={(event) => updateField('tenantId', event.target.value.toLowerCase())}
                  placeholder="calvary"
                />
                {tenantIdValidation ? (
                  <p className={`text-sm ${tenantIdValidation.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tenantIdValidation.message}
                  </p>
                ) : null}
              </div>
              <Input
                label="Church Name"
                value={form.churchName}
                onChange={(event) => updateField('churchName', event.target.value)}
                placeholder="Calvary Chapel"
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="info@calvary.org"
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                placeholder="+233..."
              />
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/80">Country</span>
                <select
                  value={form.country}
                  onChange={(event) => updateField('country', event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none focus:border-accent"
                >
                  {eligibleCountries.map((country) => (
                    <option key={country.name} value={country.name}>
                      {country.name} ({country.currencyCode})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/80">Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white/70"
                />
                {filePreview ? (
                  <img src={filePreview} alt="Church logo preview" className="h-20 w-20 rounded-2xl object-cover" />
                ) : null}
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => updateField('subscriptionPlan', plan.id)}
                  className={`rounded-[22px] border p-4 text-left ${
                    form.subscriptionPlan === plan.id
                      ? 'border-accent bg-accent/10'
                      : 'border-white/10 bg-[#0b1120]'
                  }`}
                >
                  <p className="text-lg font-semibold text-white">{plan.title}</p>
                  <p className="mt-2 text-sm text-white/60">{plan.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-[24px] border border-white/10 bg-[#101827] p-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-accent">Initial Admin</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Church admin profile</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Full Name"
                value={form.initialFullName}
                onChange={(event) => updateField('initialFullName', event.target.value)}
                placeholder="Lead pastor name"
              />
              <Input
                label="Username"
                value={form.initialUsername}
                onChange={(event) => updateField('initialUsername', event.target.value)}
                placeholder="headpastor"
              />
              <div>
                <span className="mb-2 block text-sm font-medium text-white/80">Initial PIN</span>
                <PinInput value={form.initialPin} onChange={(value) => updateField('initialPin', value)} />
              </div>
              <div>
                <span className="mb-2 block text-sm font-medium text-white/80">Confirm PIN</span>
                <PinInput value={form.confirmPin} onChange={(value) => updateField('confirmPin', value)} />
              </div>
            </div>
          </div>
        </div>

        <CapabilityMatrix
          title="Tenant Capabilities"
          description="Choose which menus and actions this church tenant should have."
          value={form.capabilities}
          onChange={(nextValue) => updateField('capabilities', nextValue)}
          allowedCapabilities={allCapabilities}
        />

        <div className="rounded-[24px] border border-emerald-400/20 bg-[linear-gradient(135deg,rgba(52,211,153,0.12),rgba(16,24,39,0.98))] p-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-200/80">Default Admin Access</p>
          <h3 className="mt-2 text-lg font-semibold text-white">First church admin gets full tenant access</h3>
          <p className="mt-2 text-sm text-white/65">
            Every feature you enable for this tenant is automatically assigned to the default church admin account.
          </p>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-sm text-white/75">
              Enabled tenant permissions: <span className="font-semibold text-white">{form.capabilities.length}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          {error ? <p className="text-sm text-red-400">{error}</p> : <p className="text-sm text-white/45">Tenant and first admin access are saved together.</p>}
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Registering...' : 'Create Tenant'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
