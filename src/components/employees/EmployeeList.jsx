import React, { useState, useEffect } from 'react';
import EmployeeProfile from '../hr/EmployeeProfile';
import { 
  PlusCircle, 
  Filter, 
  Copy, 
  FileSpreadsheet, 
  Search, 
  ArrowUpDown, 
  Plus, 
  Pencil, 
  Folder, 
  Building, 
  Receipt, 
  Gauge,
  Trash2,
  X,
  Users,
  ShieldAlert,
  LogOut
} from 'lucide-react';
import api from '../../services/api';
import DataTable from '../common/DataTable';
import { useAuth } from '../../context/AuthContext';

const FALLBACK_EMPLOYEES = [
  { id: 'EMP-001', employee_code: 'SLX-E01', full_name: 'Vũ Thị Hoan', email: 'hoan.vu@soilexlifescience.com', phone: '+84-908-112233', department: 'Sales & Export', designation: 'Senior Sales Executive', branch: 'Hanoi HQ', shift: 'Morning Shift', join_date: '2023-04-15', status: 'ACTIVE' },
  { id: 'EMP-002', employee_code: 'SLX-E02', full_name: 'Rajesh Sharma', email: 'rajesh.s@soilexlifescience.com', phone: '+91-98401-22334', department: 'Quality Assurance', designation: 'QA Lab Director', branch: 'Kochi Terminal', shift: 'Standard Shift', join_date: '2022-08-01', status: 'ACTIVE' },
  { id: 'EMP-003', employee_code: 'SLX-E03', full_name: 'Nguyễn Văn Hùng', email: 'hung.nguyen@soilexlifescience.com', phone: '+84-912-445566', department: 'Operations & Supply', designation: 'Logistics Supervisor', branch: 'Hai Phong Hub', shift: 'Night Shift', join_date: '2024-01-10', status: 'ACTIVE' },
  { id: 'EMP-004', employee_code: 'SLX-E04', full_name: 'Priya Nair', email: 'priya.n@soilexlifescience.com', phone: '+91-98765-43210', department: 'Human Resources', designation: 'HR Operations Lead', branch: 'Kochi Terminal', shift: 'Morning Shift', join_date: '2023-11-20', status: 'ACTIVE' },
  { id: 'EMP-005', employee_code: 'SLX-E05', full_name: 'Trần Quốc Bảo', email: 'bao.tran@soilexlifescience.com', phone: '+84-983-998877', department: 'Finance & Accounts', designation: 'Senior Trade Accountant', branch: 'Hanoi HQ', shift: 'Morning Shift', join_date: '2021-03-01', status: 'ACTIVE' },
];

const DEPARTMENTS = ['ALL', 'Sales & Export', 'Operations & Supply', 'Quality Assurance', 'Finance & Accounts', 'Human Resources'];

const BRANCHES = ['Hanoi HQ', 'Kochi Terminal', 'Hai Phong Hub', 'Dubai Office'];
const SHIFTS = ['Morning Shift', 'Standard Shift', 'Night Shift', 'General Shift'];

const mapEmployee = (e) => ({
  id: e.id,
  employee_code: e.employee_code || e.code || 'N/A',
  full_name: e.full_name || e.name || 'Unknown',
  email: e.email || '',
  phone: e.phone || '',
  department: e.department || 'General',
  designation: e.designation || 'Staff',
  branch: e.branch || 'Hanoi HQ',
  shift: e.shift || 'Morning Shift',
  join_date: e.join_date || '',
  status: e.status || 'ACTIVE',
});

