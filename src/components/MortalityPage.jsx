import React, { useState, useEffect } from 'react';
import { Plus, Skull, Trash2, ShieldAlert } from 'lucide-react';
import { runQuery, executeSql } from '../wasm/db';

export default function MortalityPage({ onRefreshData }) {
  const [mortality, setMortality] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [deathDate, setDeathDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState(1);
  const [quantity, setQuantity] = useState('');
  const [cause, setCause] = useState('');

  const loadData = () => {
    try {
      const list = runQuery(`
        SELECT m.*, cat.category_name 
        FROM mortality m 
        LEFT JOIN chicken_categories cat ON m.category_id = cat.id 
        ORDER BY m.death_date DESC
      `);
      const cats = runQuery("SELECT * FROM chicken_categories");
      setMortality(list);
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
    if (!quantity) return;

    executeSql(`
      INSERT INTO mortality (death_date, category_id, quantity, cause_of_death)
      VALUES ('${deathDate}', ${categoryId}, ${parseInt(quantity)}, '${cause || 'Unspecified'}')
    `);

    setShowModal(false);
    setQuantity('');
    setCause('');
    loadData();
    onRefreshData();
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete mortality entry?')) {
      executeSql(`DELETE FROM mortality WHERE id = ${id}`);
      loadData();
      onRefreshData();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Skull color="var(--accent-rose)" /> Mortality Log & Disease Tracker
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Record flock death events, document causes of death, and monitor survival percentages.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-danger">
          <Plus size={18} /> Record Mortality
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Quantity Lost</th>
              <th>Cause of Death</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mortality.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>
                  No mortality records logged.
                </td>
              </tr>
            ) : (
              mortality.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.death_date}</td>
                  <td><span className="badge badge-sky">{item.category_name || 'Flock'}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-rose)' }}>{item.quantity}</td>
                  <td>{item.cause_of_death}</td>
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
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Log Mortality Incident</h2>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Date of Occurrence</label>
                <input type="date" className="form-control" value={deathDate} onChange={e => setDeathDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Affected Category</label>
                <select className="form-control" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Quantity Lost</label>
                <input type="number" className="form-control" placeholder="e.g. 2" value={quantity} onChange={e => setQuantity(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Cause of Death / Symptoms</label>
                <input type="text" className="form-control" placeholder="e.g. Heat stress, Coccidiosis" value={cause} onChange={e => setCause(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-danger">Log Mortality</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
