import React from 'react';
import { 
  Bird, 
  Egg, 
  DollarSign, 
  Wheat, 
  Activity, 
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  HardHat,
  Building2,
  Users,
  FileSpreadsheet,
  Plus,
  Wrench
} from 'lucide-react';

export default function Dashboard({ metrics, onNavigate, currentUser }) {
  const role = currentUser?.role || 'Admin';

  const getStatusBadge = (status) => {
    if (status.includes('EXCELLENT') || status.includes('GOOD')) {
      return <span className="badge badge-emerald"><CheckCircle2 size={14} /> {status}</span>;
    }
    if (status.includes('ATTENTION') || status.includes('WARNING') || status.includes('CRITICAL')) {
      return <span className="badge badge-rose"><AlertTriangle size={14} /> {status}</span>;
    }
    return <span className="badge badge-amber"><Activity size={14} /> {status}</span>;
  };

  // 1. CONSTRUCTION DASHBOARD VIEW
  if (role === 'Construction') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Top Banner */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(16, 185, 129, 0.15))',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          padding: '2rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-amber)', fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <HardHat size={18} />
              <span>Construction & Site Operations Hub</span>
            </div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              BEACON FAM Construction Dashboard
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', maxWidth: '600px' }}>
              Track farm infrastructure repairs, building shed capacities, feed silos, solar installations, and capital expenditure.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('expenses')} className="btn btn-primary">
              <Plus size={18} /> Record Construction Cost
            </button>
            <button onClick={() => onNavigate('reports')} className="btn btn-secondary">
              <FileSpreadsheet size={18} /> Export Reports
            </button>
          </div>
        </div>

        {/* Construction Stat Cards */}
        <div className="stat-grid">
          <div className="card stat-card card-hover" onClick={() => onNavigate('expenses')} style={{ cursor: 'pointer', borderLeft: '4px solid var(--accent-amber)' }}>
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
              <HardHat size={28} />
            </div>
            <div>
              <div className="stat-lbl">Construction & Repair Costs</div>
              <div className="stat-val">RWF {(metrics.totalConstruction || 0).toLocaleString()}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', marginTop: '0.25rem', fontWeight: 600 }}>
                Capital Infrastructure Expenses
              </div>
            </div>
          </div>

          <div className="card stat-card card-hover" style={{ borderLeft: '4px solid var(--accent-emerald)' }}>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
              <Building2 size={28} />
            </div>
            <div>
              <div className="stat-lbl">Active Sheds & Buildings</div>
              <div className="stat-val">3 Units</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '0.25rem', fontWeight: 600 }}>
                Building A, B, C (Total Cap: 1,300)
              </div>
            </div>
          </div>

          <div className="card stat-card card-hover" style={{ borderLeft: '4px solid var(--accent-sky)' }}>
            <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-sky)' }}>
              <Wrench size={28} />
            </div>
            <div>
              <div className="stat-lbl">Completed Site Upgrades</div>
              <div className="stat-val">4 Projects</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-sky)', marginTop: '0.25rem', fontWeight: 600 }}>
                Roof, Silo, Plumbing & Solar
              </div>
            </div>
          </div>
        </div>

        {/* Building Units Infrastructure Summary */}
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={20} color="var(--accent-emerald)" />
            Farm Shed Infrastructure Overview
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--accent-emerald)' }}>Building A</span>
                <span className="badge badge-emerald">Cap: 600</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Main Layer House — East Wing. Iron sheet roofing repaired & reinforced.</p>
            </div>

            <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--accent-sky)' }}>Building B</span>
                <span className="badge badge-sky">Cap: 400</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Broiler House — Central Unit. Ventilated feeding area & automatic waterers.</p>
            </div>

            <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--accent-amber)' }}>Building C</span>
                <span className="badge badge-amber">Cap: 300</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Chick Nursery — West Wing. Extended water pipeline & solar heating backup.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. SALES DASHBOARD VIEW
  if (role === 'Sales') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Top Banner */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(16, 185, 129, 0.15))',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          padding: '2rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-sky)', fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <DollarSign size={18} />
              <span>Commercial Sales & Customer Hub</span>
            </div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              BEACON FAM Sales Operations
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', maxWidth: '600px' }}>
              Monitor commercial egg sales, customer ledgers, unit pricing, and net egg harvest available for dispatch.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('sales')} className="btn btn-primary">
              <Plus size={18} /> Record New Sale
            </button>
            <button onClick={() => onNavigate('reports')} className="btn btn-secondary">
              <FileSpreadsheet size={18} /> Export Sales Reports
            </button>
          </div>
        </div>

        {/* Sales Stat Cards */}
        <div className="stat-grid">
          <div className="card stat-card card-hover" onClick={() => onNavigate('sales')} style={{ cursor: 'pointer', borderLeft: '4px solid var(--accent-sky)' }}>
            <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-sky)' }}>
              <DollarSign size={28} />
            </div>
            <div>
              <div className="stat-lbl">Total Sales Revenue</div>
              <div className="stat-val">{metrics.totalRevenue.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 600 }}>RWF</span></div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-sky)', marginTop: '0.25rem', fontWeight: 600 }}>
                {metrics.totalCustomers} Registered Buyers
              </div>
            </div>
          </div>

          <div className="card stat-card card-hover" onClick={() => onNavigate('eggs')} style={{ cursor: 'pointer', borderLeft: '4px solid var(--accent-amber)' }}>
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
              <Egg size={28} />
            </div>
            <div>
              <div className="stat-lbl">Total Eggs Harvested</div>
              <div className="stat-val">{metrics.totalEggs.toLocaleString()}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Harvest ready for dispatch
              </div>
            </div>
          </div>

          <div className="card stat-card card-hover" style={{ borderLeft: '4px solid var(--accent-emerald)' }}>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
              <Users size={28} />
            </div>
            <div>
              <div className="stat-lbl">Active Customer Accounts</div>
              <div className="stat-val">{metrics.totalCustomers}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '0.25rem', fontWeight: 600 }}>
                Wholesale & Retail Buyers
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. ADMIN FULL DASHBOARD VIEW (Everything)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        padding: '2rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            <Sparkles size={18} />
            <span>Executive WebAssembly Control Center</span>
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            BEACON FAM Operations Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', maxWidth: '600px' }}>
            Complete executive overview of flock health, egg collection, commercial revenue, worker payroll, construction expenses, and WASM analytics.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Overall Farm Health
          </div>
          {getStatusBadge(metrics.overallStatus)}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="stat-grid">
        <div className="card stat-card card-hover" onClick={() => onNavigate('chickens')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
            <Bird size={28} />
          </div>
          <div>
            <div className="stat-lbl">Active Chickens</div>
            <div className="stat-val">{metrics.totalChickens.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '0.25rem', fontWeight: 600 }}>
              Flock Count
            </div>
          </div>
        </div>

        <div className="card stat-card card-hover" onClick={() => onNavigate('eggs')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
            <Egg size={28} />
          </div>
          <div>
            <div className="stat-lbl">Total Eggs Harvested</div>
            <div className="stat-val">{metrics.totalEggs.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {metrics.eggsPerChicken} eggs / chicken
            </div>
          </div>
        </div>

        <div className="card stat-card card-hover" onClick={() => onNavigate('sales')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-sky)' }}>
            <DollarSign size={28} />
          </div>
          <div>
            <div className="stat-lbl">Total Sales Revenue</div>
            <div className="stat-val">{metrics.totalRevenue.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 600 }}>RWF</span></div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-sky)', marginTop: '0.25rem', fontWeight: 600 }}>
              {metrics.totalCustomers} Active Customers
            </div>
          </div>
        </div>

        <div className="card stat-card card-hover" onClick={() => onNavigate('feed')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: 'var(--accent-purple)' }}>
            <Wheat size={28} />
          </div>
          <div>
            <div className="stat-lbl">Feed Stock Remaining</div>
            <div className="stat-val">{metrics.feedRemaining.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 600 }}>kg</span></div>
            <div style={{ fontSize: '0.75rem', color: metrics.feedRemaining < 100 ? 'var(--accent-rose)' : 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 600 }}>
              {metrics.feedRemaining < 100 ? 'Low Stock Warning' : 'Optimal Inventory'}
            </div>
          </div>
        </div>

        <div className="card stat-card card-hover" onClick={() => onNavigate('expenses')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)' }}>
            <HardHat size={28} />
          </div>
          <div>
            <div className="stat-lbl">Labor & Construction Expenses</div>
            <div className="stat-val">{(metrics.totalExpenses || 0).toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 600 }}>RWF</span></div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', marginTop: '0.25rem', fontWeight: 600 }}>
              {metrics.workerCount || 0} Workers · Wages & Capital
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="var(--accent-emerald)" />
              Flock Survival & Health
            </h3>
            <span className="badge badge-emerald">{metrics.survivalRate}% Survival</span>
          </div>
          <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              <span>Mortality Rate ({metrics.totalDeaths} deaths)</span>
              <span style={{ fontWeight: 700, color: Number(metrics.mortalityRate) > 5 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                {metrics.mortalityRate}%
              </span>
            </div>
            <div style={{ height: '8px', background: 'var(--bg-surface-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(metrics.mortalityRate * 10, 100)}%`,
                background: Number(metrics.mortalityRate) > 5 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
          <button onClick={() => onNavigate('mortality')} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
            View Mortality Records <ArrowRight size={16} />
          </button>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} color="var(--accent-sky)" />
              Python Analytics (WASM)
            </h3>
            <span className="badge badge-sky">Pyodide 0.25</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Run the original Python analytics algorithms directly in your browser with zero server dependency.
          </p>
          <button onClick={() => onNavigate('python')} className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
            Launch Python WASM Studio <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
