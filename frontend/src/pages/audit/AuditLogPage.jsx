import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Download, History, ShieldAlert } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Input from '../../components/ui/Input';
import PageHeader from '../../components/ui/PageHeader';
import {
  getAuditLogs,
  getExportHistory,
  getLoginHistory,
  getSuspiciousActivity,
} from '../../api/endpoints/audit';
import { downloadCsvFile, downloadJsonFile } from '../../utils/exportData';

const formatDateTime = (value) => {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return parsed.toLocaleString();
};

const formatLabel = (value) =>
  String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());

function Badge({ children, className = 'bg-white/10 text-white/75' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${className}`}>
      {children}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, helper }) {
  const tones = {
    'Audit Events': 'bg-[linear-gradient(135deg,rgba(56,189,248,0.16),rgba(14,22,36,0.98))]',
    'Suspicious Events': 'bg-[linear-gradient(135deg,rgba(251,113,133,0.16),rgba(14,22,36,0.98))]',
    'Login Events': 'bg-[linear-gradient(135deg,rgba(167,139,250,0.16),rgba(14,22,36,0.98))]',
    Exports: 'bg-[linear-gradient(135deg,rgba(244,201,93,0.18),rgba(14,22,36,0.98))]',
  };
  return (
    <Card className={`min-h-[102px] p-3.5 ${tones[label] || ''}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="inline-flex rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-white/75">{label}</p>
        <Icon className="h-5 w-5 text-accent" />
      </div>
      <p className="mt-3 font-serif text-[2rem] font-semibold leading-none text-white">{value}</p>
      {helper ? <p className="mt-2 text-xs text-white/40">{helper}</p> : null}
    </Card>
  );
}

