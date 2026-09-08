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
  Cpu
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chickens', label: 'Chickens / Flock', icon: Bird },
    { id: 'eggs', label: 'Egg Production', icon: Egg },
    { id: 'sales', label: 'Sales & Revenue', icon: DollarSign },
    { id: 'feed', label: 'Feed Inventory', icon: Wheat },
    { id: 'mortality', label: 'Mortality Tracker', icon: Skull },
    { id: 'vaccination', label: 'Vaccination Log', icon: Syringe },
    { id: 'python', label: 'Python WASM Studio', icon: Terminal, badge: 'WASM' },
    { id: 'database', label: 'SQLite Console', icon: Database, badge: 'WASM' },
  ];

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          padding: '0.5rem',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}>
          <Bird size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>BEACO FARM</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.7rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
            <Cpu size={12} />
            <span>WebAssembly 2.0</span>
          </div>
        </div>
      </div>

      <nav style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', paddingLeft: '0.75rem' }}>
          Management
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
          <span>Storage Mode</span>
          <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>IndexedDB / WASM</span>
        </div>
      </div>
    </aside>
  );
}
