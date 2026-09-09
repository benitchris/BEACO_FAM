import React, { useState, useEffect } from 'react';
import { Users, HardHat, DollarSign, Plus, Trash2, Calendar, Wrench, Briefcase, FileText } from 'lucide-react';
import { runQuery, executeSql } from '../wasm/db';

export default function ExpensesPage({ onRefreshData, currentUser }) {
  const isConstruction = currentUser?.role === 'Construction';
  const isAdmin = currentUser?.role === 'Admin' || !currentUser;

  const [activeTab, setActiveTab] = useState(isConstruction ? 'construction' : 'summary'); // 'summary' | 'workers' | 'payroll' | 'construction'
  
  // Summary Stats
  const [workers, setWorkers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [construction, setConstruction] = useState([]);

  // Modals
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConstructionModal, setShowConstructionModal] = useState(false);

  // New Worker Form
  const [workerName, setWorkerName] = useState('');
  const [workerRole, setWorkerRole] = useState('Attendant');
  const [workerRate, setWorkerRate] = useState('');
  const [workerPhone, setWorkerPhone] = useState('');

  // New Payment Form
  const [payWorkerId, setPayWorkerId] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payDays, setPayDays] = useState(28);
  const [payNotes, setPayNotes] = useState('');

  // New Construction Expense Form
  const [constDate, setConstDate] = useState(new Date().toISOString().split('T')[0]);
  const [constDesc, setConstDesc] = useState('');
  const [constCategory, setConstCategory] = useState('Construction');
  const [constAmount, setConstAmount] = useState('');
  const [constVendor, setConstVendor] = useState('');
  const [constNotes, setConstNotes] = useState('');

  const loadData = () => {
    try {
      if (isAdmin) {
        const wList = runQuery("SELECT * FROM workers ORDER BY id DESC");
        setWorkers(wList);

        const pList = runQuery(`
          SELECT p.*, w.full_name, w.role 
          FROM worker_payments p 
          LEFT JOIN workers w ON p.worker_id = w.id 
          ORDER BY p.payment_date DESC
        `);
        setPayments(pList);

        if (wList.length > 0 && !payWorkerId) {
          setPayWorkerId(wList[0].id);
        }
      }

      const cList = runQuery("SELECT * FROM construction_expenses ORDER BY expense_date DESC");
      setConstruction(cList);
    } catch (err) {
      console.error('Error loading expense data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Handlers
  const handleAddWorker = (e) => {
    e.preventDefault();
    const rate = parseFloat(workerRate || 0);
    const today = new Date().toISOString().split('T')[0];
    executeSql(`
      INSERT INTO workers (full_name, role, daily_rate, phone, start_date, status)
      VALUES ('${workerName.replace(/'/g, "''")}', '${workerRole.replace(/'/g, "''")}', ${rate}, '${workerPhone}', '${today}', 'Active')
    `);
    setShowWorkerModal(false);
    setWorkerName('');
    setWorkerRole('Attendant');
    setWorkerRate('');
    setWorkerPhone('');
    loadData();
    onRefreshData();
  };

  const handleAddPayment = (e) => {
    e.preventDefault();
    const worker = workers.find(w => String(w.id) === String(payWorkerId));
    const dailyRate = worker ? worker.daily_rate : 0;
    const days = parseInt(payDays || 1);
    const totalAmount = dailyRate * days;

    executeSql(`
      INSERT INTO worker_payments (worker_id, payment_date, days_worked, amount_paid, notes)
      VALUES (${payWorkerId}, '${payDate}', ${days}, ${totalAmount}, '${payNotes.replace(/'/g, "''")}')
    `);
    setShowPaymentModal(false);
    setPayNotes('');
    loadData();
    onRefreshData();
  };

  const handleAddConstruction = (e) => {
    e.preventDefault();
    const amt = parseFloat(constAmount || 0);
    executeSql(`
      INSERT INTO construction_expenses (expense_date, description, category, amount, vendor, notes)
      VALUES ('${constDate}', '${constDesc.replace(/'/g, "''")}', '${constCategory}', ${amt}, '${constVendor.replace(/'/g, "''")}', '${constNotes.replace(/'/g, "''")}')
    `);
    setShowConstructionModal(false);
    setConstDesc('');
    setConstAmount('');
    setConstVendor('');
    setConstNotes('');
    loadData();
    onRefreshData();
  };

  const handleDeleteWorker = (id) => {
    if (window.confirm('Delete worker record?')) {
      executeSql(`DELETE FROM workers WHERE id = ${id}`);
      loadData();
      onRefreshData();
    }
  };

  const handleDeletePayment = (id) => {
    if (window.confirm('Delete this payment record?')) {
      executeSql(`DELETE FROM worker_payments WHERE id = ${id}`);
      loadData();
      onRefreshData();
    }
  };

  const handleDeleteConstruction = (id) => {
    if (window.confirm('Delete construction expense?')) {
      executeSql(`DELETE FROM construction_expenses WHERE id = ${id}`);
      loadData();
      onRefreshData();
    }
  };

  // Calculations
  const totalPayroll = payments.reduce((acc, p) => acc + Number(p.amount_paid || 0), 0);
  const totalConstruction = construction.reduce((acc, c) => acc + Number(c.amount || 0), 0);
  const grandTotal = totalPayroll + totalConstruction;
  const activeWorkers = workers.filter(w => w.status === 'Active').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HardHat color="var(--accent-amber)" /> {isConstruction ? 'Farm Construction & Building Expenses' : 'Workers & Construction Expenses'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {isConstruction 
              ? 'Log and track structural repairs, new shed construction, solar equipment, and site infrastructure.' 
              : 'Manage farm labor wages, employee profiles, and structural construction/repair costs.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {isAdmin && (
            <>
              <button onClick={() => setShowWorkerModal(true)} className="btn btn-secondary btn-sm">
                <Plus size={16} /> Add Worker
              </button>
              <button onClick={() => setShowPaymentModal(true)} className="btn btn-primary btn-sm">
                <DollarSign size={16} /> Pay Wages
              </button>
            </>
          )}
          <button onClick={() => setShowConstructionModal(true)} className="btn btn-amber btn-sm" style={{ background: 'var(--accent-amber)', color: '#000', fontWeight: 700 }}>
            <Wrench size={16} /> Record Construction Cost
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {isAdmin && (
          <>
            <div className="card card-hover" style={{ borderLeft: '4px solid var(--accent-emerald)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Active Workers</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-emerald)', margin: '0.25rem 0' }}>{activeWorkers}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered farm personnel</div>
            </div>

            <div className="card card-hover" style={{ borderLeft: '4px solid var(--accent-sky)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Total Payroll Paid</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--accent-sky)', margin: '0.25rem 0' }}>
                RWF {totalPayroll.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cumulative wage payments</div>
            </div>
          </>
        )}

        <div className="card card-hover" style={{ borderLeft: '4px solid var(--accent-amber)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Construction & Building Costs</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--accent-amber)', margin: '0.25rem 0' }}>
            RWF {totalConstruction.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Silos, roofs, plumbing, solar ({construction.length} records)</div>
        </div>

        {isAdmin && (
          <div className="card card-hover" style={{ borderLeft: '4px solid var(--accent-rose)', background: 'rgba(244,63,94,0.05)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Grand Total Labor & Capital</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--accent-rose)', margin: '0.25rem 0' }}>
              RWF {grandTotal.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Combined non-feed operational expense</div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      {isAdmin && (
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          {[
            { id: 'summary', label: 'All Expenses Log', icon: FileText },
            { id: 'workers', label: `Workers Directory (${workers.length})`, icon: Users },
            { id: 'payroll', label: `Payroll History (${payments.length})`, icon: DollarSign },
            { id: 'construction', label: `Construction Costs (${construction.length})`, icon: HardHat },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.625rem 1.25rem', borderRadius: '8px',
                  border: 'none', background: isActive ? 'var(--accent-emerald)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  fontWeight: isActive ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s ease'
                }}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Tab Content for Construction Role or Admin Construction Tab */}
      {(isConstruction || activeTab === 'construction') && (
        <div className="table-container">
          <div style={{ padding: '1rem', background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HardHat size={18} color="var(--accent-amber)" /> Construction & Site Expenses ({construction.length})
            </span>
            <button onClick={() => setShowConstructionModal(true)} className="btn btn-amber btn-sm">
              <Plus size={14} /> Record Expense
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Vendor / Supplier</th>
                <th>Amount (RWF)</th>
                <th>Notes</th>
                {isAdmin && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {construction.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>No construction or equipment expenses recorded.</td></tr>
              ) : (
                construction.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.expense_date}</td>
                    <td style={{ fontWeight: 700 }}>{item.description}</td>
                    <td><span className="badge badge-amber">{item.category}</span></td>
                    <td>{item.vendor || 'Direct'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>RWF {Number(item.amount).toLocaleString()}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.notes || '-'}</td>
                    {isAdmin && (
                      <td>
                        <button onClick={() => handleDeleteConstruction(item.id)} className="btn btn-danger btn-sm">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin Tabs */}
      {isAdmin && activeTab === 'summary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HardHat size={18} color="var(--accent-amber)" /> Construction & Capital Projects Breakdown
            </h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Project Description</th>
                    <th>Category</th>
                    <th>Vendor / Contractor</th>
                    <th>Amount (RWF)</th>
                  </tr>
                </thead>
                <tbody>
                  {construction.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-subtle)' }}>No construction records.</td></tr>
                  ) : (
                    construction.map(item => (
                      <tr key={item.id}>
                        <td>{item.expense_date}</td>
                        <td style={{ fontWeight: 600 }}>{item.description}</td>
                        <td><span className="badge badge-amber">{item.category}</span></td>
                        <td>{item.vendor || 'In-House'}</td>
                        <td style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>RWF {Number(item.amount).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={18} color="var(--accent-sky)" /> Worker Wage Disbursements
            </h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Payment Date</th>
                    <th>Worker</th>
                    <th>Role</th>
                    <th>Days Worked</th>
                    <th>Amount Paid (RWF)</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-subtle)' }}>No payment records.</td></tr>
                  ) : (
                    payments.map(p => (
                      <tr key={p.id}>
                        <td>{p.payment_date}</td>
                        <td style={{ fontWeight: 600 }}>{p.full_name || 'Worker #' + p.worker_id}</td>
                        <td><span className="badge badge-emerald">{p.role || 'Staff'}</span></td>
                        <td>{p.days_worked} days</td>
                        <td style={{ fontWeight: 700, color: 'var(--accent-sky)' }}>RWF {Number(p.amount_paid).toLocaleString()}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isAdmin && activeTab === 'workers' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Daily Rate (RWF)</th>
                <th>Est. Monthly (28 Days)</th>
                <th>Phone</th>
                <th>Start Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workers.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>No workers registered yet. Click "Add Worker" to start.</td></tr>
              ) : (
                workers.map(w => (
                  <tr key={w.id}>
                    <td style={{ fontWeight: 700 }}>{w.full_name}</td>
                    <td><span className="badge badge-sky">{w.role}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>RWF {Number(w.daily_rate).toLocaleString()} / day</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>RWF {(Number(w.daily_rate) * 28).toLocaleString()}</td>
                    <td>{w.phone || '-'}</td>
                    <td>{w.start_date || '-'}</td>
                    <td><span className="badge badge-emerald">{w.status}</span></td>
                    <td>
                      <button onClick={() => handleDeleteWorker(w.id)} className="btn btn-danger btn-sm">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {isAdmin && activeTab === 'payroll' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Payment Date</th>
                <th>Worker Name</th>
                <th>Role</th>
                <th>Days Worked</th>
                <th>Amount Paid (RWF)</th>
                <th>Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>No payroll disbursements logged.</td></tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.payment_date}</td>
                    <td style={{ fontWeight: 700 }}>{p.full_name || 'Staff #' + p.worker_id}</td>
                    <td><span className="badge badge-sky">{p.role || 'Staff'}</span></td>
                    <td>{p.days_worked} days</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>RWF {Number(p.amount_paid).toLocaleString()}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.notes || '-'}</td>
                    <td>
                      <button onClick={() => handleDeletePayment(p.id)} className="btn btn-danger btn-sm">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showWorkerModal && isAdmin && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} color="var(--accent-emerald)" /> Register New Worker
            </h2>
            <form onSubmit={handleAddWorker}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-control" placeholder="e.g. Jean Paul Nshimiyimana" value={workerName} onChange={e => setWorkerName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Role / Job Title</label>
                <select className="form-control" value={workerRole} onChange={e => setWorkerRole(e.target.value)}>
                  <option value="Farm Supervisor">Farm Supervisor</option>
                  <option value="Layer House Attendant">Layer House Attendant</option>
                  <option value="Feed & Watering Operator">Feed & Watering Operator</option>
                  <option value="Egg Collector">Egg Collector</option>
                  <option value="Security Guard">Security Guard</option>
                  <option value="Construction Worker">Construction Worker</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Daily Wage Rate (RWF)</label>
                <input type="number" className="form-control" placeholder="e.g. 5000" value={workerRate} onChange={e => setWorkerRate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-control" placeholder="e.g. +250 788 123 456" value={workerPhone} onChange={e => setWorkerPhone(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowWorkerModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Worker</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && isAdmin && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={20} color="var(--accent-sky)" /> Record Wage Disbursement
            </h2>
            <form onSubmit={handleAddPayment}>
              <div className="form-group">
                <label className="form-label">Select Worker</label>
                <select className="form-control" value={payWorkerId} onChange={e => setPayWorkerId(e.target.value)} required>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.full_name} ({w.role}) — RWF {Number(w.daily_rate).toLocaleString()}/day
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Payment Date</label>
                <input type="date" className="form-control" value={payDate} onChange={e => setPayDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Number of Days Worked</label>
                <input type="number" className="form-control" value={payDays} onChange={e => setPayDays(e.target.value)} required min="1" max="60" />
              </div>
              {payWorkerId && (() => {
                const selected = workers.find(w => String(w.id) === String(payWorkerId));
                const total = selected ? selected.daily_rate * payDays : 0;
                return (
                  <div style={{ background: 'var(--bg-primary)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Computed Total Salary:</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>RWF {total.toLocaleString()}</div>
                  </div>
                );
              })()}
              <div className="form-group">
                <label className="form-label">Payment Notes / Month</label>
                <input type="text" className="form-control" placeholder="e.g. February full salary" value={payNotes} onChange={e => setPayNotes(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Process Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConstructionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Wrench size={20} color="var(--accent-amber)" /> Log Construction / Repair Expense
            </h2>
            <form onSubmit={handleAddConstruction}>
              <div className="form-group">
                <label className="form-label">Expense Date</label>
                <input type="date" className="form-control" value={constDate} onChange={e => setConstDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description / Title</label>
                <input type="text" className="form-control" placeholder="e.g. Building B Ventilation Fan Installation" value={constDesc} onChange={e => setConstDesc(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-control" value={constCategory} onChange={e => setConstCategory(e.target.value)}>
                  <option value="Construction">Building Construction</option>
                  <option value="Repair">Roof & Shed Repair</option>
                  <option value="Equipment">Silo & Solar Equipment</option>
                  <option value="Infrastructure">Water & Plumbing Infrastructure</option>
                  <option value="Fence">Perimeter & Security Fencing</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (RWF)</label>
                <input type="number" className="form-control" placeholder="e.g. 450000" value={constAmount} onChange={e => setConstAmount(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Vendor / Contractor Name</label>
                <input type="text" className="form-control" placeholder="e.g. Kigali Construction Ltd" value={constVendor} onChange={e => setConstVendor(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Additional Notes</label>
                <input type="text" className="form-control" placeholder="Optional details..." value={constNotes} onChange={e => setConstNotes(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowConstructionModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
