import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Egg } from 'lucide-react';
import { runQuery, executeSql } from '../wasm/db';

export default function EggsPage({ onRefreshData }) {
  const [records, setRecords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState(1);
  const [collected, setCollected] = useState('');
  const [broken, setBroken] = useState(0);

  const loadData = () => {
    try {
      const list = runQuery(`
        SELECT e.*, cat.category_name 
        FROM egg_production e 
        LEFT JOIN chicken_categories cat ON e.category_id = cat.id 
        ORDER BY e.production_date DESC
      `);
      const cats = runQuery("SELECT * FROM chicken_categories");
      setRecords(list);
      setCategories(cats);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    const numCollected = parseInt(collected || 0);
    const numBroken = parseInt(broken || 0);
    const remaining = Math.max(0, numCollected - numBroken);

    executeSql(`
      INSERT INTO egg_production (production_date, category_id, eggs_collected, broken_eggs, remaining_eggs)
      VALUES ('${date}', ${categoryId}, ${numCollected}, ${numBroken}, ${remaining})
    `);

    setShowModal(false);
    setCollected('');
    setBroken(0);
    loadData();
    onRefreshData();
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete egg production record?')) {
      executeSql(`DELETE FROM egg_production WHERE id = ${id}`);
      loadData();
      onRefreshData();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Egg color="var(--accent-amber)" /> Egg Production Log
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Log daily harvests, track breakage rate, and compute net sellable inventory.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={18} /> Record Egg Harvest
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Eggs Collected</th>
              <th>Broken Eggs</th>
              <th>Net Available</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>
                  No egg harvest records recorded yet.
                </td>
              </tr>
            ) : (
              records.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.production_date}</td>
                  <td><span className="badge badge-sky">{item.category_name || 'Layers'}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>{item.eggs_collected}</td>
                  <td style={{ color: item.broken_eggs > 10 ? 'var(--accent-rose)' : 'var(--text-muted)' }}>{item.broken_eggs}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{item.remaining_eggs}</td>
                  <td>
                    <button onClick={() => handleDelete(item.id)} className="btn btn-danger btn-sm">
                      <Trash2 size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Record Egg Production Harvest</h2>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Harvest Date</label>
                <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-control" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Total Eggs Collected</label>
                <input type="number" className="form-control" placeholder="e.g. 450" value={collected} onChange={e => setCollected(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Broken / Damaged Eggs</label>
                <input type="number" className="form-control" placeholder="e.g. 5" value={broken} onChange={e => setBroken(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Harvest Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
