import { useState } from 'react';
import Sidebar from './Sidebar';
import SuperAdminShell from './SuperAdminShell';
import TopBar from './TopBar';
import { useAuth } from '../../hooks/useAuth';
import ErrorBoundary from '../ui/ErrorBoundary';
import PageTransition from '../ui/PageTransition';

export default function AppShell({ children }) {
  const { role } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (role === 'super_admin') {
    return <SuperAdminShell>{children}</SuperAdminShell>;
  }

  return (
    <div className="h-screen overflow-hidden bg-[#060b14] text-white">
      <div className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(201,168,76,0.06),transparent_22%),linear-gradient(180deg,#060b14_0%,#050912_100%)]">
        <Sidebar isOpen={isOpen} onToggle={() => setIsOpen((current) => !current)} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <TopBar onMenuClick={() => setIsOpen(true)} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 lg:px-5 lg:py-5 xl:px-6">
            <ErrorBoundary>
              <PageTransition>{children}</PageTransition>
            </ErrorBoundary>
          </main>
        </div>
      </div>
      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-primary/30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      ) : null}
    </div>
  );
}
