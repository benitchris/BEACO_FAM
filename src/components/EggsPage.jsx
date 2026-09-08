import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Egg, Building2, TrendingUp } from 'lucide-react';
import { runQuery, executeSql } from '../wasm/db';

const BUILDING_COLORS = {
  1: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', label: 'Building A' },
  2: { color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)', label: 'Building B' },
  3: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', label: 'Building C' },
};

export default function EggsPage({ onRefreshData }) {
  const [buildings, setBuildings] = useState([]);
  const [buildingStats, setBuildingStats] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filterBuilding, setFilterBuilding] = useState('all');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [buildingId, setBuildingId] = useState(1);
  const [categoryId, setCategoryId] = useState(1);
  const [collected, setCollected] = useState('');
  const [broken, setBroken] = useState(0);

  const loadData = () => {
    try {
      const bldgs = runQuery("SELECT * FROM buildings ORDER BY id");
      setBuildings(bldgs);

      // Per-building totals
      const stats = runQuery(`
        SELECT 
          b.id,
          b.building_name,
          b.capacity,
          b.description,
          COALESCE(SUM(e.eggs_collected), 0) AS total_collected,
          COALESCE(SUM(e.broken_eggs), 0) AS total_broken,
          COALESCE(SUM(e.remaining_eggs), 0) AS total_net,
          COUNT(e.id) AS record_count,
          MAX(e.production_date) AS last_harvest
        FROM buildings b
        LEFT JOIN egg_production e ON e.building_id = b.id
        GROUP BY b.id
        ORDER BY b.id
      `);
      setBuildingStats(stats);

      const records = runQuery(`
        SELECT e.*, b.building_name, cat.category_name
        FROM egg_production e
        LEFT JOIN buildings b ON e.building_id = b.id
        LEFT JOIN chicken_categories cat ON e.category_id = cat.id
        ORDER BY e.production_date DESC, e.building_id
      `);
      setAllRecords(records);

      const cats = runQuery("SELECT * FROM chicken_categories");
      setCategories(cats);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    const numCollected = parseInt(collected || 0);
    const numBroken = parseInt(broken || 0);
    const remaining = Math.max(0, numCollected - numBroken);

    executeSql(`
      INSERT INTO egg_production (production_date, category_id, building_id, eggs_collected, broken_eggs, remaining_eggs)
      VALUES ('${date}', ${categoryId}, ${buildingId}, ${numCollected}, ${numBroken}, ${remaining})
    `);

    setShowModal(false);
    setCollected('');
    setBroken(0);
    loadData();
    onRefreshData();
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this harvest record?')) {
      executeSql(`DELETE FROM egg_production WHERE id = ${id}`);
      loadData();
      onRefreshData();
    }
  };

  const grandTotal = {
    collected: buildingStats.reduce((a, b) => a + Number(b.total_collected), 0),
    broken: buildingStats.reduce((a, b) => a + Number(b.total_broken), 0),
    net: buildingStats.reduce((a, b) => a + Number(b.total_net), 0),
  };

  const filteredRecords = filterBuilding === 'all'
    ? allRecords
    : allRecords.filter(r => String(r.building_id) === String(filterBuilding));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Egg color="var(--accent-amber)" /> Egg Production — Per Building
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Track daily harvests from Building A, B, and C separately. All totals computed automatically.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={18} /> Record Egg Harvest
        </button>
      </div>

      {/* Grand Total Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(16,185,129,0.08))',
        border: '1px solid rgba(245,158,11,0.25)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1.5rem',
        padding: '1.5rem 2rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Collected</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-amber)', lineHeight: 1.1 }}>{grandTotal.collected.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>All 3 buildings combined</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Broken</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-rose)', lineHeight: 1.1 }}>{grandTotal.broken.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Damage across all sheds</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Available</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-emerald)', lineHeight: 1.1 }}>{grandTotal.net.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ready for sale / storage</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Breakage Rate</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-sky)', lineHeight: 1.1 }}>
            {grandTotal.collected > 0 ? ((grandTotal.broken / grandTotal.collected) * 100).toFixed(1) : 0}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Farm-wide average</div>
        </div>
      </div>

      {/* Per-Building Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {buildingStats.map((bldg) => {
          const style = BUILDING_COLORS[bldg.id] || BUILDING_COLORS[1];
          const breakagePct = bldg.total_collected > 0
            ? ((bldg.total_broken / bldg.total_collected) * 100).toFixed(1)
            : 0;
          const netPct = bldg.total_collected > 0
            ? ((bldg.total_net / bldg.total_collected) * 100).toFixed(0)
            : 0;

          return (
            <div key={bldg.id} className="card card-hover" style={{ border: `1px solid ${style.color}33`, background: style.bg }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${style.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={22} color={style.color} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{bldg.building_name}</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bldg.description}</div>
                  </div>
                </div>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.5rem',
                  borderRadius: '999px', background: `${style.color}22`, color: style.color,
                  border: `1px solid ${style.color}44`
                }}>
                  Cap: {bldg.capacity}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                {[
                  { label: 'Collected', val: bldg.total_collected, color: style.color },
                  { label: 'Broken', val: bldg.total_broken, color: 'var(--accent-rose)' },
                  { label: 'Net', val: bldg.total_net, color: 'var(--accent-emerald)' },
                ].map(stat => (
                  <div key={stat.label} style={{ textAlign: 'center', background: 'var(--bg-primary)', padding: '0.625rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: stat.color }}>{Number(stat.val).toLocaleString()}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 600 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Progress bar: net yield */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
                  <span>Net yield rate</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{netPct}%</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-surface-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${netPct}%`, background: `linear-gradient(90deg, ${style.color}, #10b981)`, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: '0.375rem' }}>
                  {bldg.record_count} harvest records · Last: {bldg.last_harvest || 'No records yet'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs + Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterBuilding('all')}
            className={`btn btn-sm ${filterBuilding === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All Buildings ({allRecords.length})
          </button>
          {buildings.map(b => (
            <button
              key={b.id}
              onClick={() => setFilterBuilding(b.id)}
              className={`btn btn-sm ${String(filterBuilding) === String(b.id) ? 'btn-primary' : 'btn-secondary'}`}
            >
              {b.building_name} ({allRecords.filter(r => r.building_id === b.id).length})
            </button>
          ))}
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Building</th>
                <th>Category</th>
                <th>Eggs Collected</th>
                <th>Broken</th>
                <th>Net Available</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>No harvest records found.</td></tr>
              ) : (
                filteredRecords.map((item) => {
                  const bStyle = BUILDING_COLORS[item.building_id] || BUILDING_COLORS[1];
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.production_date}</td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                          padding: '0.25rem 0.625rem', borderRadius: '999px',
                          background: bStyle.bg, color: bStyle.color,
                          fontSize: '0.75rem', fontWeight: 700, border: `1px solid ${bStyle.color}44`
                        }}>
                          <Building2 size={12} /> {item.building_name}
                        </span>
                      </td>
                      <td><span className="badge badge-sky">{item.category_name || 'Layers'}</span></td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>{item.eggs_collected}</td>
                      <td style={{ color: item.broken_eggs > 10 ? 'var(--accent-rose)' : 'var(--text-muted)' }}>{item.broken_eggs}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{item.remaining_eggs}</td>
                      <td>
                        <button onClick={() => handleDelete(item.id)} className="btn btn-danger btn-sm">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={20} color="var(--accent-amber)" /> Record Egg Harvest
            </h2>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Harvest Date</label>
                <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Building / Shed</label>
                <select className="form-control" value={buildingId} onChange={e => setBuildingId(e.target.value)}>
                  {buildings.map(b => <option key={b.id} value={b.id}>{b.building_name} — {b.description}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Chicken Category</label>
                <select className="form-control" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Total Eggs Collected</label>
                <input type="number" className="form-control" placeholder="e.g. 400" value={collected} onChange={e => setCollected(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Broken / Damaged Eggs</label>
                <input type="number" className="form-control" placeholder="e.g. 5" value={broken} onChange={e => setBroken(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Harvest</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
