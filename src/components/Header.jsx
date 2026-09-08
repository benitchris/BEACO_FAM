import React from 'react';
import { Menu, Sun, Moon, User, RefreshCw } from 'lucide-react';
import { resetToDefaults } from '../wasm/db';

export default function Header({ sidebarOpen, setSidebarOpen, theme, setTheme, onRefreshData }) {
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
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Poultry Management Engine
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onRefreshData}
          className="btn btn-secondary btn-sm"
          title="Refresh WASM Cache"
        >
          <RefreshCw size={16} />
          <span>Sync Data</span>
        </button>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="btn btn-secondary btn-sm"
          style={{ padding: '0.5rem' }}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
        </button>

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
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--accent-emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <User size={16} />
          </div>
          <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)' }}>Administrator</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-subtle)' }}>admin@beacofarm.com</div>
          </div>
        </div>
      </div>
    </header>
  );
}
