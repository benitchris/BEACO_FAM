import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Bird, RefreshCw } from 'lucide-react';
import { runQuery, executeSql } from '../wasm/db';

export default function ChickensPage({ onRefreshData }) {
  const [chickens, setChickens] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [code, setCode] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [breed, setBreed] = useState('');
  const [quantity, setQuantity] = useState('');
  const [age, setAge] = useState('');

  const loadData = () => {
    try {
      const list = runQuery(`
        SELECT c.*, cat.category_name 
        FROM chickens c 
        LEFT JOIN chicken_categories cat ON c.category_id = cat.id 
        ORDER BY c.id DESC
      `);
      const cats = runQuery("SELECT * FROM chicken_categories");
      setChickens(list);
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
    const dateAdded = new Date().toISOString().split('T')[0];
    const generatedCode = code || `CHK-${Math.floor(100 + Math.random() * 900)}`;

    executeSql(`
      INSERT INTO chickens (chicken_code, category_id, breed, quantity, age_in_weeks, date_added, status)
      VALUES ('${generatedCode}', ${categoryId}, '${breed || 'Standard'}', ${parseInt(quantity)}, ${parseInt(age || 0)}, '${dateAdded}', 'Active')
    `);

    setShowModal(false);
    setCode('');
    setBreed('');
    setQuantity('');
    setAge('');
    loadData();
    onRefreshData();
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this chicken entry?')) {
      executeSql(`DELETE FROM chickens WHERE id = ${id}`);
      loadData();
      onRefreshData();
    }
  };

  const filtered = chickens.filter(c => 
    (c.chicken_code || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.breed || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.category_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bird color="var(--accent-emerald)" /> Flock & Chicken Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Track layer batches, broilers, chicks, breeds, and mortality statuses.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={18} /> Add New Chicken Batch
        </button>
      </div>

      {/* Filter & Search */}
      <div className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
          <input
            type="text"
            placeholder="Search by Code, Breed, or Category..."
            className="form-control"
            style={{ paddingLeft: '2.5rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Category</th>
              <th>Breed</th>
              <th>Quantity</th>
              <th>Age (Weeks)</th>
              <th>Date Added</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>
                  No chicken records found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{item.chicken_code || `#${item.id}`}</td>
                  <td><span className="badge badge-sky">{item.category_name || 'General'}</span></td>
                  <td>{item.breed || 'N/A'}</td>
                  <td style={{ fontWeight: 700 }}>{item.quantity}</td>
                  <td>{item.age_in_weeks} weeks</td>
                  <td>{item.date_added}</td>
                  <td><span className="badge badge-emerald">{item.status}</span></td>
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

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Add New Chicken Batch</h2>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Batch Code (Optional)</label>
                <input type="text" className="form-control" placeholder="e.g. CHK-200" value={code} onChange={e => setCode(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-control" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Breed</label>
                <input type="text" className="form-control" placeholder="e.g. Lohmann Brown, Cobb 500" value={breed} onChange={e => setBreed(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input type="number" className="form-control" placeholder="e.g. 500" value={quantity} onChange={e => setQuantity(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Age in Weeks</label>
                <input type="number" className="form-control" placeholder="e.g. 18" value={age} onChange={e => setAge(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
