import { apiRequest } from './api';

export interface AdminTelemetryDto {
  activeSessions: number;
  totalSessions: number;
  onlineSessions: number;
  offlineSessions: number;
  totalUsers: number;
  totalAdmins: number;
  tokenAllocations: number;
  failedAccessAttempts: number;
}

export interface AuditLogDto {
  id: string;
  timestamp: string;
  actor: string;
  eventType: string;
  sessionId?: string;
  status: string;
  metadata?: string;
  ipAddress?: string;
}

export interface AdminUserDto {
  id: string;
  name: string;
  email: string;
  phone?: string;
  accountType: string;
  enabled: boolean;
  createdAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export async function getAdminTelemetry(token: string | null): Promise<AdminTelemetryDto> {
  return await apiRequest('/api/admin/telemetry', 'GET', null, token);
}

export async function getAuditLogs(
  token: string | null,
  page = 0,
  size = 15,
  actor = '',
  eventType = ''
): Promise<PagedResponse<AuditLogDto>> {
  let url = `/api/admin/audit-logs?page=${page}&size=${size}`;
  if (actor) url += `&actor=${encodeURIComponent(actor)}`;
  if (eventType) url += `&eventType=${encodeURIComponent(eventType)}`;
  return await apiRequest(url, 'GET', null, token);
}

export async function getAdminUsers(
  token: string | null,
  page = 0,
  size = 15,
  search = ''
): Promise<PagedResponse<AdminUserDto>> {
  let url = `/api/admin/users?page=${page}&size=${size}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  return await apiRequest(url, 'GET', null, token);
}

export async function cancelSessionByAdmin(sessionId: string, token: string | null): Promise<void> {
  return await apiRequest(`/api/admin/sessions/${sessionId}/cancel`, 'POST', null, token);
}
