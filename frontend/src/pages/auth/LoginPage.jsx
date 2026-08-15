import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  GraduationCap,
  LayoutGrid,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  User,
} from 'lucide-react';
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
          href: 'https://eduprynova.com',
        },
        {
          id: 'app-2',
          title: 'Business Management System',
          description: 'Manage sales, inventory, finance, and growth.',
          href: 'https://prynovatech.com/business',
        },
        {
          id: 'app-3',
          title: 'More Solutions',
          description: 'Powerful platforms built to help your ministry thrive.',
          href: 'https://prynovatech.com',
        },
      ];

  const solutionIconFor = (app, index) => {
    const haystack = `${app.title || ''} ${app.description || ''}`.toLowerCase();
    if (/edu|school|student|academy|learn/.test(haystack)) return <GraduationCap className="h-5 w-5" />;
    if (/pos|shop|store|sale|inventory|business|commerce|retail|cart|point/.test(haystack)) return <ShoppingCart className="h-5 w-5" />;
    if (/suite|platform|product|more|other|solution|eco/.test(haystack)) return <LayoutGrid className="h-5 w-5" />;
    if (index === 0) return <GraduationCap className="h-5 w-5" />;
    if (index === 1) return <ShoppingCart className="h-5 w-5" />;
    return <Sparkles className="h-5 w-5" />;
  };

  return (
    <div className="min-h-screen bg-[#050915] text-white">
      <div
        className="relative min-h-screen overflow-hidden"
        style={{
          backgroundImage: authBranding.backgroundImageUrl
            ? `radial-gradient(ellipse at center, rgba(5,10,22,0) 42%, rgba(3,7,18,0.82) 82%, rgba(2,6,16,0.95) 100%), url(${authBranding.backgroundImageUrl})`
            : 'radial-gradient(ellipse at center, rgba(9,15,34,0.85) 0%, rgba(3,7,18,0.98) 100%)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: authBranding.backgroundImageUrl ? '100% 100%, contain' : 'auto',
          backgroundPosition: authBranding.backgroundImageUrl ? 'center center, center 38%' : undefined,
          backgroundColor: '#050915',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage:
            'radial-gradient(circle at 8% 12%, rgba(201,168,76,0.10), transparent 32%), radial-gradient(circle at 92% 88%, rgba(59,130,246,0.08), transparent 36%), linear-gradient(180deg, rgba(2,6,16,0.16), rgba(2,6,16,0.38))',
        }} />
        <div className="relative grid min-h-screen lg:grid-cols-[1.12fr_0.88fr]">
          <div className="flex px-6 py-7 sm:px-10 lg:px-14 lg:py-10">
            <div className="flex w-full flex-col justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute -inset-[2px] rounded-[1.3rem] bg-[conic-gradient(from_140deg_at_50%_50%,rgba(217,181,93,0.9),rgba(245,224,162,0.22),rgba(217,181,93,0.9))]" />
                    <img
                      src={authLogo}
                      alt={authBranding.appName}
                      className="relative h-14 w-14 rounded-[1.25rem] object-cover border border-black/40 shadow-[0_14px_30px_rgba(0,0,0,0.45)]"
                    />
                  </div>
                  <div>
                    <p className="text-[2.05rem] font-black uppercase tracking-[0.06em] text-white sm:text-[2.6rem] leading-none">
                      {authBranding.appName}
                    </p>
                    <p className="mt-2 text-[15px] font-semibold tracking-wide text-[#e8c56a]">{authBranding.tagline}</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 max-w-md">
                <p className="text-[10px] uppercase tracking-[0.38em] text-white/48">More solutions by Prynova</p>
                <div className="mt-4 inline-block w-fit border-t border-white/6 pt-2 min-w-[400px]">
                  {promotedApps.slice(0, 3).map((app, index) => {
                    const href = app.href && app.href.trim() !== '' ? app.href : '';
                    const isClickable = Boolean(href) && href !== '#';
                    return (
                      <div
                        key={app.id || `${href}-${index}`}
                        className={`border-b border-white/6 last:border-b-0`}
                      >
                        <a
                          href={href || '#'}
                          target={isClickable ? '_blank' : undefined}
                          rel={isClickable ? 'noreferrer' : undefined}
                          aria-disabled={!isClickable}
                          onClick={isClickable ? undefined : (e) => e.preventDefault()}
                          className={`group flex items-center gap-4 py-3 transition ${
                            isClickable
                              ? 'hover:bg-white/[0.03] -mx-2 rounded-2xl px-2 cursor-pointer'
                              : 'cursor-not-allowed text-white/70 -mx-2 rounded-2xl px-2'
                          }`}
                        >
                          <div className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[1.1rem] border border-white/10 bg-[rgba(10,17,34,0.88)] ${isClickable ? 'text-[#e8c56a]' : 'text-white/50'}`}>
                            {solutionIconFor(app, index)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[15px] font-semibold uppercase tracking-[0.04em] text-white">
                              {app.title || `Solution ${index + 1}`}
                            </p>
                            <p className="mt-1 text-[13px] leading-5 text-white/62">
                              {app.description || (isClickable ? href : 'Add a name, short description, and link in Settings → Config → Promoted Solutions.')}
                            </p>
                          </div>
                          <ArrowRight className={`h-4 w-4 shrink-0 transition ${isClickable ? 'text-white/45 group-hover:text-[#e8c56a] group-hover:translate-x-0.5' : 'text-white/20'}`} />
                        </a>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/55">
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#e8c56a]" />
                    Secure
                  </span>
                  <span className="inline-flex items-center justify-center h-1 w-1 rounded-full bg-white/25" />
                  <span className="inline-flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#e8c56a]" />
                    Cloud Based
                  </span>
                  <span className="inline-flex items-center justify-center h-1 w-1 rounded-full bg-white/25" />
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#e8c56a]" />
                    Reliable Support
                  </span>
                </div>

              </div>
            </div>
          </div>

          <div className="flex items-center justify-center px-4 py-5 sm:px-6 lg:px-10">
            <div className="relative w-full max-w-lg">
              <div className="absolute -inset-[1.5px] rounded-[1.8rem] bg-[linear-gradient(140deg,rgba(217,181,93,0.7),rgba(250,230,170,0.15)_35%,rgba(250,230,170,0.12)_65%,rgba(217,181,93,0.55))] opacity-90 blur-[0.3px]" />
              <div className="absolute inset-0 rounded-[1.8rem] shadow-[0_0_120px_rgba(217,181,93,0.08)]" />
              <Card className="relative w-full rounded-[1.75rem] border border-[#e8c56a]/40 bg-[linear-gradient(180deg,rgba(11,18,36,0.92),rgba(6,12,26,0.98))] p-5 text-white shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-7 overflow-hidden">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(ellipse_at_top,rgba(232,197,106,0.16),transparent_60%)]" />
                <div className="relative flex justify-center">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl border border-[#e8c56a]/45 bg-[#e8c56a]/10 text-[#f2d98f] shadow-[0_10px_30px_rgba(232,197,106,0.12)]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>
                <form className="relative mt-5 space-y-4" onSubmit={handleSubmit(onSubmit)}>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-[34px] h-[18px] w-[18px] text-[#e8c56a]/90" />
                    <div className="pl-11">
                      <Input
                        label="Church ID"
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
                    </div>
                  </div>

                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-[34px] h-[18px] w-[18px] text-[#e8c56a]/90" />
                    <div className="pl-11">
                      <Input
                        label="Username or Phone"
                        placeholder="Enter your username or phone"
                        error={errors.username?.message}
                        {...register('username')}
                      />
                    </div>
                  </div>

                  <div>
                    <span className="mb-2 block text-sm font-medium text-white/80">PIN</span>
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
                    className="w-full border border-[#e8c56a]/55 bg-[linear-gradient(180deg,#e0bd60,#c99b2f)] text-[15px] font-semibold text-[#111827] shadow-[0_14px_30px_rgba(201,155,47,0.22)] hover:brightness-105"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner />
                        Signing in...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 opacity-90" />
                        Access Workspace
                      </span>
                    )}
                  </Button>
                </form>

                <div className="relative mt-5 border-t border-white/10 pt-4 text-center text-sm text-white/50">
                  <span>{new Date().getFullYear()} Prynova Technologies. All rights reserved.</span>
                  <span className="mx-3 text-white/20">|</span>
                  <Link to="/manual" className="font-semibold text-[#e3c77f] transition hover:text-[#f2d98f]">
                    Open manual
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
