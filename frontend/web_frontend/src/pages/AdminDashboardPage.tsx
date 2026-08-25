import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAdminTelemetry,
  getAuditLogs,
  getAdminUsers,
  cancelSessionByAdmin,
  type AdminTelemetryDto,
  type AuditLogDto,
  type AdminUserDto
} from '../utils/adminApi';

export const AdminDashboardPage: React.FC = () => {
  const { accessToken } = useAuth();

  // Telemetry aggregates
  const [telemetry, setTelemetry] = useState<AdminTelemetryDto | null>(null);
  const [telemetryLoading, setTelemetryLoading] = useState(true);

  // Audit Logs paging states
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [logPage, setLogPage] = useState(0);
  const [logTotalPages, setLogTotalPages] = useState(1);
  const [logFilterActor, setLogFilterActor] = useState('');
  const [logFilterType, setLogFilterType] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);

  // Users paging states
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [userPage, setUserPage] = useState(0);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  // Stuck call cancellation inputs
  const [cancelSessionId, setCancelSessionId] = useState('');
  const [cancellationStatus, setCancellationStatus] = useState<string | null>(null);

  // Global status alerts
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Refresh Telemetry stats
  const fetchTelemetry = useCallback(async () => {
    try {
      setTelemetryLoading(true);
      const data = await getAdminTelemetry(accessToken);
      setTelemetry(data);
    } catch (err: any) {
      setGeneralError(err?.message || 'Failed to fetch telemetry metrics.');
    } finally {
      setTelemetryLoading(false);
    }
  }, [accessToken]);

  // Refresh Audit Logs page
  const fetchAuditLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const data = await getAuditLogs(accessToken, logPage, 10, logFilterActor, logFilterType);
      setLogs(data.content);
      setLogTotalPages(data.totalPages);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLogsLoading(false);
    }
  }, [accessToken, logPage, logFilterActor, logFilterType]);

  // Refresh Users directory page
  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const data = await getAdminUsers(accessToken, userPage, 10, userSearch);
      setUsers(data.content);
      setUserTotalPages(data.totalPages);
    } catch (err: any) {
      console.error('Failed to load users list:', err);
    } finally {
      setUsersLoading(false);
    }
  }, [accessToken, userPage, userSearch]);

  // Initial load
  useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  // Sync log page refetches
  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Sync user page refetches
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Force cancel stuck session handler
  const handleCancelSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelSessionId.trim()) return;

    const confirmCancel = window.confirm(
      `Are you sure you want to force terminate and cancel session ${cancelSessionId}?`
    );
    if (!confirmCancel) return;

    try {
      setCancellationStatus('Processing forced cancellation...');
      await cancelSessionByAdmin(cancelSessionId.trim(), accessToken);
      setCancellationStatus('Success: Communication session cancelled.');
      setCancelSessionId('');
      // Refresh telemetry and logs
      fetchTelemetry();
      fetchAuditLogs();
    } catch (err: any) {
      setCancellationStatus(`Error: ${err?.message || 'Failed to terminate session.'}`);
    }
  };

  const handleApplyLogFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setLogPage(0);
    fetchAuditLogs();
  };

  const handleApplyUserSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setUserPage(0);
    fetchUsers();
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto px-4 py-6" role="main" aria-label="Admin Control Console">
      
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-4 gap-4">
        <div>
          <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-extrabold tracking-widest uppercase">
            Admin Control Console
          </span>
          <h1 className="text-2xl font-bold mt-1">Operational Telemetry & Governance</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchTelemetry();
              fetchAuditLogs();
              fetchUsers();
            }}
            className="btn-secondary px-4 py-2 text-xs font-bold"
            aria-label="Refresh Dashboard Telemetry"
          >
            🔄 Refresh Dashboard
          </button>
        </div>
      </header>

      {/* Model Validation Warning Alert */}
      <div 
        className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg text-xs text-blue-700 dark:text-blue-400 font-bold"
        role="status"
        aria-live="polite"
      >
        ℹ️ Real ISL model validation remains pending until a trained ISL classification model/weights are supplied.
      </div>

      {generalError && (
        <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm font-bold" role="alert">
          ⚠️ {generalError}
        </div>
      )}

      {/* Telemetry Aggregate KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Operational Telemetry Dashboard">
        <div className="card p-5 flex flex-col gap-1 justify-between min-h-[110px]">
          <span className="text-[10px] uppercase tracking-wider font-extrabold opacity-60">Active Calls</span>
          {telemetryLoading ? (
            <span className="text-lg animate-pulse font-bold">...</span>
          ) : (
            <span className="text-3xl font-black text-green-500">{telemetry?.activeSessions}</span>
          )}
        </div>

        <div className="card p-5 flex flex-col gap-1 justify-between min-h-[110px]">
          <span className="text-[10px] uppercase tracking-wider font-extrabold opacity-60">Total Sessions</span>
          {telemetryLoading ? (
            <span className="text-lg animate-pulse font-bold">...</span>
          ) : (
            <span className="text-3xl font-black text-primary">
              {telemetry?.totalSessions} <span className="text-xs opacity-75 font-normal">({telemetry?.onlineSessions} online / {telemetry?.offlineSessions} offline)</span>
            </span>
          )}
        </div>

        <div className="card p-5 flex flex-col gap-1 justify-between min-h-[110px]">
          <span className="text-[10px] uppercase tracking-wider font-extrabold opacity-60">Total Users</span>
          {telemetryLoading ? (
            <span className="text-lg animate-pulse font-bold">...</span>
          ) : (
            <span className="text-3xl font-black text-accent">
              {telemetry?.totalUsers} <span className="text-xs opacity-75 font-normal">({telemetry?.totalAdmins} admin)</span>
            </span>
          )}
        </div>

        <div className="card p-5 flex flex-col gap-1 justify-between min-h-[110px]">
          <span className="text-[10px] uppercase tracking-wider font-extrabold opacity-60">LiveKit Token Allocations</span>
          {telemetryLoading ? (
            <span className="text-lg animate-pulse font-bold">...</span>
          ) : (
            <span className="text-3xl font-black text-amber-500">{telemetry?.tokenAllocations}</span>
          )}
        </div>
      </section>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Audit Log Listing & Search */}
        <section className="lg:col-span-2 card p-6 flex flex-col gap-4">
          <h2 className="text-lg font-bold border-b border-border pb-2">Append-Only Audit Trails</h2>

          {/* Filters Form */}
          <form onSubmit={handleApplyLogFilters} className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-bg/50 p-3 rounded-lg border border-border/60">
            <div className="flex flex-col gap-1">
              <label htmlFor="log-actor" className="text-[10px] font-bold uppercase opacity-75">Filter Actor</label>
              <input
                id="log-actor"
                type="text"
                placeholder="User email..."
                value={logFilterActor}
                onChange={(e) => setLogFilterActor(e.target.value)}
                className="px-2.5 py-1.5 rounded border border-border text-xs bg-bg text-text"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="log-type" className="text-[10px] font-bold uppercase opacity-75">Filter Event Type</label>
              <select
                id="log-type"
                value={logFilterType}
                onChange={(e) => setLogFilterType(e.target.value)}
                className="px-2.5 py-1.5 rounded border border-border text-xs bg-bg text-text"
              >
                <option value="">All Events</option>
                <option value="SESSION_CREATION">Session Creation</option>
                <option value="SESSION_START">Session Start</option>
                <option value="SESSION_END">Session End</option>
                <option value="SESSION_CANCEL">Session Cancel</option>
                <option value="LIVEKIT_TOKEN_GEN">LiveKit Token Gen</option>
                <option value="API_ACCESS_DENIED">API Access Denied</option>
                <option value="AUTHENTICATION_FAILURE">Auth Failure</option>
                <option value="ADMIN_CANCEL_SESSION">Admin Cancel Action</option>
              </select>
            </div>

            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full py-1.5 text-xs font-bold">
                Apply Filters
              </button>
            </div>
          </form>

          {/* Audit Logs Table */}
          <div className="overflow-x-auto border border-border rounded-lg" tabIndex={0} aria-label="Audit Logs Table">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-bg border-b border-border font-bold">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Event Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {logsLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center font-semibold animate-pulse">Loading audit history...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center opacity-65">No audit records found matching your query criteria.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-cardBg/50 transition-colors">
                      <td className="p-3 whitespace-nowrap opacity-75">{log.timestamp}</td>
                      <td className="p-3 font-semibold">{log.actor}</td>
                      <td className="p-3">
                        <span className="font-mono bg-bg border border-border/80 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {log.eventType}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-red-500/10 text-red-500'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3 max-w-[200px] truncate" title={log.metadata}>
                        {log.metadata || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Logs Paging Controls */}
          {logTotalPages > 1 && (
            <nav className="flex items-center justify-between pt-2" aria-label="Audit Logs Pagination">
              <button
                onClick={() => setLogPage((p) => Math.max(0, p - 1))}
                disabled={logPage === 0}
                className="btn-secondary px-3 py-1 text-xs disabled:opacity-50"
              >
                ◀ Previous
              </button>
              <span className="text-xs font-bold">Page {logPage + 1} of {logTotalPages}</span>
              <button
                onClick={() => setLogPage((p) => Math.min(logTotalPages - 1, p + 1))}
                disabled={logPage === logTotalPages - 1}
                className="btn-secondary px-3 py-1 text-xs disabled:opacity-50"
              >
                Next ▶
              </button>
            </nav>
          )}
        </section>

        {/* Right Column: User Management Directory & Controls */}
        <section className="flex flex-col gap-6">
          
          {/* Stuck session manager widget */}
          <div className="card p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold border-b border-border pb-2">Session Interception</h2>
            <form onSubmit={handleCancelSession} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="cancel-id" className="text-[10px] font-bold uppercase opacity-75">Stuck Session ID (UUID)</label>
                <input
                  id="cancel-id"
                  type="text"
                  placeholder="Paste session UUID here..."
                  value={cancelSessionId}
                  onChange={(e) => setCancelSessionId(e.target.value)}
                  className="px-2.5 py-1.5 rounded border border-border text-xs bg-bg text-text"
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full py-2 text-xs font-bold bg-red-600 hover:bg-red-700">
                Cancel Stuck Session
              </button>
              {cancellationStatus && (
                <div 
                  className={`p-2.5 rounded text-[10px] font-bold text-center border ${
                    cancellationStatus.startsWith('Success')
                      ? 'bg-green-500/10 text-green-500 border-green-500/20'
                      : cancellationStatus.startsWith('Error')
                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  {cancellationStatus}
                </div>
              )}
            </form>
          </div>

          {/* User Directory Widget */}
          <div className="card p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold border-b border-border pb-2 font-bold">User Registry</h2>
            
            {/* User search bar */}
            <form onSubmit={handleApplyUserSearch} className="flex gap-2">
              <label htmlFor="user-search" className="sr-only">Search Users</label>
              <input
                id="user-search"
                type="text"
                placeholder="Search name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="flex-grow px-2.5 py-1.5 rounded border border-border text-xs bg-bg text-text"
              />
              <button type="submit" className="btn-secondary px-3 py-1.5 text-xs font-bold">
                Search
              </button>
            </form>

            {/* Users list list-block */}
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1" tabIndex={0} aria-label="User Registry List">
              {usersLoading ? (
                <span className="text-xs text-center py-4 animate-pulse">Loading directory...</span>
              ) : users.length === 0 ? (
                <span className="text-xs text-center py-4 opacity-60">No users found.</span>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="p-3 bg-bg border border-border rounded-lg flex items-center justify-between text-xs hover:border-primary/50 transition-colors">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-text">{user.name}</span>
                      <span className="opacity-75 font-mono text-[10px]">{user.email}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                      user.accountType === 'ADMIN'
                        ? 'bg-red-500/10 text-red-500'
                        : user.accountType === 'ACCESSIBILITY_USER'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-primary/10 text-primary'
                    }`}>
                      {user.accountType}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Users Pagination */}
            {userTotalPages > 1 && (
              <nav className="flex items-center justify-between pt-2" aria-label="User Directory Pagination">
                <button
                  onClick={() => setUserPage((p) => Math.max(0, p - 1))}
                  disabled={userPage === 0}
                  className="btn-secondary px-2.5 py-1 text-[10px] disabled:opacity-50"
                >
                  ◀
                </button>
                <span className="text-[10px] font-bold">Page {userPage + 1} of {userTotalPages}</span>
                <button
                  onClick={() => setUserPage((p) => Math.min(userTotalPages - 1, p + 1))}
                  disabled={userPage === userTotalPages - 1}
                  className="btn-secondary px-2.5 py-1 text-[10px] disabled:opacity-50"
                >
                  ▶
                </button>
              </nav>
            )}
          </div>
        </section>

      </div>

    </div>
  );
};
export default AdminDashboardPage;
