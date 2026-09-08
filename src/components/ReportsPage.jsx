import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Download, Egg, DollarSign, HardHat, Wheat, Sparkles, CheckCircle2 } from 'lucide-react';
import { runQuery, getFarmMetrics } from '../wasm/db';
import { exportToPdf, exportToExcel } from '../utils/reportExporter';

export default function ReportsPage({ currentUser }) {
  const [downloading, setDownloading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // 1. Egg Production Report Generator
  const handleExportEggs = async (format) => {
    setDownloading(true);
    setStatusMsg('Generating Egg Production Report...');

    try {
      const records = runQuery(`
        SELECT e.production_date, b.building_name, cat.category_name, e.eggs_collected, e.broken_eggs, e.remaining_eggs
        FROM egg_production e
        LEFT JOIN buildings b ON e.building_id = b.id
        LEFT JOIN chicken_categories cat ON e.category_id = cat.id
        ORDER BY e.production_date DESC
      `);

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

      if (format === 'pdf') {
        await exportToPdf({
          title: 'Egg Harvest & Building Production Report',
          subtitle: 'Detailed record of egg collection, breakage rates, and net available yield per shed.',
          headers,
          rows,
          summaryCards: [
            { label: 'Total Collected', value: totalCollected.toLocaleString(), color: 'emerald' },
            { label: 'Total Broken', value: totalBroken.toLocaleString(), color: 'rose' },
            { label: 'Net Available', value: totalNet.toLocaleString(), color: 'emerald' }
          ],
          filename: 'beacon_fam_egg_production',
          generatedBy: currentUser?.full_name || currentUser?.username
        });
      } else {
        exportToExcel({
          title: 'Egg Harvest & Building Production Report',
          headers,
          rows,
          filename: 'beacon_fam_egg_production'
        });
      }
      setStatusMsg('Egg Production Report downloaded!');
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
      const records = runQuery(`
        SELECT s.sale_date, c.customer_name, c.phone, s.quantity, s.unit_price, s.total_amount
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        ORDER BY s.sale_date DESC
      `);

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

      if (format === 'pdf') {
        await exportToPdf({
          title: 'Sales & Revenue Financial Report',
          subtitle: 'Commercial egg sales revenue, customer transactions, and unit price audit.',
          headers,
          rows,
          summaryCards: [
            { label: 'Total Sales Revenue', value: `RWF ${totalRevenue.toLocaleString()}`, color: 'emerald' },
            { label: 'Total Eggs Sold', value: totalEggsSold.toLocaleString(), color: 'emerald' },
            { label: 'Total Transactions', value: records.length.toString(), color: 'emerald' }
          ],
          filename: 'beacon_fam_sales_revenue',
          generatedBy: currentUser?.full_name || currentUser?.username
        });
      } else {
        exportToExcel({
          title: 'Sales & Revenue Financial Report',
          headers,
          rows,
          filename: 'beacon_fam_sales_revenue'
        });
      }
      setStatusMsg('Sales Report downloaded!');
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
      const payroll = runQuery(`
        SELECT p.payment_date, w.full_name, w.role, p.days_worked, p.amount_paid, p.notes
        FROM worker_payments p
        LEFT JOIN workers w ON p.worker_id = w.id
        ORDER BY p.payment_date DESC
      `);

      const construction = runQuery(`
        SELECT expense_date, description, category, vendor, amount, notes
        FROM construction_expenses
        ORDER BY expense_date DESC
      `);

      const headers = ['Date', 'Expense Category', 'Title / Worker / Vendor', 'Details', 'Amount Paid (RWF)'];
      
      const rows = [
        ...payroll.map(p => [
          p.payment_date,
          'Worker Wage Payroll',
          p.full_name || ('Staff #' + p.worker_id),
          `${p.days_worked} days worked (${p.notes || '-'})`,
          `RWF ${Number(p.amount_paid).toLocaleString()}`
        ]),
        ...construction.map(c => [
          c.expense_date,
          `Construction (${c.category})`,
          c.description,
          `Vendor: ${c.vendor || 'Direct'} (${c.notes || '-'})`,
          `RWF ${Number(c.amount).toLocaleString()}`
        ])
      ];

      const totalWages = payroll.reduce((a, b) => a + Number(b.amount_paid), 0);
      const totalConstruction = construction.reduce((a, b) => a + Number(b.amount), 0);
      const grandTotal = totalWages + totalConstruction;

      if (format === 'pdf') {
        await exportToPdf({
          title: 'Workers Payroll & Construction Expenses Report',
          subtitle: 'Complete breakdown of farm employee wages, building maintenance, and capital projects.',
          headers,
          rows,
          summaryCards: [
            { label: 'Total Payroll Paid', value: `RWF ${totalWages.toLocaleString()}`, color: 'emerald' },
            { label: 'Total Construction', value: `RWF ${totalConstruction.toLocaleString()}`, color: 'rose' },
            { label: 'Grand Total Expenses', value: `RWF ${grandTotal.toLocaleString()}`, color: 'rose' }
          ],
          filename: 'beacon_fam_labor_construction_expenses',
          generatedBy: currentUser?.full_name || currentUser?.username
        });
      } else {
        exportToExcel({
          title: 'Workers Payroll & Construction Expenses Report',
          headers,
          rows,
          filename: 'beacon_fam_labor_construction_expenses'
        });
      }
      setStatusMsg('Expenses Report downloaded!');
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
      const headers = ['Metric Category', 'Key Performance Indicator', 'Value', 'Status / Audit Notes'];
      const rows = [
        ['Flock Management', 'Total Active Chickens', metrics.totalChickens.toLocaleString(), 'Healthy Flock'],
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
          subtitle: 'Consolidated summary of flock count, egg harvest, revenue, expenses, and overall status.',
          headers,
          rows,
          summaryCards: [
            { label: 'Flock Count', value: metrics.totalChickens.toLocaleString(), color: 'emerald' },
            { label: 'Total Sales Revenue', value: `RWF ${metrics.totalRevenue.toLocaleString()}`, color: 'emerald' },
            { label: 'Total Labor/Capital', value: `RWF ${metrics.totalExpenses.toLocaleString()}`, color: 'rose' }
          ],
          filename: 'beacon_fam_master_executive_report',
          generatedBy: currentUser?.full_name || currentUser?.username
        });
      } else {
        exportToExcel({
          title: 'BEACON FAM — Master Executive Operations Report',
          headers,
          rows,
          filename: 'beacon_fam_master_executive_report'
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileSpreadsheet color="var(--accent-emerald)" /> Reports & Document Exports
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Export official BEACON FAM operational and financial documents in PDF and Excel (.xlsx) formats.
        </p>
      </div>

      {statusMsg && (
        <div style={{ padding: '0.875rem 1.25rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} /> <span>{statusMsg}</span>
        </div>
      )}

      {/* Grid of Report Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Master Executive Card */}
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
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Combines flock count, egg harvest, commercial sales revenue, feed stock, worker wages, and construction expenses into a single audit document.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => handleExportMaster('pdf')} disabled={downloading} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
              <FileText size={16} /> Export PDF
            </button>
            <button onClick={() => handleExportMaster('excel')} disabled={downloading} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
              <Download size={16} /> Export Excel
            </button>
          </div>
        </div>

        {/* Egg Production Card */}
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
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Detailed breakdown of total eggs collected, broken eggs, and net yield across Building A, Building B, and Building C.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => handleExportEggs('pdf')} disabled={downloading} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
              <FileText size={16} /> Export PDF
            </button>
            <button onClick={() => handleExportEggs('excel')} disabled={downloading} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
              <Download size={16} /> Export Excel
            </button>
          </div>
        </div>

        {/* Sales & Revenue Card */}
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
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            List of customer transactions, egg quantities sold, unit pricing, and total revenue in RWF.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => handleExportSales('pdf')} disabled={downloading} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
              <FileText size={16} /> Export PDF
            </button>
            <button onClick={() => handleExportSales('excel')} disabled={downloading} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
              <Download size={16} /> Export Excel
            </button>
          </div>
        </div>

        {/* Labor & Construction Card */}
        <div className="card card-hover" style={{ borderTop: '4px solid var(--accent-rose)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(244,63,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HardHat size={24} color="var(--accent-rose)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Labor & Construction Expenses</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Worker wages & capital project costs</div>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Audit log of employee wage disbursements, daily rates, roof repairs, feed silos, plumbing, and solar installation costs.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => handleExportExpenses('pdf')} disabled={downloading} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
              <FileText size={16} /> Export PDF
            </button>
            <button onClick={() => handleExportExpenses('excel')} disabled={downloading} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
              <Download size={16} /> Export Excel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