export default function EmployeeList() {
  const getInitialEmployees = () => {
    let list = [...FALLBACK_EMPLOYEES];
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('soilex_onboarded_employees') : null;
      if (stored) {
        const onboarded = JSON.parse(stored);
        if (Array.isArray(onboarded)) {
          onboarded.forEach(emp => {
            const mapped = mapEmployee(emp);
            if (!list.some(e => e.id === mapped.id || e.employee_code === mapped.employee_code || e.email === mapped.email)) {
              list.unshift(mapped);
            }
          });
        }
      }
    } catch (e) {
      // ignore
    }
    return list;
  };

  const { user } = useAuth();
  const isEmployeeRole = user?.role === 'EMPLOYEE';

  const [searchTerm, setSearchTerm] = useState('');
  const [activeDept, setActiveDept] = useState('ALL');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [employees, setEmployees] = useState(getInitialEmployees);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [profileTab, setProfileTab] = useState('overview');


  const [newEmp, setNewEmp] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: 'Sales & Export',
    designation: '',
    branch: 'Hanoi HQ',
    shift: 'Morning Shift',
    join_date: '',
    role: 'EMPLOYEE',
    password: 'emp123',
  });

  const notify = (type, msg) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  const refreshEmployees = async () => {
    let list = [];
    const data = await api.getEmployees();
    if (data && data.length > 0) {
      list = data.map(mapEmployee);
    } else {
      list = [...FALLBACK_EMPLOYEES];
    }
    try {
      const stored = localStorage.getItem('soilex_onboarded_employees');
      if (stored) {
        const onboarded = JSON.parse(stored);
        if (Array.isArray(onboarded)) {
          onboarded.forEach(emp => {
            const mapped = mapEmployee(emp);
            if (!list.some(e => e.id === mapped.id || e.employee_code === mapped.employee_code || e.email === mapped.email)) {
              list.unshift(mapped);
            }
          });
        }
      }
    } catch (e) {
      console.warn('Failed reading soilex_onboarded_employees:', e);
    }
    setEmployees(list);
  };

  useEffect(() => {
    refreshEmployees();
  }, []);

  const filteredEmployees = employees.filter(emp => {
    const matchesDept = activeDept === 'ALL' || emp.department === activeDept;
    const matchesSearch =
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const displayedEmployees = filteredEmployees.slice(0, entriesPerPage);

  const handleOpenAddModal = async () => {
    try {
      const res = await api.getNextEmployeeCode();
      const code = res?.next_code || `SLX-E0${employees.length + 1}`;
      setNewEmp(prev => ({ ...prev, employee_code: code }));
    } catch {
      setNewEmp(prev => ({ ...prev, employee_code: `SLX-E0${employees.length + 1}` }));
    }
    setShowAddModal(true);
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!newEmp.full_name || !newEmp.email || !newEmp.designation) return;
    setSaving(true);
    try {
      const result = await api.createEmployee({
        employee_code: newEmp.employee_code,
        full_name: newEmp.full_name,
        email: newEmp.email,
        phone: newEmp.phone,
        department: newEmp.department,
        designation: newEmp.designation,
        branch: newEmp.branch,
        shift: newEmp.shift,
        join_date: newEmp.join_date,
        role: newEmp.role || 'EMPLOYEE',
        password: newEmp.password || 'emp123',
      });

      const createdObj = {
        id: result?.id || `EMP-${Date.now().toString().slice(-4)}`,
        employee_code: result?.employee_code || newEmp.employee_code,
        full_name: newEmp.full_name,
        email: newEmp.email,
        phone: newEmp.phone,
        department: newEmp.department,
        designation: newEmp.designation,
        branch: newEmp.branch,
        shift: newEmp.shift,
        join_date: newEmp.join_date,
        status: 'ACTIVE',
      };

      setEmployees(prev => [mapEmployee(createdObj), ...prev.filter(e => e.id !== createdObj.id && e.employee_code !== createdObj.employee_code)]);

      try {
        const stored = JSON.parse(localStorage.getItem('soilex_onboarded_employees') || '[]');
        const updatedStored = [createdObj, ...stored.filter(e => e.id !== createdObj.id && e.employee_code !== createdObj.employee_code)];
        localStorage.setItem('soilex_onboarded_employees', JSON.stringify(updatedStored));
      } catch (err) {}

      notify('success', `${newEmp.full_name} (${createdObj.employee_code}) added to employee directory.`);
      window.dispatchEvent(new CustomEvent('soilex:employee_updated'));
      await refreshEmployees();
      setShowAddModal(false);
      setNewEmp({ employee_code: '', full_name: '', email: '', phone: '', department: 'Sales & Export', designation: '', branch: 'Hanoi HQ', shift: 'Morning Shift', join_date: '', role: 'EMPLOYEE', password: 'emp123' });
    } catch {
      notify('error', 'Failed to add employee.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEmployee = async (id) => {
    setSaving(true);
    try {
      try {
        const stored = localStorage.getItem('soilex_onboarded_employees');
        if (stored) {
          const onboarded = JSON.parse(stored);
          const filtered = onboarded.filter(e => e.id !== id);
          localStorage.setItem('soilex_onboarded_employees', JSON.stringify(filtered));
        }
      } catch {}
      const result = await api._request('DELETE', '/employees/' + id);
      if (result !== null) {
        notify('success', 'Employee removed from directory.');
        await refreshEmployees();
      } else {
        setEmployees(prev => prev.filter(e => e.id !== id));
        notify('success', 'Employee removed locally.');
      }
    } catch {
      setEmployees(prev => prev.filter(e => e.id !== id));
      notify('success', 'Employee removed.');
    } finally {
      setSaving(false);
      setDeleteConfirmId(null);
    }
  };

  const handleOpenEdit = (emp) => {
    setEditEmp({ ...emp });
    setShowEditModal(true);
  };

  const handleEditEmployee = async (e) => {
    e.preventDefault();
    if (!editEmp.full_name || !editEmp.email || !editEmp.designation) return;
    setSaving(true);
    try {
      const payload = {
        employee_code: editEmp.employee_code || editEmp.code,
        full_name: editEmp.full_name,
        email: editEmp.email,
        phone: editEmp.phone,
        department: editEmp.department,
        designation: editEmp.designation,
        branch: editEmp.branch,
        shift: editEmp.shift,
        join_date: editEmp.join_date,
        status: editEmp.status,
      };
      const result = await api.updateEmployee(editEmp.id, payload);
      if (result) {
        notify('success', `${editEmp.full_name} updated successfully.`);
        await refreshEmployees();
      } else {
        // Offline fallback — update locally
        setEmployees(prev => prev.map(e => e.id === editEmp.id ? { ...e, ...payload } : e));
        notify('success', 'Employee updated locally.');
      }
      setShowEditModal(false);
      setEditEmp(null);
    } catch {
      notify('error', 'Failed to update employee.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyTable = () => {
    const headers = ['EMP CODE', 'FULL NAME', 'DEPARTMENT', 'DESIGNATION', 'BRANCH', 'SHIFT', 'JOIN DATE', 'STATUS'];
    const rows = filteredEmployees.map(e => [
      e.employee_code,
      e.full_name,
      e.department,
      e.designation,
      e.branch,
      e.shift,
      e.join_date,
      e.status
    ]);
    const tsv = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsv);
    notify('success', `Copied ${filteredEmployees.length} employee records to clipboard.`);
  };

  const handleExportExcel = () => {
    const headers = ['Employee Code', 'Full Name', 'Email', 'Phone', 'Department', 'Designation', 'Branch', 'Shift', 'Join Date', 'Status'];
    const rows = filteredEmployees.map(e => [
      `"${e.employee_code}"`,
      `"${e.full_name}"`,
      `"${e.email}"`,
      `"${e.phone}"`,
      `"${e.department}"`,
      `"${e.designation}"`,
      `"${e.branch}"`,
      `"${e.shift}"`,
      `"${e.join_date}"`,
      `"${e.status}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soilex_employee_directory_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    notify('success', `Exported ${filteredEmployees.length} employees to CSV.`);
  };



  return (
    <div className="p-6 space-y-6">
      {/* Notification Banner */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg border text-xs font-bold transition-all ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <span>{notification.type === 'success' ? '✓' : '✕'}</span>
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E40AF] flex items-center justify-center border border-blue-200">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-wide uppercase">
              SOILEX EMPLOYEE DIRECTORY
            </h1>
            <p className="text-[11px] text-slate-500">Personnel, Sales, Operations, QA, Finance &amp; HR Teams</p>
          </div>
        </div>

        {/* Top Action Icons */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setActiveDept('ALL')}
            title="Reset Filters / Show All Departments"
            className="w-9 h-9 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-md flex items-center justify-center shadow-sm transition-colors"
          >
            <Filter className="w-4 h-4" />
          </button>
          <button 
            onClick={handleCopyTable}
            title="Copy Table to Clipboard"
            className="w-9 h-9 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-md flex items-center justify-center shadow-sm transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button 
            onClick={handleExportExcel}
            title="Export Employee Directory to CSV Spreadsheet"
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-md shadow-sm transition-colors uppercase tracking-wider"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>EXPORT CSV</span>
          </button>
          {!isEmployeeRole && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#FDE68A]" />
              <span>ADD EMPLOYEE</span>
            </button>
          )}
        </div>
      </div>

      {/* ── IAM Security & Access Policy Pill ── */}
      {isEmployeeRole && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
              🔒
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-950">IAM Policy: EMPLOYEE · Minimum Level Access Control Active</span>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Workforce directory is in Read-Only Static Details mode. Administrative operations, document generation, and compensation records are restricted under least privilege.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-emerald-200/60 text-emerald-800 border border-emerald-300 w-fit shrink-0">
            Static Details Mode
          </span>
        </div>
      )}

      {/* Main Table Container Card */}
      <DataTable
        columns={[
          {
            key: 'employee_code',
            header: 'EMP CODE',
            render: (val, emp) => (
              <button
                onClick={() => { setSelectedEmployee(emp); setProfileTab('overview'); }}
                className="font-mono font-bold text-[#1E40AF] hover:underline"
              >
                {val}
              </button>
            )
          },
          {
            key: 'full_name',
            header: 'FULL NAME',
            render: (val, emp) => (
              <span
                onClick={() => { setSelectedEmployee(emp); setProfileTab('overview'); }}
                className="font-bold text-slate-900 cursor-pointer hover:text-blue-700"
              >
                {val}
              </span>
            )
          },
          {
            key: 'department',
            header: 'DEPARTMENT',
            render: (val) => <span className="text-slate-600 font-medium">{val}</span>
          },
          {
            key: 'designation',
            header: 'DESIGNATION',
            render: (val) => <span className="font-semibold text-slate-800">{val}</span>
          },
          {
            key: 'branch',
            header: 'BRANCH',
            render: (val) => <span className="text-slate-500">{val}</span>
          },
          {
            key: 'shift',
            header: 'SHIFT',
            render: (val) => (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold border border-slate-200">
                {val}
              </span>
            )
          },
          {
            key: 'join_date',
            header: 'JOIN DATE',
            render: (val) => <span className="font-mono text-slate-500 text-xs">{val}</span>
          },
          {
            key: 'status',
            header: 'STATUS',
            align: 'center',
            render: (val) => (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                val === 'ACTIVE'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}>
                {val}
              </span>
            )
          },
          {
            key: 'actions',
            header: 'ACTIONS',
            sortable: false,
            align: 'center',
            render: (_, emp) => (
              isEmployeeRole ? (
                <button
                  onClick={() => { setSelectedEmployee(emp); setProfileTab('overview'); }}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#1E40AF] border border-blue-200 rounded text-[11px] font-bold transition-colors inline-flex items-center space-x-1 shadow-xs"
                  title="View static details for this employee"
                >
                  <span>👁️</span>
                  <span>Static Details</span>
                </button>
              ) : (
                <div className="flex items-center justify-center space-x-1">
                  <button 
                    onClick={() => handleOpenEdit(emp)} 
                    title="Edit Employee Profile" 
                    className="p-1.5 hover:bg-amber-100 rounded text-[#D97706] transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => { setSelectedEmployee(emp); setProfileTab('onboarding'); }}
                    title="View Documents & Onboarding Checklist" 
                    className="p-1.5 hover:bg-blue-100 rounded text-[#1E40AF] transition-colors"
                  >
                    <Folder className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => { setSelectedEmployee(emp); setProfileTab('payroll'); }}
                    title="Banking & Salary Details" 
                    className="p-1.5 hover:bg-blue-100 rounded text-[#1E40AF] transition-colors"
                  >
                    <Building className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => { setSelectedEmployee(emp); setProfileTab('payroll'); }}
                    title="Salary Slips & Disbursals" 
                    className="p-1.5 hover:bg-amber-100 rounded text-[#D97706] transition-colors"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => { setSelectedEmployee(emp); setProfileTab('compliance'); }}
                    title="Food Safety & Health (ISO 22000)" 
                    className="p-1.5 hover:bg-emerald-100 rounded text-emerald-600 transition-colors"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => { setSelectedEmployee(emp); setProfileTab('exit'); }}
                    title="Exit Clearance & F&F Settlement" 
                    className="p-1.5 hover:bg-amber-100 rounded text-amber-700 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                  {deleteConfirmId === emp.id ? (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleDeleteEmployee(emp.id)}
                        disabled={saving}
                        className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700 disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-1 border border-slate-200 text-slate-600 rounded text-[10px] font-bold hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(emp.id)}
                      title="Delete Employee"
                      className="p-1.5 hover:bg-red-100 rounded text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )
            )
          }
        ]}
        data={filteredEmployees}
        title="Enterprise_Workforce_Directory"
        searchPlaceholder="Search employee name, code, department, branch..."
        onAdd={!isEmployeeRole ? handleOpenAddModal : null}
        addLabel="+ Add Employee"
        actions={
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {DEPARTMENTS.map(dept => (
              <button
                key={dept}
                onClick={() => setActiveDept(dept)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  activeDept === dept
                    ? 'bg-[#1E40AF] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        }
      />


      {/* Edit Employee Modal */}
      {showEditModal && editEmp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase">Edit Employee</h3>
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{editEmp.employee_code}</p>
              </div>
              <button onClick={() => { setShowEditModal(false); setEditEmp(null); }} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditEmployee} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editEmp.full_name}
                    onChange={(e) => setEditEmp({ ...editEmp, full_name: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={editEmp.email}
                    onChange={(e) => setEditEmp({ ...editEmp, email: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={editEmp.phone}
                    onChange={(e) => setEditEmp({ ...editEmp, phone: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Department</label>
                  <select
                    value={editEmp.department}
                    onChange={(e) => setEditEmp({ ...editEmp, department: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  >
                    {DEPARTMENTS.filter(d => d !== 'ALL').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Designation *</label>
                  <input
                    type="text"
                    required
                    value={editEmp.designation}
                    onChange={(e) => setEditEmp({ ...editEmp, designation: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Branch</label>
                  <select
                    value={editEmp.branch}
                    onChange={(e) => setEditEmp({ ...editEmp, branch: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  >
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Shift</label>
                  <select
                    value={editEmp.shift}
                    onChange={(e) => setEditEmp({ ...editEmp, shift: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  >
                    {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={editEmp.status}
                    onChange={(e) => setEditEmp({ ...editEmp, status: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="ON_LEAVE">ON LEAVE</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Join Date</label>
                  <input
                    type="date"
                    value={editEmp.join_date}
                    onChange={(e) => setEditEmp({ ...editEmp, join_date: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => { setShowEditModal(false); setEditEmp(null); }} className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-[#D97706] text-white rounded-md text-xs font-semibold hover:bg-[#B45309] shadow-sm disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase">Add New Employee</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 block">Employee Code *</label>
                    <span className="text-[10px] text-[#1E40AF] font-bold">Auto-assigned sequential ID</span>
                  </div>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. SLX-E06"
                    value={newEmp.employee_code || ''}
                    onChange={(e) => setNewEmp({ ...newEmp, employee_code: e.target.value })}
                    className="w-full bg-blue-50/40 border border-blue-200 rounded-md px-3 py-2 text-xs font-mono font-bold text-[#1E40AF] focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Nguyen Van An"
                    value={newEmp.full_name}
                    onChange={(e) => setNewEmp({ ...newEmp, full_name: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email *</label>
                  <input 
                    type="email"
                    required
                    placeholder="name@soilexlifescience.com"
                    value={newEmp.email}
                    onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phone</label>
                  <input 
                    type="text"
                    placeholder="+84-xxx-xxxxxx"
                    value={newEmp.phone}
                    onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Department</label>
                  <select 
                    value={newEmp.department}
                    onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  >
                    {DEPARTMENTS.filter(d => d !== 'ALL').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Designation *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Sales Executive"
                    value={newEmp.designation}
                    onChange={(e) => setNewEmp({ ...newEmp, designation: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Branch</label>
                  <select 
                    value={newEmp.branch}
                    onChange={(e) => setNewEmp({ ...newEmp, branch: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  >
                    {BRANCHES.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Shift</label>
                  <select 
                    value={newEmp.shift}
                    onChange={(e) => setNewEmp({ ...newEmp, shift: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  >
                    {SHIFTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Join Date</label>
                  <input 
                    type="date"
                    value={newEmp.join_date}
                    onChange={(e) => setNewEmp({ ...newEmp, join_date: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  />
                </div>

                <div className="col-span-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 block">IAM Login Role *</label>
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Reflects in User Switcher</span>
                  </div>
                  <select 
                    value={newEmp.role || 'EMPLOYEE'}
                    onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-bold text-slate-800"
                  >
                    <option value="EMPLOYEE">EMPLOYEE (Standard User — Personal Self-Service Portal)</option>
                    <option value="HR_MANAGER">HR_MANAGER (Human Resources & People Operations)</option>
                    <option value="ADMIN">ADMIN (Executive Full ERP Access)</option>
                    <option value="QUALITY_MANAGER">QUALITY_MANAGER (QA & Food Safety Lab)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Initial Login Password</label>
                  <input 
                    type="text"
                    placeholder="emp123"
                    value={newEmp.password || 'emp123'}
                    onChange={(e) => setNewEmp({ ...newEmp, password: e.target.value })}
                    className="w-full bg-slate-50 border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-mono text-slate-700"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Default credentials: emp123 (allows instant testing via IAM User Switcher)</p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1E40AF] text-white rounded-md text-xs font-semibold hover:bg-blue-800 shadow-sm disabled:opacity-60">
                  {saving ? 'Saving...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Employee 360° Profile Slide-in Panel ── */}
      {selectedEmployee && (
        <EmployeeProfile
          employee={selectedEmployee}
          initialTab={isEmployeeRole ? 'overview' : profileTab}
          onClose={() => setSelectedEmployee(null)}
          onEditRequest={isEmployeeRole ? null : (emp) => {
            setSelectedEmployee(null);
            handleOpenEdit(emp);
          }}
        />
      )}
    </div>
  );
}