export default function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [tab, setTab] = useState('logs');

  const auditQuery = useQuery({
    queryKey: ['phase11-audit-logs', search, moduleFilter, actionFilter, suspiciousOnly],
    queryFn: () =>
      getAuditLogs({
        limit: 50,
        search: search || undefined,
        module: moduleFilter || undefined,
        action: actionFilter || undefined,
        isSuspicious: suspiciousOnly || undefined,
      }),
  });
  const suspiciousQuery = useQuery({
    queryKey: ['phase11-audit-suspicious'],
    queryFn: getSuspiciousActivity,
  });
  const loginQuery = useQuery({
    queryKey: ['phase11-audit-logins'],
    queryFn: () => getLoginHistory({ limit: 25 }),
  });
  const exportQuery = useQuery({
    queryKey: ['phase11-audit-exports'],
    queryFn: () => getExportHistory({ limit: 25 }),
  });

  const audit = auditQuery.data || {};
  const logs = useMemo(() => audit.logs || [], [audit.logs]);
  const summary = audit.summary || {};
  const suspiciousUsers = suspiciousQuery.data || [];
  const loginRows = loginQuery.data?.logs || [];
  const exportRows = exportQuery.data?.logs || [];

  const modules = useMemo(
    () => [...new Set(logs.map((item) => item.module).filter(Boolean))].sort(),
    [logs],
  );
  const actions = useMemo(
    () => [...new Set(logs.map((item) => item.action).filter(Boolean))].sort(),
    [logs],
  );

  const exportLogs = (filename, rows) => {
    downloadCsvFile(
      filename,
      [
        { key: 'createdAt', label: 'Created At' },
        { key: 'userName', label: 'User' },
        { key: 'userRole', label: 'Role' },
        { key: 'module', label: 'Module' },
        { key: 'action', label: 'Action' },
        { key: 'entityName', label: 'Entity' },
        { key: 'description', label: 'Description' },
      ],
      rows.map((item) => ({
        ...item,
        createdAt: formatDateTime(item.createdAt),
      })),
    );
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Audit Trail Viewer"
          subtitle="Review system activity, suspicious events, login history, and export activity from one controlled workspace."
          action={
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost" onClick={() => exportLogs('audit-logs.csv', logs)}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  downloadJsonFile('audit-workspace.json', {
                    audit,
                    suspiciousUsers,
                    loginRows,
                    exportRows,
                  })
                }
              >
                Export JSON
              </Button>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Audit Events" value={audit.total || 0} icon={History} />
          <StatCard label="Suspicious Events" value={summary.suspiciousCount || 0} icon={ShieldAlert} />
          <StatCard label="Login Events" value={loginQuery.data?.total || 0} icon={AlertTriangle} />
          <StatCard label="Exports" value={exportQuery.data?.total || 0} icon={Download} />
        </div>

        <Card className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Input label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="User, entity, or description" />
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Module</span>
              <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} className="w-full rounded-xl border border-cyan-300/15 bg-cyan-400/10 px-3.5 py-2.5 text-sm text-white outline-none">
                <option value="">All modules</option>
                {modules.map((item) => (
                  <option key={item} value={item}>
                    {formatLabel(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Action</span>
              <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} className="w-full rounded-xl border border-cyan-300/15 bg-cyan-400/10 px-3.5 py-2.5 text-sm text-white outline-none">
                <option value="">All actions</option>
                {actions.map((item) => (
                  <option key={item} value={item}>
                    {formatLabel(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Priority</span>
              <button
                type="button"
                onClick={() => setSuspiciousOnly((current) => !current)}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-medium ${suspiciousOnly ? 'border-rose-400/30 bg-rose-500/10 text-rose-100' : 'border-white/10 bg-[#101827] text-white/75'}`}
              >
                {suspiciousOnly ? 'Showing suspicious only' : 'Show all events'}
              </button>
            </label>
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Tabs</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ['logs', 'Logs'],
                  ['logins', 'Logins'],
                  ['exports', 'Exports'],
                ].map(([value, label]) => (
                  <Button key={value} variant={tab === value ? 'secondary' : 'ghost'} onClick={() => setTab(value)}>
                    {label}
                  </Button>
                ))}
              </div>
            </label>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Suspicious Activity</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Risk watchlist</h2>
              </div>
              <Badge className="bg-rose-500/15 text-rose-100">{suspiciousUsers.length} users</Badge>
            </div>
            {suspiciousUsers.length ? (
              <div className="space-y-3">
                {suspiciousUsers.slice(0, 5).map((item) => (
                  <div key={item.user?.userId || item.user?.userName} className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{item.user?.userName || 'Unknown user'}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">{item.user?.userRole || 'Unknown role'}</p>
                      </div>
                      <Badge className="bg-rose-500/20 text-rose-100">{item.count} events</Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      {item.events.slice(0, 3).map((event) => (
                        <div key={`${event.action}-${event.createdAt}`} className="rounded-xl border border-white/10 bg-[#101827] px-3 py-2">
                          <p className="text-sm text-white">{formatLabel(event.action)} in {formatLabel(event.module)}</p>
                          <p className="mt-1 text-xs text-white/45">{event.description || event.entityName || 'Activity captured'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="OK"
                title="No suspicious activity flagged"
                message="Suspicious activity alerts will appear here automatically when the audit engine finds risk patterns."
              />
            )}
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Module Summary</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Where activity is happening</h2>
            </div>
            <div className="space-y-3">
              {(summary.byModule || []).length ? (
                summary.byModule.map((item) => (
                  <div key={item.module} className="rounded-2xl border border-violet-300/15 bg-violet-400/10 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-white">{formatLabel(item.module)}</p>
                      <Badge>{item.count}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon="M"
                  title="No module summary yet"
                  message="Audit summaries will appear once events are available for this tenant."
                />
              )}
            </div>
          </Card>
        </div>

        {tab === 'logs' ? (
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Audit Logs</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Detailed event trail</h2>
              </div>
              <Button variant="ghost" onClick={() => exportLogs('audit-detailed.csv', logs)}>
                Export View
              </Button>
            </div>
            {logs.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-white/75">
                  <thead className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                    <tr>
                      <th className="pb-3">When</th>
                      <th className="pb-3">User</th>
                      <th className="pb-3">Module</th>
                      <th className="pb-3">Action</th>
                      <th className="pb-3">Entity</th>
                      <th className="pb-3">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log._id || `${log.action}-${log.createdAt}`} className="border-t border-white/8">
                        <td className="py-3">{formatDateTime(log.createdAt)}</td>
                        <td>
                          <div>
                            <p className="font-medium text-white">{log.userName || 'System'}</p>
                            <p className="text-xs text-white/45">{log.userRole || '—'}</p>
                          </div>
                        </td>
                        <td>{formatLabel(log.module)}</td>
                        <td>
                          <Badge className={log.isSuspicious ? 'bg-rose-500/15 text-rose-100' : 'bg-white/10 text-white/75'}>
                            {formatLabel(log.action)}
                          </Badge>
                        </td>
                        <td>{log.entityName || log.entityId || '—'}</td>
                        <td>{log.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon="AT"
                title="No audit events found"
                message="Try widening your filters or wait for new activity to appear."
              />
            )}
          </Card>
        ) : null}

        {tab === 'logins' ? (
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Login History</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Authentication activity</h2>
              </div>
              <Button variant="ghost" onClick={() => exportLogs('audit-logins.csv', loginRows)}>
                Export Logins
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-white/75">
                <thead className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                  <tr>
                    <th className="pb-3">When</th>
                    <th className="pb-3">User</th>
                    <th className="pb-3">Action</th>
                    <th className="pb-3">IP Address</th>
                    <th className="pb-3">Path</th>
                  </tr>
                </thead>
                <tbody>
                  {loginRows.map((log) => (
                    <tr key={log._id || `${log.action}-${log.createdAt}`} className="border-t border-white/8">
                      <td className="py-3">{formatDateTime(log.createdAt)}</td>
                      <td>{log.userName || 'Unknown user'}</td>
                      <td>{formatLabel(log.action)}</td>
                      <td>{log.ipAddress || '—'}</td>
                      <td>{log.requestPath || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}

        {tab === 'exports' ? (
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Export History</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Data extraction log</h2>
              </div>
              <Button variant="ghost" onClick={() => exportLogs('audit-exports.csv', exportRows)}>
                Export Exports
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-white/75">
                <thead className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                  <tr>
                    <th className="pb-3">When</th>
                    <th className="pb-3">User</th>
                    <th className="pb-3">Module</th>
                    <th className="pb-3">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {exportRows.map((log) => (
                    <tr key={log._id || `${log.action}-${log.createdAt}`} className="border-t border-white/8">
                      <td className="py-3">{formatDateTime(log.createdAt)}</td>
                      <td>{log.userName || 'Unknown user'}</td>
                      <td>{formatLabel(log.module)}</td>
                      <td>{log.description || log.entityName || 'Export recorded'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
