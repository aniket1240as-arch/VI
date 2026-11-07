import React, { useState } from 'react';
import { 
  Home, 
  ShoppingCart, 
  FileText, 
  DollarSign, 
  BarChart2, 
  Handshake, 
  Users, 
  Fingerprint, 
  Receipt, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Layers, 
  Box, 
  Truck, 
  Briefcase, 
  UserCheck, 
  Calendar, 
  Sun, 
  CheckSquare, 
  ShieldCheck,
  Building2,
  Wheat,
  Container,
  TrendingUp,
  BookOpen,
  Warehouse,
  Ship,
  FileSpreadsheet,
  AlertCircle,
  PackageCheck,
  RotateCcw,
  AlertTriangle,
  Scale,
  CircleDot,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ 
  activeTab, 
  activeSubTab, 
  onSelectTab, 
  isCollapsed, 
  onToggleCollapse 
}) {
  const [imgError, setImgError] = useState(false);
  const { user } = useAuth();
  const isEmployeeRole = user?.role === 'EMPLOYEE';

  // Master Accordion State for IMPORT and EXPORT
  const [openDropdowns, setOpenDropdowns] = useState({
    import: true,
    export: true,
    masters: true,
  });

  // Nested Accordion State for subcategories inside IMPORT and EXPORT
  const [openNested, setOpenNested] = useState({
    // IMPORT subcategories
    imp_purchase: true,
    imp_operation: true,
    imp_sales: true,
    imp_inventory: true,
    imp_account: true,
    // EXPORT subcategories
    exp_sales: true,
    exp_purchase: true,
    exp_qc: true,
    exp_ops: true,
    exp_accounts: true,
  });

  const toggleDropdown = (key, e) => {
    if (e) e.stopPropagation();
    if (isCollapsed) {
      onToggleCollapse();
    }
    setOpenDropdowns(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleNested = (key, e) => {
    if (e) e.stopPropagation();
    if (isCollapsed) {
      onToggleCollapse();
    }
    setOpenNested(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleItemClick = (tabId, subTabId = null) => {
    if (isCollapsed) {
      onToggleCollapse();
    }
    onSelectTab(tabId, subTabId);
  };

  // ─────────────────────────────────────────────────────────────
  // STRUCTURED IMPORT SUBMENU
  // ─────────────────────────────────────────────────────────────
  const importSections = [
    {
      id: 'import_dashboard',
      label: 'DASHBOARD',
      icon: BarChart2,
      target: 'import_dashboard',
      subTab: null,
      isLeaf: true
    },
    {
      id: 'imp_purchase',
      label: 'PURCHASE',
      icon: ShoppingCart,
      isLeaf: false,
      items: [
        { id: 'imp_po', label: 'PURCHASE ORDER', target: 'procurement', subTab: 'purchase_orders' }
      ]
    },
    {
      id: 'imp_operation',
      label: 'OPERATION',
      icon: Ship,
      isLeaf: false,
      items: [
        { id: 'imp_exec', label: 'EXECUTION', target: 'operations', subTab: 'executions' },
        { id: 'imp_doc', label: 'DOCUMENT SUBMISSION', target: 'operations', subTab: 'documents' }
      ]
    },
    {
      id: 'imp_sales',
      label: 'SALES',
      icon: FileText,
      isLeaf: false,
      items: [
        { id: 'imp_claim', label: 'DELIVERY CLAIM', target: 'operations', subTab: 'claims' },
        { id: 'imp_del_note', label: 'DELIVERY NOTE', target: 'inventory', subTab: 'delivery_note' },
        { id: 'imp_invoice', label: 'SALES INVOICE', target: 'finance', subTab: 'invoices' }
      ]
    },
    {
      id: 'imp_inventory',
      label: 'INVENTORY',
      icon: Warehouse,
      isLeaf: false,
      items: [
        { id: 'imp_stock', label: 'CURRENT STOCK & LOTS', target: 'inventory', subTab: 'stock' },
        { id: 'imp_stock_in', label: 'STOCK IN (GRN)', target: 'inventory', subTab: 'stock_in' },
        { id: 'imp_wh_delivery', label: 'WH DELIVERY', target: 'inventory', subTab: 'delivery' },
        { id: 'imp_wh_return', label: 'WH DELIVERY RETURN', target: 'inventory', subTab: 'returns' },
        { id: 'imp_wh_note', label: 'WH DELIVERY NOTE', target: 'inventory', subTab: 'delivery_note' },
        { id: 'imp_damage', label: 'WAREHOUSE DAMAGE & LOSS', target: 'inventory', subTab: 'damages' }
      ]
    },
    {
      id: 'imp_account',
      label: 'ACCOUNT',
      icon: DollarSign,
      isLeaf: false,
      items: [
        { id: 'imp_cr_note', label: 'IMPORT CREDIT NOTE', target: 'finance', subTab: 'notes' },
        { id: 'imp_dr_note', label: 'IMPORT DEBIT NOTE', target: 'finance', subTab: 'notes' },
        { id: 'imp_pay', label: 'IMPORT PAYMENTS', target: 'finance', subTab: 'payments' },
        { id: 'imp_supp_pay', label: 'SUPPLIER PAYMENTS', target: 'finance', subTab: 'payments' },
        { id: 'imp_ledger', label: 'LEDGER SUPPLIER', target: 'finance', subTab: 'general_ledger' }
      ]
    },
    {
      id: 'imp_expense',
      label: 'EXPENSE',
      icon: Receipt,
      target: 'masters',
      subTab: 'expense_categories',
      isLeaf: true
    },
    {
      id: 'imp_reports',
      label: 'REPORTS',
      icon: BarChart2,
      target: 'reports',
      subTab: null,
      isLeaf: true
    }
  ];

  // ─────────────────────────────────────────────────────────────
  // STRUCTURED EXPORT SUBMENU
  // ─────────────────────────────────────────────────────────────
  const exportSections = [
    {
      id: 'exp_admin_dash',
      label: 'ADMIN DASHBOARD',
      icon: Home,
      target: 'main',
      subTab: null,
      isLeaf: true
    },
    {
      id: 'exp_sales_dash',
      label: 'SALES DASHBOARD',
      icon: BarChart2,
      target: 'main',
      subTab: null,
      isLeaf: true
    },
    {
      id: 'exp_purch_dash',
      label: 'PURCHASE DASHBOARD',
      icon: ShoppingCart,
      target: 'procurement',
      subTab: 'dashboard',
      isLeaf: true
    },
    {
      id: 'exp_ops_dash',
      label: 'OPERATION DASHBOARD',
      icon: Ship,
      target: 'operations',
      subTab: 'executions',
      isLeaf: true
    },
    {
      id: 'exp_sales',
      label: 'SALES',
      icon: FileText,
      isLeaf: false,
      items: [
        { id: 'exp_contract', label: 'SALES CONTRACT', target: 'export', subTab: 'CONTRACTS' },
        { id: 'exp_inv', label: 'SALES INVOICE', target: 'finance', subTab: 'invoices' },
        { id: 'exp_pi', label: 'SALES PI (PROFORMA)', target: 'export', subTab: 'CONTRACTS' }
      ]
    },
    {
      id: 'exp_purchase',
      label: 'PURCHASE',
      icon: ShoppingCart,
      isLeaf: false,
      items: [
        { id: 'exp_po', label: 'PURCHASE ORDER', target: 'procurement', subTab: 'purchase_orders' },
        { id: 'exp_purch_contract', label: 'PURCHASE CONTRACT', target: 'import', subTab: 'CONTRACTS' }
      ]
    },
    {
      id: 'exp_qc',
      label: 'QC & INSPECTION',
      icon: ShieldCheck,
      isLeaf: false,
      items: [
        { id: 'exp_qc_inspect', label: 'QC INSPECTION', target: 'masters', subTab: 'qc_party' },
        { id: 'exp_qc_reports', label: 'QC REPORTS', target: 'reports', subTab: null }
      ]
    },
    {
      id: 'exp_ops',
      label: 'OPERATIONS',
      icon: Ship,
      isLeaf: false,
      items: [
        { id: 'exp_booking', label: 'CONTAINER BOOKING', target: 'export', subTab: 'SHIPMENTS' },
        { id: 'exp_bl', label: 'BL MANIFEST', target: 'export', subTab: 'SHIPMENTS' },
        { id: 'exp_tracking', label: 'SHIPPING TRACKING', target: 'export', subTab: 'CONTAINERS' }
      ]
    },
    {
      id: 'exp_accounts',
      label: 'ACCOUNTS',
      icon: DollarSign,
      isLeaf: false,
      items: [
        { id: 'exp_acc_inv', label: 'EXPORT INVOICE', target: 'finance', subTab: 'invoices' },
        { id: 'exp_notes', label: 'DEBIT / CREDIT NOTE', target: 'finance', subTab: 'notes' },
        { id: 'exp_lc', label: 'LETTER OF CREDIT (LC)', target: 'finance', subTab: 'general_ledger' }
      ]
    }
  ];


  // ─────────────────────────────────────────────────────────────
  // STRUCTURED MASTERS SUBMENU (matching live screenshot)
  // ─────────────────────────────────────────────────────────────
  const masterSections = [
    { id: 'company_profile', label: 'COMPANY PROFILE', target: 'masters', subTab: 'company_profile' },
    { id: 'branches', label: 'BRANCH', target: 'masters', subTab: 'branches' },
    { id: 'vendors', label: 'VENDORS', target: 'masters', subTab: 'vendors' },
    { id: 'warehouses', label: 'WAREHOUSE', target: 'masters', subTab: 'warehouses' },
    { id: 'transporters', label: 'TRANSPORTERS', target: 'masters', subTab: 'transporters' },
    { id: 'qc_parties', label: 'QC PARTY', target: 'masters', subTab: 'qc_parties' },
    { id: 'notify_parties', label: 'NOTIFY PARTY', target: 'masters', subTab: 'notify_parties' },
    { id: 'locations', label: 'LOCATION', target: 'masters', subTab: 'locations' },
    { id: 'expense_categories', label: 'EXPENSE CATEGORY', target: 'masters', subTab: 'expense_categories' },
    { id: 'ports', label: 'PORTMASTERS', target: 'masters', subTab: 'ports' },
    { id: 'payees', label: 'PAYMENT PAYEE', target: 'masters', subTab: 'payees' },
    { id: 'banks', label: 'BANKS', target: 'masters', subTab: 'banks' },
    { id: 'modules', label: 'MODULES', target: 'masters', subTab: 'settings' },
    { id: 'countries', label: 'COUNTRY', target: 'masters', subTab: 'countries' },
  ];

  // Other standard menu groups
  const otherMenuGroups = [
    {
      label: 'COMMODITIES & PARTNERS',
      items: [
        { id: 'products', label: 'SPICES & COMMODITIES', icon: Wheat },
        { id: 'buyers', label: 'BUYERS & CLIENTS', icon: Briefcase },
        { id: 'suppliers', label: 'FARMS & SUPPLIERS', icon: Truck },
        { id: 'brokers', label: 'BROKERS NETWORK', icon: UserCheck },
      ]
    },
    {
      label: 'PEOPLE & WORKFORCE',
      items: [
        { id: 'employees', label: 'EMPLOYEE DIRECTORY', icon: Users },
        { id: 'attendance', label: 'ATTENDANCE & LEAVES', icon: Fingerprint },
        { id: 'payroll', label: 'PAYROLL & SALARY SLIPS', icon: Receipt },
        { id: 'assets', label: 'ASSETS MANAGEMENT', icon: Box },
        { id: 'performance', label: 'PERFORMANCE & OKRs', icon: TrendingUp },
        { id: 'recruitment', label: 'RECRUITMENT', icon: Briefcase },
        { id: 'user_mgmt', label: 'IAM ROLES & ACCOUNTS', icon: ShieldCheck },
      ]
    },
    {
      label: 'REPORTS & INTELLIGENCE',
      items: [
        { id: 'reports', label: 'BI & EXPORT REPORTS', icon: BarChart2 },
        { id: 'visits', label: 'CLIENT VISITS & AUDITS', icon: Handshake },
      ]
    },
    {
      label: 'PLANNING & AGENDA',
      items: [
        { id: 'todo', label: 'TODO DASHBOARD', icon: CheckSquare },
        { id: 'calendar', label: 'SCIENTIFIC CALENDAR', icon: Calendar },
        { id: 'my_day', label: 'MY DAY PLANNER', icon: Sun },
      ]
    }
  ];

  // Employee desk menu
  const employeeMenuGroups = [
    {
      label: 'SELF-SERVICE & MY DESK',
      items: [
        { id: 'employee_portal', label: 'MY HOURS & PORTAL', icon: UserCheck },
        { id: 'todo', label: 'TODO DASHBOARD', icon: CheckSquare },
        { id: 'calendar', label: 'MY CALENDAR', icon: Calendar },
        { id: 'my_day', label: 'MY DAY PLANNER', icon: Sun },
      ]
    },
    {
      label: 'WORKFORCE DIRECTORY',
      items: [
        { id: 'employees', label: 'EMPLOYEE DIRECTORY', icon: Users },
      ]
    }
  ];

  const isImportActive = activeTab === 'import_dashboard' || 
    (activeTab === 'procurement' && activeSubTab === 'purchase_orders') ||
    (activeTab === 'operations' && ['executions', 'documents', 'claims'].includes(activeSubTab)) ||
    (activeTab === 'inventory') ||
    (activeTab === 'finance' && ['notes', 'payments'].includes(activeSubTab));

  const isExportActive = (activeTab === 'main') ||
    (activeTab === 'export') ||
    (activeTab === 'finance' && activeSubTab === 'invoices');

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen bg-white border-r border-slate-200 z-50 flex flex-col transition-all duration-300 shadow-sm ${
        isCollapsed ? 'w-[72px]' : 'w-[264px]'
      }`}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & OFFICIAL SOILEX BRAND LOGO
      ───────────────────────────────────────────────────────────── */}
      <div className="h-[68px] flex items-center justify-between px-3.5 border-b border-slate-200 relative bg-white shrink-0">
        <div 
          onClick={() => handleItemClick('main')}
          className="flex items-center space-x-2.5 cursor-pointer overflow-hidden max-w-[210px] group"
        >
          {!imgError ? (
            <img 
              src="/soilex-logo.png" 
              alt="SOILEX Life Science" 
              onError={() => setImgError(true)}
              className="h-10 object-contain max-w-[195px] group-hover:scale-[1.02] transition-transform"
            />
          ) : (
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1E40AF] to-blue-800 text-white flex items-center justify-center font-black text-sm shadow-sm">
                SX
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-base font-black text-[#1E40AF] tracking-tight leading-none">SOILEX</span>
                  <span className="text-[9px] font-bold text-[#D97706] tracking-wider uppercase mt-0.5">LIFE SCIENCE</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Toggle Chevron */}
        <button 
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className="absolute -right-3 top-6 w-6 h-6 bg-[#1E40AF] text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-800 hover:scale-105 transition-all z-10 border border-white"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SCROLLABLE NAVIGATION LINKS & ACCORDION MENUS
      ───────────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4 text-slate-700">
        {isEmployeeRole ? (
          employeeMenuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 py-0.5">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-[#1E40AF] to-blue-800 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-blue-50/80 hover:text-[#1E40AF]'
                    } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-[#FDE68A] scale-110' : 'text-slate-400'}`} />
                    {!isCollapsed && (
                      <span className="ml-3 truncate tracking-tight font-medium">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))
        ) : (
          <>
            {/* ─── DASHBOARDS & WORKSPACE ─────────────────────────── */}
            <div className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 py-0.5">
                  DASHBOARDS
                </p>
              )}
              
              <button
                onClick={() => handleItemClick('main')}
                title={isCollapsed ? 'EXPORT DASHBOARD' : undefined}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'main'
                    ? 'bg-gradient-to-r from-[#1E40AF] to-blue-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-blue-50 hover:text-[#1E40AF]'
                } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
              >
                <Home className={`w-4 h-4 shrink-0 ${activeTab === 'main' ? 'text-[#FDE68A]' : 'text-slate-400'}`} />
                {!isCollapsed && <span className="ml-3 tracking-tight font-medium">EXPORT DASHBOARD</span>}
              </button>

              <button
                onClick={() => handleItemClick('import_dashboard')}
                title={isCollapsed ? 'IMPORT DASHBOARD' : undefined}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'import_dashboard'
                    ? 'bg-gradient-to-r from-[#1E40AF] to-blue-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-blue-50 hover:text-[#1E40AF]'
                } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
              >
                <ShoppingCart className={`w-4 h-4 shrink-0 ${activeTab === 'import_dashboard' ? 'text-[#FDE68A]' : 'text-slate-400'}`} />
                {!isCollapsed && <span className="ml-3 tracking-tight font-medium">IMPORT DASHBOARD</span>}
              </button>

              <button
                onClick={() => handleItemClick('hr_dashboard')}
                title={isCollapsed ? 'HR DASHBOARD' : undefined}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'hr_dashboard' || activeTab === 'hr_dashboard_tab'
                    ? 'bg-gradient-to-r from-[#1E40AF] to-blue-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-blue-50 hover:text-[#1E40AF]'
                } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
              >
                <Users className={`w-4 h-4 shrink-0 ${activeTab === 'hr_dashboard' ? 'text-[#FDE68A]' : 'text-slate-400'}`} />
                {!isCollapsed && <span className="ml-3 tracking-tight font-medium">HR DASHBOARD</span>}
              </button>
            </div>

            {/* ─── TRANSACTION (IMPORT & EXPORT DROPDOWNS) ─────────── */}
            <div className="space-y-1 pt-1">
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 py-0.5">
                  TRANSACTION
                </p>
              )}

              {/* ───────────────────────────────────────────────────
                  IMPORT ACCORDION DROPDOWN
              ─────────────────────────────────────────────────── */}
              <div className="rounded-lg overflow-hidden transition-colors">
                <button
                  onClick={(e) => toggleDropdown('import', e)}
                  title={isCollapsed ? "IMPORT OPERATIONS (Click to expand dropdown)" : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    openDropdowns.import
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : isImportActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <ShoppingCart className={`w-4 h-4 shrink-0 ${openDropdowns.import ? 'text-emerald-200' : 'text-emerald-600'}`} />
                    {!isCollapsed && (
                      <span className="tracking-tight uppercase">IMPORT</span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <div className="p-0.5 rounded hover:bg-white/20 transition-transform">
                      {openDropdowns.import ? (
                        <ChevronDown className="w-3.5 h-3.5 text-white/90" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                      )}
                    </div>
                  )}
                </button>

                {/* Expanded Import Sub-Tree */}
                {!isCollapsed && openDropdowns.import && (
                  <div className="mt-1 pl-2 pr-1 space-y-0.5 border-l-2 border-emerald-200 ml-4 py-1">
                    {importSections.map((sec) => {
                      if (sec.isLeaf) {
                        const isLeafActive = (activeTab === sec.target) && (!sec.subTab || activeSubTab === sec.subTab);
                        return (
                          <button
                            key={sec.id}
                            onClick={() => handleItemClick(sec.target, sec.subTab)}
                            className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                              isLeafActive
                                ? 'bg-emerald-100 text-emerald-900 font-bold border-l-2 border-emerald-600'
                                : 'text-slate-600 hover:bg-emerald-50/60 hover:text-emerald-800'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                            <span className="truncate">{sec.label}</span>
                          </button>
                        );
                      }

                      // Nested category with its own sub-items
                      const isNestedOpen = !!openNested[sec.id];
                      return (
                        <div key={sec.id} className="space-y-0.5">
                          <button
                            onClick={(e) => toggleNested(sec.id, e)}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] font-semibold text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-900 transition-all"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              <span className="tracking-tight">{sec.label}</span>
                            </div>
                            {isNestedOpen ? (
                              <ChevronDown className="w-3 h-3 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                            )}
                          </button>

                          {isNestedOpen && (
                            <div className="pl-4 pr-1 space-y-0.5 border-l border-emerald-100 ml-3">
                              {sec.items.map((sub) => {
                                const isSubActive = (activeTab === sub.target) && (activeSubTab === sub.subTab);
                                return (
                                  <button
                                    key={sub.id}
                                    onClick={() => handleItemClick(sub.target, sub.subTab)}
                                    className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded text-[11px] font-medium transition-all ${
                                      isSubActive
                                        ? 'bg-emerald-100 text-emerald-900 font-bold'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-emerald-800'
                                    }`}
                                  >
                                    <span className={`w-1 h-1 rounded-full ${isSubActive ? 'bg-emerald-600' : 'bg-slate-300'}`}></span>
                                    <span className="truncate">{sub.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ───────────────────────────────────────────────────
                  EXPORT ACCORDION DROPDOWN
              ─────────────────────────────────────────────────── */}
              <div className="rounded-lg overflow-hidden transition-colors mt-1">
                <button
                  onClick={(e) => toggleDropdown('export', e)}
                  title={isCollapsed ? "EXPORT OPERATIONS (Click to expand dropdown)" : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    openDropdowns.export
                      ? 'bg-[#1E40AF] text-white shadow-sm'
                      : isExportActive
                      ? 'bg-blue-50 text-[#1E40AF] border border-blue-200'
                      : 'text-slate-700 hover:bg-blue-50/70 hover:text-[#1E40AF]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <FileText className={`w-4 h-4 shrink-0 ${openDropdowns.export ? 'text-blue-200' : 'text-[#1E40AF]'}`} />
                    {!isCollapsed && (
                      <span className="tracking-tight uppercase">EXPORT</span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <div className="p-0.5 rounded hover:bg-white/20 transition-transform">
                      {openDropdowns.export ? (
                        <ChevronDown className="w-3.5 h-3.5 text-white/90" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                      )}
                    </div>
                  )}
                </button>

                {/* Expanded Export Sub-Tree */}
                {!isCollapsed && openDropdowns.export && (
                  <div className="mt-1 pl-2 pr-1 space-y-0.5 border-l-2 border-blue-200 ml-4 py-1">
                    {exportSections.map((sec) => {
                      if (sec.isLeaf) {
                        const isLeafActive = (activeTab === sec.target) && (!sec.subTab || activeSubTab === sec.subTab);
                        return (
                          <button
                            key={sec.id}
                            onClick={() => handleItemClick(sec.target, sec.subTab)}
                            className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                              isLeafActive
                                ? 'bg-blue-100 text-blue-900 font-bold border-l-2 border-[#1E40AF]'
                                : 'text-slate-600 hover:bg-blue-50/60 hover:text-[#1E40AF]'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1E40AF] shrink-0"></span>
                            <span className="truncate">{sec.label}</span>
                          </button>
                        );
                      }

                      // Nested category with its own sub-items
                      const isNestedOpen = !!openNested[sec.id];
                      return (
                        <div key={sec.id} className="space-y-0.5">
                          <button
                            onClick={(e) => toggleNested(sec.id, e)}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] font-semibold text-slate-700 hover:bg-blue-50/70 hover:text-[#1E40AF] transition-all"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              <span className="tracking-tight">{sec.label}</span>
                            </div>
                            {isNestedOpen ? (
                              <ChevronDown className="w-3 h-3 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                            )}
                          </button>

                          {isNestedOpen && (
                            <div className="pl-4 pr-1 space-y-0.5 border-l border-blue-100 ml-3">
                              {sec.items.map((sub) => {
                                const isSubActive = (activeTab === sub.target) && (activeSubTab === sub.subTab);
                                return (
                                  <button
                                    key={sub.id}
                                    onClick={() => handleItemClick(sub.target, sub.subTab)}
                                    className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded text-[11px] font-medium transition-all ${
                                      isSubActive
                                        ? 'bg-blue-100 text-blue-900 font-bold'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-[#1E40AF]'
                                    }`}
                                  >
                                    <span className={`w-1 h-1 rounded-full ${isSubActive ? 'bg-[#1E40AF]' : 'bg-slate-300'}`}></span>
                                    <span className="truncate">{sub.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>


              {/* ───────────────────────────────────────────────────
                  MASTERS ACCORDION DROPDOWN (matching live screenshot)
              ─────────────────────────────────────────────────── */}
              <div className="rounded-lg overflow-hidden transition-colors mt-1">
                <button
                  onClick={(e) => toggleDropdown('masters', e)}
                  title={isCollapsed ? "MASTERS (Click to expand dropdown)" : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    openDropdowns.masters
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : activeTab === 'masters'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'text-slate-700 hover:bg-emerald-50/70 hover:text-emerald-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <ClipboardList className={`w-4 h-4 shrink-0 ${openDropdowns.masters ? 'text-emerald-200' : 'text-emerald-700'}`} />
                    {!isCollapsed && (
                      <span className="tracking-tight uppercase">MASTERS</span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <div className="p-0.5 rounded hover:bg-white/20 transition-transform">
                      {openDropdowns.masters ? (
                        <ChevronDown className="w-3.5 h-3.5 text-white/90" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                      )}
                    </div>
                  )}
                </button>

                {/* Expanded Masters Sub-Tree matching screenshot */}
                {!isCollapsed && openDropdowns.masters && (
                  <div className="mt-1 pl-2 pr-1 space-y-0.5 border-l-2 border-emerald-200 ml-4 py-1">
                    {masterSections.map((sec) => {
                      const isSecActive = (activeTab === 'masters') && (activeSubTab === sec.subTab);
                      return (
                        <button
                          key={sec.id}
                          onClick={() => handleItemClick(sec.target, sec.subTab)}
                          className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                            isSecActive
                              ? 'bg-emerald-100 text-emerald-950 font-bold border-l-2 border-emerald-700 shadow-2xs'
                              : 'text-slate-600 hover:bg-emerald-50/60 hover:text-emerald-800'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSecActive ? 'bg-emerald-700' : 'bg-slate-400'}`}></span>
                          <span className="truncate tracking-tight">{sec.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Direct TRANSACTIONS link */}
              <button
                onClick={() => handleItemClick('transactions')}
                title={isCollapsed ? 'TRANSACTIONS' : undefined}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-semibold transition-all mt-1 ${
                  activeTab === 'transactions'
                    ? 'bg-gradient-to-r from-[#1E40AF] to-blue-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-blue-50 hover:text-[#1E40AF]'
                } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
              >
                <DollarSign className={`w-4 h-4 shrink-0 ${activeTab === 'transactions' ? 'text-[#FDE68A]' : 'text-slate-400'}`} />
                {!isCollapsed && <span className="ml-3 tracking-tight font-medium">TRANSACTIONS</span>}
              </button>
            </div>

            {/* ─── OTHER SECTIONS (PARTNERS, HR, REPORTS, PLANNING) ─ */}
            {otherMenuGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1 pt-1">
                {!isCollapsed && (
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 py-0.5">
                    {group.label}
                  </p>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      title={isCollapsed ? item.label : undefined}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-[#1E40AF] to-blue-800 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-blue-50/80 hover:text-[#1E40AF]'
                      } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-[#FDE68A] scale-110' : 'text-slate-400'}`} />
                      {!isCollapsed && (
                        <span className="ml-3 truncate tracking-tight font-medium">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </>
        )}
      </nav>

      {/* ─────────────────────────────────────────────────────────────
          3. FOOTER / STATUS INFO
      ───────────────────────────────────────────────────────────── */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2 shrink-0">
          {isEmployeeRole && (
            <div className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-md text-[10px] text-emerald-800 font-bold flex items-center justify-between">
              <span>🔒 IAM: EMPLOYEE</span>
              <span className="uppercase text-[9px] bg-emerald-200/60 px-1.5 py-0.5 rounded font-mono">Min Access</span>
            </div>
          )}
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="font-semibold text-slate-700">soilexlifescience.com</span>
            <span className="flex items-center space-x-1.5 text-[#1E40AF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-ping"></span>
              <span className="font-bold text-[10px] text-[#1E40AF]">ISO 22000 • HACCP</span>
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
