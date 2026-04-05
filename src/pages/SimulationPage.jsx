import { useEffect, useRef, useState } from 'react';
import { nimClient } from '../services/nimClient';
import { useEngine } from '../context/EngineContext';

export default function SimulationPage({ tenantId }) {
  const { config, simulation, setSimulation } = useEngine();
  const [result, setResult] = useState(simulation);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const resultRef = useRef(null);

  useEffect(() => {
    if (result && !loading) {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result, loading]);

  async function handleSimulate() {
    if (!config) {
      setError('No generated config found. Run Auto-Configuration first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const simulation = await nimClient.generateMockPayload(config, tenantId, 'judge_demo_user');
      setResult(simulation);
      setSimulation(simulation);
    } catch (err) {
      setError(err.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="animate-in">
      <header className="page-header">
        <div className="badge-ai">AI Mock Generation</div>
        <h1>Simulation and Testing</h1>
        <p>Run configuration in a tenant-scoped sandbox with realistic payload generation and coverage tracking.</p>
      </header>

      <div className="card card-glow-blue" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h3>Run Integration Simulation</h3>
            <p>Uses NVIDIA NIM to generate realistic response payloads and compute run metrics.</p>
          </div>
          <button className="btn btn-primary" onClick={handleSimulate} disabled={loading || !config}>
            {loading ? 'Simulating...' : 'Run Simulation'}
          </button>
        </div>
        {error && <p style={{ color: 'var(--error)', marginTop: 10 }}>{error}</p>}
        {loading && (
          <div className="ai-thinking" style={{ marginTop: 12 }}>
            <div className="ai-dots"><span /><span /><span /></div>
            <span>Running simulation and generating mock payloads...</span>
          </div>
        )}
      </div>

      {!config && (
        <div className="card">
          <p>No config available. Create one in Auto-Configuration module.</p>
        </div>
      )}

      {!!result && (
        <div className="grid-2" ref={resultRef}>
          <div className="card">
            <h3 style={{ marginBottom: 10 }}>Simulation Metrics</h3>
            <div className="metric-grid">
              <div className="metric-tile">
                <div className="metric-label">Status</div>
                <div className="metric-value" style={{ fontSize: '1rem' }}>{result.status}</div>
              </div>
              <div className="metric-tile">
                <div className="metric-label">Latency</div>
                <div className="metric-value">{result.latencyMs}ms</div>
              </div>
              <div className="metric-tile">
                <div className="metric-label">Field Coverage</div>
                <div className="metric-value">{result.fieldCoverage}%</div>
              </div>
            </div>
            <p><strong>Adapter:</strong> {result.adapterId}</p>
            <p><strong>Version:</strong> {result.version}</p>
            <p><strong>Session:</strong> {result.sessionId}</p>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 10 }}>Hooks Executed</h3>
            {!!result.hooksExecuted?.length && (
              <ul style={{ paddingLeft: 18, color: 'var(--text-secondary)' }}>
                {result.hooksExecuted.map((hook, idx) => (
                  <li key={`${hook}-${idx}`}>{hook}</li>
                ))}
              </ul>
            )}
            {!result.hooksExecuted?.length && <p>No hooks recorded.</p>}

            <h4 style={{ marginTop: 16, marginBottom: 8 }}>Mock Request</h4>
            <pre className="code-block">{JSON.stringify(result.mockRequest, null, 2)}</pre>
          </div>
        </div>
      )}

      {!!result && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ marginBottom: 10 }}>Simulation Visual Flow</h3>
          <p style={{ marginBottom: 12 }}>This shows how the generated config moved through the simulator pipeline.</p>

          <div className="sim-flow-wrap">
            <div className="sim-flow-node">
              <div className="sim-flow-title">1. Config Loaded</div>
              <div className="sim-flow-value">{result.adapterId} · v{result.version}</div>
            </div>
            <div className="sim-flow-arrow">→</div>

            <div className="sim-flow-node">
              <div className="sim-flow-title">2. Mock Request</div>
              <div className="sim-flow-value">{Object.keys(result.mockRequest || {}).length} fields</div>
            </div>
            <div className="sim-flow-arrow">→</div>

            <div className="sim-flow-node">
              <div className="sim-flow-title">3. Adapter Execute</div>
              <div className="sim-flow-value">Latency {result.latencyMs}ms</div>
            </div>
            <div className="sim-flow-arrow">→</div>

            <div className="sim-flow-node">
              <div className="sim-flow-title">4. Response Validate</div>
              <div className="sim-flow-value">Coverage {result.fieldCoverage}%</div>
            </div>
            <div className="sim-flow-arrow">→</div>

            <div className="sim-flow-node">
              <div className="sim-flow-title">5. Decision Signal</div>
              <div className="sim-flow-value">{result.fieldCoverage >= 85 ? 'PASS' : 'NEEDS TUNING'}</div>
            </div>
          </div>

          <div className="sim-interpret" style={{ marginTop: 14 }}>
            <p><strong>How to read:</strong> coverage reflects how much of expected response schema was produced, while latency reflects execution speed for this adapter path.</p>
            <p><strong>Recommendation:</strong> {result.fieldCoverage >= 85 ? 'Configuration looks healthy for approval review.' : 'Refine mappings and rerun simulation before approval.'}</p>
          </div>
        </div>
      )}

      {!!result && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ marginBottom: 10 }}>Mock Response</h3>
          <pre className="code-block">{JSON.stringify(result.mockResponse, null, 2)}</pre>
        </div>
      )}
    </section>
  );
}
