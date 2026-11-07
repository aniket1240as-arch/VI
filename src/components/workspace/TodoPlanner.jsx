import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CheckSquare,
  Sun,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  Trash2,
  X,
  User,
  Users,
  Filter,
  Calendar,
  Sparkles,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronRight,
  MapPin,
  ArrowRight,
  Tag,
  ListTodo,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  MessageSquare,
  History,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Send,
  Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ─── Constants & Categories ──────────────────────────────────────────────────
const CATEGORIES = ['ALL', 'Operations', 'Compliance', 'HR & Payroll', 'Maintenance', 'Finance'];
const PRIORITY_OPTIONS = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
const CATEGORY_OPTIONS = ['Operations', 'Compliance', 'HR & Payroll', 'Maintenance', 'Finance'];
const TIME_SLOT_OPTIONS = [
  'Morning Focus (08:30 - 12:00)',
  'Afternoon Operations (12:00 - 15:30)',
  'Wrap-up & Audits (15:30 - 18:00)',
];

const HOLD_REASONS = [
  'Awaiting Client / Buyer Response',
  'Awaiting 3rd Party / Vendor Documents',
  'Blocked by Upstream Dependency',
  'Awaiting Management / Regulatory Approval',
  'Resource & Testing Constraint',
  'Other / Pending Inquiry'
];

const RESOLUTION_CODES = [
  'Solved / Work Completed',
  'Delivered as Requested',
  'Customs / Inspection Cleared',
  'Resolved with Workaround'
];

// ─── Fallback Employees Directory ─────────────────────────────────────────────
const FALLBACK_EMPLOYEES = [
  { id: 'EMP-001', employee_code: 'SLX-E01', full_name: 'Vũ Thị Hoan', email: 'hoan.vu@soilexlifescience.com', phone: '+84-908-112233', department: 'Sales & Export', designation: 'Senior Sales Executive', branch: 'Hanoi HQ' },
  { id: 'EMP-002', employee_code: 'SLX-E02', full_name: 'Rajesh Sharma', email: 'rajesh.s@soilexlifescience.com', phone: '+91-98401-22334', department: 'Quality Assurance', designation: 'QA Lab Director', branch: 'Kochi Terminal' },
  { id: 'EMP-003', employee_code: 'SLX-E03', full_name: 'Nguyễn Văn Hùng', email: 'hung.nguyen@soilexlifescience.com', phone: '+84-912-445566', department: 'Operations & Supply', designation: 'Logistics Supervisor', branch: 'Hai Phong Hub' },
  { id: 'EMP-004', employee_code: 'SLX-E04', full_name: 'Priya Nair', email: 'priya.n@soilexlifescience.com', phone: '+91-98765-43210', department: 'Human Resources', designation: 'HR Operations Lead', branch: 'Kochi Terminal' },
  { id: 'EMP-005', employee_code: 'SLX-E05', full_name: 'Trần Quốc Bảo', email: 'bao.tran@soilexlifescience.com', phone: '+84-983-998877', department: 'Finance & Accounts', designation: 'Senior Trade Accountant', branch: 'Hanoi HQ' },
];

// ─── Status Helpers (ServiceNow & Jira Lifecycle) ─────────────────────────────
function normalizeStatus(task) {
  if (task.status) return task.status.toUpperCase();
  if (task.completed) return 'COMPLETED';
  return 'ASSIGNED';
}

function statusBadge(task) {
  const s = normalizeStatus(task);
  if (s === 'ASSIGNED') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#1E40AF] border border-blue-200 uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-[#1E40AF] animate-pulse"></span>
        <span>ASSIGNED</span>
      </span>
    );
  }
  if (s === 'IN_PROGRESS') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        <span>IN PROGRESS</span>
      </span>
    );
  }
  if (s === 'ON_HOLD') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
        <span>ON HOLD</span>
      </span>
    );
  }
  if (s === 'COMPLETED' || s === 'CLOSED') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        <span>COMPLETED</span>
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
      {s}
    </span>
  );
}

