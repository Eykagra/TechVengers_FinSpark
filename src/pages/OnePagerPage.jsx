import { useEffect, useMemo, useRef, useState } from 'react';
import { nimClient } from '../services/nimClient';
import { api } from '../services/api';
import { useEngine } from '../context/EngineContext';

export default function OnePagerPage({ tenantId }) {
  const { parsed, setParsed, rankings, setRankings, config, setConfig, simulation, setSimulation } = useEngine();

  const [documentText, setDocumentText] = useState('Build integrations for Credit Bureau, Aadhaar KYC, GST verification, Fraud score, and payment mandate lifecycle. Mandatory services are Credit Bureau, KYC, and Fraud. Preferred auth is OAuth2 and API key fallback. Include request and response field mappings for onboarding and underwriting workflows.');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [strategy, setStrategy] = useState('unknown');
  const [demoSummary, setDemoSummary] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [configDecision, setConfigDecision] = useState('pending');
  const [decisionNote, setDecisionNote] = useState('Awaiting user decision.');
  const [lastConfigSnapshot, setLastConfigSnapshot] = useState(null);

  const [parsing, setParsing] = useState(false);
  const [ranking, setRanking] = useState(false);
  const [configuring, setConfiguring] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [fullRunning, setFullRunning] = useState(false);

  const parseSectionRef = useRef(null);
  const rankSectionRef = useRef(null);
  const configSectionRef = useRef(null);
  const simulationSectionRef = useRef(null);
  const auditSectionRef = useRef(null);

  const selectedRanking = rankings[selectedIndex] || rankings[0] || null;

  const canRank = Boolean(parsed?.services?.length);
  const canConfig = Boolean(rankings.length && parsed?.schemas?.length);
  const canSimulate = Boolean(config);

  const totalStepsDone = useMemo(() => {
    let count = 0;
    if (parsed) count += 1;
    if (rankings.length) count += 1;
    if (config) count += 1;
    if (simulation) count += 1;
    if (auditLogs.length) count += 1;
    return count;
  }, [parsed, rankings, config, simulation, auditLogs]);

  function smoothScroll(ref) {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function resetFlowState() {
    setParsed(null);
    setRankings([]);
    setConfig(null);
    setSimulation(null);
    setAuditLogs([]);
    setDemoSummary(null);
    setStrategy('unknown');
    setSelectedIndex(0);
    setError('');
    setEditMode(false);
    setConfigDecision('pending');
    setDecisionNote('Awaiting user decision.');
    setLastConfigSnapshot(null);
  }

  function cloneConfig(value) {
    return value ? JSON.parse(JSON.stringify(value)) : null;
  }

  function updateMapping(index, field, value) {
    setConfig(prev => {
      if (!prev) return prev;
      const updatedMappings = (prev.fieldMappings || []).map((item, idx) => {
        if (idx !== index) return item;
        return { ...item, [field]: value };
      });
      return { ...prev, fieldMappings: updatedMappings, status: 'DRAFT' };
    });
  }

  function handleApproveConfig() {
    if (!config) return;
    setConfig(prev => (prev ? { ...prev, status: 'APPROVED' } : prev));
    setLastConfigSnapshot(cloneConfig(config));
    setEditMode(false);
    setConfigDecision('approved');
    setDecisionNote('Configuration approved for simulation and downstream execution.');
  }

  function handleEnableEditMapping() {
    if (!config) return;
    setEditMode(true);
    setConfigDecision('editing');
    setDecisionNote('Mapping edit mode enabled. Update fields, then save.');
  }

  function handleSaveMappingUpdates() {
    setEditMode(false);
    setConfigDecision('edited');
    setDecisionNote('Mapping edits saved. Re-approve or run simulation.');
  }

  function handleRollbackConfig() {
    if (!lastConfigSnapshot) {
      setConfigDecision('rollback_unavailable');
      setDecisionNote('No previous configuration snapshot available for rollback.');
      return;
    }

    setConfig(cloneConfig(lastConfigSnapshot));
    setSimulation(null);
    setEditMode(false);
    setConfigDecision('rolled_back');
    setDecisionNote('Configuration rolled back to the previous approved snapshot.');
  }

  async function handleParse() {
    const input = documentText.trim();
    if (!input) {
      setError('Please provide BRD/SOW text first.');
      return;
    }

    setParsing(true);
    resetFlowState();

    try {
      const result = await nimClient.parseRequirementDoc(input, tenantId, 'judge_demo_user');
      setParsed(result);
      setRankings([]);
      setConfig(null);
      setSimulation(null);
      setDemoSummary(null);
      setAuditLogs([]);
      setSelectedIndex(0);
      setTimeout(() => smoothScroll(rankSectionRef), 100);
    } catch (err) {
      setError(err.message || 'Parse failed');
    } finally {
      setParsing(false);
    }
  }

  async function handleRank() {
    if (!parsed?.services?.length) {
      setError('Run parse first.');
      return;
    }

    setRanking(true);
    setError('');

    try {
      const adapters = await api.getAdapters();
      const result = await nimClient.rankAdapters(parsed, adapters, tenantId);
      setRankings(result.rankings || []);
      setStrategy(result.strategy || 'unknown');
      setConfig(null);
      setSimulation(null);
      setSelectedIndex(0);
      setTimeout(() => smoothScroll(configSectionRef), 100);
    } catch (err) {
      setError(err.message || 'Ranking failed');
    } finally {
      setRanking(false);
    }
  }

  async function handleConfig() {
    if (!selectedRanking || !parsed?.schemas?.length) {
      setError('Run rank first and select a recommendation.');
      return;
    }

    setConfiguring(true);
    setError('');

    try {
      const generated = await nimClient.generateFieldMappings(
        parsed.schemas[0],
        { adapterId: selectedRanking.adapterId, version: selectedRanking.recommendedVersion },
        tenantId,
        'judge_demo_user',
      );
      setConfig(generated);
      setSimulation(null);
      setEditMode(false);
      setConfigDecision('pending');
      setDecisionNote('Awaiting user decision.');
      setTimeout(() => smoothScroll(simulationSectionRef), 100);
    } catch (err) {
      setError(err.message || 'Configuration failed');
    } finally {
      setConfiguring(false);
    }
  }

  async function handleSimulate() {
    if (!config) {
      setError('Generate config first.');
      return;
    }

    setSimulating(true);
    setError('');

    try {
      const result = await nimClient.generateMockPayload(config, tenantId, 'judge_demo_user');
      setSimulation(result);
      setTimeout(() => smoothScroll(auditSectionRef), 100);
    } catch (err) {
      setError(err.message || 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  }

  async function handleAuditRefresh() {
    setAuditLoading(true);
    setError('');

    try {
      const data = await api.getAuditLogs(tenantId);
      setAuditLogs(data.logs || []);
    } catch (err) {
      setError(err.message || 'Audit fetch failed');
    } finally {
      setAuditLoading(false);
    }
  }

  async function handleRunAll() {
    const input = documentText.trim();
    if (!input) {
      setError('Please provide BRD/SOW text first.');
      return;
    }

    setFullRunning(true);
    resetFlowState();

    try {
      const startedAt = Date.now();

      setParsing(true);
      const parsedResult = await nimClient.parseRequirementDoc(input, tenantId, 'judge_demo_user');
      setParsed(parsedResult);
      setRankings([]);
      setConfig(null);
      setSimulation(null);
      setAuditLogs([]);
      setSelectedIndex(0);
      setParsing(false);
      smoothScroll(rankSectionRef);
      await wait(180);

      setRanking(true);
      const adapters = await api.getAdapters();
      const rankedResult = await nimClient.rankAdapters(parsedResult, adapters, tenantId);
      const rankedItems = rankedResult.rankings || [];
      if (!rankedItems.length) {
        throw new Error('No ranked adapters found.');
      }
      setRankings(rankedItems);
      setStrategy(rankedResult.strategy || 'unknown');
      setSelectedIndex(0);
      setRanking(false);
      smoothScroll(configSectionRef);
      await wait(180);

      setConfiguring(true);
      const firstSchema = parsedResult.schemas?.[0];
      if (!firstSchema) {
        throw new Error('No parsed schema available for config generation.');
      }
      const topRank = rankedItems[0];
      const generatedConfig = await nimClient.generateFieldMappings(
        firstSchema,
        { adapterId: topRank.adapterId, version: topRank.recommendedVersion },
        tenantId,
        'judge_demo_user',
      );
      setConfig(generatedConfig);
      setLastConfigSnapshot(null);
      setEditMode(false);
      setConfigDecision('pending');
      setDecisionNote('Awaiting user decision.');
      setConfiguring(false);
      smoothScroll(simulationSectionRef);
      await wait(180);

      setSimulating(true);
      const simulationResult = await nimClient.generateMockPayload(generatedConfig, tenantId, 'judge_demo_user');
      setSimulation(simulationResult);
      setSimulating(false);
      smoothScroll(auditSectionRef);
      await wait(160);

      setAuditLoading(true);
      const data = await api.getAuditLogs(tenantId);
      setAuditLogs(data.logs || []);
      setAuditLoading(false);

      const completedAt = Date.now();
      setDemoSummary({
        totalTimeMs: completedAt - startedAt,
        serviceCount: parsedResult.services?.length || 0,
        schemaCount: parsedResult.schemas?.length || 0,
        selectedAdapter: topRank.adapter?.name || topRank.adapterId,
        selectedVersion: topRank.recommendedVersion,
        confidence: Math.round((topRank.confidence || 0) * 100),
        fieldMappings: generatedConfig.fieldMappings?.length || 0,
        latencyMs: simulationResult.latencyMs || 0,
        fieldCoverage: simulationResult.fieldCoverage || 0,
      });
    } catch (err) {
      setError(err.message || 'Run-all flow failed');
      setParsing(false);
      setRanking(false);
      setConfiguring(false);
      setSimulating(false);
      setAuditLoading(false);
    } finally {
      setFullRunning(false);
    }
  }

  useEffect(() => {
    // One-pager should start clean so judges always see a fresh 0/5 flow.
    resetFlowState();
    smoothScroll(parseSectionRef);
  }, []);

  return (
    <section className="animate-in onepager">
      <header className="page-header">
        <div className="badge-ai">One Pager Mode</div>
        <h1>End-to-End Integration One Pager</h1>
        <p>Single scrollable flow for judges: parse, rank, configure, simulate, and audit in one page with auto-scroll progression.</p>
      </header>

      <div className="card onepager-topbar">
        <div>
          <strong>Progress:</strong> {totalStepsDone}/5 steps completed
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={resetFlowState} disabled={fullRunning}>
            Reset Flow
          </button>
          <button className="btn btn-primary" onClick={handleRunAll} disabled={fullRunning}>
            {fullRunning ? 'Running Full Flow...' : 'Run Full Flow (Auto)'}
          </button>
        </div>
      </div>

      {error && <div className="card" style={{ borderColor: 'rgba(248,113,113,0.35)', marginTop: 12 }}><p style={{ color: 'var(--error)' }}>{error}</p></div>}

      <div className="card onepager-step" ref={parseSectionRef}>
        <h3>1. Parse Requirement</h3>
        <p>Upload or paste BRD text and extract service-level intent.</p>
        <div className="form-group">
          <label className="label" htmlFor="onepager-brd">Requirement Text</label>
          <textarea
            id="onepager-brd"
            className="input textarea"
            rows={8}
            value={documentText}
            onChange={e => setDocumentText(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary" onClick={handleParse} disabled={parsing || fullRunning}>
          {parsing ? 'Parsing...' : 'Parse'}
        </button>
        {parsing && (
          <div className="ai-thinking" style={{ marginTop: 12 }}>
            <div className="ai-dots"><span /><span /><span /></div>
            <span>Extracting services and schemas...</span>
          </div>
        )}

        {!!parsed && (
          <div style={{ marginTop: 14 }}>
            <p><strong>Project:</strong> {parsed.projectName}</p>
            <p><strong>Summary:</strong> {parsed.summary}</p>
            <p><strong>Services:</strong> {parsed.services?.length || 0}</p>
            <p><strong>Schemas:</strong> {parsed.schemas?.length || 0}</p>

            <table className="data-table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Auth</th>
                  <th>Mandatory</th>
                  <th>Endpoint</th>
                </tr>
              </thead>
              <tbody>
                {(parsed.services || []).map((service, idx) => (
                  <tr key={`${service.name}-${idx}`}>
                    <td>{service.name}</td>
                    <td>{service.authType}</td>
                    <td>{service.mandatory ? 'Yes' : 'No'}</td>
                    <td>{service.endpointPattern}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card onepager-step" ref={rankSectionRef}>
        <h3>2. Select Best Adapter</h3>
        <p>AI generates ranked options, then you pick the best adapter for this integration.</p>
        <div style={{ marginBottom: 10 }}>
          <span className={`badge ${strategy === 'embeddings' ? 'badge-success' : 'badge-warning'}`}>Strategy: {strategy}</span>
        </div>
        <button className="btn btn-secondary" onClick={handleRank} disabled={!canRank || ranking || fullRunning}>
          {ranking ? 'Ranking...' : 'Run Ranking'}
        </button>
        {ranking && (
          <div className="ai-thinking" style={{ marginTop: 12 }}>
            <div className="ai-dots"><span /><span /><span /></div>
            <span>Scoring services against adapter metadata...</span>
          </div>
        )}
        {!!rankings.length && (
          <div className="ranking-grid" style={{ marginTop: 14 }}>
            {rankings.map((row, idx) => {
              const confidencePercent = Math.round((row.confidence || 0) * 100);
              return (
                <article key={`${row.adapterId}-${idx}`} className="ranking-card">
                  <div className="ranking-top">
                    <h4>{row.serviceName}</h4>
                    <span className="badge badge-info">{confidencePercent}%</span>
                  </div>
                  <p className="ranking-adapter">{row.adapter?.name || row.adapterId}</p>
                  <p className="ranking-reason">{row.reason}</p>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="card onepager-step" ref={configSectionRef}>
        <h3>3. Generate Configuration</h3>
        <p>Create field mappings and target adapter template.</p>
        <div className="form-group" style={{ maxWidth: 420 }}>
          <label className="label" htmlFor="onepager-select">Select recommendation</label>
          <select
            id="onepager-select"
            className="input select"
            value={selectedIndex}
            onChange={e => setSelectedIndex(Number(e.target.value))}
          >
            {rankings.map((row, idx) => (
              <option key={`${row.adapterId}-${idx}`} value={idx}>{row.serviceName} → {row.adapter?.name || row.adapterId}</option>
            ))}
            {!rankings.length && <option value={0}>No ranking yet</option>}
          </select>
        </div>
        <button className="btn btn-secondary" onClick={handleConfig} disabled={!canConfig || configuring || fullRunning}>
          {configuring ? 'Generating...' : 'Generate Config'}
        </button>
        {configuring && (
          <div className="ai-thinking" style={{ marginTop: 12 }}>
            <div className="ai-dots"><span /><span /><span /></div>
            <span>Building field mappings and hook bindings...</span>
          </div>
        )}
        {!!config && (
          <div style={{ marginTop: 14 }}>
            <p><strong>Adapter:</strong> {config.adapterName}</p>
            <p><strong>Version:</strong> {config.version}</p>
            <p><strong>Endpoint:</strong> {config.endpoint}</p>
            <p><strong>Auth:</strong> {config.authType}</p>
            <p><strong>Mappings:</strong> {config.fieldMappings?.length || 0}</p>
            <p><strong>Status:</strong> {config.status || 'DRAFT'}</p>

            <table className="data-table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Target</th>
                  <th>Transform</th>
                </tr>
              </thead>
              <tbody>
                {(config.fieldMappings || []).map((row, idx) => (
                  <tr key={`${row.targetField}-${idx}`}>
                    <td>
                      {editMode ? (
                        <input className="input" value={row.sourceField || ''} onChange={e => updateMapping(idx, 'sourceField', e.target.value)} />
                      ) : (row.sourceField || 'UNMAPPED')}
                    </td>
                    <td>
                      {editMode ? (
                        <input className="input" value={row.targetField || ''} onChange={e => updateMapping(idx, 'targetField', e.target.value)} />
                      ) : row.targetField}
                    </td>
                    <td>
                      {editMode ? (
                        <input className="input" value={row.transformFn || ''} onChange={e => updateMapping(idx, 'transformFn', e.target.value)} />
                      ) : row.transformFn}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="card" style={{ marginTop: 12, padding: 14, borderColor: 'rgba(0, 212, 255, 0.22)' }}>
              <h4 style={{ marginBottom: 8 }}>User Decision Moment</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={handleApproveConfig}>Approve Config</button>
                <button className="btn btn-secondary" onClick={handleEnableEditMapping}>Edit Mapping</button>
                <button className="btn btn-ghost" onClick={handleRollbackConfig}>Rollback</button>
                {editMode && (
                  <button className="btn btn-secondary" onClick={handleSaveMappingUpdates}>Save Mapping Updates</button>
                )}
              </div>
              <div style={{ marginTop: 8 }}>
                <span className={`badge ${configDecision === 'approved' ? 'badge-success' : configDecision === 'rolled_back' ? 'badge-warning' : 'badge-info'}`}>
                  Decision: {configDecision.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <p style={{ marginTop: 8 }}>{decisionNote}</p>
            </div>
          </div>
        )}
      </div>

      <div className="card onepager-step" ref={simulationSectionRef}>
        <h3>4. Simulate</h3>
        <p>Run generated configuration and evaluate coverage and latency.</p>
        <button className="btn btn-secondary" onClick={handleSimulate} disabled={!canSimulate || simulating || fullRunning}>
          {simulating ? 'Simulating...' : 'Run Simulation'}
        </button>
        {simulating && (
          <div className="ai-thinking" style={{ marginTop: 12 }}>
            <div className="ai-dots"><span /><span /><span /></div>
            <span>Generating mock payloads and executing simulation...</span>
          </div>
        )}
        {!!simulation && (
          <>
            <div className="metric-grid" style={{ marginTop: 14, marginBottom: 0 }}>
              <div className="metric-tile"><div className="metric-label">Status</div><div className="metric-value" style={{ fontSize: '1rem' }}>{simulation.status}</div></div>
              <div className="metric-tile"><div className="metric-label">Coverage</div><div className="metric-value">{simulation.fieldCoverage}%</div></div>
              <div className="metric-tile"><div className="metric-label">Latency</div><div className="metric-value">{simulation.latencyMs}ms</div></div>
            </div>

            <div className="card" style={{ marginTop: 12, padding: 14 }}>
              <h4 style={{ marginBottom: 10 }}>Simulation Visual Flow</h4>
              <div className="sim-flow-wrap">
                <div className="sim-flow-node">
                  <div className="sim-flow-title">1. Config Loaded</div>
                  <div className="sim-flow-value">{simulation.adapterId} · v{simulation.version}</div>
                </div>
                <div className="sim-flow-arrow">→</div>

                <div className="sim-flow-node">
                  <div className="sim-flow-title">2. Mock Request</div>
                  <div className="sim-flow-value">{Object.keys(simulation.mockRequest || {}).length} fields</div>
                </div>
                <div className="sim-flow-arrow">→</div>

                <div className="sim-flow-node">
                  <div className="sim-flow-title">3. Adapter Execute</div>
                  <div className="sim-flow-value">Latency {simulation.latencyMs}ms</div>
                </div>
                <div className="sim-flow-arrow">→</div>

                <div className="sim-flow-node">
                  <div className="sim-flow-title">4. Response Validate</div>
                  <div className="sim-flow-value">Coverage {simulation.fieldCoverage}%</div>
                </div>
                <div className="sim-flow-arrow">→</div>

                <div className="sim-flow-node">
                  <div className="sim-flow-title">5. Decision Signal</div>
                  <div className="sim-flow-value">{simulation.fieldCoverage >= 85 ? 'PASS' : 'NEEDS TUNING'}</div>
                </div>
              </div>

              <div className="sim-interpret" style={{ marginTop: 12 }}>
                <p><strong>Status:</strong> confirms if simulated execution completed successfully.</p>
                <p><strong>Coverage:</strong> how much of expected response schema was produced.</p>
                <p><strong>Latency:</strong> expected response speed for this adapter path.</p>
                <p><strong>Decision:</strong> {simulation.fieldCoverage >= 85 ? 'Looks healthy for approval review.' : 'Tune mappings and rerun simulation before approval.'}</p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="card onepager-step" ref={auditSectionRef}>
        <h3>5. Audit Trail</h3>
        <p>View latest tenant-isolated actions for governance proof.</p>
        <button className="btn btn-secondary" onClick={handleAuditRefresh} disabled={auditLoading || fullRunning}>
          {auditLoading ? 'Refreshing...' : 'Refresh Audit'}
        </button>
        {auditLoading && (
          <div className="ai-thinking" style={{ marginTop: 12 }}>
            <div className="ai-dots"><span /><span /><span /></div>
            <span>Loading audit events...</span>
          </div>
        )}
        {!!auditLogs.length && (
          <table className="data-table" style={{ marginTop: 14 }}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.slice(0, 8).map(log => (
                <tr key={log.logId}>
                  <td>{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td>{log.action}</td>
                  <td>{log.userId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!!demoSummary && (
        <div className="card card-glow-green onepager-step">
          <h3>Execution Summary</h3>
          <div className="metric-grid" style={{ marginBottom: 0 }}>
            <div className="metric-tile"><div className="metric-label">Total Runtime</div><div className="metric-value">{demoSummary.totalTimeMs}ms</div></div>
            <div className="metric-tile"><div className="metric-label">Selected Adapter</div><div className="metric-value" style={{ fontSize: '1rem' }}>{demoSummary.selectedAdapter}</div></div>
            <div className="metric-tile"><div className="metric-label">Mappings</div><div className="metric-value">{demoSummary.fieldMappings}</div></div>
            <div className="metric-tile"><div className="metric-label">Coverage</div><div className="metric-value">{demoSummary.fieldCoverage}%</div></div>
          </div>
        </div>
      )}
    </section>
  );
}
