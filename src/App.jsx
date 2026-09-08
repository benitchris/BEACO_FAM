import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ChickensPage from './components/ChickensPage';
import EggsPage from './components/EggsPage';
import SalesPage from './components/SalesPage';
import FeedPage from './components/FeedPage';
import MortalityPage from './components/MortalityPage';
import VaccinationPage from './components/VaccinationPage';
import PythonWasmConsole from './components/PythonWasmConsole';
import DatabaseConsole from './components/DatabaseConsole';

import { initWasmDatabase, getFarmMetrics } from './wasm/db';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [dbReady, setDbReady] = useState(false);
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
      });
  }, []);

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="main-content">
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          theme={theme}
          setTheme={setTheme}
          onRefreshData={refreshFarmData}
        />

        <main className="page-body">
          {!dbReady ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div className="badge badge-emerald" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                Initializing SQLite & WebAssembly Engine...
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard
                  metrics={metrics}
                  onNavigate={setActiveTab}
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
              {activeTab === 'feed' && (
                <FeedPage onRefreshData={refreshFarmData} />
              )}
              {activeTab === 'mortality' && (
                <MortalityPage onRefreshData={refreshFarmData} />
              )}
              {activeTab === 'vaccination' && (
                <VaccinationPage onRefreshData={refreshFarmData} />
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
  );
}
