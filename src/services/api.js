const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace(/\/$/, '');

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API error');
  }
  return res.json();
}

export const api = {
  health: () => apiFetch('/health'),
  getAdapters: () => apiFetch('/adapters'),
  parseDocument: (documentText, tenantId, userId) =>
    apiFetch('/parse', { method: 'POST', body: { documentText, tenantId, userId } }),
  rankAdapters: (services, tenantId) =>
    apiFetch('/rank-adapters', { method: 'POST', body: { services, tenantId } }),
  generateConfig: (adapterId, version, sourceSchema, tenantId, userId) =>
    apiFetch('/generate-config', { method: 'POST', body: { adapterId, version, sourceSchema, tenantId, userId } }),
  simulate: (config, tenantId, userId) =>
    apiFetch('/simulate', { method: 'POST', body: { config, tenantId, userId } }),
  compareVersions: (adapterId, versionA, versionB, tenantId) =>
    apiFetch('/simulate/compare', { method: 'POST', body: { adapterId, versionA, versionB, tenantId } }),
  getAuditLogs: (tenantId) => apiFetch(`/audit?tenantId=${tenantId}`),
};
