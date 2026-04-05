import { useEffect, useRef, useState } from 'react';
import { nimClient } from '../services/nimClient';
import { api } from '../services/api';
import { useEngine } from '../context/EngineContext';

export default function ConfigPage({ tenantId }) {
  const { parsed, rankings, config, setConfig, setSimulation } = useEngine();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [comparison, setComparison] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [error, setError] = useState('');
  const configResultRef = useRef(null);
  const compareResultRef = useRef(null);

  const selectedRanking = rankings[selectedIndex] || null;
  const selectedAdapter = selectedRanking?.adapter || null;
  const selectedVersion = selectedRanking?.recommendedVersion || selectedAdapter?.versions?.[0]?.version;

  useEffect(() => {
    if (config && !loadingConfig) {
      configResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [config, loadingConfig]);

  useEffect(() => {
    if (comparison && !loadingCompare) {
      compareResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [comparison, loadingCompare]);

  async function handleGenerateConfig() {
    if (!selectedAdapter || !parsed?.schemas?.length) {
      setError('Need parsed schemas and ranked adapter before config generation.');
      return;
    }

    setLoadingConfig(true);
    setError('');

    try {
      const firstSchema = parsed.schemas[0];
      const generated = await nimClient.generateFieldMappings(
        firstSchema,
        { adapterId: selectedAdapter.id, version: selectedVersion },
        tenantId,
        'judge_demo_user',
      );
      setConfig(generated);
      setSimulation(null);
    } catch (err) {
      setError(err.message || 'Failed to generate configuration');
    } finally {
      setLoadingConfig(false);
    }
  }

  async function handleCompareVersions() {
    if (!selectedAdapter || !selectedAdapter.versions || selectedAdapter.versions.length < 2) {
      setError('Selected adapter needs at least two versions for comparison.');
      return;
    }

    setLoadingCompare(true);
    setError('');

    try {
      const versionA = selectedAdapter.versions[0].version;
      const versionB = selectedAdapter.versions[selectedAdapter.versions.length - 1].version;
      const result = await api.compareVersions(selectedAdapter.id, versionA, versionB, tenantId);
      setComparison(result.comparison);
    } catch (err) {
      setError(err.message || 'Version comparison failed');
    } finally {
      setLoadingCompare(false);
    }
  }

  return (
    <section className="animate-in">
      <header className="page-header">
        <div className="badge-ai">AI Mapping Engine</div>
        <h1>Auto-Configuration Engine</h1>
        <p>Create a deployable template with AI-generated field mappings and version diff visibility.</p>
      </header>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-group" style={{ maxWidth: 360 }}>
          <label className="label" htmlFor="ranking-select">Select Ranked Service</label>
          <select
            id="ranking-select"
            className="input select"
            value={selectedIndex}
            onChange={e => setSelectedIndex(Number(e.target.value))}
          >
            {rankings.map((row, idx) => (
              <option key={`${row.adapterId}-${idx}`} value={idx}>
                {row.serviceName || `Service ${idx + 1}`} → {row.adapter?.name || row.adapterId}
              </option>
            ))}
            {!rankings.length && <option value={0}>No ranked adapters available</option>}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleGenerateConfig} disabled={loadingConfig || !rankings.length}>
            {loadingConfig ? 'Generating...' : 'Generate Configuration'}
          </button>
          <button className="btn btn-secondary" onClick={handleCompareVersions} disabled={loadingCompare || !rankings.length}>
            {loadingCompare ? 'Comparing...' : 'Compare Adapter Versions'}
          </button>
        </div>

        {error && <p style={{ color: 'var(--error)', marginTop: 12 }}>{error}</p>}
        {(loadingConfig || loadingCompare) && (
          <div className="ai-thinking" style={{ marginTop: 12 }}>
            <div className="ai-dots"><span /><span /><span /></div>
            <span>{loadingConfig ? 'Generating configuration template...' : 'Comparing adapter versions...'}</span>
          </div>
        )}
      </div>

      <div className="grid-2">
        <div className="card card-glow-green" ref={configResultRef}>
          <h3 style={{ marginBottom: 10 }}>Generated Configuration</h3>
          {!config && <p>Generate config to see output.</p>}
          {config && (
            <>
              <p><strong>Adapter:</strong> {config.adapterName}</p>
              <p><strong>Version:</strong> {config.version}</p>
              <p><strong>Endpoint:</strong> {config.endpoint}</p>
              <p><strong>Auth:</strong> {config.authType}</p>

              <h4 style={{ marginTop: 16, marginBottom: 8 }}>Field Mappings</h4>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Target</th>
                    <th>Transform</th>
                  </tr>
                </thead>
                <tbody>
                  {(config.fieldMappings || []).map((row, idx) => (
                    <tr key={`${row.sourceField}-${idx}`}>
                      <td>{row.sourceField || 'UNMAPPED'}</td>
                      <td>{row.targetField}</td>
                      <td>{row.transformFn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        <div className="card" ref={compareResultRef}>
          <h3 style={{ marginBottom: 10 }}>Version Diff</h3>
          {!comparison && <p>Run version comparison to see backward compatibility impact.</p>}
          {comparison && (
            <>
              <p><strong>Recommendation:</strong> {comparison.recommendation}</p>
              <p>
                <strong>Backward Compatible:</strong>{' '}
                {comparison.backwardCompatible ? 'Yes' : 'No'}
              </p>

              <h4 style={{ marginTop: 16, marginBottom: 8 }}>Schema Delta</h4>
              <p><strong>Added:</strong> {(comparison.addedFields || []).join(', ') || 'None'}</p>
              <p><strong>Removed:</strong> {(comparison.removedFields || []).join(', ') || 'None'}</p>
              <p><strong>Common:</strong> {(comparison.commonFields || []).length}</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
