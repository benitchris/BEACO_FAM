import React, { useState, useEffect, Component } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ChickensPage from './components/ChickensPage';
import EggsPage from './components/EggsPage';
import SalesPage from './components/SalesPage';
import FeedPage from './components/FeedPage';
import MortalityPage from './components/MortalityPage';
import VaccinationPage from './components/VaccinationPage';
import ExpensesPage from './components/ExpensesPage';
import ReportsPage from './components/ReportsPage';
import SettingsPage from './components/SettingsPage';
import LoginPage from './components/LoginPage';
import PythonWasmConsole from './components/PythonWasmConsole';
import DatabaseConsole from './components/DatabaseConsole';

import { initWasmDatabase, getFarmMetrics } from './wasm/db';

const SESSION_KEY = 'BEACON_FAM_LOGGED_USER_SESSION_v1';

// React Error Boundary Component to prevent blank screen crashes
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('BEACON FAM App UI Error Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: '#fff',
          padding: '2rem'
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '2.5rem', background: '#1e293b', border: '1px solid rgba(244,63,94,0.3)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f43f5e', marginBottom: '0.75rem' }}>
              ⚠️ Application View Error
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {this.state.error?.message || 'A temporary rendering error occurred while displaying this section.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button 
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  if (this.props.onReset) this.props.onReset();
                }} 
                className="btn btn-primary"
              >
                Reload View
              </button>
              <button 
                onClick={() => {
                  localStorage.removeItem(SESSION_KEY);
                  window.location.reload();
                }} 
                className="btn btn-secondary"
              >
                Sign Out & Restart
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [dbReady, setDbReady] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [metrics, setMetrics] = useState({
    totalChickens: 0,
    totalEggs: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    totalDeaths: 0,
    feedPurchased: 0,
    feedConsumed: 0,
    feedRemaining: 0,
    mortalityRate: '0.00',
    survivalRate: '100.00',
    eggsPerChicken: '0.00',
    overallStatus: 'LOADING...'
  });

  const refreshFarmData = () => {
    try {
      const data = getFarmMetrics();
      setMetrics(data);
    } catch (e) {
      console.error('Failed to get farm metrics:', e);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    initWasmDatabase()
      .then(() => {
        setDbReady(true);
        refreshFarmData();
      })
      .catch((err) => {
        console.error('Failed to initialize WebAssembly database:', err);
        setDbReady(true);
      });
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const handleUserUpdated = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
  };

  // If DB not ready
  if (!dbReady) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#fff',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          padding: '4px',
          background: 'linear-gradient(135deg, #10b981, #f59e0b)'
        }}>
          <img src="./logo.png" alt="BEACON FAM Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>BEACON FAM</h2>
        <div className="badge badge-emerald" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          Initializing SQLite & WebAssembly Engine...
        </div>
      </div>
    );
  }

  // If user not authenticated, render Login Screen
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Role permissions check
  const role = currentUser.role || 'Admin';
  const roleAllowedTabs = {
    Admin: ['dashboard', 'chickens', 'eggs', 'expenses', 'sales', 'feed', 'mortality', 'vaccination', 'reports', 'settings', 'python', 'database'],
    Sales: ['dashboard', 'eggs', 'sales', 'reports', 'settings'],
    Construction: ['dashboard', 'expenses', 'reports', 'settings'],
    Employee: ['dashboard', 'chickens', 'eggs', 'reports', 'settings']
  };

  const allowed = roleAllowedTabs[role] || roleAllowedTabs.Admin;
  const currentTabAllowed = allowed.includes(activeTab);

  return (
    <ErrorBoundary onReset={() => setActiveTab('dashboard')}>
      <div className="app-container">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentUser={currentUser}
        />

        <div className="main-content">
          <Header
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            theme={theme}
            setTheme={setTheme}
            onRefreshData={refreshFarmData}
            currentUser={currentUser}
            onLogout={handleLogout}
            onNavigate={setActiveTab}
          />

          <main className="page-body">
            {!currentTabAllowed ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div className="card" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center', padding: '2.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-rose)', marginBottom: '0.5rem' }}>
                    🚫 Access Restricted
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    Your account role (<strong>{role}</strong>) does not have permission to view this section.
                  </p>
                  <button onClick={() => setActiveTab('dashboard')} className="btn btn-primary">
                    Return to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <Dashboard
                    metrics={metrics}
                    onNavigate={setActiveTab}
                    currentUser={currentUser}
                  />
                )}
                {activeTab === 'chickens' && (
                  <ChickensPage onRefreshData={refreshFarmData} />
                )}
                {activeTab === 'eggs' && (
                  <EggsPage onRefreshData={refreshFarmData} />
                )}
                {activeTab === 'sales' && (
                  <SalesPage onRefreshData={refreshFarmData} />
                )}
                {activeTab === 'expenses' && (
                  <ExpensesPage onRefreshData={refreshFarmData} currentUser={currentUser} />
                )}
                {activeTab === 'feed' && (
                  <FeedPage onRefreshData={refreshFarmData} />
                )}
                {activeTab === 'mortality' && (
                  <MortalityPage onRefreshData={refreshFarmData} />
                )}
                {activeTab === 'vaccination' && (
                  <VaccinationPage onRefreshData={refreshFarmData} />
                )}
                {activeTab === 'reports' && (
                  <ReportsPage currentUser={currentUser} />
                )}
                {activeTab === 'settings' && (
                  <SettingsPage currentUser={currentUser} onUserUpdated={handleUserUpdated} />
                )}
                {activeTab === 'python' && (
                  <PythonWasmConsole metrics={metrics} />
                )}
                {activeTab === 'database' && (
                  <DatabaseConsole onRefreshData={refreshFarmData} />
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
