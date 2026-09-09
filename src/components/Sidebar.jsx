import React from 'react';
import { 
  LayoutDashboard, 
  Bird, 
  Egg, 
  DollarSign, 
  Wheat, 
  Skull, 
  Syringe, 
  Terminal, 
  Database,
  Cpu,
  HardHat,
  FileSpreadsheet,
  Settings,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen, currentUser }) {
  const role = currentUser?.role || 'Admin';

  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Sales', 'Construction', 'Employee'] },
    { id: 'chickens', label: 'Chickens / Flock', icon: Bird, roles: ['Admin', 'Employee'] },
    { id: 'eggs', label: 'Egg Production', icon: Egg, roles: ['Admin', 'Sales', 'Employee'] },
    { id: 'expenses', label: role === 'Construction' ? 'Construction Expenses' : 'Workers & Expenses', icon: HardHat, roles: ['Admin', 'Construction'] },
    { id: 'sales', label: 'Sales & Revenue', icon: DollarSign, roles: ['Admin', 'Sales'] },
    { id: 'feed', label: 'Feed Inventory', icon: Wheat, roles: ['Admin'] },
    { id: 'mortality', label: 'Mortality Tracker', icon: Skull, roles: ['Admin'] },
    { id: 'vaccination', label: 'Vaccination Log', icon: Syringe, roles: ['Admin'] },
    { id: 'reports', label: 'Reports & Exports', icon: FileSpreadsheet, roles: ['Admin', 'Sales', 'Construction'], badge: 'PDF/XLS' },
    { id: 'settings', label: 'Settings & Profile', icon: Settings, roles: ['Admin', 'Sales', 'Construction'] },
    { id: 'python', label: 'Python WASM Studio', icon: Terminal, roles: ['Admin'], badge: 'WASM' },
    { id: 'database', label: 'SQLite Console', icon: Database, roles: ['Admin'], badge: 'WASM' },
  ];

  // Filter items based on logged in role
  const navItems = allNavItems.filter(item => item.roles.includes(role));

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          padding: '2px',
          background: 'linear-gradient(135deg, #10b981, #f59e0b)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <img 
            src="./logo.png" 
            alt="BEACON FAM Logo" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', background: '#fff' }} 
          />
        </div>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.1, letterSpacing: '-0.01em' }}>BEACON FAM</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.7rem', color: 'var(--accent-emerald)', fontWeight: 700, marginTop: '0.2rem' }}>
            <Cpu size={12} />
            <span>WebAssembly 2.0</span>
          </div>
        </div>
      </div>

      <nav style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Navigation
          </span>
          <span className="badge badge-sky" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
            {role}
          </span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 0.875rem',
                marginBottom: '0.375rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                color: isActive ? 'var(--accent-emerald)' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={18} color={isActive ? 'var(--accent-emerald)' : 'currentColor'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="badge badge-emerald" style={{ fontSize: '0.65rem', padding: '0.125rem 0.375rem' }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <ShieldCheck size={14} color="var(--accent-emerald)" /> {currentUser?.username || 'User'}
          </span>
          <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>{role}</span>
        </div>
      </div>
    </aside>
  );
}
