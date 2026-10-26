import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  FileSignature, 
  Receipt, 
  ShoppingCart, 
  Box, 
  Users, 
  Layers, 
  HandCoins, 
  Wallet,
  ArrowUpRight,
  TrendingUp,
  Download,
  Wheat,
  ShieldCheck,
  PieChart as PieIcon,
  BarChart3,
  Award,
  DollarSign,
  PackageCheck,
  Globe2,
  Printer,
  ChevronRight,
  Sparkles,
  Building2,
  Briefcase
} from 'lucide-react';
import api from '../../services/api';
import PieDonutChart from './PieDonutChart';

export default function MainDashboard({ onNavigate }) {
  const [dashData, setDashData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [selectedModule, setSelectedModule] = useState('ALL'); // 'ALL' | 'SALES' | 'PURCHASE' | 'HR'
  const [isPitchMode, setIsPitchMode] = useState(false);
  const [chartTypeToggle, setChartTypeToggle] = useState({}); // toggle between donut/pie per chart

  useEffect(() => {
    // 1. Fetch Executive Summary KPIs
    api.getDashboardSummary().then(data => {
      if (data) setDashData(data);
    });

    // 2. Fetch Presentation Charts Data
    api.getPresentationCharts().then(data => {
      if (data) setChartData(data);
    });
  }, []);

  // Use live data if available, otherwise fallback to defaults
  const d = dashData || {};
  const so = d.salesOrders || {};
  const sc = d.salesContract || {};
  const si = d.salesInvoice || {};
  const po = d.purchaseOrders || {};
  const tp = d.totalPurchase || {};
  const cn = d.containers || {};
  const pc = d.partnersCount || {};

  // Presentation charts data with safe fallbacks
  const c = chartData || {};
  const salesCharts = c.sales || {
    by_status: [
      { id: 'paid', label: 'Settled & Paid', value: 2850000, count: 34, color: '#059669' },
      { id: 'invoiced', label: 'Invoiced (Pending AR)', value: 1950000, count: 26, color: '#1E40AF' },
      { id: 'fully_delivered', label: 'Fully Delivered (In Transit)', value: 1480000, count: 19, color: '#0284C7' },
      { id: 'in_process', label: 'Approved & In Process', value: 920000, count: 15, color: '#D97706' },
      { id: 'pending_approval', label: 'Pending Approval / Draft', value: 650000, count: 9, color: '#7C3AED' }
    ],
    by_commodity: [
      { id: 'pepper', label: 'Black Pepper FAQ 550g/l', value: 3150000, volume: '480 MT', color: '#1E3A8A' },
      { id: 'cassia', label: 'Cassia / Cinnamon Split', value: 1820000, volume: '320 MT', color: '#D97706' },
      { id: 'anise', label: 'Star Anise Premium Cleaned', value: 1240000, volume: '165 MT', color: '#059669' },
      { id: 'cardamom', label: 'Green Cardamom Bold 8mm+', value: 980000, volume: '42 MT', color: '#0284C7' },
      { id: 'turmeric', label: 'High-Curcumin Turmeric', value: 660000, volume: '110 MT', color: '#EA580C' }
    ],
    by_territory: [
      { id: 'asean', label: 'Southeast Asia & ASEAN', value: 3140000, share: '40.0%', color: '#2563EB' },
      { id: 'gcc', label: 'Middle East & GCC', value: 2355000, share: '30.0%', color: '#D97706' },
      { id: 'eu', label: 'European Union & UK', value: 1413000, share: '18.0%', color: '#059669' },
      { id: 'na', label: 'North America & Others', value: 942000, share: '12.0%', color: '#7C3AED' }
    ],
    total_revenue: 7850000,
    total_orders: 103,
    top_commodity: 'Black Pepper FAQ 550g/l (40.1%)',
    delivery_success_rate: '96.4%'
  };

  const procurementCharts = c.procurement || {
    by_status: [
      { id: 'fully_received', label: 'Fully Received & Cleared', value: 2420000, count: 148, color: '#059669' },
      { id: 'partially_received', label: 'Partially Received (Warehouse)', value: 1380000, count: 76, color: '#0284C7' },
      { id: 'approved_issued', label: 'Approved & Supplier Issued', value: 890000, count: 52, color: '#1E40AF' },
      { id: 'pending_approval', label: 'Pending BOG Approval', value: 470000, count: 28, color: '#D97706' },
      { id: 'draft_sourcing', label: 'Draft RFQ & Sourcing', value: 260000, count: 14, color: '#64748B' }
    ],
    by_category: [
      { id: 'raw_pepper', label: 'Raw Black Pepper (Farm Gate)', value: 2280000, volume: '520 MT', color: '#1E40AF' },
      { id: 'cassia_barks', label: 'Cassia Barks & Cinnamon Sticks', value: 1350000, volume: '340 MT', color: '#D97706' },
      { id: 'raw_anise', label: 'Star Anise & Aromatic Seeds', value: 940000, volume: '180 MT', color: '#059669' },
      { id: 'packaging', label: 'Food-Grade PP Bags & Liners', value: 480000, volume: '140K Units', color: '#7C3AED' },
      { id: 'freight_logistics', label: 'Inland Logistics & Drayage', value: 370000, volume: '320 Trips', color: '#E11D48' }
    ],
    by_supplier: [
      { id: 'gialai', label: 'Gia Lai Spice Farmers Co-op', value: 1780000, color: '#059669' },
      { id: 'daklak', label: 'Dak Lak Organic Agritech', value: 1240000, color: '#1E40AF' },
      { id: 'yenbai', label: 'Yen Bai Cinnamon Association', value: 970000, color: '#D97706' },
      { id: 'cochin', label: 'Cochin Spices & Plantations Ltd', value: 810000, color: '#0284C7' },
      { id: 'longan', label: 'Long An Processing Milling', value: 620000, color: '#7C3AED' }
    ],
    total_spend: 5420000,
    total_orders: 318,
    active_suppliers: 56,
    lead_time_days: '14 Days'
  };

  const hrCharts = c.hr || {
    by_department: [
      { id: 'sales_export', label: 'Sales & Global Export', count: 18, color: '#1E40AF' },
      { id: 'procurement', label: 'Procurement & Sourcing', count: 15, color: '#D97706' },
      { id: 'plant_ops', label: 'Plant Operations & Milling', count: 16, color: '#059669' },
      { id: 'quality', label: 'Quality Assurance & QC Lab', count: 9, color: '#0284C7' },
      { id: 'finance', label: 'Finance, Accounts & LC', count: 6, color: '#7C3AED' },
      { id: 'executive', label: 'Executive & People Ops', count: 4, color: '#E11D48' }
    ],
    by_performance_band: [
      { id: 'top_talent', label: 'Top Performer (4.5 - 5.0)', count: 16, score: '4.7 Avg', color: '#059669' },
      { id: 'exceeds', label: 'Exceeds Targets (4.0 - 4.4)', count: 27, score: '4.2 Avg', color: '#2563EB' },
      { id: 'meets', label: 'Meets Standards (3.5 - 3.9)', count: 19, score: '3.7 Avg', color: '#D97706' },
      { id: 'developing', label: 'Developing / Coached (< 3.5)', count: 6, score: '3.2 Avg', color: '#94A3B8' }
    ],
    by_payroll_cost: [
      { id: 'base_salary', label: 'Base Salaries & Regular Wages', value: 118000, share: '62.1%', color: '#1E40AF' },
      { id: 'incentives', label: 'Export & Quality Incentives', value: 36000, share: '18.9%', color: '#059669' },
      { id: 'benefits', label: 'Healthcare & Statutory Benefits', value: 21000, share: '11.1%', color: '#D97706' },
      { id: 'allowances', label: 'Shift & Safety Allowances', value: 15000, share: '7.9%', color: '#7C3AED' }
    ],
    total_headcount: 68,
    avg_rating: '4.28 / 5.0',
    retention_rate: '95.8%',
    monthly_payroll: 190000
  };

  const handlePrint = () => {
    window.print();
  };

  const kpiCards = [
    {
      title: 'SALES ORDERS',
      icon: FileText,
      iconBg: 'bg-[#1E40AF]',
      lines: [
        { label: 'BOG APPROVAL PENDING', value: String(so.bogApprovalPending ?? '6') },
        { label: 'AWAITING BUYER SIGN', value: String(so.awaitingBuyerSign ?? '2') },
        { label: 'ORDER IN PROCESS', value: String(so.orderInProcess ?? '99') },
        { label: 'COMPLETED', value: String(so.completed ?? '8') },
      ],
      action: 'export'
    },
    {
      title: 'SPICES & AGRO CONTRACTS',
      icon: FileSignature,
      iconBg: 'bg-[#D97706]',
      lines: [
        { label: 'MTD($)', value: '0.00' },
        { label: 'YTD($)', value: '7M' },
        { label: 'MTD QTY', value: '-' },
        { label: 'YTD QTY', value: '20,892.32 CBM | 1,784.16 MT' },
      ],
      action: 'export'
    },
    {
      title: 'COMMERCIAL SALES INVOICE',
      icon: Receipt,
      iconBg: 'bg-[#2563EB]',
      lines: [
        { label: 'MTD($)', value: '0.00' },
        { label: 'YTD($)', value: '1.3M' },
        { label: 'MTD QTY', value: '-' },
        { label: 'YTD QTY', value: '6,076.50 CBM' },
      ],
      action: 'export'
    },
    {
      title: 'RAW MATERIAL PROCUREMENT',
      icon: FileText,
      iconBg: 'bg-[#334155]',
      lines: [
        { label: 'BOG APPROVAL PENDING', value: '28' },
        { label: 'APPROVED', value: '265' },
        { label: 'PAYMENT PENDING', value: '207' },
      ],
      action: 'procurement'
    },
    {
      title: 'TOTAL PURCHASE VOLUME',
      icon: ShoppingCart,
      iconBg: 'bg-[#B45309]',
      lines: [
        { label: 'MTD(₫)', value: '0.00' },
        { label: 'YTD(₫)', value: '1,312.2B' },
        { label: 'MTD QTY', value: '-' },
        { label: 'YTD QTY', value: '615,420.29 CBM' },
      ],
      action: 'procurement'
    },
    {
      title: 'CONTAINER LOGISTICS',
      icon: Layers,
      iconBg: 'bg-[#1E40AF]',
      lines: [
        { label: 'ORDERS 500 | PENDING 425 | LOADED 75', value: '' },
      ],
      action: 'export'
    },
    {
      title: 'BUYERS & FARM SUPPLIERS',
      icon: Users,
      iconBg: 'bg-[#D97706]',
      lines: [
        { label: 'GLOBAL BUYERS', value: String(pc.registeredBuyers ?? '34') },
        { label: 'CERTIFIED FARMS & SUPPLIERS', value: String(pc.qualifiedSuppliers ?? '56') },
      ],
      action: 'buyers'
    },
    {
      title: 'COMMODITIES & SPICES SKUS',
      icon: Wheat,
      iconBg: 'bg-[#0284C7]',
      lines: [
        { label: 'WHOLE SPICES, RICE, TEA, MEAL', value: `${d.productsCount ?? 21} SKUs` },
      ],
      action: 'products'
    },
    {
      title: 'HR & WORKFORCE HEADCOUNT',
      icon: Users,
      iconBg: 'bg-[#059669]',
      lines: [
        { label: 'ACTIVE PERSONNEL', value: `${hrCharts.total_headcount} Staff` },
        { label: 'RETENTION RATE', value: hrCharts.retention_rate },
        { label: 'AVG APPRAISAL', value: hrCharts.avg_rating },
      ],
      action: 'employees'
    }
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP BANNER / CORPORATE IDENTITY & PRESENTATION BAR
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm print:hidden">
        <div className="flex items-center space-x-3.5">
          <img 
            src="/favicon.png" 
            alt="SOILEX" 
            className="w-12 h-12 object-contain rounded-xl p-1 bg-blue-50 border border-blue-200"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                SOILEX Life Science
              </h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-[#B45309] border border-amber-200">
                The Essence of Authentic Spices
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md font-semibold bg-blue-50 text-[#1E40AF] border border-blue-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Executive Analytics Deck
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-Module Enterprise Intelligence • Visual Distribution Charts (Sales • Procurement • Human Resources)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button 
            onClick={() => setIsPitchMode(!isPitchMode)}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all border ${
              isPitchMode 
                ? 'bg-[#1E40AF] text-white border-[#1E40AF]' 
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            title="Toggle Clean Boardroom Pitch Mode"
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>{isPitchMode ? 'PRESENTATION MODE: ACTIVE' : 'BOARDROOM PITCH MODE'}</span>
          </button>

          <button 
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors"
            title="Print or Export Slide Report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT / PDF</span>
          </button>

          <button 
            onClick={() => onNavigate('export')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>TRADE OPERATIONS</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. MODULE PRESENTATION TABS SELECTOR
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 gap-2 flex-wrap print:hidden">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-1">
          <button
            onClick={() => setSelectedModule('ALL')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
              selectedModule === 'ALL'
                ? 'bg-[#1E40AF] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ALL MODULES OVERVIEW</span>
          </button>

          <button
            onClick={() => setSelectedModule('SALES')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
              selectedModule === 'SALES'
                ? 'bg-[#1E40AF] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-blue-400" />
            <span>SALES & EXPORT</span>
          </button>

          <button
            onClick={() => setSelectedModule('PURCHASE')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
              selectedModule === 'PURCHASE'
                ? 'bg-[#D97706] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 text-amber-300" />
            <span>PURCHASE & PROCUREMENT</span>
          </button>

          <button
            onClick={() => setSelectedModule('HR')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
              selectedModule === 'HR'
                ? 'bg-[#059669] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-300" />
            <span>HR & PEOPLE OPERATIONS</span>
          </button>
        </div>

        {/* Active Module Indicator Badge */}
        <div className="text-xs text-slate-500 font-medium">
          Showing: <strong className="text-slate-800">
            {selectedModule === 'ALL' && 'Full Enterprise Tri-Module Deck'}
            {selectedModule === 'SALES' && 'Sales Order Lifecycle & Commodity Revenue'}
            {selectedModule === 'PURCHASE' && 'Procurement Spend & Supplier Allocation'}
            {selectedModule === 'HR' && 'Department Headcount, Appraisals & Payroll'}
          </strong>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MODULE FOCUSED HIGHLIGHTS BAR
      ───────────────────────────────────────────────────────────── */}
      {selectedModule === 'SALES' && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Executive Sales Portfolio</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">96.4% On-Time Fulfillment</span>
            </div>
            <h2 className="text-lg font-bold">International Spice & Agro Export Distribution</h2>
            <p className="text-xs text-blue-100/80">Interactive analysis of {salesCharts.total_orders} active sales orders, commodity volume mix, and export destination markets.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate('sales_orders')}
              className="px-4 py-2 bg-white text-[#1E40AF] hover:bg-blue-50 text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>View All Sales Orders</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {selectedModule === 'PURCHASE' && (
        <div className="bg-gradient-to-r from-amber-900 to-stone-900 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-200">Procurement & Sourcing Deck</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">14 Days Avg Farm Gate Lead Time</span>
            </div>
            <h2 className="text-lg font-bold">Raw Material Procurement & Farm Sourcing Spend</h2>
            <p className="text-xs text-amber-100/80">Analysis of ₫1,312.2B ($5.42M) raw spice procurement, cooperative supplier allocation, and goods receipt status.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate('procurement')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>Open Procurement Module</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {selectedModule === 'HR' && (
        <div className="bg-gradient-to-r from-emerald-950 to-teal-900 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">People Operations & Talent Analytics</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">95.8% Employee Retention</span>
            </div>
            <h2 className="text-lg font-bold">Bi-National Workforce, 9-Box Appraisals & Payroll</h2>
            <p className="text-xs text-emerald-100/80">Departmental headcount breakdown across {hrCharts.total_headcount} active personnel, 9-Box performance rubric, and CTC allocation.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate('employees')}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>Open Employee Directory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. MAIN PRESENTATION PIE & DONUT CHARTS
      ───────────────────────────────────────────────────────────── */}
      
      {/* ── MODULE 1: SALES & EXPORT CHARTS ── */}
      {(selectedModule === 'ALL' || selectedModule === 'SALES') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#1E40AF]"></div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Sales & Export Distribution Analytics
              </h2>
            </div>
            <button
              onClick={() => onNavigate('sales_orders')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Sales Orders & Invoices</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Chart 1: Sales Order Lifecycle (Donut) */}
            <PieDonutChart
              title="Sales Order Lifecycle Stages"
              subtitle="Breakdown of pipeline value across delivery & invoicing status"
              data={salesCharts.by_status}
              currency="$"
              isDonut={true}
              centerLabel="TOTAL VALUE"
              centerValue="$7.85M"
              centerSub="103 Orders Active"
              onSliceClick={() => onNavigate('sales_orders')}
            />

            {/* Chart 2: Commodity Revenue Mix (Pie) */}
            <PieDonutChart
              title="Commodity Portfolio Revenue Share"
              subtitle="Value & volume split across whole spices & commodities"
              data={salesCharts.by_commodity}
              currency="$"
              isDonut={false}
              centerLabel="TOP COMMODITY"
              centerValue="Pepper (40%)"
              onSliceClick={() => onNavigate('products')}
            />

            {/* Chart 3: Export Regional Territory Share (Donut) */}
            <PieDonutChart
              title="Global Export Territory Allocation"
              subtitle="Export revenue distribution across overseas destination hubs"
              data={salesCharts.by_territory}
              currency="$"
              isDonut={true}
              centerLabel="GLOBAL REACH"
              centerValue="4 Continents"
              centerSub="ASEAN & GCC Primary"
              onSliceClick={() => onNavigate('export')}
            />
          </div>
        </div>
      )}

      {/* ── MODULE 2: PURCHASE & PROCUREMENT CHARTS ── */}
      {(selectedModule === 'ALL' || selectedModule === 'PURCHASE') && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Purchase & Procurement Sourcing Analytics
              </h2>
            </div>
            <button
              onClick={() => onNavigate('procurement')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1"
            >
              <span>Purchase Orders & GRN</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Chart 4: PO Lifecycle Status (Donut) */}
            <PieDonutChart
              title="Purchase Order Lifecycle Status"
              subtitle="Raw material order stages from draft RFQ to fully received"
              data={procurementCharts.by_status}
              currency="$"
              isDonut={true}
              centerLabel="TOTAL SPEND"
              centerValue="$5.42M"
              centerSub="318 Purchase Orders"
              onSliceClick={() => onNavigate('procurement')}
            />

            {/* Chart 5: Sourcing Category Spend (Pie) */}
            <PieDonutChart
              title="Raw Spice & Sourcing Spend Allocation"
              subtitle="Budget allocation across raw spices, packaging & freight"
              data={procurementCharts.by_category}
              currency="$"
              isDonut={false}
              centerLabel="TOP INPUT"
              centerValue="Raw Pepper"
              onSliceClick={() => onNavigate('procurement')}
            />

            {/* Chart 6: Top Supplier & Cooperative Allocation (Donut) */}
            <PieDonutChart
              title="Top Certified Suppliers & Co-ops"
              subtitle="Concentration of purchase budget across key farm cooperatives"
              data={procurementCharts.by_supplier}
              currency="$"
              isDonut={true}
              centerLabel="SUPPLIERS"
              centerValue="56 Active"
              centerSub="Top 5 Shown"
              onSliceClick={() => onNavigate('suppliers')}
            />
          </div>
        </div>
      )}

      {/* ── MODULE 3: HR & WORKFORCE CHARTS ── */}
      {(selectedModule === 'ALL' || selectedModule === 'HR') && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#059669]"></div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Human Resources & People Operations Analytics
              </h2>
            </div>
            <button
              onClick={() => onNavigate('employees')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
            >
              <span>Employee Directory & Appraisals</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Chart 7: Headcount by Department (Donut) */}
            <PieDonutChart
              title="Workforce Headcount by Department"
              subtitle="Staff distribution across export, operations, QA and admin"
              data={hrCharts.by_department}
              isDonut={true}
              centerLabel="TOTAL STAFF"
              centerValue={`${hrCharts.total_headcount} Staff`}
              centerSub="Bi-National Team"
              onSliceClick={() => onNavigate('employees')}
            />

            {/* Chart 8: Talent Appraisal Rating Bands (Pie) */}
            <PieDonutChart
              title="Talent Performance & Appraisal Bands"
              subtitle="9-Box appraisal rating breakdown across active team members"
              data={hrCharts.by_performance_band}
              isDonut={false}
              centerLabel="AVG SCORE"
              centerValue={hrCharts.avg_rating}
              onSliceClick={() => onNavigate('performance')}
            />

            {/* Chart 9: Monthly Compensation & CTC Allocation (Donut) */}
            <PieDonutChart
              title="Compensation & Monthly CTC Breakdown"
              subtitle="Monthly payroll split across base wages, incentives and benefits"
              data={hrCharts.by_payroll_cost}
              currency="$"
              isDonut={true}
              centerLabel="MONTHLY CTC"
              centerValue="$190k"
              centerSub="100% Disbursed"
              onSliceClick={() => onNavigate('payroll')}
            />
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. OPERATIONAL KPI METRICS SUMMARY GRID
      ───────────────────────────────────────────────────────────── */}
      {!isPitchMode && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Operational Highlights & Key Indicators
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">Click any metric card to jump to operational view</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {kpiCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div 
                  key={idx}
                  onClick={() => onNavigate(card.action)}
                  className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md hover:border-[#BFDBFE] transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1 pr-3">
                      <div className="space-y-1">
                        {card.lines.map((line, lIdx) => (
                          <div key={lIdx} className="flex flex-wrap items-baseline justify-between text-xs">
                            <span className="font-semibold text-slate-600 uppercase tracking-wide text-[11px]">
                              {line.label}
                            </span>
                            {line.value && (
                              <span className="font-bold text-slate-900 ml-2">
                                {line.value}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={`w-11 h-11 rounded-lg ${card.iconBg} text-white flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase group-hover:text-[#1E40AF] transition-colors">
                      {card.title}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#D97706] transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
