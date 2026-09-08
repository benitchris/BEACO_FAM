import React, { useState, useEffect } from 'react';
import { Plus, Syringe, Trash2 } from 'lucide-react';
import { runQuery, executeSql } from '../wasm/db';

export default function VaccinationPage({ onRefreshData }) {
  const [vaccinations, setVaccinations] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const loadData = () => {
    try {
      const list = runQuery("SELECT * FROM vaccinations ORDER BY vaccination_date DESC");
      setVaccinations(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name) return;

    executeSql(`
      INSERT INTO vaccinations (vaccine_name, vaccination_date, notes)
      VALUES ('${name}', '${date}', '${notes}')
    `);

    setShowModal(false);
    setName('');
    setNotes('');
    loadData();
    onRefreshData();
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete vaccination entry?')) {
      executeSql(`DELETE FROM vaccinations WHERE id = ${id}`);
      loadData();
      onRefreshData();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Syringe color="var(--accent-emerald)" /> Vaccination Schedule & History
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Schedule and log vaccines (Newcastle, Gumboro, Marek's) administered to your poultry flocks.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-emerald">
          <Plus size={18} /> Schedule Vaccination
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date Administered</th>
              <th>Vaccine Name</th>
              <th>Notes / Method</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vaccinations.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>
                  No vaccination logs recorded.
                </td>
              </tr>
            ) : (
              vaccinations.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.vaccination_date}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{item.vaccine_name}</td>
                  <td>{item.notes || 'N/A'}</td>
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
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Schedule Vaccination</h2>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Vaccine Name</label>
                <input type="text" className="form-control" placeholder="e.g. Newcastle Lasota, Gumboro IBD" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Date Administered / Scheduled</label>
                <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Administration Notes</label>
                <textarea className="form-control" placeholder="e.g. Added via drinking water with skimmed milk powder" value={notes} onChange={e => setNotes(e.target.value)} rows="3"></textarea>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-emerald">Save Vaccine Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
