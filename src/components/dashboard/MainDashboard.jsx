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
  Briefcase,
  CheckCircle2,
  TrendingDown,
  Clock
} from 'lucide-react';
import api from '../../services/api';
import PieDonutChart from './PieDonutChart';

export default function MainDashboard({ onNavigate }) {
  const [dashData, setDashData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [selectedModule, setSelectedModule] = useState('ALL'); // 'ALL' | 'SALES' | 'PURCHASE' | 'HR'
  const [isPitchMode, setIsPitchMode] = useState(false);

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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ─────────────────────────────────────────────────────────────
          1. CLASSIC & MODERN CORPORATE HERO BANNER
      ───────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.03)] print:border-none">
        {/* Subtle Brand Top Accent Bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#1E40AF] via-[#D97706] to-[#059669]" />

        <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Identity & Mission */}
          <div className="flex items-start sm:items-center space-x-4">
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/80 border border-blue-200/80 p-2 flex items-center justify-center shadow-xs shrink-0">
              <img 
                src="/favicon.png" 
                alt="SOILEX" 
                className="w-full h-full object-contain"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#D97706] border-2 border-white flex items-center justify-center text-[9px] text-white font-bold">
                ★
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
                  SOILEX Life Science
                </h1>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-[#B45309] border border-amber-200/80">
                  The Essence of Authentic Spices
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 text-[#1E40AF] border border-blue-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> ISO 22000 • HACCP • FSSAI
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Integrated Agro-Commodity Export ERP • Boardroom Executive Visual Analytics & Presentation Suite
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-2 shrink-0">
            <button 
              onClick={() => setIsPitchMode(!isPitchMode)}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all border ${
                isPitchMode 
                  ? 'bg-gradient-to-r from-[#1E40AF] to-blue-800 text-white border-blue-800 ring-2 ring-blue-300' 
                  : 'bg-white text-slate-700 border-slate-300/80 hover:bg-slate-50 hover:border-slate-400'
              }`}
              title="Toggle Executive Presentation Slide Mode"
            >
              <PieIcon className="w-4 h-4 text-amber-400" />
              <span>{isPitchMode ? 'BOARDROOM SLIDES: ACTIVE' : 'EXECUTIVE PRESENTATION'}</span>
            </button>

            <button 
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-white border border-slate-300/80 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-colors"
              title="Print or Export Slide Report to PDF"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>EXPORT PDF</span>
            </button>

            <button 
              onClick={() => onNavigate('export')}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              <span>OPERATIONS</span>
            </button>
          </div>
        </div>

        {/* Executive Ticker Bar */}
        <div className="bg-slate-50/70 border-t border-slate-100 px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">YTD Export Volume</span>
            <span className="font-extrabold text-slate-800 text-sm">20,892 MT</span>
            <span className="text-[10px] text-emerald-600 font-bold ml-1.5">↑ 18.4% YoY</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Gross Export Revenue</span>
            <span className="font-extrabold text-[#1E40AF] text-sm">$7.85M USD</span>
            <span className="text-[10px] text-slate-500 font-semibold ml-1.5">103 Contracts</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Raw Farm Sourcing</span>
            <span className="font-extrabold text-[#D97706] text-sm">₫1,312.2B</span>
            <span className="text-[10px] text-slate-500 font-semibold ml-1.5">56 Co-ops</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Active Workforce</span>
            <span className="font-extrabold text-[#059669] text-sm">68 Personnel</span>
            <span className="text-[10px] text-emerald-600 font-bold ml-1.5">95.8% Retention</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SEGMENTED PRESENTATION MODULE SELECTOR
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-4 gap-3 print:hidden">
        {/* Module Switcher Tabs */}
        <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 space-x-1 overflow-x-auto shadow-inner">
          <button
            onClick={() => setSelectedModule('ALL')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
              selectedModule === 'ALL'
                ? 'bg-white text-[#1E40AF] shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ALL MODULES OVERVIEW</span>
          </button>

          <button
            onClick={() => setSelectedModule('SALES')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
              selectedModule === 'SALES'
                ? 'bg-[#1E40AF] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-blue-300" />
            <span>SALES & EXPORT</span>
          </button>

          <button
            onClick={() => setSelectedModule('PURCHASE')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
              selectedModule === 'PURCHASE'
                ? 'bg-[#D97706] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 text-amber-200" />
            <span>PURCHASE & SOURCING</span>
          </button>

          <button
            onClick={() => setSelectedModule('HR')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
              selectedModule === 'HR'
                ? 'bg-[#059669] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-200" />
            <span>HR & WORKFORCE</span>
          </button>
        </div>

        {/* Perspective Label */}
        <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <span>Scope:</span>
          <strong className="text-slate-800">
            {selectedModule === 'ALL' && 'Unified Tri-Module Executive Suite'}
            {selectedModule === 'SALES' && 'Global Sales Contracts & Commodity Mix'}
            {selectedModule === 'PURCHASE' && 'Direct Farm Sourcing & Cooperative Spend'}
            {selectedModule === 'HR' && 'Bi-National Team, Appraisals & Payroll CTC'}
          </strong>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MODULE SPOTLIGHT BANNERS (WHEN DRILLING DOWN)
      ───────────────────────────────────────────────────────────── */}
      {selectedModule === 'SALES' && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-blue-800/40">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Executive Sales Deck</span>
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ✓ 96.4% On-Time Global Fulfillment
              </span>
            </div>
            <h2 className="text-lg font-extrabold tracking-tight">International Spice & Agro Export Revenue</h2>
            <p className="text-xs text-blue-100/80 max-w-2xl">
              Real-time portfolio analytics across {salesCharts.total_orders} active trade contracts, containerized logistics, and multi-currency LC settlements.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('sales_orders')}
            className="px-4 py-2.5 bg-white text-[#1E40AF] hover:bg-blue-50 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            <span>View All Sales Orders</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {selectedModule === 'PURCHASE' && (
        <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-amber-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-amber-800/40">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-200">Procurement & Sourcing Deck</span>
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                14 Days Average Farm Gate Lead Time
              </span>
            </div>
            <h2 className="text-lg font-extrabold tracking-tight">Raw Material Procurement & Farm Sourcing Spend</h2>
            <p className="text-xs text-amber-100/80 max-w-2xl">
              Tracking ₫1,312.2B ($5.42M) spend across Gia Lai, Dak Lak and Yen Bai partner cooperatives, GRN warehouse receipts, and vendor payments.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('procurement')}
            className="px-4 py-2.5 bg-[#D97706] hover:bg-amber-500 text-slate-900 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            <span>Open Procurement Module</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {selectedModule === 'HR' && (
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-800/40">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Human Capital & Talent Analytics</span>
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                95.8% Employee Retention Rate
              </span>
            </div>
            <h2 className="text-lg font-extrabold tracking-tight">Bi-National Workforce, 9-Box Appraisals & Payroll</h2>
            <p className="text-xs text-emerald-100/80 max-w-2xl">
              Distribution of {hrCharts.total_headcount} certified plant and trade personnel, appraisal rating rubric (4.28 Avg), and monthly compensation CTC.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('employees')}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            <span>Open Employee Directory</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. MAIN PRESENTATION PIE & DONUT CHARTS (3-COLUMN GRID)
      ───────────────────────────────────────────────────────────── */}
      
      {/* ── SALES & EXPORT MODULE ── */}
      {(selectedModule === 'ALL' || selectedModule === 'SALES') && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="w-3 h-3 rounded-full bg-[#1E40AF]"></span>
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Sales & Export Distribution Analytics
              </h2>
            </div>
            <button
              onClick={() => onNavigate('sales_orders')}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
            >
              <span>Sales Orders & Invoices →</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <PieDonutChart
              title="Sales Order Lifecycle Stages"
              subtitle="Pipeline revenue distribution across delivery and invoicing stages"
              data={salesCharts.by_status}
              currency="$"
              isDonut={true}
              centerLabel="TOTAL PIPELINE"
              centerValue="$7.85M"
              centerSub="103 Orders Active"
              onSliceClick={() => onNavigate('sales_orders')}
            />

            <PieDonutChart
              title="Commodity Portfolio Revenue Share"
              subtitle="Volume & value split across whole spices and agricultural lines"
              data={salesCharts.by_commodity}
              currency="$"
              isDonut={false}
              centerLabel="TOP COMMODITY"
              centerValue="Pepper (40%)"
              onSliceClick={() => onNavigate('products')}
            />

            <PieDonutChart
              title="Global Export Territory Allocation"
              subtitle="Overseas destination split across ASEAN, GCC, Europe and Americas"
              data={salesCharts.by_territory}
              currency="$"
              isDonut={true}
              centerLabel="DESTINATIONS"
              centerValue="4 Continents"
              centerSub="ASEAN Primary"
              onSliceClick={() => onNavigate('export')}
            />
          </div>
        </div>
      )}

      {/* ── PURCHASE & PROCUREMENT MODULE ── */}
      {(selectedModule === 'ALL' || selectedModule === 'PURCHASE') && (
        <div className="space-y-3.5 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="w-3 h-3 rounded-full bg-[#D97706]"></span>
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Purchase & Procurement Sourcing Analytics
              </h2>
            </div>
            <button
              onClick={() => onNavigate('procurement')}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1"
            >
              <span>Purchase Orders & GRN →</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <PieDonutChart
              title="Purchase Order Lifecycle Status"
              subtitle="Raw spice sourcing orders from draft RFQ to fully received"
              data={procurementCharts.by_status}
              currency="$"
              isDonut={true}
              centerLabel="TOTAL SOURCING"
              centerValue="$5.42M"
              centerSub="318 Purchase Orders"
              onSliceClick={() => onNavigate('procurement')}
            />

            <PieDonutChart
              title="Raw Material & Sourcing Spend"
              subtitle="Capital allocation across raw whole spices, packaging and drayage"
              data={procurementCharts.by_category}
              currency="$"
              isDonut={false}
              centerLabel="TOP INPUT"
              centerValue="Raw Pepper"
              onSliceClick={() => onNavigate('procurement')}
            />

            <PieDonutChart
              title="Certified Supplier & Co-op Allocation"
              subtitle="Concentration of purchase budget across key regional cooperatives"
              data={procurementCharts.by_supplier}
              currency="$"
              isDonut={true}
              centerLabel="COOPERATIVES"
              centerValue="56 Certified"
              centerSub="Top 5 Shown"
              onSliceClick={() => onNavigate('suppliers')}
            />
          </div>
        </div>
      )}

      {/* ── HR & WORKFORCE MODULE ── */}
      {(selectedModule === 'ALL' || selectedModule === 'HR') && (
        <div className="space-y-3.5 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="w-3 h-3 rounded-full bg-[#059669]"></span>
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Human Resources & People Operations Analytics
              </h2>
            </div>
            <button
              onClick={() => onNavigate('employees')}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
            >
              <span>Employee Directory & Appraisals →</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <PieDonutChart
              title="Workforce Distribution by Department"
              subtitle="Headcount split across sales, procurement, plant milling, and QA"
              data={hrCharts.by_department}
              isDonut={true}
              centerLabel="TOTAL HEADCOUNT"
              centerValue={`${hrCharts.total_headcount} Staff`}
              centerSub="Bi-National Team"
              onSliceClick={() => onNavigate('employees')}
            />

            <PieDonutChart
              title="Talent Performance Appraisal Bands"
              subtitle="9-Box appraisal rating bands across verified staff members"
              data={hrCharts.by_performance_band}
              isDonut={false}
              centerLabel="AVG RATING"
              centerValue={hrCharts.avg_rating}
              onSliceClick={() => onNavigate('performance')}
            />

            <PieDonutChart
              title="Monthly Compensation & CTC Breakdown"
              subtitle="Payroll disbursement split across basic wages, incentives and benefits"
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
          5. CLASSIC ENTERPRISE OPERATIONAL KPI CARDS
      ───────────────────────────────────────────────────────────── */}
      {!isPitchMode && (
        <div className="space-y-3.5 pt-4 border-t border-slate-200/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-slate-600" />
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Operational Ledger & Master Indicators
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">Click any card to jump to module</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {kpiCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div 
                  key={idx}
                  onClick={() => onNavigate(card.action)}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1 pr-3">
                      <div className="space-y-1.5">
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

                    <div className={`w-11 h-11 rounded-xl ${card.iconBg} text-white flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase group-hover:text-[#1E40AF] transition-colors">
                      {card.title}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#D97706] transition-colors" />
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
