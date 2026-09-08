import React from 'react';
import { Menu, Sun, Moon, User, RefreshCw, LogOut, Settings, Shield } from 'lucide-react';

export default function Header({ sidebarOpen, setSidebarOpen, theme, setTheme, onRefreshData, currentUser, onLogout, onNavigate }) {
  const roleColors = {
    Admin: 'var(--accent-emerald)',
    Sales: 'var(--accent-sky)',
    Construction: 'var(--accent-amber)',
    Employee: 'var(--accent-purple)'
  };

  const badgeColor = roleColors[currentUser?.role] || 'var(--accent-emerald)';

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', padding: '0.5rem' }}
        >
          <Menu size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="./logo.png" alt="Logo" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
          <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
            BEACON FAM
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <button
          onClick={onRefreshData}
          className="btn btn-secondary btn-sm"
          title="Refresh WASM Data Cache"
        >
          <RefreshCw size={16} />
          <span className="hide-mobile">Sync</span>
        </button>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="btn btn-secondary btn-sm"
          style={{ padding: '0.5rem' }}
          title="Toggle Dark/Light Theme"
        >
          {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
        </button>

        {/* Logged In User Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          padding: '0.375rem 0.75rem',
          background: 'var(--bg-surface-elevated)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: badgeColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            fontWeight: 800,
            fontSize: '0.8rem'
          }}>
            {(currentUser?.full_name || currentUser?.username || 'U')[0].toUpperCase()}
          </div>
          <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              {currentUser?.full_name || currentUser?.username}
            </div>
            <div style={{ fontSize: '0.6875rem', color: badgeColor, fontWeight: 700 }}>
              {currentUser?.role || 'User'}
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('settings')}
          className="btn btn-secondary btn-sm"
          style={{ padding: '0.5rem' }}
          title="User & System Settings"
        >
          <Settings size={18} />
        </button>

        <button
          onClick={onLogout}
          className="btn btn-danger btn-sm"
          style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
          title="Sign Out"
        >
          <LogOut size={16} />
          <span className="hide-mobile">Logout</span>
        </button>
      </div>
    </header>
  );
}
