import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { nimClient } from '../services/nimClient';
import { useEngine } from '../context/EngineContext';

export default function RegistryPage({ tenantId }) {
  const { parsed, rankings, setRankings, setConfig, setSimulation } = useEngine();
  const [adapters, setAdapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState('unknown');
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [error, setError] = useState('');
  const resultsRef = useRef(null);

  useEffect(() => {
    if (rankings.length && !loading) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [rankings, loading]);

  useEffect(() => {
    api.getAdapters().then(setAdapters).catch(err => setError(err.message));
  }, []);

  async function handleRank() {
    if (!parsed?.services?.length) {
      setError('No parsed requirement found. Run parser first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await nimClient.rankAdapters(parsed, adapters, tenantId);
      setRankings(result.rankings || []);
      setStrategy(result.strategy || 'unknown');
      setFallbackUsed(Boolean(result.fallbackUsed));
      setConfig(null);
      setSimulation(null);
    } catch (err) {
      setError(err.message || 'Ranking failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="animate-in">
      <header className="page-header">
        <div className="badge-ai">AI Semantic Matching</div>
        <h1>Integration Registry</h1>
        <p>Rank declarative adapters by requirement intent using live NIM embedding similarity.</p>
      </header>

      <div className="card card-glow-green" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h3>Adapter Catalog</h3>
            <p>{adapters.length} adapters available across credit, KYC, GST, fraud, and payments.</p>
          </div>
          <button className="btn btn-primary" onClick={handleRank} disabled={loading || !adapters.length}>
            {loading ? 'Ranking...' : 'Run AI Ranking'}
          </button>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span className={`badge ${fallbackUsed ? 'badge-warning' : 'badge-success'}`}>
            Strategy: {strategy.toUpperCase()}
          </span>
          <span className="badge badge-info">
            AI Ranking = semantic similarity score between requirement intent and adapter metadata
          </span>
        </div>
        {error && <p style={{ color: 'var(--error)', marginTop: 12 }}>{error}</p>}
        {loading && (
          <div className="ai-thinking" style={{ marginTop: 12 }}>
            <div className="ai-dots"><span /><span /><span /></div>
            <span>Computing semantic ranking for adapters...</span>
          </div>
        )}
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <h3 style={{ marginBottom: 10 }}>Loaded Adapters</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Versions</th>
              </tr>
            </thead>
            <tbody>
              {adapters.map(adapter => (
                <tr key={adapter.id}>
                  <td>{adapter.name}</td>
                  <td>{adapter.category}</td>
                  <td>{adapter.versions?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 10 }}>Parsed Requirement Services</h3>
          {!parsed?.services?.length && <p>Parse a document in the Parser module first.</p>}
          {!!parsed?.services?.length && (
            <ul style={{ paddingLeft: 18, color: 'var(--text-secondary)' }}>
              {parsed.services.map((service, idx) => (
                <li key={`${service.name}-${idx}`}>{service.name} ({service.authType})</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card" ref={resultsRef}>
        <h3 style={{ marginBottom: 10 }}>Ranking Results</h3>
        {!rankings.length && <p>No ranking output yet.</p>}
        {!!rankings.length && (
          <div className="ranking-grid">
            {rankings.map((row, idx) => {
              const confidencePercent = Math.round((row.confidence || 0) * 100);
              return (
                <article key={`${row.adapterId}-${idx}`} className="ranking-card">
                  <div className="ranking-top">
                    <h4>{row.serviceName || `Service ${row.serviceIndex + 1}`}</h4>
                    <span className="badge badge-info">v{row.recommendedVersion}</span>
                  </div>

                  <p className="ranking-adapter">{row.adapter?.name || row.adapterId}</p>

                  <div className="confidence-wrap">
                    <div className="confidence-label">
                      <span>Confidence</span>
                      <strong>{confidencePercent}%</strong>
                    </div>
                    <div className="confidence-bar-track">
                      <div className="confidence-bar-fill" style={{ width: `${confidencePercent}%` }} />
                    </div>
                  </div>

                  <p className="ranking-reason">{row.reason}</p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
