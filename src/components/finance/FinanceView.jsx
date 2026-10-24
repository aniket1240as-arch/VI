import React, { useState, useEffect } from 'react';
import {
  DollarSign, FileText, BookOpen, CreditCard, CheckCircle, Clock,
  Plus, Search, Filter, ChevronRight, Eye, Send, ArrowUpRight, ArrowDownLeft,
  BarChart2, Receipt, Building2, TrendingUp, AlertCircle, PieChart, Layers
} from 'lucide-react';
import api from '../../services/api';

const STATUS_COLORS = {
  DRAFT: 'bg-slate-100 text-slate-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PARTIALLY_DELIVERED: 'bg-amber-100 text-amber-700',
  FULLY_DELIVERED: 'bg-indigo-100 text-indigo-700',
  INVOICED: 'bg-purple-100 text-purple-700',
  PARTIALLY_PAID: 'bg-orange-100 text-orange-700',
  PAID: 'bg-green-100 text-green-700',
  CLOSED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-gray-100 text-gray-500',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  OVERDUE: 'bg-red-100 text-red-700',
};

const ACCOUNT_TYPE_COLORS = {
  Asset: 'text-blue-600 bg-blue-50 border-blue-200',
  Liability: 'text-amber-600 bg-amber-50 border-amber-200',
  Equity: 'text-purple-600 bg-purple-50 border-purple-200',
  Income: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  Expense: 'text-rose-600 bg-rose-50 border-rose-200',
};

