import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import './index.css';
import { EngineProvider } from './context/EngineContext';

// Pages
import ParserPage      from './pages/ParserPage';
import RegistryPage    from './pages/RegistryPage';
import ConfigPage      from './pages/ConfigPage';
import SimulationPage  from './pages/SimulationPage';
import GovernancePage  from './pages/GovernancePage';
import OnePagerPage    from './pages/OnePagerPage';

const NAV_ITEMS = [
  {
    section: 'Engine Modules',
    items: [
      { path: '/one-pager',  icon: '🧭', label: 'One-Page Flow',      badge: 'NEW' },
      { path: '/parser',     icon: '📄', label: 'Requirement Parser',  badge: 'AI' },
      { path: '/registry',   icon: '🗂️', label: 'Integration Registry', badge: null },
      { path: '/config',     icon: '⚙️', label: 'Auto-Configuration',  badge: 'AI' },
      { path: '/simulation', icon: '🧪', label: 'Simulation & Testing', badge: null },
    ],
  },
  {
    section: 'Governance',
    items: [
      { path: '/governance', icon: '🛡️', label: 'Audit Dashboard',     badge: null },
    ],
  },
];

function Sidebar({ tenantId, setTenantId }) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">⚡</div>
          <div>
            <div className="logo-name gradient-text">Integration Engine</div>
            <div className="logo-sub">Orchestration Engine</div>
          </div>
        </div>
      </div>

      {/* Tenant */}
      <div className="sidebar-tenant">
        <select
          className="input select"
          value={tenantId}
          onChange={e => setTenantId(e.target.value)}
          id="tenant-selector"
          style={{ fontSize: '0.75rem', padding: '7px 32px 7px 10px' }}
        >
          <option value="tenant_hdfc">HDFC Bank — Lending</option>
          <option value="tenant_bajaj">Bajaj Finserv</option>
          <option value="tenant_axis">Axis Bank</option>
          <option value="tenant_demo">Demo Tenant</option>
        </select>
        <div className="tenant-badge" style={{ marginTop: 8 }}>
          <div className="dot" />
          <span>Live · Multi-tenant Mode</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(group => (
          <div key={group.section}>
            <div className="nav-section-label">{group.section}</div>
            {group.items.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                id={`nav-${item.path.replace('/', '')}`}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div>Powered by</div>
        <div className="nim-badge">
          <span>🟢</span>
          <span>NVIDIA NIM APIs</span>
        </div>
        <div style={{ marginTop: 8, color: 'var(--text-muted)' }}>
          LLM: dracarys-llama-3.1-70b
        </div>
      </div>
    </aside>
  );
}

function AppInner() {
  const [tenantId, setTenantId] = useState('tenant_hdfc');

  return (
    <div className="app-layout">
      <Sidebar tenantId={tenantId} setTenantId={setTenantId} />
      <main className="main-content">
        <Routes>
          <Route path="/"           element={<OnePagerPage tenantId={tenantId} />} />
          <Route path="/one-pager"  element={<OnePagerPage tenantId={tenantId} />} />
          <Route path="/parser"     element={<ParserPage tenantId={tenantId} />} />
          <Route path="/registry"   element={<RegistryPage tenantId={tenantId} />} />
          <Route path="/config"     element={<ConfigPage tenantId={tenantId} />} />
          <Route path="/simulation" element={<SimulationPage tenantId={tenantId} />} />
          <Route path="/governance" element={<GovernancePage tenantId={tenantId} />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <EngineProvider>
        <AppInner />
      </EngineProvider>
    </BrowserRouter>
  );
}
