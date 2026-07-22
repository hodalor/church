import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, ShieldCheck, Sparkles } from 'lucide-react';
import { z } from 'zod';
import logo from '../../assets/logo.svg';
import { getPublicBranding } from '../../api/endpoints/auth';
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
  const updateGlobalBranding = useBrandingStore((state) => state.updateGlobalBranding);
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const brandingQuery = useQuery({
    queryKey: ['public-auth-branding'],
    queryFn: getPublicBranding,
    staleTime: 5 * 60 * 1000,
  });
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

  useEffect(() => {
    if (!brandingQuery.data) {
      return;
    }

    updateGlobalBranding(brandingQuery.data);
  }, [brandingQuery.data, updateGlobalBranding]);

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

  const authBranding = {
    appName: globalBranding.appName || 'Ecclesia',
    logoUrl: globalBranding.logoUrl || '',
    tagline: globalBranding.tagline || 'Church OS',
    heroTitle: globalBranding.heroTitle || 'Secure church operations in one elegant workspace.',
    heroSubtitle: globalBranding.heroSubtitle || 'Sign in to the master console or your church tenant dashboard.',
    backgroundImageUrl: globalBranding.backgroundImageUrl || '',
    promotedApps: Array.isArray(globalBranding.promotedApps) ? globalBranding.promotedApps : [],
  };
  const authLogo = authBranding.logoUrl || logo;
  const promotedApps = authBranding.promotedApps.length
    ? authBranding.promotedApps
    : [
        {
          id: 'app-1',
          title: 'EduPrynova',
          description: 'Your complete school management system.',
          href: '#',
        },
        {
          id: 'app-2',
          title: 'Business Management System',
          description: 'Manage sales, inventory, finance, and growth.',
          href: '#',
        },
      ];

  return (
    <div className="min-h-screen bg-[#030714] text-white">
      <div
        className="relative min-h-screen overflow-hidden"
        style={{
          backgroundImage: authBranding.backgroundImageUrl
            ? `linear-gradient(90deg, rgba(2,7,20,0.97), rgba(4,12,28,0.84)), radial-gradient(circle at top right, rgba(201,168,76,0.16), transparent 34%), url(${authBranding.backgroundImageUrl})`
            : 'linear-gradient(90deg, rgba(2,7,20,0.98), rgba(4,12,28,0.92)), radial-gradient(circle at top right, rgba(201,168,76,0.14), transparent 36%)',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,168,76,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_28%)]" />
        <div className="relative grid min-h-screen lg:grid-cols-[1.12fr_0.88fr]">
          <div className="flex px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
            <div className="flex w-full flex-col justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-4">
                  <img src={authLogo} alt={authBranding.appName} className="h-16 w-16 rounded-[1.4rem] object-cover shadow-lg shadow-black/30" />
                  <div>
                    <p className="text-[2rem] font-semibold uppercase tracking-[0.05em] text-white sm:text-[2.7rem]">
                      {authBranding.appName}
                    </p>
                    <p className="text-lg text-[#ebd59b]">{authBranding.tagline}</p>
                  </div>
                </div>
                <div className="mt-12 max-w-3xl">
                  <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                    {authBranding.heroTitle}
                  </h1>
                  <p className="mt-5 max-w-xl text-base leading-8 text-white/70 sm:text-lg">
                    {authBranding.heroSubtitle}
                  </p>
                </div>
              </div>

              <div className="mt-12 max-w-xl">
                <p className="text-[11px] uppercase tracking-[0.36em] text-white/42">More solutions by Prynova</p>
                <div className="mt-5 space-y-3">
                  {promotedApps.map((app) => (
                    <a
                      key={app.id || app.href}
                      href={app.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-4 rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 backdrop-blur transition hover:border-[#d9b55d]/45 hover:bg-white/[0.05]"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#d9b55d]/25 bg-[#d9b55d]/10 text-[#f4d98c]">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white">{app.title}</p>
                        <p className="mt-1 text-sm leading-6 text-white/62">{app.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-white/55 transition group-hover:text-[#f4d98c]" />
                    </a>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-white/55">
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#f4d98c]" />
                    Secure
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#f4d98c]" />
                    Cloud Based
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#f4d98c]" />
                    Reliable Support
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
            <Card className="w-full max-w-xl rounded-[2rem] border border-[#d9b55d]/30 bg-[linear-gradient(180deg,rgba(11,18,35,0.9),rgba(6,12,24,0.96))] p-8 text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur sm:p-10">
              <div className="flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#d9b55d]/45 bg-[#d9b55d]/10 text-[#f4d98c]">
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>
              <p className="mt-5 text-center text-sm uppercase tracking-[0.35em] text-[#e3c77f]">Welcome back</p>
              <h2 className="mt-3 text-center font-serif text-4xl font-semibold text-white sm:text-5xl">Sign in</h2>
              <p className="mt-3 text-center text-base text-white/65">Access your church workspace</p>

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
                  <span className="mb-2 block text-sm font-medium text-white/78">PIN</span>
                  <Controller
                    control={control}
                    name="pin"
                    render={({ field }) => (
                      <PinInput value={field.value} onChange={field.onChange} error={errors.pin?.message} />
                    )}
                  />
                </div>

                {error ? <p className="text-sm font-medium text-red-400">{error}</p> : null}

                <Button
                  type="submit"
                  className="w-full border border-[#d9b55d]/35 bg-[#d1aa47] text-base text-[#111827] hover:bg-[#ddb962]"
                  disabled={isLoading}
                >
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

              <div className="mt-8 border-t border-white/10 pt-5 text-center text-sm text-white/45">
                <span>{new Date().getFullYear()} Prynova Technologies. All rights reserved.</span>
                <span className="mx-3 text-white/20">|</span>
                <Link to="/manual" className="text-[#e3c77f] transition hover:text-[#f4d98c]">
                  Open manual
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