export default function FinanceView() {
  const [activeSubTab, setActiveSubTab] = useState('dashboard');
  const [salesOrders, setSalesOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [showCreateSO, setShowCreateSO] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [selectedSO, setSelectedSO] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [soData, invData, coaData, jeData, payData, sumData] = await Promise.all([
      api.getSalesOrders(),
      api.getInvoices(),
      api.getChartOfAccounts(),
      api.getJournalEntries(),
      api.getPayments(),
      api.getFinanceSummary(),
    ]);
    if (soData) setSalesOrders(soData);
    if (invData) setInvoices(invData);
    if (coaData) setAccounts(coaData);
    if (jeData) setJournalEntries(jeData);
    if (payData) setPayments(payData);
    if (sumData) setSummary(sumData);
    setLoading(false);
  };

  const handleCreateSO = async (formData) => {
    const res = await api.createSalesOrder(formData);
    if (res) {
      setShowCreateSO(false);
      loadData();
    }
  };

  const handleStatusUpdate = async (soId, newStatus) => {
    const res = await api.updateSOStatus(soId, { status: newStatus });
    if (res) loadData();
  };

  const handleCreateInvoice = async (formData) => {
    const res = await api.createInvoice(formData);
    if (res) {
      setShowCreateInvoice(false);
      loadData();
    }
  };

  const handleRecordPayment = async (formData) => {
    const res = await api.createPayment(formData);
    if (res) {
      setShowRecordPayment(false);
      loadData();
    }
  };

  const handleAddAccount = async (formData) => {
    const res = await api.createAccount(formData);
    if (res) {
      setShowAddAccount(false);
      loadData();
    }
  };

  const subTabs = [
    { id: 'dashboard', label: 'Financial Overview', icon: BarChart2 },
    { id: 'sales_orders', label: 'Sales Orders', icon: DollarSign },
    { id: 'invoices', label: 'Invoicing & AR', icon: Receipt },
    { id: 'general_ledger', label: 'Chart of Accounts & GL', icon: BookOpen },
    { id: 'payments', label: 'Payment Entries', icon: CreditCard },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Sub-Navigation */}
      <div className="flex items-center space-x-1 bg-white rounded-xl shadow-sm border border-slate-200 p-1.5 flex-wrap">
        {subTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === tab.id
                  ? 'bg-[#1E40AF] text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-[#1E40AF]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#1E40AF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {activeSubTab === 'dashboard' && (
            <FinanceDashboard
              summary={summary}
              accounts={accounts}
              invoices={invoices}
              onNavigate={setActiveSubTab}
            />
          )}

          {activeSubTab === 'sales_orders' && (
            <SalesOrderList
              orders={salesOrders}
              onSelect={setSelectedSO}
              onStatusUpdate={handleStatusUpdate}
              onCreateNew={() => setShowCreateSO(true)}
            />
          )}

          {activeSubTab === 'invoices' && (
            <InvoiceList
              invoices={invoices}
              salesOrders={salesOrders}
              onCreateNew={() => setShowCreateInvoice(true)}
            />
          )}

          {activeSubTab === 'general_ledger' && (
            <GeneralLedgerView
              accounts={accounts}
              journalEntries={journalEntries}
              onAddAccount={() => setShowAddAccount(true)}
            />
          )}

          {activeSubTab === 'payments' && (
            <PaymentList
              payments={payments}
              invoices={invoices}
              onCreateNew={() => setShowRecordPayment(true)}
            />
          )}
        </>
      )}

      {/* Modals */}
      {showCreateSO && (
        <CreateSOModal onClose={() => setShowCreateSO(false)} onSubmit={handleCreateSO} />
      )}

      {showCreateInvoice && (
        <CreateInvoiceModal
          salesOrders={salesOrders.filter(so => ['CONFIRMED', 'FULLY_DELIVERED'].includes(so.status))}
          onClose={() => setShowCreateInvoice(false)}
          onSubmit={handleCreateInvoice}
        />
      )}

      {showRecordPayment && (
        <RecordPaymentModal
          invoices={invoices.filter(i => ['SUBMITTED', 'PARTIALLY_PAID'].includes(i.status))}
          onClose={() => setShowRecordPayment(false)}
          onSubmit={handleRecordPayment}
        />
      )}

      {showAddAccount && (
        <AddAccountModal
          accounts={accounts}
          onClose={() => setShowAddAccount(false)}
          onSubmit={handleAddAccount}
        />
      )}

      {selectedSO && (
        <SODetailDrawer
          so={selectedSO}
          onClose={() => setSelectedSO(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// 1. FINANCIAL OVERVIEW DASHBOARD
// ═══════════════════════════════════════════════════════════

function FinanceDashboard({ summary, accounts, invoices, onNavigate }) {
  if (!summary) return null;

  const kpis = [
    { label: 'Total Sales Revenue', value: `$${(summary.total_revenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Accounts Receivable (AR)', value: `$${(summary.total_receivable || 0).toLocaleString()}`, icon: DollarSign, color: 'text-[#D97706]', bg: 'bg-amber-50' },
    { label: 'Total Invoices', value: summary.total_invoices, icon: Receipt, color: 'text-[#1E40AF]', bg: 'bg-blue-50' },
    { label: 'Realized Collections', value: `$${(summary.payments_received || 0).toLocaleString()}`, icon: CheckCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Active Sales Orders', value: summary.total_sales_orders, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Chart of Accounts', value: accounts.length, icon: BookOpen, color: 'text-slate-600', bg: 'bg-slate-100' },
  ];

  // CoA Summary by root type
  const typeBalances = { Asset: 0, Liability: 0, Equity: 0, Income: 0, Expense: 0 };
  accounts.forEach(acc => {
    if (typeBalances[acc.account_type] !== undefined) {
      typeBalances[acc.account_type] += acc.balance || 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition">
              <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{kpi.value}</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Main Grid: CoA Breakdown & AR Aging */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart of Accounts Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Balance Sheet & Income Statement Summary</h3>
            <button
              onClick={() => onNavigate('general_ledger')}
              className="text-xs font-semibold text-[#1E40AF] hover:underline flex items-center"
            >
              View Full GL <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
          <div className="space-y-3">
            {Object.entries(typeBalances).map(([type, bal]) => (
              <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${ACCOUNT_TYPE_COLORS[type]}`}>
                    {type}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">Total {type}s</span>
                </div>
                <span className="text-xs font-bold text-slate-800">${bal.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Invoices & AR Aging */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Recent Invoices</h3>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-xs font-semibold text-[#1E40AF] hover:underline flex items-center"
            >
              View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
          <div className="space-y-2.5">
            {(summary.recent_invoices || []).map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-800">{inv.invoice_number}</p>
                  <p className="text-[10px] text-slate-500">{inv.customer_name} • Due: {inv.due_date}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800">${(inv.grand_total || 0).toLocaleString()}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${STATUS_COLORS[inv.status] || 'bg-slate-100'}`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
            {(!summary.recent_invoices || summary.recent_invoices.length === 0) && (
              <p className="text-xs text-slate-400 py-4 text-center">No invoices created yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// 2. SALES ORDERS LIST & LIFECYCLE
// ═══════════════════════════════════════════════════════════

function SalesOrderList({ orders, onSelect, onStatusUpdate, onCreateNew }) {
  const [filter, setFilter] = useState('ALL');
  const statuses = ['ALL', 'DRAFT', 'CONFIRMED', 'FULLY_DELIVERED', 'INVOICED', 'PAID', 'CANCELLED'];

  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Sales Orders</h2>
          <p className="text-xs text-slate-500 mt-0.5">{orders.length} commercial sales orders</p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center space-x-2 px-4 py-2.5 bg-[#1E40AF] text-white rounded-lg text-xs font-bold hover:bg-blue-800 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>NEW SALES ORDER</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 flex-wrap">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
              filter === s
                ? 'bg-[#1E40AF] text-white'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-[#1E40AF] hover:text-[#1E40AF]'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* SO Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['SO Number', 'Customer', 'Order Date', 'Incoterms', 'Payment Terms', 'Total', 'Outstanding', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(so => (
              <tr key={so.id} className="hover:bg-blue-50/40 transition-colors">
                <td className="px-4 py-3">
                  <button onClick={() => onSelect(so)} className="text-xs font-bold text-[#1E40AF] hover:underline">
                    {so.so_number}
                  </button>
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-700 truncate max-w-[200px]">{so.customer_name}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{so.order_date}</td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{so.incoterms}</span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{so.payment_terms}</td>
                <td className="px-4 py-3 text-xs font-bold text-slate-800">${(so.grand_total || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-xs font-semibold text-amber-600">${(so.outstanding_amount || 0).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${STATUS_COLORS[so.status] || 'bg-slate-100'}`}>
                    {so.status?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-1.5">
                    {so.status === 'DRAFT' && (
                      <button
                        onClick={() => onStatusUpdate(so.id, 'CONFIRMED')}
                        className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition"
                      >
                        Confirm
                      </button>
                    )}
                    {so.status === 'CONFIRMED' && (
                      <button
                        onClick={() => onStatusUpdate(so.id, 'FULLY_DELIVERED')}
                        className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition"
                      >
                        Deliver
                      </button>
                    )}
                    <button
                      onClick={() => onSelect(so)}
                      className="text-[10px] font-bold text-slate-500 hover:text-[#1E40AF] bg-slate-50 hover:bg-blue-50 px-2 py-1 rounded transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">No sales orders found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// 3. INVOICE & ACCOUNTS RECEIVABLE
// ═══════════════════════════════════════════════════════════

function InvoiceList({ invoices, salesOrders, onCreateNew }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Sales Invoices & Billing</h2>
          <p className="text-xs text-slate-500 mt-0.5">{invoices.length} invoices generated</p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center space-x-2 px-4 py-2.5 bg-[#1E40AF] text-white rounded-lg text-xs font-bold hover:bg-blue-800 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>GENERATE INVOICE</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Invoice Number', 'SO Ref', 'Customer', 'Date', 'Due Date', 'Total', 'Paid', 'Balance Due', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map(inv => (
              <tr key={inv.id} className="hover:bg-blue-50/40 transition-colors">
                <td className="px-4 py-3 text-xs font-bold text-[#1E40AF]">{inv.invoice_number}</td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-600">{inv.so_number || '—'}</td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-700">{inv.customer_name}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{inv.invoice_date}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{inv.due_date}</td>
                <td className="px-4 py-3 text-xs font-bold text-slate-800">${(inv.grand_total || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-xs font-semibold text-green-600">${(inv.paid_amount || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-xs font-bold text-amber-600">${(inv.outstanding_amount || 0).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${STATUS_COLORS[inv.status] || 'bg-slate-100'}`}>
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">No invoices found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// 4. GENERAL LEDGER & CHART OF ACCOUNTS
// ═══════════════════════════════════════════════════════════

function GeneralLedgerView({ accounts, journalEntries, onAddAccount }) {
  const [activeTab, setActiveTab] = useState('coa');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filteredAccounts = typeFilter === 'ALL'
    ? accounts
    : accounts.filter(a => a.account_type === typeFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('coa')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'coa'
                ? 'bg-[#1E40AF] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Chart of Accounts ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab('gl')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'gl'
                ? 'bg-[#1E40AF] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Journal Entries & GL ({journalEntries.length})
          </button>
        </div>

        {activeTab === 'coa' && (
          <button
            onClick={onAddAccount}
            className="flex items-center space-x-2 px-4 py-2 bg-[#1E40AF] text-white rounded-lg text-xs font-bold hover:bg-blue-800 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>ADD GL ACCOUNT</span>
          </button>
        )}
      </div>

      {activeTab === 'coa' ? (
        <div className="space-y-3">
          {/* Filter Pills */}
          <div className="flex items-center space-x-2">
            {['ALL', 'Asset', 'Liability', 'Equity', 'Income', 'Expense'].map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                  typeFilter === t
                    ? 'bg-[#1E40AF] text-white'
                    : 'bg-white text-slate-500 border border-slate-200 hover:text-[#1E40AF]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Code', 'Account Name', 'Type', 'Currency', 'Balance', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map(acc => (
                  <tr key={acc.id} className={acc.is_group ? 'bg-slate-50/70 font-bold' : 'hover:bg-blue-50/40'}>
                    <td className="px-4 py-2.5 text-xs font-mono text-slate-600">{acc.account_code}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-800">
                      <span className={acc.parent_account ? 'ml-4' : ''}>
                        {acc.is_group ? '📁 ' : '📄 '}
                        {acc.account_name}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${ACCOUNT_TYPE_COLORS[acc.account_type]}`}>
                        {acc.account_type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{acc.currency}</td>
                    <td className="px-4 py-2.5 text-xs font-bold text-slate-800">${(acc.balance || 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Journal Entries Log */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Entry #', 'Date', 'Account', 'Party', 'Reference', 'Debit', 'Credit', 'Narration'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {journalEntries.map(je => (
                <tr key={je.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-4 py-2.5 text-xs font-mono font-bold text-[#1E40AF]">{je.entry_number}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">{je.entry_date}</td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-slate-800">{je.account_name}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">{je.party_name || '—'}</td>
                  <td className="px-4 py-2.5 text-[10px] text-slate-500 font-mono">{je.reference_type} #{je.reference_id}</td>
                  <td className="px-4 py-2.5 text-xs font-bold text-emerald-600">
                    {je.debit > 0 ? `$${je.debit.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-bold text-rose-600">
                    {je.credit > 0 ? `$${je.credit.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500 truncate max-w-[200px]">{je.narration}</td>
                </tr>
              ))}
              {journalEntries.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-400">No journal entries recorded</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// 5. PAYMENT ENTRIES
// ═══════════════════════════════════════════════════════════

function PaymentList({ payments, invoices, onCreateNew }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Payment Entries & Settlements</h2>
          <p className="text-xs text-slate-500 mt-0.5">{payments.length} banking & settlement transactions</p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center space-x-2 px-4 py-2.5 bg-[#1E40AF] text-white rounded-lg text-xs font-bold hover:bg-blue-800 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>RECORD PAYMENT</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Payment #', 'Type', 'Party', 'Date', 'Mode', 'Amount', 'Reference UTR/LC', 'Allocated Invoice', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map(pay => (
              <tr key={pay.id} className="hover:bg-blue-50/40 transition-colors">
                <td className="px-4 py-3 text-xs font-mono font-bold text-[#1E40AF]">{pay.payment_number}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    pay.payment_type === 'RECEIVE' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {pay.payment_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-700">{pay.party_name}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{pay.payment_date}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{pay.mode_of_payment}</td>
                <td className="px-4 py-3 text-xs font-bold text-slate-800">${(pay.paid_amount || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-500">{pay.reference_no || '—'}</td>
                <td className="px-4 py-3 text-xs font-mono text-[#1E40AF]">{pay.allocated_invoice_number || '—'}</td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Settled</span>
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">No payment entries found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// MODALS & DRAWERS
// ═══════════════════════════════════════════════════════════

function CreateSOModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    customer_name: '', order_date: new Date().toISOString().split('T')[0],
    delivery_date: '', currency: 'USD', payment_terms: 'LC at Sight',
    incoterms: 'FOB', incoterms_location: '', salesperson: 'Vũ Thị Hoan', territory: 'Southeast Asia', remarks: '',
    items: [{ item_name: '', quantity: 0, uom: 'MT', rate: 0, discount_percent: 0, warehouse: 'Hanoi HQ' }]
  });

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { item_name: '', quantity: 0, uom: 'MT', rate: 0, discount_percent: 0, warehouse: 'Hanoi HQ' }] }));
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx, field, val) => {
    setForm(f => ({
      ...f,
      items: f.items.map((item, i) => i === idx ? { ...item, [field]: ['quantity', 'rate', 'discount_percent'].includes(field) ? parseFloat(val) || 0 : val } : item)
    }));
  };

  const subtotal = form.items.reduce((sum, i) => sum + (i.quantity * i.rate * (1 - i.discount_percent / 100)), 0);

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-start justify-center pt-10 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 mb-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-800">Create Sales Order</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Customer Name *</label>
              <input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs" placeholder="Buyer / Client legal name" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Order Date *</label>
              <input type="date" value={form.order_date} onChange={e => setForm(f => ({ ...f, order_date: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Payment Terms</label>
              <select value={form.payment_terms} onChange={e => setForm(f => ({ ...f, payment_terms: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs">
                {['LC at Sight', 'CAD / 30 Days', 'TT 30% Adv / 70% BL', 'Net 30', 'Net 60'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Incoterms</label>
              <select value={form.incoterms} onChange={e => setForm(f => ({ ...f, incoterms: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs">
                {['FOB', 'CIF', 'CFR', 'EXW', 'DDP'].map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Salesperson</label>
              <input value={form.salesperson} onChange={e => setForm(f => ({ ...f, salesperson: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Territory</label>
              <input value={form.territory} onChange={e => setForm(f => ({ ...f, territory: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-700">LINE ITEMS</h3>
              <button onClick={addItem} className="text-[10px] font-bold text-[#1E40AF] hover:underline flex items-center">
                <Plus className="w-3 h-3 mr-1" /> Add Line
              </button>
            </div>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    {['Product / Commodity', 'Qty', 'UOM', 'Rate (USD)', 'Disc %', 'Amount', ''].map(h => (
                      <th key={h} className="text-left px-2 py-2 text-[10px] font-bold text-slate-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, idx) => (
                    <tr key={idx} className="border-t border-slate-100">
                      <td className="px-2 py-1.5">
                        <input value={item.item_name} onChange={e => updateItem(idx, 'item_name', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs" placeholder="Commodity grade" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)}
                          className="w-16 px-2 py-1.5 border border-slate-200 rounded text-xs" />
                      </td>
                      <td className="px-2 py-1.5">
                        <select value={item.uom} onChange={e => updateItem(idx, 'uom', e.target.value)}
                          className="px-2 py-1.5 border border-slate-200 rounded text-xs">
                          {['MT', 'KG', 'Bags', 'Containers'].map(u => <option key={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)}
                          className="w-20 px-2 py-1.5 border border-slate-200 rounded text-xs" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={item.discount_percent} onChange={e => updateItem(idx, 'discount_percent', e.target.value)}
                          className="w-14 px-2 py-1.5 border border-slate-200 rounded text-xs" />
                      </td>
                      <td className="px-2 py-1.5 text-xs font-bold text-slate-700">
                        ${(item.quantity * item.rate * (1 - item.discount_percent / 100)).toLocaleString()}
                      </td>
                      <td className="px-2 py-1.5">
                        {form.items.length > 1 && (
                          <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="bg-slate-50 rounded-lg px-6 py-3 text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Value</p>
              <p className="text-xl font-bold text-[#1E40AF]">${subtotal.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
          <button
            onClick={() => onSubmit(form)}
            disabled={!form.customer_name || form.items.every(i => !i.item_name)}
            className="px-6 py-2.5 bg-[#1E40AF] text-white rounded-lg text-xs font-bold hover:bg-blue-800 disabled:opacity-40 transition shadow-sm"
          >
            Create Order
          </button>
        </div>
      </div>
    </div>
  );
}


function CreateInvoiceModal({ salesOrders, onClose, onSubmit }) {
  const [selectedSO, setSelectedSO] = useState('');
  const [form, setForm] = useState({
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    remarks: '', items: []
  });

  const handleSOSelect = (soId) => {
    setSelectedSO(soId);
    const so = salesOrders.find(s => s.id === soId);
    if (so && so.items) {
      setForm(f => ({
        ...f,
        items: so.items.map(i => ({
          item_code: i.item_code, item_name: i.item_name, description: i.description,
          quantity: i.quantity, rate: i.rate, tax_rate: 0
        }))
      }));
    }
  };

  const so = salesOrders.find(s => s.id === selectedSO);

  const handleSubmit = () => {
    if (!so) return;
    onSubmit({
      sales_order_id: so.id, so_number: so.so_number, customer_id: so.customer_id,
      customer_name: so.customer_name, payment_terms: so.payment_terms, ...form
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-start justify-center pt-10 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 mb-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-800">Generate Commercial Sales Invoice</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Select Sales Order *</label>
            <select value={selectedSO} onChange={e => handleSOSelect(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs">
              <option value="">— Select Confirmed SO —</option>
              {salesOrders.map(s => (
                <option key={s.id} value={s.id}>{s.so_number} — {s.customer_name} (${s.grand_total?.toLocaleString()})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Invoice Date</label>
              <input type="date" value={form.invoice_date} onChange={e => setForm(f => ({ ...f, invoice_date: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Payment Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!selectedSO}
            className="px-6 py-2.5 bg-[#1E40AF] text-white rounded-lg text-xs font-bold hover:bg-blue-800 disabled:opacity-40 transition shadow-sm"
          >
            Create Invoice
          </button>
        </div>
      </div>
    </div>
  );
}


function RecordPaymentModal({ invoices, onClose, onSubmit }) {
  const [form, setForm] = useState({
    payment_type: 'RECEIVE', party_type: 'Customer', party_name: '',
    payment_date: new Date().toISOString().split('T')[0], mode_of_payment: 'TT Wire',
    paid_amount: 0, reference_no: '', bank_account: 'HDFC Bank - Export Account',
    allocated_to_invoice: '', allocated_invoice_number: ''
  });

  const handleInvoiceSelect = (invId) => {
    const inv = invoices.find(i => i.id === invId);
    if (inv) {
      setForm(f => ({
        ...f,
        allocated_to_invoice: inv.id,
        allocated_invoice_number: inv.invoice_number,
        party_name: inv.customer_name,
        paid_amount: inv.outstanding_amount || inv.grand_total,
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-start justify-center pt-10 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 mb-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-800">Record Payment Entry</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Allocate to Invoice (Optional)</label>
            <select value={form.allocated_to_invoice} onChange={e => handleInvoiceSelect(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs">
              <option value="">— Direct / Unallocated —</option>
              {invoices.map(i => (
                <option key={i.id} value={i.id}>{i.invoice_number} — {i.customer_name} (Due: ${i.outstanding_amount?.toLocaleString()})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Party Name *</label>
              <input value={form.party_name} onChange={e => setForm(f => ({ ...f, party_name: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Payment Date</label>
              <input type="date" value={form.payment_date} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Settlement Mode</label>
              <select value={form.mode_of_payment} onChange={e => setForm(f => ({ ...f, mode_of_payment: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs">
                {['TT Wire', 'LC Negotiation', 'Bank Transfer', 'CAD', 'Cheque'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Amount Received ($) *</label>
              <input type="number" value={form.paid_amount} onChange={e => setForm(f => ({ ...f, paid_amount: parseFloat(e.target.value) || 0 }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">UTR / Reference No.</label>
              <input value={form.reference_no} onChange={e => setForm(f => ({ ...f, reference_no: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs" placeholder="UTR-..." />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Bank Account</label>
              <input value={form.bank_account} onChange={e => setForm(f => ({ ...f, bank_account: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500">Cancel</button>
          <button
            onClick={() => onSubmit(form)}
            disabled={!form.party_name || form.paid_amount <= 0}
            className="px-6 py-2.5 bg-[#1E40AF] text-white rounded-lg text-xs font-bold hover:bg-blue-800 disabled:opacity-40 transition shadow-sm"
          >
            Post Payment
          </button>
        </div>
      </div>
    </div>
  );
}


function AddAccountModal({ accounts, onClose, onSubmit }) {
  const [form, setForm] = useState({
    account_code: '', account_name: '', account_type: 'Asset', parent_account: '', is_group: false, currency: 'USD', description: ''
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-start justify-center pt-10 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 mb-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-800">Add General Ledger Account</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Account Code *</label>
              <input value={form.account_code} onChange={e => setForm(f => ({ ...f, account_code: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono" placeholder="e.g. 1103" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Account Type *</label>
              <select value={form.account_type} onChange={e => setForm(f => ({ ...f, account_type: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs">
                {['Asset', 'Liability', 'Equity', 'Income', 'Expense'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Account Name *</label>
            <input value={form.account_name} onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))}
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs" placeholder="e.g. ICICI Forex Settlement Account" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Description</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs" />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500">Cancel</button>
          <button
            onClick={() => onSubmit(form)}
            disabled={!form.account_code || !form.account_name}
            className="px-6 py-2.5 bg-[#1E40AF] text-white rounded-lg text-xs font-bold hover:bg-blue-800 disabled:opacity-40 transition shadow-sm"
          >
            Save Account
          </button>
        </div>
      </div>
    </div>
  );
}


function SODetailDrawer({ so, onClose, onStatusUpdate }) {
  return (
    <div className="fixed inset-0 bg-black/30 z-[100] flex justify-end">
      <div className="w-full max-w-lg bg-white shadow-2xl h-full overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-slate-800">{so.so_number}</h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_COLORS[so.status]}`}>
              {so.status?.replace(/_/g, ' ')}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Customer', so.customer_name],
              ['Order Date', so.order_date],
              ['Delivery Date', so.delivery_date || '—'],
              ['Incoterms', `${so.incoterms} ${so.incoterms_location || ''}`],
              ['Payment Terms', so.payment_terms],
              ['Salesperson', so.salesperson || '—'],
              ['Territory', so.territory || '—'],
              ['Paid Amount', `$${(so.paid_amount || 0).toLocaleString()}`],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">{val}</p>
              </div>
            ))}
          </div>

          {so.items && so.items.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-700 mb-2">COMMODITY ITEMS</h3>
              <div className="space-y-2">
                {so.items.map(item => (
                  <div key={item.id} className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-700">{item.item_name}</p>
                      <p className="text-xs font-bold text-[#1E40AF]">${(item.amount || 0).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center space-x-4 mt-1.5 text-[10px] text-slate-500">
                      <span>Qty: {item.quantity} {item.uom}</span>
                      <span>Rate: ${item.rate?.toLocaleString()}/{item.uom}</span>
                      <span>Delivered: {item.delivered_qty || 0} {item.uom}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-[#1E40AF]/5 rounded-lg p-4 space-y-1.5">
            <div className="flex justify-between text-xs"><span className="text-slate-500">Subtotal</span><span className="font-bold">${(so.subtotal || 0).toLocaleString()}</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-500">Shipping</span><span className="font-bold">${(so.shipping_charges || 0).toLocaleString()}</span></div>
            <div className="flex justify-between text-sm border-t border-slate-200 pt-2 mt-2"><span className="font-bold text-slate-700">Grand Total</span><span className="font-bold text-[#1E40AF]">${(so.grand_total || 0).toLocaleString()}</span></div>
            <div className="flex justify-between text-xs text-amber-600 font-semibold"><span>Outstanding Balance</span><span>${(so.outstanding_amount || 0).toLocaleString()}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
