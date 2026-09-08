import React, { useState } from 'react';
import { Terminal, Play, Cpu, CheckCircle2, AlertTriangle, Code } from 'lucide-react';
import { runPythonAnalytics, PYTHON_TEMPLATES } from '../wasm/pyodide';

export default function PythonWasmConsole({ metrics }) {
  const [selectedTemplate, setSelectedTemplate] = useState('farm_performance');
  const [code, setCode] = useState(PYTHON_TEMPLATES.farm_performance);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSelectTemplate = (templateKey) => {
    setSelectedTemplate(templateKey);
    setCode(PYTHON_TEMPLATES[templateKey]);
  };

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setOutput('');

    try {
      const res = await runPythonAnalytics(code, metrics);
      if (res.success) {
        setOutput(res.output);
      } else {
        setError(res.error);
      }
    } catch (e) {
      setError(e.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Terminal color="var(--accent-sky)" /> Python WebAssembly (WASM) Studio
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Run live Python analytics scripts client-side using Pyodide WebAssembly.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className="badge badge-sky"><Cpu size={12} /> Pyodide WASM Engine</span>
          <button onClick={handleRun} disabled={loading} className="btn btn-emerald">
            <Play size={16} /> {loading ? 'Running WASM...' : 'Execute Python Script'}
          </button>
        </div>
      </div>

      {/* Script Selector */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => handleSelectTemplate('farm_performance')}
          className={`btn btn-sm ${selectedTemplate === 'farm_performance' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Code size={14} /> farm_performance.py
        </button>
        <button
          onClick={() => handleSelectTemplate('feed_analysis')}
          className={`btn btn-sm ${selectedTemplate === 'feed_analysis' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Code size={14} /> feed_analysis.py
        </button>
        <button
          onClick={() => handleSelectTemplate('mortality_analysis')}
          className={`btn btn-sm ${selectedTemplate === 'mortality_analysis' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Code size={14} /> mortality_analysis.py
        </button>
      </div>

      {/* Grid Layout: Code Editor + Output Console */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        {/* Editor */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              script.py
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Accesses `farm_data` dict</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              width: '100%',
              height: '380px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem',
              background: 'var(--bg-primary)',
              color: '#38bdf8',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem',
              outline: 'none',
              resize: 'none',
              lineHeight: 1.5
            }}
          />
        </div>

        {/* Output */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem', background: '#090d16' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal size={16} /> Standard Output (stdout)
            </span>
            {loading && <span className="badge badge-amber">Executing...</span>}
          </div>

          <div style={{
            height: '380px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8125rem',
            color: '#f8fafc',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6
          }}>
            {error ? (
              <div style={{ color: 'var(--accent-rose)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            ) : output ? (
              output
            ) : (
              <span style={{ color: 'var(--text-subtle)' }}>
                Click "Execute Python Script" to run code inside WebAssembly Pyodide engine...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
