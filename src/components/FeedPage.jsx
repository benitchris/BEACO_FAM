import React, { useState, useEffect } from 'react';
import { Plus, Wheat, Trash2, AlertTriangle } from 'lucide-react';
import { runQuery, executeSql } from '../wasm/db';

export default function FeedPage({ onRefreshData }) {
  const [feeds, setFeeds] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [feedName, setFeedName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [consumed, setConsumed] = useState(0);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = () => {
    try {
      const list = runQuery("SELECT * FROM feed_management ORDER BY purchase_date DESC");
      setFeeds(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    const qty = parseFloat(quantity || 0);
    const cons = parseFloat(consumed || 0);
    const rem = Math.max(0, qty - cons);

    executeSql(`
      INSERT INTO feed_management (feed_name, quantity, consumed_kg, remaining_kg, purchase_date)
      VALUES ('${feedName}', ${qty}, ${cons}, ${rem}, '${purchaseDate}')
    `);

    setShowModal(false);
    setFeedName('');
    setQuantity('');
    setConsumed(0);
    loadData();
    onRefreshData();
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete feed record?')) {
      executeSql(`DELETE FROM feed_management WHERE id = ${id}`);
      loadData();
      onRefreshData();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wheat color="var(--accent-purple)" /> Feed Inventory & Consumption
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Track feed stock purchases (Layer Mash, Broiler Starter), daily consumption rates, and remaining kg.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={18} /> Add Feed Stock
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Purchase Date</th>
              <th>Feed Name</th>
              <th>Initial Stock (kg)</th>
              <th>Consumed (kg)</th>
              <th>Remaining (kg)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {feeds.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>
                  No feed inventory logged yet.
                </td>
              </tr>
            ) : (
              feeds.map((item) => {
                const isLow = Number(item.remaining_kg) < 100;
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.purchase_date}</td>
                    <td style={{ fontWeight: 700 }}>{item.feed_name}</td>
                    <td>{Number(item.quantity).toFixed(2)} kg</td>
                    <td>{Number(item.consumed_kg || 0).toFixed(2)} kg</td>
                    <td style={{ fontWeight: 800, color: isLow ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                      {Number(item.remaining_kg || 0).toFixed(2)} kg
                    </td>
                    <td>
                      {isLow ? (
                        <span className="badge badge-rose"><AlertTriangle size={12} /> Low Stock</span>
                      ) : (
                        <span className="badge badge-emerald">Optimal</span>
                      )}
                    </td>
                    <td>
                      <button onClick={() => handleDelete(item.id)} className="btn btn-danger btn-sm">
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Add Feed Batch</h2>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Feed Name / Type</label>
                <input type="text" className="form-control" placeholder="e.g. Layer Mash, Grower Feed" value={feedName} onChange={e => setFeedName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Purchased Weight (kg)</label>
                <input type="number" className="form-control" placeholder="e.g. 500" value={quantity} onChange={e => setQuantity(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Consumed Weight (kg)</label>
                <input type="number" className="form-control" placeholder="e.g. 50" value={consumed} onChange={e => setConsumed(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Purchase Date</label>
                <input type="date" className="form-control" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Feed Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
