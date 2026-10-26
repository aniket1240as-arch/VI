import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronDown, 
  Clock, 
  Bell, 
  Wheat, 
  Phone, 
  LogOut,
  UserCheck,
  Shield,
  Sparkles,
  Building,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const DEFAULT_ACCOUNTS = [
  { label: 'Admin (Executive)', email: 'admin@soilexlifescience.com', role: 'ADMIN' },
  { label: 'Priya Nair (HR Manager)', email: 'priya.n@soilexlifescience.com', role: 'HR_MANAGER' },
  { label: 'Vũ Thị Hoan (Sales Emp)', email: 'hoan.vu@soilexlifescience.com', role: 'EMPLOYEE' },
  { label: 'Rajesh Sharma (QA Director)', email: 'rajesh.s@soilexlifescience.com', role: 'QUALITY_MANAGER' },
  { label: 'Nguyễn Văn Hùng (Ops Emp)', email: 'hung.nguyen@soilexlifescience.com', role: 'EMPLOYEE' },
  { label: 'Trần Quốc Bảo (Finance Emp)', email: 'bao.tran@soilexlifescience.com', role: 'EMPLOYEE' },
];

export default function Navbar({ currentModule, onSelectModule, isSidebarCollapsed }) {
  const { user, switchUser, logout } = useAuth();
  const [timerRunning, setTimerRunning] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [availableAccounts, setAvailableAccounts] = useState(DEFAULT_ACCOUNTS);
  const [isSwitching, setIsSwitching] = useState(false);

  // Load live IAM users & employees from backend
  const loadUsers = useCallback(async () => {
    try {
      const data = await api.getAvailableUsers();
      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map(u => {
          let roleLabel = 'Employee';
          if (u.role === 'ADMIN') roleLabel = 'Executive Admin';
          else if (u.role === 'HR_MANAGER') roleLabel = 'HR Manager';
          else if (u.role === 'QUALITY_MANAGER') roleLabel = 'QA Director';
          else roleLabel = `${u.department || 'Staff'} Emp`;

          const codeSuffix = u.employee_code ? ` [${u.employee_code}]` : '';
          return {
            label: `${u.name} (${roleLabel})${codeSuffix}`,
            email: u.email,
            role: u.role,
            name: u.name,
            department: u.department
          };
        });
        setAvailableAccounts(formatted);
      }
    } catch {
      // Keep defaults
    }
  }, []);

  useEffect(() => {
    loadUsers();

    // Listen for employee additions or updates anywhere in the app
    const handleUpdate = () => loadUsers();
    window.addEventListener('soilex:employee_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('soilex:employee_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadUsers]);

  const handleSwitchAccount = async (e) => {
    const targetEmail = e.target.value;
    if (!targetEmail || targetEmail === user?.email) return;

    setIsSwitching(true);
    try {
      const res = await switchUser(targetEmail);
      if (res?.success) {
        if (res.user?.role === 'EMPLOYEE') {
          onSelectModule('employee_portal');
        } else {
          onSelectModule('main');
        }
      }
    } finally {
      setIsSwitching(false);
    }
  };

  useEffect(() => {
    let interval = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (!timerRunning && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerRunning, seconds]);

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const displayName = user?.fullName?.toUpperCase() || user?.name?.toUpperCase() || user?.email?.split('@')[0]?.toUpperCase() || 'SOILEX ADMIN';

  return (
    <header className="sticky top-0 z-40 h-[68px] bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all">
      {/* ─────────────────────────────────────────────────────────────
          LEFT: MODULE BREADCRUMB & COMMODITY CONTEXT
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center space-x-3">
        {/* Module Pill */}
        <div className="relative group">
          <div className="flex items-center space-x-2 bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] text-white text-xs font-bold uppercase px-3.5 py-2 rounded-lg shadow-sm border border-blue-900/20">
            <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse"></span>
            <span className="tracking-wide">{currentModule || 'EXECUTIVE OVERVIEW'}</span>
          </div>
        </div>

        {/* Commodity Category Dropdown */}
        <div className="relative hidden md:block">
          <select 
            aria-label="Commodities & Spices Category"
            className="text-xs uppercase font-semibold text-slate-700 bg-slate-50/80 hover:bg-slate-100/70 border border-slate-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] cursor-pointer appearance-none shadow-xs transition-colors"
          >
            <option>ALL COMMODITIES & SPICES</option>
            <option>WHOLE SPICES (EXPORT & IMPORT)</option>
            <option>PERFUMED RICE & GRAINS (DT 8)</option>
            <option>INDIAN AROMATIC TEA (DOOARS)</option>
            <option>FEED MEALS (RICE/CORN DDGS)</option>
            <option>GLOBAL CONTAINER SHIPMENTS</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Fiscal Year Selector */}
        <div className="relative hidden lg:block">
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            aria-label="Fiscal Year"
            className="text-xs font-bold text-slate-700 bg-slate-50/80 hover:bg-slate-100/70 border border-slate-200 rounded-lg px-3 py-2 pr-7 focus:outline-none focus:border-[#1E40AF] cursor-pointer appearance-none shadow-xs transition-colors"
          >
            <option value="2026">FY 2026-27</option>
            <option value="2025">FY 2025-26</option>
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT: DYNAMIC IAM SWITCHER, TIMER, PROFILE & ACTIONS
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Live session timer with toggle */}
        <div className="hidden sm:flex items-center space-x-2 bg-slate-50/90 border border-slate-200/80 rounded-full px-3 py-1 shadow-xs">
          <button 
            onClick={() => setTimerRunning(!timerRunning)}
            title="Toggle Live Session Timer"
            className={`w-7 h-3.5 flex items-center rounded-full p-0.5 transition-colors ${timerRunning ? 'bg-[#1E40AF]' : 'bg-slate-300'}`}
          >
            <div className={`bg-white w-2.5 h-2.5 rounded-full shadow transform transition-transform ${timerRunning ? 'translate-x-3.5' : 'translate-x-0'}`} />
          </button>
          <span className="font-mono text-xs font-semibold text-slate-700 select-none">
            {formatTime(seconds)}
          </span>
        </div>

        {/* Dynamic IAM Role Switcher */}
        <div className="relative">
          <select
            value={user?.email || 'admin@soilexlifescience.com'}
            onChange={handleSwitchAccount}
            disabled={isSwitching}
            aria-label="Switch IAM Login Role"
            className="text-xs font-bold text-slate-900 bg-gradient-to-r from-blue-50 to-amber-50/40 hover:from-blue-100/70 hover:to-amber-100/50 border border-blue-200/90 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] cursor-pointer appearance-none shadow-xs transition-all max-w-[210px] sm:max-w-none truncate"
          >
            {availableAccounts.map(acc => (
              <option key={acc.email} value={acc.email}>
                Switch: {acc.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#1E40AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Logged-in User Chip with Role Badge */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-slate-50/80 border border-slate-200/80 rounded-lg shadow-xs">
          <span className="text-xs uppercase font-bold text-slate-800 tracking-wide">{displayName}</span>
          {user?.role && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
              user.role === 'ADMIN'
                ? 'bg-blue-100/80 text-[#1E40AF] border-blue-200'
                : user.role === 'HR_MANAGER'
                ? 'bg-amber-100/80 text-amber-900 border-amber-200'
                : user.role === 'QUALITY_MANAGER'
                ? 'bg-sky-100/80 text-sky-900 border-sky-200'
                : 'bg-emerald-100/80 text-emerald-900 border-emerald-200'
            }`}>
              {user.role === 'EMPLOYEE' ? 'EMPLOYEE (PORTAL)' : user.role}
            </span>
          )}
        </div>

        {/* User avatar with status indicator */}
        <div 
          onClick={() => onSelectModule(user?.role === 'EMPLOYEE' ? 'employee_portal' : 'main')}
          className="relative flex items-center cursor-pointer group"
          title="Profile & Workspace"
        >
          <div className="w-8 h-8 rounded-full border-2 border-[#1E40AF] bg-white p-0.5 shadow-sm overflow-hidden flex items-center justify-center font-black text-xs text-[#1E40AF]">
            <img 
              src="/favicon.png" 
              alt="User" 
              className="w-full h-full object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#D97706] border-2 border-white rounded-full"></span>
        </div>

        {/* Notification Bell */}
        <button 
          title="Enterprise Notifications"
          className="relative p-2 text-slate-500 hover:text-[#1E40AF] hover:bg-blue-50/70 rounded-lg transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-[#D97706] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
            3
          </span>
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          title="Sign Out"
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50/80 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
