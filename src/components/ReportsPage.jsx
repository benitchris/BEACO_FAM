import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Egg, 
  DollarSign, 
  HardHat, 
  Wheat, 
  Sparkles, 
  CheckCircle2,
  Calendar,
  ArrowUpDown,
  Filter,
  Eye
} from 'lucide-react';
import { runQuery, getFarmMetrics } from '../wasm/db';
import { exportToPdf, exportToExcel } from '../utils/reportExporter';

export default function ReportsPage({ currentUser }) {
  const role = currentUser?.role || 'Admin';

  const [downloading, setDownloading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Time Sorting & Filtering State
  const [timePreset, setTimePreset] = useState('all'); // 'all' | 'today' | '7days' | 'month' | 'custom'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' (Newest First) | 'asc' (Oldest First)
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState(todayStr);

  const defaultTab = role === 'Construction' ? 'expenses' : role === 'Sales' ? 'sales' : 'eggs';
  const [activePreviewReport, setActivePreviewReport] = useState(defaultTab); // 'eggs' | 'sales' | 'expenses'

  // Helper to compute date condition for SQL
  const getDateCondition = (dateColumn) => {
    if (timePreset === 'today') {
      return `${dateColumn} = '${todayStr}'`;
    }
    if (timePreset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const sevenDaysAgo = d.toISOString().split('T')[0];
      return `${dateColumn} >= '${sevenDaysAgo}'`;
    }
    if (timePreset === 'month') {
      const d = new Date();
      const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
      return `${dateColumn} >= '${firstDay}'`;
    }
    if (timePreset === 'custom') {
      return `${dateColumn} >= '${startDate}' AND ${dateColumn} <= '${endDate}'`;
    }
    return '1=1'; // All time
  };

  const getTimeLabel = () => {
    if (timePreset === 'today') return `Today (${todayStr})`;
    if (timePreset === '7days') return 'Past 7 Days';
    if (timePreset === 'month') return 'Current Month';
    if (timePreset === 'custom') return `From ${startDate} to ${endDate}`;
    return 'All Available Records';
  };

  // Helper to load sorted data for previews and exports
  const loadEggRecords = () => {
    const whereClause = getDateCondition('e.production_date');
    const orderDirection = sortOrder.toUpperCase();
    return runQuery(`
      SELECT e.production_date, b.building_name, cat.category_name, e.eggs_collected, e.broken_eggs, e.remaining_eggs
      FROM egg_production e
      LEFT JOIN buildings b ON e.building_id = b.id
      LEFT JOIN chicken_categories cat ON e.category_id = cat.id
      WHERE ${whereClause}
      ORDER BY e.production_date ${orderDirection}, e.building_id
    `);
  };

  const loadSalesRecords = () => {
    const whereClause = getDateCondition('s.sale_date');
    const orderDirection = sortOrder.toUpperCase();
    return runQuery(`
      SELECT s.sale_date, c.customer_name, c.phone, s.quantity, s.unit_price, s.total_amount
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE ${whereClause}
      ORDER BY s.sale_date ${orderDirection}
    `);
  };

  const loadExpenseRecords = () => {
    const pWhere = getDateCondition('p.payment_date');
    const cWhere = getDateCondition('expense_date');

    const payroll = role === 'Construction' ? [] : runQuery(`
      SELECT p.payment_date as event_date, w.full_name as title, 'Worker Wage Payroll' as category, 
             p.days_worked || ' days worked (' || COALESCE(p.notes, '-') || ')' as details, p.amount_paid as amount
      FROM worker_payments p
      LEFT JOIN workers w ON p.worker_id = w.id
      WHERE ${pWhere}
    `);

    const construction = runQuery(`
      SELECT expense_date as event_date, description as title, 'Construction (' || category || ')' as category,
             'Vendor: ' || COALESCE(vendor, 'Direct') || ' (' || COALESCE(notes, '-') || ')' as details, amount
      FROM construction_expenses
      WHERE ${cWhere}
    `);

    let combined = [...payroll, ...construction];
    combined.sort((a, b) => {
      if (sortOrder === 'desc') {
        return new Date(b.event_date) - new Date(a.event_date);
      } else {
        return new Date(a.event_date) - new Date(b.event_date);
      }
    });

    return combined;
  };

  // 1. Egg Production Report Generator
  const handleExportEggs = async (format) => {
    setDownloading(true);
    setStatusMsg('Generating Egg Production Report...');

    try {
      const records = loadEggRecords();
      const headers = ['Date', 'Building / Shed', 'Category', 'Collected', 'Broken', 'Net Available'];
      const rows = records.map(r => [
        r.production_date,
        r.building_name || 'Building A',
        r.category_name || 'Layers',
        r.eggs_collected,
        r.broken_eggs,
        r.remaining_eggs
      ]);

      const totalCollected = records.reduce((a, b) => a + Number(b.eggs_collected), 0);
      const totalBroken = records.reduce((a, b) => a + Number(b.broken_eggs), 0);
      const totalNet = records.reduce((a, b) => a + Number(b.remaining_eggs), 0);

      const subtitle = `Time Scope: ${getTimeLabel()} | Date Sorted: ${sortOrder === 'desc' ? 'Newest First ⬇️' : 'Oldest First ⬆️'} (${records.length} records)`;

      if (format === 'pdf') {
        await exportToPdf({
          title: 'Egg Harvest & Building Production Report',
          subtitle,
          headers,
          rows,
          summaryCards: [
            { label: 'Total Collected', value: totalCollected.toLocaleString(), color: 'emerald' },
            { label: 'Total Broken', value: totalBroken.toLocaleString(), color: 'rose' },
            { label: 'Net Available', value: totalNet.toLocaleString(), color: 'emerald' }
          ],
          filename: `beacon_fam_egg_production_${timePreset}_${sortOrder}`,
          generatedBy: currentUser?.full_name || currentUser?.username
        });
      } else {
        exportToExcel({
          title: `Egg Harvest & Building Production Report — ${getTimeLabel()} (${sortOrder === 'desc' ? 'Newest First' : 'Oldest First'})`,
          headers,
          rows,
          filename: `beacon_fam_egg_production_${timePreset}_${sortOrder}`
        });
      }
      setStatusMsg(`Egg Production Report downloaded (${records.length} records)!`);
    } catch (err) {
      console.error(err);
      setStatusMsg('Failed to generate report.');
    } finally {
      setDownloading(false);
    }
  };

  // 2. Sales & Revenue Report Generator
  const handleExportSales = async (format) => {
    setDownloading(true);
    setStatusMsg('Generating Sales & Revenue Report...');

    try {
      const records = loadSalesRecords();
      const headers = ['Sale Date', 'Customer Name', 'Phone', 'Quantity (Eggs)', 'Unit Price (RWF)', 'Total Revenue (RWF)'];
      const rows = records.map(r => [
        r.sale_date,
        r.customer_name || 'Direct Sale',
        r.phone || '-',
        r.quantity,
        `RWF ${Number(r.unit_price).toLocaleString()}`,
        `RWF ${Number(r.total_amount).toLocaleString()}`
      ]);

      const totalRevenue = records.reduce((a, b) => a + Number(b.total_amount), 0);
      const totalEggsSold = records.reduce((a, b) => a + Number(b.quantity), 0);
      const subtitle = `Time Scope: ${getTimeLabel()} | Date Sorted: ${sortOrder === 'desc' ? 'Newest First ⬇️' : 'Oldest First ⬆️'} (${records.length} sales)`;

      if (format === 'pdf') {
        await exportToPdf({
          title: 'Sales & Revenue Financial Report',
          subtitle,
          headers,
          rows,
          summaryCards: [
            { label: 'Total Sales Revenue', value: `RWF ${totalRevenue.toLocaleString()}`, color: 'emerald' },
            { label: 'Total Eggs Sold', value: totalEggsSold.toLocaleString(), color: 'emerald' },
            { label: 'Total Transactions', value: records.length.toString(), color: 'emerald' }
          ],
          filename: `beacon_fam_sales_revenue_${timePreset}_${sortOrder}`,
          generatedBy: currentUser?.full_name || currentUser?.username
        });
      } else {
        exportToExcel({
          title: `Sales & Revenue Financial Report — ${getTimeLabel()} (${sortOrder === 'desc' ? 'Newest First' : 'Oldest First'})`,
          headers,
          rows,
          filename: `beacon_fam_sales_revenue_${timePreset}_${sortOrder}`
        });
      }
      setStatusMsg(`Sales Report downloaded (${records.length} sales)!`);
    } catch (err) {
      console.error(err);
      setStatusMsg('Failed to generate sales report.');
    } finally {
      setDownloading(false);
    }
  };

  // 3. Construction & Payroll Report Generator
  const handleExportExpenses = async (format) => {
    setDownloading(true);
    setStatusMsg('Generating Labor & Construction Expense Report...');

    try {
      const combined = loadExpenseRecords();
      const headers = ['Date', 'Expense Category', 'Title / Worker / Vendor', 'Details', 'Amount Paid (RWF)'];
      const rows = combined.map(item => [
        item.event_date,
        item.category,
        item.title || 'Staff Expense',
        item.details,
        `RWF ${Number(item.amount).toLocaleString()}`
      ]);

      const grandTotal = combined.reduce((a, b) => a + Number(b.amount), 0);
      const subtitle = `Time Scope: ${getTimeLabel()} | Date Sorted: ${sortOrder === 'desc' ? 'Newest First ⬇️' : 'Oldest First ⬆️'} (${combined.length} records)`;

      if (format === 'pdf') {
        await exportToPdf({
          title: role === 'Construction' ? 'Construction & Building Expenses Report' : 'Workers Payroll & Construction Expenses Report',
          subtitle,
          headers,
          rows,
          summaryCards: [
            { label: 'Time Scope', value: getTimeLabel(), color: 'emerald' },
            { label: 'Total Expense Records', value: combined.length.toString(), color: 'emerald' },
            { label: 'Grand Total Expense', value: `RWF ${grandTotal.toLocaleString()}`, color: 'rose' }
          ],
          filename: `beacon_fam_expenses_${timePreset}_${sortOrder}`,
          generatedBy: currentUser?.full_name || currentUser?.username
        });
      } else {
        exportToExcel({
          title: `Labor & Construction Expenses Report — ${getTimeLabel()} (${sortOrder === 'desc' ? 'Newest First' : 'Oldest First'})`,
          headers,
          rows,
          filename: `beacon_fam_expenses_${timePreset}_${sortOrder}`
        });
      }
      setStatusMsg(`Expenses Report downloaded (${combined.length} records)!`);
    } catch (err) {
      console.error(err);
      setStatusMsg('Failed to generate expenses report.');
    } finally {
      setDownloading(false);
    }
  };

  // 4. Master Farm Comprehensive Report Generator
  const handleExportMaster = async (format) => {
    setDownloading(true);
    setStatusMsg('Generating Master Comprehensive Farm Report...');

    try {
      const metrics = getFarmMetrics();
      const subtitle = `Time Scope: ${getTimeLabel()} | Date Sorted: ${sortOrder === 'desc' ? 'Newest First ⬇️' : 'Oldest First ⬆️'}`;

      const headers = ['Metric Category', 'Key Performance Indicator', 'Value', 'Status / Audit Notes'];
      const rows = [
        ['Time Scope & Filter', 'Selected Range & Order', `${getTimeLabel()}`, sortOrder === 'desc' ? 'Sorted Newest First ⬇️' : 'Sorted Oldest First ⬆️'],
        ['Flock Management', 'Total Active Chickens', metrics.totalChickens.toLocaleString(), 'Active Flock'],
        ['Flock Management', 'Mortality Deaths', metrics.totalDeaths.toLocaleString(), `${metrics.mortalityRate}% Mortality Rate`],
        ['Egg Production', 'Cumulative Eggs Harvested', metrics.totalEggs.toLocaleString(), `${metrics.eggsPerChicken} eggs / chicken average`],
        ['Commercial Sales', 'Total Revenue Generated', `RWF ${metrics.totalRevenue.toLocaleString()}`, `${metrics.totalCustomers} Active Buyers`],
        ['Feed Stock', 'Remaining Feed Inventory', `${metrics.feedRemaining.toLocaleString()} kg`, metrics.feedRemaining < 100 ? 'Low Stock Warning' : 'Optimal Stock'],
        ['Labor Expenses', 'Total Worker Wages Paid', `RWF ${metrics.totalWages.toLocaleString()}`, `${metrics.workerCount} Active Staff`],
        ['Capital Expenses', 'Construction & Equipment', `RWF ${metrics.totalConstruction.toLocaleString()}`, 'Silos, Solar, Building Repairs'],
        ['Overall Farm Financials', 'Net Operating Balance (Revenue - Labor/Capital)', `RWF ${(metrics.totalRevenue - metrics.totalExpenses).toLocaleString()}`, metrics.overallStatus]
      ];

      if (format === 'pdf') {
        await exportToPdf({
          title: 'BEACON FAM — Master Executive Operations Report',
          subtitle,
          headers,
          rows,
          summaryCards: [
            { label: 'Flock Count', value: metrics.totalChickens.toLocaleString(), color: 'emerald' },
            { label: 'Total Sales Revenue', value: `RWF ${metrics.totalRevenue.toLocaleString()}`, color: 'emerald' },
            { label: 'Total Labor/Capital', value: `RWF ${metrics.totalExpenses.toLocaleString()}`, color: 'rose' }
          ],
          filename: `beacon_fam_master_executive_${timePreset}_${sortOrder}`,
          generatedBy: currentUser?.full_name || currentUser?.username
        });
      } else {
        exportToExcel({
          title: `BEACON FAM — Master Executive Operations Report (${getTimeLabel()})`,
          headers,
          rows,
          filename: `beacon_fam_master_executive_${timePreset}_${sortOrder}`
        });
      }
      setStatusMsg('Master Executive Report downloaded!');
    } catch (err) {
      console.error(err);
      setStatusMsg('Failed to generate master report.');
    } finally {
      setDownloading(false);
    }
  };

  // Preview Data Loading
  const previewEggData = loadEggRecords();
  const previewSalesData = loadSalesRecords();
  const previewExpenseData = loadExpenseRecords();

  const isRoleAdmin = role === 'Admin';
  const isRoleSales = role === 'Sales';
  const isRoleConstruction = role === 'Construction';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileSpreadsheet color="var(--accent-emerald)" /> Reports & Document Exports
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Export official BEACON FAM operational and financial documents in PDF and Excel (.xlsx) formats.
        </p>
      </div>

      {/* Global Time Filter & Sorting Control Toolbar */}
      <div className="card" style={{
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
            <Filter size={16} /> <span>Time Range Filter:</span>
          </div>

          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: '7days', label: 'Past 7 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'custom', label: 'Custom Range' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setTimePreset(p.id)}
                className={`btn btn-sm ${timePreset === p.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {timePreset === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-primary)', padding: '0.25rem 0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <Calendar size={14} color="var(--text-muted)" />
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.75rem' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>to</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.75rem' }} />
            </div>
          )}
        </div>

        {/* Time Sorting Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-sky)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <ArrowUpDown size={16} /> Date Sort:
          </span>
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.85rem', fontWeight: 700, border: '1px solid var(--accent-sky)' }}
          >
            {sortOrder === 'desc' ? '⬇️ Newest First (Latest Date)' : '⬆️ Oldest First (Chronological)'}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div style={{ padding: '0.875rem 1.25rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} /> <span>{statusMsg}</span>
        </div>
      )}

      {/* Grid of Role-Filtered Report Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Master Executive Card (Admin Only) */}
        {isRoleAdmin && (
          <div className="card card-hover" style={{ borderTop: '4px solid var(--accent-emerald)', background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.05))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={24} color="var(--accent-emerald)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Master Executive Report</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Consolidated operational & financial summary</div>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Combines flock count, egg harvest, commercial sales revenue, feed stock, worker wages, and construction expenses into a single audit document.
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 700, marginBottom: '1rem' }}>
              Time Scope: {getTimeLabel()} ({sortOrder === 'desc' ? 'Newest First ⬇️' : 'Oldest First ⬆️'})
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => handleExportMaster('pdf')} disabled={downloading} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                <FileText size={16} /> Export PDF
              </button>
              <button onClick={() => handleExportMaster('excel')} disabled={downloading} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                <Download size={16} /> Export Excel
              </button>
            </div>
          </div>
        )}

        {/* Egg Production Card (Admin & Sales) */}
        {(isRoleAdmin || isRoleSales) && (
          <div className="card card-hover" style={{ borderTop: '4px solid var(--accent-amber)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Egg size={24} color="var(--accent-amber)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Egg Harvest & Production</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Per-building daily harvest logs</div>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Detailed breakdown of total eggs collected, broken eggs, and net yield across Building A, Building B, and Building C.
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 700, marginBottom: '1rem' }}>
              Time Scope: {getTimeLabel()} ({previewEggData.length} records, {sortOrder === 'desc' ? 'Newest First ⬇️' : 'Oldest First ⬆️'})
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => handleExportEggs('pdf')} disabled={downloading} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                <FileText size={16} /> Export PDF
              </button>
              <button onClick={() => handleExportEggs('excel')} disabled={downloading} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                <Download size={16} /> Export Excel
              </button>
            </div>
          </div>
        )}

        {/* Sales & Revenue Card (Admin & Sales) */}
        {(isRoleAdmin || isRoleSales) && (
          <div className="card card-hover" style={{ borderTop: '4px solid var(--accent-sky)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={24} color="var(--accent-sky)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Sales & Revenue Report</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Commercial egg sales & customer ledger</div>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              List of customer transactions, egg quantities sold, unit pricing, and total revenue in RWF.
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-sky)', fontWeight: 700, marginBottom: '1rem' }}>
              Time Scope: {getTimeLabel()} ({previewSalesData.length} sales, {sortOrder === 'desc' ? 'Newest First ⬇️' : 'Oldest First ⬆️'})
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => handleExportSales('pdf')} disabled={downloading} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                <FileText size={16} /> Export PDF
              </button>
              <button onClick={() => handleExportSales('excel')} disabled={downloading} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                <Download size={16} /> Export Excel
              </button>
            </div>
          </div>
        )}

        {/* Labor & Construction Card (Admin & Construction) */}
        {(isRoleAdmin || isRoleConstruction) && (
          <div className="card card-hover" style={{ borderTop: '4px solid var(--accent-rose)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(244,63,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HardHat size={24} color="var(--accent-rose)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{isRoleConstruction ? 'Construction Expenses Report' : 'Labor & Construction Expenses'}</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{isRoleConstruction ? 'Building & site infrastructure costs' : 'Worker wages & capital project costs'}</div>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {isRoleConstruction 
                ? 'Audit log of roof repairs, feed silos, plumbing, solar equipment, and site build expenses.' 
                : 'Audit log of employee wage disbursements, daily rates, roof repairs, feed silos, plumbing, and solar installation costs.'}
            </p>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', fontWeight: 700, marginBottom: '1rem' }}>
              Time Scope: {getTimeLabel()} ({previewExpenseData.length} records, {sortOrder === 'desc' ? 'Newest First ⬇️' : 'Oldest First ⬆️'})
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => handleExportExpenses('pdf')} disabled={downloading} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                <FileText size={16} /> Export PDF
              </button>
              <button onClick={() => handleExportExpenses('excel')} disabled={downloading} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                <Download size={16} /> Export Excel
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Live Audit Table Preview Section (Role-Filtered) */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye size={20} color="var(--accent-sky)" /> Live Audit Table Preview (Sorted {sortOrder === 'desc' ? 'Newest ⬇️' : 'Oldest ⬆️'})
            </h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Inspect the exact sorted rows that will be printed in your PDF or Excel file.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(isRoleAdmin || isRoleSales) && (
              <button
                onClick={() => setActivePreviewReport('eggs')}
                className={`btn btn-sm ${activePreviewReport === 'eggs' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Egg Production ({previewEggData.length})
              </button>
            )}
            {(isRoleAdmin || isRoleSales) && (
              <button
                onClick={() => setActivePreviewReport('sales')}
                className={`btn btn-sm ${activePreviewReport === 'sales' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Sales ({previewSalesData.length})
              </button>
            )}
            {(isRoleAdmin || isRoleConstruction) && (
              <button
                onClick={() => setActivePreviewReport('expenses')}
                className={`btn btn-sm ${activePreviewReport === 'expenses' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Construction Expenses ({previewExpenseData.length})
              </button>
            )}
          </div>
        </div>

        <div className="table-container">
          {activePreviewReport === 'eggs' && (isRoleAdmin || isRoleSales) && (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Building</th>
                  <th>Category</th>
                  <th>Eggs Collected</th>
                  <th>Broken</th>
                  <th>Net Available</th>
                </tr>
              </thead>
              <tbody>
                {previewEggData.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>No egg records in selected date range.</td></tr>
                ) : (
                  previewEggData.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{r.production_date}</td>
                      <td><span className="badge badge-sky">{r.building_name || 'Building A'}</span></td>
                      <td>{r.category_name || 'Layers'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>{r.eggs_collected}</td>
                      <td style={{ color: 'var(--accent-rose)' }}>{r.broken_eggs}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{r.remaining_eggs}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activePreviewReport === 'sales' && (isRoleAdmin || isRoleSales) && (
            <table>
              <thead>
                <tr>
                  <th>Sale Date</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Quantity Sold</th>
                  <th>Unit Price</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {previewSalesData.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>No sales transactions in selected date range.</td></tr>
                ) : (
                  previewSalesData.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700, color: 'var(--accent-sky)' }}>{r.sale_date}</td>
                      <td style={{ fontWeight: 600 }}>{r.customer_name || 'Direct'}</td>
                      <td>{r.phone || '-'}</td>
                      <td>{r.quantity} eggs</td>
                      <td>RWF {Number(r.unit_price).toLocaleString()}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>RWF {Number(r.total_amount).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activePreviewReport === 'expenses' && (isRoleAdmin || isRoleConstruction) && (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Title / Worker / Vendor</th>
                  <th>Details</th>
                  <th>Amount (RWF)</th>
                </tr>
              </thead>
              <tbody>
                {previewExpenseData.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-subtle)' }}>No expense records in selected date range.</td></tr>
                ) : (
                  previewExpenseData.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700, color: 'var(--accent-rose)' }}>{r.event_date}</td>
                      <td><span className="badge badge-amber">{r.category}</span></td>
                      <td style={{ fontWeight: 600 }}>{r.title}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.details}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-rose)' }}>RWF {Number(r.amount).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
