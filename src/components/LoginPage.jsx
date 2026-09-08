import React, { useState } from 'react';
import { Lock, User, Key, LogIn, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { authenticateUser } from '../wasm/db';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = authenticateUser(username.trim(), password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError('Invalid username or password. Try quick login buttons below.');
      }
    } catch (err) {
      console.error(err);
      setError('Database error during login authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (uName, pwd) => {
    setUsername(uName);
    setPassword(pwd);
    setError('');
    try {
      const user = authenticateUser(uName, pwd);
      if (user) {
        onLoginSuccess(user);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.15), rgba(15, 23, 42, 0.95) 60%), #0f172a',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background ambient glow */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, rgba(0,0,0,0) 70%)',
        top: '-100px',
        right: '-100px',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(30, 41, 59, 0.75)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '2.5rem 2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Official Logo Banner */}
        <div style={{
          width: '110px',
          height: '110px',
          borderRadius: '50%',
          padding: '4px',
          background: 'linear-gradient(135deg, #10b981, #f59e0b, #059669)',
          marginBottom: '1.25rem',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
        }}>
          <img 
            src="./logo.png" 
            alt="BEACON FAM Logo" 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%',
              background: '#fff'
            }}
          />
        </div>

        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 900,
          color: '#f8fafc',
          letterSpacing: '-0.02em',
          textAlign: 'center',
          marginBottom: '0.25rem'
        }}>
          BEACON FAM
        </h1>
        <p style={{
          fontSize: '0.875rem',
          color: '#94a3b8',
          textAlign: 'center',
          marginBottom: '1.75rem'
        }}>
          Poultry & Egg Production Management System
        </p>

        {error && (
          <div style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#f43f5e',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="#64748b" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Enter username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  paddingLeft: '2.75rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  borderRadius: '10px'
                }}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#64748b" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                className="form-control" 
                placeholder="Enter password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  paddingLeft: '2.75rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  borderRadius: '10px'
                }}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: 800,
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
            }}
          >
            <LogIn size={18} /> {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>

        {/* Quick Demo Login Preset Buttons */}
        <div style={{ width: '100%', marginTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', marginBottom: '0.875rem' }}>
            ⚡ Instant Quick Access
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'admin@123')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.625rem 0.875rem',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <span>👑 Administrator</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>admin@123</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('sales', 'sales@123')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.625rem 0.875rem',
                borderRadius: '8px',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                background: 'rgba(6, 182, 212, 0.1)',
                color: '#06b6d4',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <span>📈 Sales Manager</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>sales@123</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('construction', 'construction@123')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.625rem 0.875rem',
                borderRadius: '8px',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                background: 'rgba(245, 158, 11, 0.1)',
                color: '#f59e0b',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <span>🏗️ Construction Lead</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>construction@123</span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <ShieldCheck size={14} color="#10b981" /> SQLite WASM Role Security Active
        </div>
      </div>
    </div>
  );
}