function priorityBadge(priority) {
  const p = (priority || '').toUpperCase();
  const cls =
    p === 'URGENT'
      ? 'bg-red-100 text-red-700 border-red-300 font-black'
      : p === 'HIGH'
      ? 'bg-amber-100 text-amber-800 border-amber-300'
      : p === 'MEDIUM'
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${cls}`}>
      {priority}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TodoPlanner({ isMyDay = false }) {
  const { user } = useAuth();
  const isEmployeeRole = user?.role === 'EMPLOYEE';
  const currentUserDisplayName = user?.fullName || user?.name || user?.email?.split('@')[0] || 'Staff User';

  const [employees, setEmployees] = useState(FALLBACK_EMPLOYEES);

  // Resolve active employee ID
  const defaultEmpId = useMemo(() => {
    if (user?.employee_id) return user.employee_id;
    const match = employees.find(e => e.email?.toLowerCase() === user?.email?.toLowerCase());
    return match ? match.id : 'EMP-001';
  }, [user, employees]);

  const [selectedEmpId, setSelectedEmpId] = useState(defaultEmpId);

  useEffect(() => {
    if (defaultEmpId) setSelectedEmpId(defaultEmpId);
  }, [defaultEmpId]);

  const activeEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedEmpId) || employees[0];
  }, [employees, selectedEmpId]);

  // Tasks state & filters
  const [tasks, setTasks] = useState([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ASSIGNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED'
  const [timeSlotFilter, setTimeSlotFilter] = useState('ALL');
  const [filterEmployeeId, setFilterEmployeeId] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  // Modals & Drawers
  const [showAddModal, setShowAddModal] = useState(false);
  const [holdTargetTask, setHoldTargetTask] = useState(null); // When opening Hold Modal
  const [closeTargetTask, setCloseTargetTask] = useState(null); // When opening Close Modal
  const [activeDrawerTask, setActiveDrawerTask] = useState(null); // Jira Ticket Details Drawer

  // Hold Modal Form State
  const [holdReason, setHoldReason] = useState(HOLD_REASONS[0]);
  const [holdComments, setHoldComments] = useState('');

  // Close Modal Form State
  const [resolutionCode, setResolutionCode] = useState(RESOLUTION_CODES[0]);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Drawer Comment Form State
  const [drawerComment, setDrawerComment] = useState('');

  // New Task Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Operations');
  const [newPriority, setNewPriority] = useState('HIGH');
  const [newDue, setNewDue] = useState(new Date().toISOString().split('T')[0]);
  const [newTimeSlot, setNewTimeSlot] = useState('Morning Focus (08:30 - 12:00)');
  const [newAssignedTo, setNewAssignedTo] = useState(activeEmployee?.full_name || 'Vũ Thị Hoan');
  const [newAssignedBy, setNewAssignedBy] = useState(user?.role === 'ADMIN' ? 'Admin (Executive)' : currentUserDisplayName);
  const [newNotes, setNewNotes] = useState('');

  // Sync newAssignedTo
  useEffect(() => {
    if (activeEmployee) {
      setNewAssignedTo(activeEmployee.full_name);
    }
  }, [activeEmployee]);

  // Load employee master
  useEffect(() => {
    api.getEmployees().then(res => {
      if (res && Array.isArray(res) && res.length > 0) {
        setEmployees(res);
      }
    }).catch(() => {});
  }, []);

  const notify = (type, msg) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  // ─── Fetch Tasks from API ──────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      let filterParam = null;
      if (isMyDay) {
        filterParam = activeEmployee.full_name;
      } else if (filterEmployeeId !== 'ALL') {
        const emp = employees.find(e => e.id === filterEmployeeId);
        filterParam = emp ? emp.full_name : filterEmployeeId;
      }

      const res = await api.getTasks(activeCategory, filterParam);
      if (res && Array.isArray(res)) {
        setTasks(res);
      }
    } catch {
      // Keep existing
    } finally {
      setLoading(false);
    }
  }, [isMyDay, activeEmployee, activeCategory, filterEmployeeId, employees]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ─── State Machine Workflow Actions ─────────────────────────────────────────

  // 1. Accept Task (ASSIGNED -> IN_PROGRESS)
  const handleAcceptTask = async (task) => {
    try {
      const res = await api.updateTaskStatus(task.id, {
        status: 'IN_PROGRESS',
        user: currentUserDisplayName,
        comment: `Task accepted by ${currentUserDisplayName}. Work started.`
      });
      if (res) {
        notify('success', `Ticket ${task.id} Accepted! Status moved to In Progress.`);
        await fetchTasks();
        if (activeDrawerTask && activeDrawerTask.id === task.id) {
          setActiveDrawerTask(res);
        }
      }
    } catch (e) {
      notify('error', 'Failed to update task status.');
    }
  };

  // 2. Resume Task (ON_HOLD -> IN_PROGRESS)
  const handleResumeTask = async (task) => {
    try {
      const res = await api.updateTaskStatus(task.id, {
        status: 'IN_PROGRESS',
        user: currentUserDisplayName,
        comment: `Task resumed from Hold by ${currentUserDisplayName}.`
      });
      if (res) {
        notify('success', `Ticket ${task.id} Resumed! Moved to In Progress.`);
        await fetchTasks();
        if (activeDrawerTask && activeDrawerTask.id === task.id) {
          setActiveDrawerTask(res);
        }
      }
    } catch {
      notify('error', 'Failed to resume task.');
    }
  };

  // 3. Confirm Put on Hold (Any -> ON_HOLD with mandatory comments)
  const handleConfirmHold = async (e) => {
    e.preventDefault();
    if (!holdComments.trim()) {
      notify('error', 'Hold comments are mandatory as per ServiceNow protocol.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.updateTaskStatus(holdTargetTask.id, {
        status: 'ON_HOLD',
        hold_reason: holdReason,
        hold_comments: holdComments.trim(),
        user: currentUserDisplayName,
        comment: holdComments.trim()
      });
      if (res) {
        notify('success', `Ticket ${holdTargetTask.id} placed ON HOLD with reason: ${holdReason}`);
        setHoldTargetTask(null);
        setHoldComments('');
        await fetchTasks();
        if (activeDrawerTask && activeDrawerTask.id === holdTargetTask.id) {
          setActiveDrawerTask(res);
        }
      }
    } catch {
      notify('error', 'Failed to put task on hold.');
    } finally {
      setSaving(false);
    }
  };

  // 4. Confirm Complete & Close (Any -> COMPLETED with resolution notes)
  const handleConfirmClose = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const notes = resolutionNotes.trim() || `Closed with code: ${resolutionCode}`;
      const res = await api.updateTaskStatus(closeTargetTask.id, {
        status: 'COMPLETED',
        resolution_notes: notes,
        user: currentUserDisplayName,
        comment: `Ticket resolved: ${notes}`
      });
      if (res) {
        notify('success', `Ticket ${closeTargetTask.id} Closed & Completed successfully!`);
        setCloseTargetTask(null);
        setResolutionNotes('');
        await fetchTasks();
        if (activeDrawerTask && activeDrawerTask.id === closeTargetTask.id) {
          setActiveDrawerTask(res);
        }
      }
    } catch {
      notify('error', 'Failed to close task.');
    } finally {
      setSaving(false);
    }
  };

  // 5. Reopen Task (COMPLETED -> IN_PROGRESS)
  const handleReopenTask = async (task) => {
    try {
      const res = await api.updateTaskStatus(task.id, {
        status: 'REOPENED',
        user: currentUserDisplayName,
        comment: `Ticket reopened by ${currentUserDisplayName} for additional work.`
      });
      if (res) {
        notify('success', `Ticket ${task.id} Reopened! Moved back to In Progress.`);
        await fetchTasks();
        if (activeDrawerTask && activeDrawerTask.id === task.id) {
          setActiveDrawerTask(res);
        }
      }
    } catch {
      notify('error', 'Failed to reopen task.');
    }
  };

  // 6. Add Drawer Work Note / Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!drawerComment.trim() || !activeDrawerTask) return;
    try {
      const res = await api.addTaskComment(activeDrawerTask.id, {
        comment: drawerComment.trim(),
        user: currentUserDisplayName
      });
      if (res) {
        notify('success', 'Work note appended to activity journal.');
        setDrawerComment('');
        setActiveDrawerTask(res);
        await fetchTasks();
      }
    } catch {
      notify('error', 'Failed to record work note.');
    }
  };

  // 7. Delete Task
  const handleDeleteTask = async (task, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete ticket ${task.id}?`)) return;
    try {
      await api.deleteTask(task.id);
      notify('success', `Ticket ${task.id} deleted.`);
      if (activeDrawerTask && activeDrawerTask.id === task.id) {
        setActiveDrawerTask(null);
      }
      await fetchTasks();
    } catch {
      notify('error', 'Failed to delete task.');
    }
  };

  // 8. Add New Task (Manager Assignment)
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const assignedTarget = isMyDay ? activeEmployee.full_name : (newAssignedTo || activeEmployee.full_name);
      const payload = {
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        category: newCategory,
        priority: newPriority,
        status: 'ASSIGNED',
        due_date: newDue || new Date().toISOString().split('T')[0],
        assigned_to: assignedTarget,
        assigned_by: newAssignedBy || 'Admin (Executive)',
        notes: newNotes.trim() ? `${newTimeSlot ? '[' + newTimeSlot + '] ' : ''}${newNotes.trim()}` : newTimeSlot || null,
      };

      const res = await api.createTask(payload);
      if (res) {
        notify('success', `Task ${res.id || ''} assigned to ${assignedTarget}. Status: ASSIGNED.`);
        setShowAddModal(false);
        setNewTitle('');
        setNewDescription('');
        setNewNotes('');
        await fetchTasks();
      }
    } catch {
      notify('error', 'Failed to create task.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Filtered Tasks List ────────────────────────────────────────────────────
  const displayedTasks = useMemo(() => {
    return tasks.filter(t => {
      // Category filter
      if (activeCategory !== 'ALL' && t.category !== activeCategory) return false;

      // Status filter
      const s = normalizeStatus(t);
      if (statusFilter !== 'ALL' && s !== statusFilter) return false;

      // In isMyDay mode, only show this employee's tasks
      if (isMyDay) {
        const matchesEmp =
          t.assigned_to === activeEmployee.full_name ||
          t.assigned_to === activeEmployee.id ||
          t.assigned_to === activeEmployee.employee_code ||
          (t.assigned_to && activeEmployee.full_name.includes(t.assigned_to));
        if (!matchesEmp) return false;

        if (timeSlotFilter !== 'ALL') {
          const slot = t.notes || '';
          if (!slot.includes(timeSlotFilter.split(' ')[0])) return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const inTitle = t.title?.toLowerCase().includes(q);
        const inId = t.id?.toLowerCase().includes(q);
        const inAssignee = t.assigned_to?.toLowerCase().includes(q);
        const inNotes = t.notes?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
        if (!inTitle && !inId && !inAssignee && !inNotes) return false;
      }

      return true;
    });
  }, [tasks, activeCategory, statusFilter, isMyDay, activeEmployee, timeSlotFilter, searchTerm]);

  // ─── Metrics ───────────────────────────────────────────────────────────────
  const assignedCount = tasks.filter(t => normalizeStatus(t) === 'ASSIGNED').length;
  const inProgressCount = tasks.filter(t => normalizeStatus(t) === 'IN_PROGRESS').length;
  const onHoldCount = tasks.filter(t => normalizeStatus(t) === 'ON_HOLD').length;
  const completedCount = tasks.filter(t => normalizeStatus(t) === 'COMPLETED').length;
  const totalCount = tasks.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-[9999] flex items-center space-x-2 px-4 py-3 rounded-lg shadow-xl border text-xs font-bold transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-red-50 border-red-300 text-red-800'
          }`}
        >
          <span>{notification.type === 'success' ? '✓' : '✕'}</span>
          <span>{notification.msg}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. TOP HERO HEADER & VIEW SWITCHER
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Identity & Header Text */}
          <div className="flex items-center space-x-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm shrink-0 ${
              isMyDay
                ? 'bg-gradient-to-br from-[#D97706] to-amber-600 text-white'
                : 'bg-gradient-to-br from-[#1E40AF] to-blue-800 text-white'
            }`}>
              {isMyDay ? <Sun className="w-7 h-7 text-amber-100" /> : <ListTodo className="w-7 h-7 text-blue-100" />}
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {isMyDay ? 'My Daily Agenda & Task Focus' : 'Operations Task & Work Order Queue'}
                </h1>
                <span className="text-[10px] font-bold bg-blue-100 text-[#1E40AF] border border-blue-200 px-2 py-0.5 rounded-full uppercase">
                  ServiceNow &amp; Jira Lifecycle
                </span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                  Live Audit Trail
                </span>
              </div>

              {isMyDay ? (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-semibold">
                  <span>Daily Planner for: <strong className="text-slate-900 font-bold">{activeEmployee.full_name}</strong></span>
                  <span>•</span>
                  <span className="text-[#1E40AF] font-bold">{activeEmployee.designation}</span>
                  <span>•</span>
                  <span className="text-slate-500 font-medium">{activeEmployee.department} ({activeEmployee.branch})</span>
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-medium">
                  Centralized work order lifecycle: Manager assignment $\rightarrow$ Assignee acceptance $\rightarrow$ Hold with mandatory comments $\rightarrow$ Resolution &amp; sign-off.
                </p>
              )}
            </div>
          </div>

          {/* Right Controls: Staff Filter & New Ticket Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {(!user || user.role === 'ADMIN' || user.role === 'HR_MANAGER') ? (
              <div className="text-right sm:text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {isMyDay ? 'VIEW DAILY PLANNER FOR' : 'FILTER BY ASSIGNED STAFF'}
                </span>
                <select
                  value={isMyDay ? selectedEmpId : filterEmployeeId}
                  onChange={(e) => {
                    if (isMyDay) setSelectedEmpId(e.target.value);
                    else setFilterEmployeeId(e.target.value);
                  }}
                  className="mt-0.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1E40AF] shadow-xs cursor-pointer"
                >
                  {!isMyDay && <option value="ALL">All Workforce Members (Company-wide)</option>}
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_code || emp.id}) — {emp.department}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-1.5 text-xs font-bold text-emerald-900 flex items-center space-x-2">
                <span>🔒</span>
                <div>
                  <div className="text-[10px] uppercase font-mono text-emerald-700">IAM Role: EMPLOYEE</div>
                  <div className="text-xs font-bold text-emerald-950">Personal Work Queue</div>
                </div>
              </div>
            )}

            {/* New Task Action Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-[#1E40AF] to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-[#FDE68A]" />
              <span>+ NEW WORK ORDER</span>
            </button>
          </div>
        </div>

        {/* Progress Bar for isMyDay */}
        {isMyDay && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-2.5 text-xs font-bold text-slate-700">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>
                Today&apos;s Deliverables for <span className="text-[#1E40AF] font-black">{activeEmployee.full_name}</span>:
              </span>
              <span className="font-semibold text-slate-500">
                {inProgressCount} active item{inProgressCount !== 1 ? 's' : ''} in progress
              </span>
            </div>

            <div className="flex items-center space-x-3 w-full md:w-72">
              <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <span className="text-xs font-black font-mono text-emerald-700 whitespace-nowrap">
                {completedCount}/{totalCount} ({completionPercent}%)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. LIFECYCLE METRIC KPI CARDS (SERVICENOW STAGES)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Assigned (Pending Acceptance) */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'ASSIGNED' ? 'ALL' : 'ASSIGNED')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'ASSIGNED' ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50/20' : 'border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ASSIGNED (NEW)</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1E40AF] flex items-center justify-center font-bold text-xs">
              1
            </div>
          </div>
          <p className="text-2xl font-black text-[#1E40AF] mt-1">{assignedCount}</p>
          <span className="text-[10px] text-slate-400 font-medium">Awaiting acceptance</span>
        </div>

        {/* Card 2: In Progress (Active) */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'IN_PROGRESS' ? 'ring-2 ring-amber-500 border-amber-400 bg-amber-50/20' : 'border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">IN PROGRESS</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
              2
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-1">{inProgressCount}</p>
          <span className="text-[10px] text-amber-600 font-semibold">Actively being worked</span>
        </div>

        {/* Card 3: On Hold (Blocked with Reason) */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'ON_HOLD' ? 'ALL' : 'ON_HOLD')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'ON_HOLD' ? 'ring-2 ring-rose-500 border-rose-400 bg-rose-50/20' : 'border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ON HOLD (BLOCKED)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xs">
              ⏸
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-1">{onHoldCount}</p>
          <span className="text-[10px] text-rose-600 font-semibold">With mandatory comments</span>
        </div>

        {/* Card 4: Completed & Closed */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'COMPLETED' ? 'ring-2 ring-emerald-500 border-emerald-400 bg-emerald-50/20' : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">COMPLETED &amp; CLOSED</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              ✓
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1">{completedCount}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Resolved deliverables</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. LIFECYCLE FILTER STRIP & SEARCH
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Lifecycle Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'ALL TICKETS' },
              { id: 'ASSIGNED', label: 'ASSIGNED (NEW)' },
              { id: 'IN_PROGRESS', label: 'IN PROGRESS' },
              { id: 'ON_HOLD', label: 'ON HOLD' },
              { id: 'COMPLETED', label: 'COMPLETED' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-[#1E40AF] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by ID, title, assignee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1E40AF]"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Categories Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">DEPARTMENT / CATEGORY:</span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all border ${
                  activeCategory === cat
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {isMyDay && (
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">TIME BLOCK:</span>
              <select
                value={timeSlotFilter}
                onChange={(e) => setTimeSlotFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1E40AF]"
              >
                <option value="ALL">All Time Blocks</option>
                <option value="Morning">Morning Focus</option>
                <option value="Afternoon">Afternoon Operations</option>
                <option value="Wrap-up">Wrap-up &amp; Audits</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. SERVICENOW & JIRA TICKET QUEUE LIST
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-4 h-4 text-[#1E40AF]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Work Order &amp; Ticket Queue ({displayedTasks.length} {displayedTasks.length === 1 ? 'ticket' : 'tickets'})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            Select workflow action dropdown to transition states
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center space-x-3 animate-pulse">
                <div className="bg-slate-100 rounded-lg w-6 h-6 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="bg-slate-100 rounded h-3.5 w-3/4" />
                  <div className="bg-slate-100 rounded h-2.5 w-1/3" />
                </div>
                <div className="bg-slate-100 rounded h-8 w-28" />
              </div>
            ))
          ) : displayedTasks.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-slate-800">No tickets found for this criteria.</p>
              <p className="text-xs text-slate-500">All work orders have been processed or none match the active filters.</p>
            </div>
          ) : (
            displayedTasks.map((task) => {
              const status = normalizeStatus(task);
              const isHold = status === 'ON_HOLD';
              const isDone = status === 'COMPLETED' || status === 'CLOSED';
              const isAssigned = status === 'ASSIGNED';
              const isInProgress = status === 'IN_PROGRESS';

              return (
                <div
                  key={task.id}
                  onClick={() => setActiveDrawerTask(task)}
                  className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors cursor-pointer ${
                    isDone 
                      ? 'bg-slate-50/50 hover:bg-slate-50' 
                      : isHold 
                      ? 'bg-rose-50/20 hover:bg-rose-50/40' 
                      : isAssigned 
                      ? 'bg-blue-50/15 hover:bg-blue-50/30' 
                      : 'hover:bg-amber-50/20'
                  }`}
                >
                  {/* Left: Ticket ID, Status Badge & Title Details */}
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    {/* Ticket Key Badge */}
                    <span className="font-mono text-[10px] font-black px-2 py-1 bg-slate-100 text-slate-700 rounded border border-slate-200 shrink-0 mt-0.5">
                      {task.id}
                    </span>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                        {statusBadge(task)}
                        
                        <h4 className={`text-xs font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {task.title}
                        </h4>

                        {priorityBadge(task.priority)}
                      </div>

                      {/* Description / Notes snippet */}
                      {task.description && (
                        <p className="text-xs text-slate-600 line-clamp-1">
                          {task.description}
                        </p>
                      )}

                      {/* If ON_HOLD: Show ServiceNow hold reason and hold comments */}
                      {isHold && task.hold_reason && (
                        <div className="bg-rose-50 border border-rose-200 rounded-md px-2.5 py-1 text-[11px] text-rose-800 flex items-start space-x-2 mt-1">
                          <PauseCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <div className="leading-tight">
                            <span className="font-bold">Hold Reason: {task.hold_reason}</span>
                            {task.hold_comments && (
                              <span className="text-rose-700 block italic">Comments: &quot;{task.hold_comments}&quot;</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* If COMPLETED: Show resolution notes */}
                      {isDone && task.resolution_notes && (
                        <div className="text-[11px] text-emerald-800 font-medium italic">
                          Resolution: {task.resolution_notes}
                        </div>
                      )}

                      {/* Metadata Row: Reporter, Assignee, Category, Due Date */}
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 pt-0.5">
                        {task.assigned_by && (
                          <span className="flex items-center space-x-1">
                            <span className="text-slate-400 font-medium">Assigned by:</span>
                            <strong className="text-slate-700">{task.assigned_by}</strong>
                          </span>
                        )}

                        {task.assigned_to && (
                          <>
                            <span>•</span>
                            <span className="flex items-center space-x-1">
                              <User className="w-3 h-3 text-[#1E40AF]" />
                              <strong className="text-slate-800">{task.assigned_to}</strong>
                            </span>
                          </>
                        )}

                        {task.due_date && (
                          <>
                            <span>•</span>
                            <span className="flex items-center space-x-1 font-mono text-slate-600">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>Due: {task.due_date}</span>
                            </span>
                          </>
                        )}

                        {task.category && (
                          <>
                            <span>•</span>
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                              {task.category}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: ServiceNow / Jira Workflow State Action Dropdown */}
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="flex items-center space-x-2 shrink-0 self-start md:self-center"
                  >
                    {/* State Transition Dropdown */}
                    <div className="relative group">
                      <select
                        value={status}
                        onChange={(e) => {
                          const nextVal = e.target.value;
                          if (nextVal === 'IN_PROGRESS') {
                            if (status === 'ASSIGNED') handleAcceptTask(task);
                            else if (status === 'ON_HOLD') handleResumeTask(task);
                            else handleAcceptTask(task);
                          } else if (nextVal === 'ON_HOLD') {
                            setHoldTargetTask(task);
                            setHoldComments('');
                          } else if (nextVal === 'COMPLETED') {
                            setCloseTargetTask(task);
                            setResolutionNotes('');
                          } else if (nextVal === 'REOPENED') {
                            handleReopenTask(task);
                          }
                        }}
                        className={`text-xs font-bold rounded-lg px-3 py-1.5 pr-8 border shadow-xs cursor-pointer appearance-none transition-all ${
                          isAssigned
                            ? 'bg-blue-50 text-[#1E40AF] border-blue-300 hover:bg-blue-100'
                            : isInProgress
                            ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                            : isHold
                            ? 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                        }`}
                      >
                        {isAssigned && (
                          <>
                            <option value="ASSIGNED">Status: ASSIGNED</option>
                            <option value="IN_PROGRESS">▶ Accept Task (Start Work)</option>
                            <option value="ON_HOLD">⏸ Put on Hold with Comments...</option>
                            <option value="COMPLETED">✓ Complete &amp; Close Ticket...</option>
                          </>
                        )}

                        {isInProgress && (
                          <>
                            <option value="IN_PROGRESS">Status: IN PROGRESS</option>
                            <option value="ON_HOLD">⏸ Put on Hold with Comments...</option>
                            <option value="COMPLETED">✓ Complete &amp; Close Ticket...</option>
                          </>
                        )}

                        {isHold && (
                          <>
                            <option value="ON_HOLD">Status: ON HOLD</option>
                            <option value="IN_PROGRESS">▶ Resume Task (In Progress)</option>
                            <option value="COMPLETED">✓ Complete &amp; Close Ticket...</option>
                          </>
                        )}

                        {isDone && (
                          <>
                            <option value="COMPLETED">Status: COMPLETED</option>
                            <option value="REOPENED">↺ Reopen Ticket</option>
                          </>
                        )}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                    </div>

                    {/* Quick Eye Button to View Activity Journal */}
                    <button
                      onClick={() => setActiveDrawerTask(task)}
                      title="View Ticket Details & Activity Journal"
                      className="p-1.5 text-slate-400 hover:text-[#1E40AF] hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Task */}
                    <button
                      onClick={(e) => handleDeleteTask(task, e)}
                      title="Delete Ticket"
                      className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. SERVICENOW "PUT ON HOLD" MODAL (MANDATORY COMMENTS)
      ───────────────────────────────────────────────────────────── */}
      {holdTargetTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  ⏸
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Put Ticket on Hold (ServiceNow Standard)</h2>
                  <span className="text-[11px] font-mono font-bold text-slate-500">{holdTargetTask.id}</span>
                </div>
              </div>
              <button 
                onClick={() => setHoldTargetTask(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-0.5">Ticket Summary:</span>
              <p className="text-slate-900 font-semibold">{holdTargetTask.title}</p>
            </div>

            <form onSubmit={handleConfirmHold} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Hold Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-rose-500 shadow-xs"
                >
                  {HOLD_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Mandatory Work Notes / Comments <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={holdComments}
                  onChange={(e) => setHoldComments(e.target.value)}
                  placeholder="ServiceNow protocol: Explain why work is suspended (e.g. Waiting for shipping line to issue revised BL manifest)..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-800 focus:outline-none focus:border-rose-500 font-medium"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  ⚠️ This explanation will be permanently recorded in the ticket&apos;s activity audit journal.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setHoldTargetTask(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !holdComments.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  {saving ? 'Placing on Hold...' : 'Confirm Put on Hold'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. RESOLUTION & CLOSE TICKET MODAL
      ───────────────────────────────────────────────────────────── */}
      {closeTargetTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Resolve &amp; Close Ticket</h2>
                  <span className="text-[11px] font-mono font-bold text-slate-500">{closeTargetTask.id}</span>
                </div>
              </div>
              <button 
                onClick={() => setCloseTargetTask(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-0.5">Ticket Summary:</span>
              <p className="text-slate-900 font-semibold">{closeTargetTask.title}</p>
            </div>

            <form onSubmit={handleConfirmClose} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Resolution Code</label>
                <select
                  value={resolutionCode}
                  onChange={(e) => setResolutionCode(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-xs"
                >
                  {RESOLUTION_CODES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Resolution Notes &amp; Outcome Summary
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe final actions taken, document references, or release approvals..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCloseTargetTask(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                >
                  {saving ? 'Closing Ticket...' : 'Confirm Complete & Close'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. JIRA & SERVICENOW TICKET DETAILS & ACTIVITY JOURNAL DRAWER
      ───────────────────────────────────────────────────────────── */}
      {activeDrawerTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-xs font-black bg-blue-100 text-[#1E40AF] px-2.5 py-1 rounded border border-blue-200">
                  {activeDrawerTask.id}
                </span>
                {statusBadge(activeDrawerTask)}
                {priorityBadge(activeDrawerTask.priority)}
              </div>
              <button
                onClick={() => setActiveDrawerTask(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Scroll */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title & Description */}
              <div className="space-y-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                  {activeDrawerTask.title}
                </h2>
                {activeDrawerTask.description ? (
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {activeDrawerTask.description}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">No detailed description provided.</p>
                )}
              </div>

              {/* Hold Alert Banner if ON_HOLD */}
              {normalizeStatus(activeDrawerTask) === 'ON_HOLD' && (
                <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 text-xs space-y-1.5">
                  <div className="flex items-center space-x-2 text-rose-800 font-bold">
                    <PauseCircle className="w-4 h-4 text-rose-600" />
                    <span>Ticket Currently Placed on Hold</span>
                  </div>
                  <p className="text-rose-900 font-semibold">
                    Reason: {activeDrawerTask.hold_reason || 'Blocked by Dependency'}
                  </p>
                  {activeDrawerTask.hold_comments && (
                    <p className="text-rose-700 italic bg-white/60 p-2 rounded border border-rose-200">
                      &quot;{activeDrawerTask.hold_comments}&quot;
                    </p>
                  )}
                  <button
                    onClick={() => handleResumeTask(activeDrawerTask)}
                    className="mt-2 flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Resume Work (Move to In Progress)</span>
                  </button>
                </div>
              )}

              {/* Resolution Banner if COMPLETED */}
              {normalizeStatus(activeDrawerTask) === 'COMPLETED' && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-xs space-y-1">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Ticket Resolved &amp; Closed</span>
                  </div>
                  <p className="text-emerald-900 font-medium">
                    {activeDrawerTask.resolution_notes || 'Deliverables verified and accepted.'}
                  </p>
                </div>
              )}

              {/* People & Logistics Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">ASSIGNED BY (REPORTER)</span>
                  <div className="flex items-center space-x-1.5 mt-0.5 font-bold text-slate-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1E40AF]" />
                    <span>{activeDrawerTask.assigned_by || 'Admin (Executive)'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">ASSIGNEE</span>
                  <div className="flex items-center space-x-1.5 mt-0.5 font-bold text-slate-800">
                    <User className="w-3.5 h-3.5 text-[#1E40AF]" />
                    <span>{activeDrawerTask.assigned_to || 'Unassigned'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">TARGET SLA DUE</span>
                  <div className="flex items-center space-x-1.5 mt-0.5 font-bold text-slate-800 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{activeDrawerTask.due_date || 'N/A'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">DEPARTMENT CATEGORY</span>
                  <div className="mt-0.5 font-bold text-slate-800">
                    {activeDrawerTask.category || 'Operations'}
                  </div>
                </div>
              </div>

              {/* Activity Journal Stream (ServiceNow / Jira Timeline) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                    <History className="w-4 h-4 text-[#1E40AF]" />
                    <span>Activity Stream &amp; Work Notes</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {Array.isArray(activeDrawerTask.activity_log) ? activeDrawerTask.activity_log.length : 0} events
                  </span>
                </div>

                {/* Timeline Entries */}
                <div className="space-y-3">
                  {Array.isArray(activeDrawerTask.activity_log) && activeDrawerTask.activity_log.length > 0 ? (
                    activeDrawerTask.activity_log.map((entry, idx) => (
                      <div key={idx} className="flex items-start space-x-3 text-xs">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                          entry.action === 'ASSIGNED' ? 'bg-blue-100 text-[#1E40AF]' :
                          entry.action === 'ACCEPTED' || entry.action === 'RESUMED' ? 'bg-amber-100 text-amber-800' :
                          entry.action === 'PUT_ON_HOLD' ? 'bg-rose-100 text-rose-800' :
                          entry.action === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {entry.action === 'PUT_ON_HOLD' ? '⏸' :
                           entry.action === 'COMPLETED' ? '✓' :
                           entry.action === 'ACCEPTED' ? '▶' : '•'}
                        </div>

                        <div className="flex-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <strong className="text-slate-800">{entry.user || 'System'}</strong>
                            <span className="font-mono text-slate-400">{entry.timestamp}</span>
                          </div>
                          {entry.hold_reason && (
                            <span className="inline-block text-[10px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
                              Hold: {entry.hold_reason}
                            </span>
                          )}
                          <p className="text-slate-700 leading-normal font-medium">
                            {entry.comment}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No activity log entries recorded yet.</p>
                  )}
                </div>

                {/* Add Work Note Form */}
                <form onSubmit={handleAddComment} className="pt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Add an internal work note / comment..."
                      value={drawerComment}
                      onChange={(e) => setDrawerComment(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1E40AF]"
                    />
                    <button
                      type="submit"
                      disabled={!drawerComment.trim()}
                      className="px-3.5 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center space-x-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Post</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Current State: <strong className="text-slate-800">{normalizeStatus(activeDrawerTask)}</strong>
              </span>

              <div className="flex items-center space-x-2">
                {normalizeStatus(activeDrawerTask) === 'ASSIGNED' && (
                  <button
                    onClick={() => handleAcceptTask(activeDrawerTask)}
                    className="px-3.5 py-1.5 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                  >
                    ▶ Accept Task
                  </button>
                )}

                {normalizeStatus(activeDrawerTask) !== 'ON_HOLD' && normalizeStatus(activeDrawerTask) !== 'COMPLETED' && (
                  <button
                    onClick={() => {
                      setHoldTargetTask(activeDrawerTask);
                      setHoldComments('');
                    }}
                    className="px-3.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 rounded-lg text-xs font-bold transition-colors"
                  >
                    ⏸ Put on Hold...
                  </button>
                )}

                {normalizeStatus(activeDrawerTask) === 'ON_HOLD' && (
                  <button
                    onClick={() => handleResumeTask(activeDrawerTask)}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    ▶ Resume Work
                  </button>
                )}

                {normalizeStatus(activeDrawerTask) !== 'COMPLETED' && (
                  <button
                    onClick={() => {
                      setCloseTargetTask(activeDrawerTask);
                      setResolutionNotes('');
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                  >
                    ✓ Complete &amp; Close
                  </button>
                )}

                {normalizeStatus(activeDrawerTask) === 'COMPLETED' && (
                  <button
                    onClick={() => handleReopenTask(activeDrawerTask)}
                    className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    ↺ Reopen Ticket
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          8. NEW WORK ORDER MODAL (MANAGER ASSIGNMENT)
      ───────────────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1E40AF] flex items-center justify-center font-bold">
                  +
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Assign New Work Order / Ticket</h2>
                  <span className="text-[11px] text-slate-500 font-medium">Manager $\rightarrow$ Assignee Dispatch Queue</span>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ticket Summary / Action Item <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Verify customs clearance & Phytosanitary for Hai Phong container..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#1E40AF] font-medium shadow-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Detailed Work Description &amp; Acceptance Criteria
                </label>
                <textarea
                  rows={2}
                  placeholder="Detailed instructions for the assignee..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-800 focus:outline-none focus:border-[#1E40AF] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Assignee (Staff)</label>
                  <select
                    value={newAssignedTo}
                    onChange={(e) => setNewAssignedTo(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF] shadow-xs"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.full_name}>
                        {emp.full_name} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Assigned By (Manager)</label>
                  <input
                    type="text"
                    value={newAssignedBy}
                    onChange={(e) => setNewAssignedBy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF] shadow-xs"
                  >
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF] shadow-xs"
                  >
                    {PRIORITY_OPTIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Target Due Date</label>
                  <input
                    type="date"
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF] shadow-xs"
                  >
                  </input>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Time Block / Scheduling</label>
                <select
                  value={newTimeSlot}
                  onChange={(e) => setNewTimeSlot(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E40AF] shadow-xs"
                >
                  {TIME_SLOT_OPTIONS.map(ts => (
                    <option key={ts} value={ts}>{ts}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !newTitle.trim()}
                  className="px-4 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Assign Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
