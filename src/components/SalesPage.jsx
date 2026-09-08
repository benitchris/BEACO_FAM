import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Users, Trash2 } from 'lucide-react';
import { runQuery, executeSql } from '../wasm/db';

export default function SalesPage({ onRefreshData }) {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [activeTab, setActiveTab] = useState('sales');

  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showCustModal, setShowCustModal] = useState(false);

  // Sales form
  const [customerId, setCustomerId] = useState(1);
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);

  // Customer form
  const [custName, setCustName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const loadData = () => {
    try {
      const salesList = runQuery(`
        SELECT s.*, c.customer_name 
        FROM sales s 
        LEFT JOIN customers c ON s.customer_id = c.id 
        ORDER BY s.sale_date DESC
      `);
      const custs = runQuery("SELECT * FROM customers ORDER BY id DESC");
      setSales(salesList);
      setCustomers(custs);
      if (custs.length > 0 && !customerId) {
        setCustomerId(custs[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSale = (e) => {
    e.preventDefault();
    const qty = parseInt(quantity || 0);
    const price = parseFloat(unitPrice || 0);
    const total = qty * price;

    executeSql(`
      INSERT INTO sales (customer_id, quantity, unit_price, total_amount, sale_date)
      VALUES (${customerId}, ${qty}, ${price}, ${total}, '${saleDate}')
    `);

    setShowSaleModal(false);
    setQuantity('');
    setUnitPrice('');
    loadData();
    onRefreshData();
  };

  const handleAddCust = (e) => {
    e.preventDefault();
    if (!custName) return;

    executeSql(`
      INSERT INTO customers (customer_name, phone, address)
      VALUES ('${custName}', '${phone}', '${address}')
    `);

    setShowCustModal(false);
    setCustName('');
    setPhone('');
    setAddress('');
    loadData();
    onRefreshData();
  };

  const handleDeleteSale = (id) => {
    if (window.confirm('Delete sale record?')) {
      executeSql(`DELETE FROM sales WHERE id = ${id}`);
      loadData();
      onRefreshData();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign color="var(--accent-sky)" /> Sales & Customer Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Manage commercial orders, buyer profiles, unit pricing, and farm financial receipts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setShowCustModal(true)} className="btn btn-secondary">
            <Users size={18} /> New Customer
          </button>
          <button onClick={() => setShowSaleModal(true)} className="btn btn-primary">
            <Plus size={18} /> Record New Sale
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('sales')}
          className={`btn btn-sm ${activeTab === 'sales' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Sales Transactions ({sales.length})
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`btn btn-sm ${activeTab === 'customers' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Customer Directory ({customers.length})
        </button>
      </div>

      {activeTab === 'sales' ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>
                    No sales records logged yet.
                  </td>
                </tr>
              ) : (
                sales.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.sale_date}</td>
                    <td style={{ fontWeight: 700 }}>{item.customer_name || 'Walk-in Customer'}</td>
                    <td>{item.quantity}</td>
                    <td>{Number(item.unit_price).toLocaleString()} RWF</td>
                    <td style={{ fontWeight: 800, color: 'var(--accent-emerald)' }}>
                      {Number(item.total_amount).toLocaleString()} RWF
                    </td>
                    <td>
                      <button onClick={() => handleDeleteSale(item.id)} className="btn btn-danger btn-sm">
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Phone Number</th>
                <th>Address</th>
                <th>Date Added</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700 }}>{c.customer_name}</td>
                  <td>{c.phone || 'N/A'}</td>
                  <td>{c.address || 'N/A'}</td>
                  <td>{c.created_at || 'Registered'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sale Modal */}
      {showSaleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Record Commercial Sale</h2>
            <form onSubmit={handleAddSale}>
              <div className="form-group">
                <label className="form-label">Customer</label>
                <select className="form-control" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.customer_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input type="number" className="form-control" placeholder="e.g. 100" value={quantity} onChange={e => setQuantity(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Unit Price (RWF)</label>
                <input type="number" className="form-control" placeholder="e.g. 150" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Sale Date</label>
                <input type="date" className="form-control" value={saleDate} onChange={e => setSaleDate(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowSaleModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Complete Sale</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {showCustModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Add New Customer</h2>
            <form onSubmit={handleAddCust}>
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input type="text" className="form-control" placeholder="Full name or company" value={custName} onChange={e => setCustName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-control" placeholder="+250 78x xxx xxx" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Address / Location</label>
                <input type="text" className="form-control" placeholder="City or District" value={address} onChange={e => setAddress(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowCustModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
