import React, { useState } from 'react';
import {
  FileText,
  Clock,
  Ship,
  Anchor,
  CheckCircle2,
  AlertCircle,
  Users,
  DollarSign,
  TrendingUp,
  Download,
  Filter,
  ArrowUpRight,
  Boxes,
  Truck,
  Container,
  Layers
} from 'lucide-react';

export default function ImportDashboard({ onNavigate }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('2026');

  const exportSummaryCSV = () => {
    const data = [
      ['Metric', 'Value', 'Category'],
      ['Warehouse Sales (Today)', '0.00 MT', 'Sales'],
      ['Warehouse Sales (This Month)', '450.00 MT', 'Sales'],
      ['Warehouse Sales (This Year)', '3,820.00 MT', 'Sales'],
      ['Direct Sales Invoice', '1,631,945.00 USD', 'Sales'],
      ['Total Purchase Orders', '40', 'Procurement'],
      ['Pending Purchase Orders', '4', 'Procurement'],
      ['Active Shipments', '8', 'Logistics'],
      ['Containers in Transit', '14', 'Logistics'],
      ['Shipments Arrived', '35', 'Logistics'],
      ['Pending Customs Clearance', '1', 'Logistics'],
      ['Suppliers', '11', 'Partners'],
      ['Total Import Value (Current Month)', '24,850,000,000 VND', 'Finance'],
      ['Supplier Paid Amount', '18,450,000,000 VND', 'Supplier Payment'],
      ['Supplier Pending Amount', '2,718,210.51 VND', 'Supplier Payment'],
      ['Supplier Overdue Amount', '1,408,964.00 VND', 'Supplier Payment'],
      ['Supplier Advance Paid', '4,200,000,000 VND', 'Supplier Payment']
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + data.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `import_dashboard_summary_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase flex items-center gap-2">
              Import Enterprise Dashboard
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-200">
                LIVE STAGING ALIGNED
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time import procurement pipeline, customs clearance, warehouse movements, and supplier payment aging.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">ALL CATEGORIES</option>
            <option value="SPICES">SPICES & COMMODITIES</option>
            <option value="GRAINS">GRAINS & COFFEE</option>
            <option value="FEED">ANIMAL FEED MEALS</option>
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
          >
            <option value="2026">FY 2026</option>
            <option value="2025">FY 2025</option>
          </select>

          <button
            onClick={exportSummaryCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>
        </div>
      </div>

      {/* 12 KPI Metric Cards Grid (3 Rows of 4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Row 1: Sales & Warehouse Metrics */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Qty: 0.00 MT</p>
            <h3 className="text-sm font-bold text-slate-800 mt-1 uppercase">Warehouse Sales</h3>
            <p className="text-xs text-slate-500">Today Sales</p>
          </div>
          <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Qty: 450.00 MT</p>
            <h3 className="text-sm font-bold text-slate-800 mt-1 uppercase">Warehouse Sales</h3>
            <p className="text-xs text-slate-500">This Month Sales</p>
          </div>
          <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Qty: 3,820.00 MT</p>
            <h3 className="text-sm font-bold text-slate-800 mt-1 uppercase">Warehouse Sales</h3>
            <p className="text-xs text-slate-500">This Year Sales</p>
          </div>
          <div className="w-11 h-11 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Qty: 1,631,945.00</p>
            <h3 className="text-sm font-bold text-slate-800 mt-1 uppercase">Direct Sales</h3>
            <p className="text-xs text-slate-500">Sales Invoice</p>
          </div>
          <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Row 2: Purchase & Shipment Pipeline */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-blue-400 transition-colors" onClick={() => onNavigate && onNavigate('procurement')}>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">40</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Total Purchase Orders</p>
          </div>
          <div className="w-11 h-11 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-amber-400 transition-colors" onClick={() => onNavigate && onNavigate('operations')}>
          <div>
            <h3 className="text-2xl font-bold text-amber-600">4</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Pending Purchase Orders</p>
          </div>
          <div className="w-11 h-11 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-sm">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-emerald-400 transition-colors" onClick={() => onNavigate && onNavigate('operations')}>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">8</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Active Shipments</p>
          </div>
          <div className="w-11 h-11 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-sm">
            <Ship className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">14</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Containers in Transit</p>
          </div>
          <div className="w-11 h-11 bg-teal-600 text-white rounded-xl flex items-center justify-center shadow-sm">
            <Anchor className="w-5 h-5" />
          </div>
        </div>

        {/* Row 3: Customs & Financials */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-emerald-600">35</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Shipments Arrived</p>
          </div>
          <div className="w-11 h-11 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-rose-600">1</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Pending Customs Clearance</p>
          </div>
          <div className="w-11 h-11 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-sm">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-purple-400 transition-colors" onClick={() => onNavigate && onNavigate('suppliers')}>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">11</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Suppliers</p>
          </div>
          <div className="w-11 h-11 bg-purple-600 text-white rounded-xl flex items-center justify-center shadow-sm">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">VND 24,850M</p>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mt-1">Total Import Value</h3>
            <p className="text-[10px] text-slate-400">(Current Month)</p>
          </div>
          <div className="w-11 h-11 bg-blue-900 text-white rounded-xl flex items-center justify-center shadow-sm">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Supplier Payment Status Strip */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Supplier Payment Status
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-emerald-500 shadow-sm">
            <p className="text-[11px] font-bold text-slate-500 uppercase">Paid</p>
            <h4 className="text-lg font-bold text-slate-900 mt-1">VND 18,450,000,000</h4>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-amber-500 shadow-sm">
            <p className="text-[11px] font-bold text-amber-700 uppercase">Pending</p>
            <h4 className="text-lg font-bold text-amber-600 mt-1">VND 2,718,210.51</h4>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-rose-500 shadow-sm">
            <p className="text-[11px] font-bold text-rose-700 uppercase">Overdue</p>
            <h4 className="text-lg font-bold text-rose-600 mt-1">VND 1,408,964.00</h4>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-teal-500 shadow-sm">
            <p className="text-[11px] font-bold text-teal-700 uppercase">Advance Paid</p>
            <h4 className="text-lg font-bold text-teal-700 mt-1">VND 4,200,000,000</h4>
          </div>
        </div>
      </div>

      {/* Lower Pipeline & Growth Trend Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Shipment Status</h3>
              <p className="text-xs text-slate-500">Current Shipment Pipeline</p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('operations')}
              className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1"
            >
              View Executions <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Contract Signed / Order Placement</span>
                <span className="font-bold">40 POs (100%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Port Loading & QC Inspection</span>
                <span className="font-bold">12 Shipments (30%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '30%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Vessels on High Seas / Sea Transit</span>
                <span className="font-bold">8 Vessels (20%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Port Arrival & Customs Inspection</span>
                <span className="font-bold text-rose-600">1 Clearance Pending (2.5%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: '2.5%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Warehouse Reception & Final GRN</span>
                <span className="font-bold text-emerald-600">35 Lots Cleared (87.5%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '87.5%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Commodity Distribution Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Monthly Import Value</h3>
              <p className="text-xs text-slate-500">Import Growth Trend by Commodity</p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('inventory')}
              className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1"
            >
              Warehouse Inventory <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                  CRN
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Argentine Non-GMO Yellow Corn</p>
                  <p className="text-[10px] text-slate-500">Hai Phong Silo • 1,200 MT</p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-slate-900">$336,000</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  SBM
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Indian Toasted Soybean Meal 48%</p>
                  <p className="text-[10px] text-slate-500">Kolkata Silo 4 • 650 MT</p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-slate-900">$299,000</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                  CAS
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Cassia / Cinnamon Split Grade A</p>
                  <p className="text-[10px] text-slate-500">Hanoi Bonded • 142.5 MT</p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-slate-900">$441,750</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                  PEP
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Black Pepper 500g/l FAQ</p>
                  <p className="text-[10px] text-slate-500">Kochi Spices Terminal • 210 MT</p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-slate-900">$829,500</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

