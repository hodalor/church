import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import logo from '../../assets/logo.svg';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import PinInput from '../../components/ui/PinInput';
import Spinner from '../../components/ui/Spinner';
import { useAuthStore } from '../../stores/authStore';
import { useBrandingStore } from '../../stores/brandingStore';

const loginSchema = z.object({
  tenantId: z
    .string()
    .trim()
    .min(3, 'Tenant ID must be at least 3 characters.')
    .max(20, 'Tenant ID must be 20 characters or fewer.')
    .regex(/^[a-z0-9-]+$/, 'Tenant ID must contain only lowercase letters, numbers, and hyphens.'),
  username: z.string().trim().min(2, 'Username or phone must be at least 2 characters.').max(30),
  pin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4 to 6 digits.'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const globalBranding = useBrandingStore((state) => state.globalBranding);
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const {
    control,
    handleSubmit,
    register,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      tenantId: '',
      username: '',
      pin: '',
    },
  });

  useEffect(() => () => clearError(), [clearError]);

  const onSubmit = async (values) => {
    clearError();
    try {
      const role = await login(values);

      if (role === 'super_admin') {
        navigate('/superadmin/dashboard', { replace: true });
        return;
      }

      navigate('/dashboard', { replace: true });
    } catch {
      // Store state already holds the error message for inline rendering.
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden border-r border-white/10 bg-[#0b1120] px-14 py-16 lg:flex lg:items-center">
          <div className="absolute left-10 top-16 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute bottom-16 right-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative max-w-md">
            <div className="flex items-center gap-4">
              <img src={logo} alt={globalBranding.appName || 'Prynova'} className="h-12 w-auto" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-accent/80">
                  {globalBranding.appName || 'Ecclesia'}
                </p>
                <p className="mt-1 text-sm text-white/55">{globalBranding.tagline || 'Church OS'}</p>
              </div>
            </div>
            <h1 className="mt-10 text-5xl font-semibold leading-tight text-white">
              Secure church operations in one elegant workspace.
            </h1>
            <p className="mt-5 max-w-sm text-base leading-7 text-white/60">
              Sign in to the master console or your church tenant dashboard.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <Card className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#111827] p-8 text-white shadow-2xl shadow-black/20 sm:p-10">
            <p className="text-sm uppercase tracking-[0.35em] text-accent">Welcome back</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Sign in</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">
              Access the platform with your tenant ID, username or phone number, and PIN.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <Input
                label="Tenant ID"
                placeholder="e.g. calvary"
                error={errors.tenantId?.message}
                {...register('tenantId', {
                  onChange: (event) => {
                    setValue('tenantId', event.target.value.toLowerCase(), {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  },
                })}
              />

              <Input
                label="Username or Phone"
                placeholder="Enter your username or phone"
                error={errors.username?.message}
                {...register('username')}
              />

              <div>
                <span className="mb-2 block text-sm font-medium text-primary/80">PIN</span>
                <Controller
                  control={control}
                  name="pin"
                  render={({ field }) => (
                    <PinInput value={field.value} onChange={field.onChange} error={errors.pin?.message} />
                  )}
                />
              </div>

              {error ? (
                <p className="text-sm font-medium text-red-600">{error}</p>
              ) : null}

              <Button type="submit" className="w-full text-base" disabled={isLoading}>
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner />
                    Signing in...
                  </span>
                ) : (
                  'Access Workspace'
                )}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
