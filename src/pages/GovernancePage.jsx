import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function GovernancePage({ tenantId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadLogs() {
    setLoading(true);
    setError('');
    try {
      const result = await api.getAuditLogs(tenantId);
      setLogs(result.logs || []);
    } catch (err) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, [tenantId]);

  return (
    <section className="animate-in">
      <header className="page-header">
        <div className="badge-ai">Governance Layer</div>
        <h1>Governance Dashboard</h1>
        <p>Track tenant-isolated configuration lifecycle with audit entries and operational traceability.</p>
      </header>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h3>Audit Feed</h3>
            <p>Tenant scope: {tenantId}</p>
          </div>
          <button className="btn btn-secondary" onClick={loadLogs} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Logs'}
          </button>
        </div>
        {error && <p style={{ color: 'var(--error)', marginTop: 10 }}>{error}</p>}
      </div>

      <div className="metric-grid">
        <div className="metric-tile">
          <div className="metric-label">Audit Events</div>
          <div className="metric-value">{logs.length}</div>
          <div className="metric-sub">Current tenant</div>
        </div>
        <div className="metric-tile">
          <div className="metric-label">Isolation</div>
          <div className="metric-value" style={{ fontSize: '1rem' }}>ENFORCED</div>
          <div className="metric-sub">Scoped by tenantId</div>
        </div>
        <div className="metric-tile">
          <div className="metric-label">Credential Vault</div>
          <div className="metric-value" style={{ fontSize: '1rem' }}>MASKED</div>
          <div className="metric-sub">No plain secrets in UI</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 10 }}>Recent Activity</h3>
        {!logs.length && !loading && <p>No events yet. Run parser/config/simulation first.</p>}
        {!!logs.length && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>User</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.logId}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>{log.action}</td>
                  <td>{log.userId}</td>
                  <td>
                    <pre className="code-block" style={{ margin: 0 }}>
                      {JSON.stringify(log.details || {}, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
