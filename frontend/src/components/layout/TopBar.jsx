import { LogOut, Menu } from 'lucide-react';
import Button from '../ui/Button';
import NotificationBell from './NotificationBell';
import { useAuth } from '../../hooks/useAuth';
import { useCapabilities } from '../../hooks/useCapabilities';
import { useTenant } from '../../hooks/useTenant';
import { useBrandingStore } from '../../stores/brandingStore';

export default function TopBar({ onMenuClick }) {
  const { user, role, logout } = useAuth();
  const { hasCapability } = useCapabilities();
  const { churchName } = useTenant();
  const globalBranding = useBrandingStore((state) => state.globalBranding);
  const tenantBranding = useBrandingStore((state) => state.tenantBranding);
  const workspaceName = tenantBranding.appName || churchName || 'Church Workspace';
  const logoUrl = tenantBranding.logoUrl || globalBranding.logoUrl;
  const workspaceTagline = tenantBranding.tagline || 'Tenant workspace';
  const canViewNotifications = hasCapability('notifications.view');

  return (
    <header className="sticky top-0 z-30 flex w-full items-center justify-between border-b border-white/8 bg-[#09101c]/92 px-4 py-3 text-white backdrop-blur xl:px-6">
      <div className="flex items-center gap-4">
        <Button variant="subtle" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={workspaceName} className="h-11 w-11 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-sm font-semibold text-accent">
              {workspaceName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-white">{workspaceName}</p>
            <p className="text-xs text-white/40">{workspaceTagline}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {canViewNotifications ? <NotificationBell inboxPath="/communication/inbox" /> : null}
        <div className="hidden text-right md:block">
          <p className="text-sm font-semibold text-white">{user?.username || 'Guest User'}</p>
          <p className="text-xs text-white/40">{role || 'guest'}</p>
        </div>
        <Button variant="subtle" onClick={logout} className="h-11 w-11 px-0 sm:h-auto sm:w-auto sm:px-4 sm:py-2.5">
          <LogOut className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
