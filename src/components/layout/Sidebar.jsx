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
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ activeTab, onSelectTab, isCollapsed, onToggleCollapse }) {
  const [imgError, setImgError] = useState(false);
  const { user } = useAuth();
  const isEmployeeRole = user?.role === 'EMPLOYEE';

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

  const menuGroups = [
    {
      label: 'DASHBOARDS & WORKSPACE',
      items: [
        { id: 'main', label: 'EXECUTIVE OVERVIEW', icon: Home },
        { id: 'employee_portal', label: 'MY HOURS & PORTAL', icon: UserCheck },
        { id: 'hr_dashboard', label: 'HR DASHBOARD', icon: Users },
      ]
    },
    {
      label: 'GLOBAL TRADE & OPERATIONS',
      items: [
        { id: 'export', label: 'EXPORT OPERATIONS', icon: FileText, hasSubmenu: true },
        { id: 'procurement', label: 'PROCUREMENT & PO', icon: ShoppingCart, hasSubmenu: true },
        { id: 'finance', label: 'FINANCE & GL', icon: BookOpen, hasSubmenu: true },
        { id: 'import', label: 'RAW PROCUREMENT', icon: Truck, hasSubmenu: true },
        { id: 'transactions', label: 'TRADE TRANSACTIONS', icon: DollarSign, hasSubmenu: true },
      ]
    },
    {
      label: 'COMMODITIES & PARTNERS',
      items: [
        { id: 'products', label: 'SPICES & COMMODITIES', icon: Wheat },
        { id: 'buyers', label: 'BUYERS & CLIENTS', icon: Briefcase },
        { id: 'suppliers', label: 'FARMS & SUPPLIERS', icon: Truck },
        { id: 'brokers', label: 'BROKERS NETWORK', icon: UserCheck },
        { id: 'masters', label: 'SYSTEM MASTERS', icon: Layers },
      ]
    },
    {
      label: 'PEOPLE & WORKFORCE',
      items: [
        { id: 'employees', label: 'EMPLOYEE DIRECTORY', icon: Users, hasSubmenu: true },
        { id: 'attendance', label: 'ATTENDANCE & LEAVES', icon: Fingerprint, hasSubmenu: true },
        { id: 'payroll', label: 'PAYROLL & SALARY SLIPS', icon: Receipt, hasSubmenu: true },
        { id: 'performance', label: 'PERFORMANCE & OKRs', icon: TrendingUp },
        { id: 'recruitment', label: 'RECRUITMENT', icon: Briefcase },
        { id: 'user_mgmt', label: 'IAM ROLES & ACCOUNTS', icon: ShieldCheck },
      ]
    },
    {
      label: 'REPORTS & INTELLIGENCE',
      items: [
        { id: 'reports', label: 'BI & EXPORT REPORTS', icon: BarChart2, hasSubmenu: true },
        { id: 'visits', label: 'CLIENT VISITS & AUDITS', icon: Handshake, hasSubmenu: true },
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

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen bg-white/95 backdrop-blur-md border-r border-slate-200/90 z-50 flex flex-col transition-all duration-300 shadow-[1px_0_4px_rgba(0,0,0,0.03)] ${
        isCollapsed ? 'w-[72px]' : 'w-[264px]'
      }`}
    >
      {/* Top Header & Official Soilex Brand Logo */}
      <div className="h-[68px] flex items-center justify-between px-3.5 border-b border-slate-200/80 relative bg-white">
        <div 
          onClick={() => onSelectTab('main')}
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

      {/* Navigation Links with Modern Scroll & Active Highlights */}
      <nav className="flex-1 overflow-y-auto py-3.5 px-2.5 space-y-4">
        {(isEmployeeRole ? employeeMenuGroups : menuGroups).map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/90 py-0.5">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#1E40AF] to-blue-800 text-white shadow-sm shadow-blue-900/10'
                      : 'text-slate-600 hover:bg-blue-50/80 hover:text-[#1E40AF]'
                  } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-[#FDE68A] scale-110' : 'text-slate-400 group-hover:text-[#1E40AF]'}`} />
                    {!isCollapsed && (
                      <span className="truncate tracking-tight font-medium">{item.label}</span>
                    )}
                  </div>
                  {!isCollapsed && item.hasSubmenu && (
                    <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer / Status Info */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/70 space-y-2">
          {isEmployeeRole && (
            <div className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-md text-[10px] text-emerald-800 font-bold flex items-center justify-between">
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
