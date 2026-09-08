import React, { useState } from 'react';
import { Database, Play, Download, RotateCcw, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { runQuery, resetToDefaults, executeSql } from '../wasm/db';

export default function DatabaseConsole({ onRefreshData }) {
  const [sql, setSql] = useState("SELECT * FROM chickens;");
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleRunSql = () => {
    setError(null);
    setResults(null);
    try {
      if (sql.trim().toUpperCase().startsWith("SELECT") || sql.trim().toUpperCase().startsWith("PRAGMA")) {
        const rows = runQuery(sql);
        setResults(rows);
      } else {
        executeSql(sql);
        setResults([{ result: 'SQL Statement Executed Successfully' }]);
        onRefreshData();
      }
    } catch (err) {
      setError(err.toString());
    }
  };

  const handleExportJson = () => {
    try {
      const tables = ['chickens', 'egg_production', 'customers', 'sales', 'feed_management', 'vaccinations', 'mortality'];
      const backup = {};
      tables.forEach(t => {
        backup[t] = runQuery(`SELECT * FROM ${t}`);
      });
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `beaco_farm_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      alert("Error exporting JSON: " + e);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset SQLite database to default initial schema and seed dataset?')) {
      await resetToDefaults();
      onRefreshData();
      setSql("SELECT * FROM chickens;");
      setResults(runQuery("SELECT * FROM chickens;"));
      alert("Database reset completed.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database color="var(--accent-emerald)" /> In-Browser SQLite WASM Terminal
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Execute raw SQL queries against the client-side SQLite database and export full backups.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleExportJson} className="btn btn-secondary">
            <Download size={16} /> Export JSON Data
          </button>
          <button onClick={handleReset} className="btn btn-danger btn-sm">
            <RotateCcw size={14} /> Reset Database
          </button>
        </div>
      </div>

      {/* Terminal Editor */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>SQL Query Editor</span>
          <button onClick={handleRunSql} className="btn btn-primary btn-sm">
            <Play size={14} /> Run Query
          </button>
        </div>
        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          rows="4"
          className="form-control"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: '#10b981' }}
        />
      </div>

      {/* Results View */}
      {error && (
        <div className="card" style={{ borderColor: 'var(--accent-rose)', background: 'rgba(244,63,94,0.1)' }}>
          <div style={{ color: 'var(--accent-rose)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} /> Query Execution Error
          </div>
          <pre style={{ marginTop: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{error}</pre>
        </div>
      )}

      {results && Array.isArray(results) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Query Results ({results.length} rows returned)
          </span>
          <div className="table-container">
            <table>
              {results.length > 0 && (
                <thead>
                  <tr>
                    {Object.keys(results[0]).map(key => <th key={key}>{key}</th>)}
                  </tr>
                </thead>
              )}
              <tbody>
                {results.map((row, idx) => (
                  <tr key={idx}>
                    {Object.values(row).map((val, i) => (
                      <td key={i}>{val !== null ? String(val) : 'NULL'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
