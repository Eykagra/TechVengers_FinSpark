import { useEffect, useRef, useState } from 'react';
import { nimClient } from '../services/nimClient';
import { useEngine } from '../context/EngineContext';

export default function ParserPage({ tenantId }) {
  const { parsed, setParsed, setRankings, setConfig, setSimulation } = useEngine();
  const [documentText, setDocumentText] = useState('Build integrations for Credit Bureau, Aadhaar KYC, GST verification, Fraud score, and payment mandate lifecycle. Mandatory services are Credit Bureau, KYC, and Fraud. Preferred auth is OAuth2 and API key fallback. Include request and response field mappings for onboarding and underwriting workflows.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const resultRef = useRef(null);

  useEffect(() => {
    if (parsed && !loading) {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [parsed, loading]);

  async function handleParse() {
    if (!documentText.trim()) {
      setError('Please paste BRD or SOW text before parsing.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await nimClient.parseRequirementDoc(documentText, tenantId, 'judge_demo_user');
      setParsed(result);
      setRankings([]);
      setConfig(null);
      setSimulation(null);
    } catch (err) {
      setError(err.message || 'Failed to parse document.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="animate-in">
      <header className="page-header">
        <div className="badge-ai">AI Parsing Engine</div>
        <h1>Requirement Parsing Engine</h1>
        <p>Upload BRD or SOW intent and transform unstructured requirements into schema-aware integration contracts.</p>
      </header>

      <div className="grid-2">
        <div className="card card-glow-blue">
          <div className="form-group">
            <label className="label" htmlFor="brd-text">Requirement Document Text</label>
            <textarea
              id="brd-text"
              className="input textarea"
              value={documentText}
              onChange={e => setDocumentText(e.target.value)}
              rows={12}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={handleParse} disabled={loading}>
              {loading ? 'Parsing with NIM...' : 'Parse with NVIDIA NIM'}
            </button>
          </div>

          {error && <p style={{ color: 'var(--error)', marginTop: 14 }}>{error}</p>}
          {loading && (
            <div className="ai-thinking" style={{ marginTop: 14 }}>
              <div className="ai-dots"><span /><span /><span /></div>
              <span>Parsing requirement document...</span>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 10 }}>Parsed Summary</h3>
          {!parsed && <p>No parsed output yet.</p>}
          {parsed && (
            <>
              <p><strong>Project:</strong> {parsed.projectName}</p>
              <p style={{ marginTop: 8 }}>{parsed.summary}</p>
              <div className="metric-grid" style={{ marginTop: 18, marginBottom: 0 }}>
                <div className="metric-tile">
                  <div className="metric-label">Services</div>
                  <div className="metric-value">{parsed.services?.length || 0}</div>
                </div>
                <div className="metric-tile">
                  <div className="metric-label">Schemas</div>
                  <div className="metric-value">{parsed.schemas?.length || 0}</div>
                </div>
                <div className="metric-tile">
                  <div className="metric-label">Complexity</div>
                  <div className="metric-value" style={{ fontSize: '1rem' }}>{parsed.integrationComplexity || 'NA'}</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }} ref={resultRef}>
        <h3 style={{ marginBottom: 10 }}>Extracted Services</h3>
        {!parsed?.services?.length && <p>Run parsing to see service extraction.</p>}
        {!!parsed?.services?.length && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Auth</th>
                <th>Mandatory</th>
                <th>Endpoint Pattern</th>
              </tr>
            </thead>
            <tbody>
              {parsed.services.map((service, idx) => (
                <tr key={`${service.name}-${idx}`}>
                  <td>{service.name}</td>
                  <td>{service.authType}</td>
                  <td>{service.mandatory ? 'Yes' : 'No'}</td>
                  <td>{service.endpointPattern}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </section>
  );
}
