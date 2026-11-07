import React, { useState, useEffect } from 'react';
import {
  DollarSign, FileText, BookOpen, CreditCard, CheckCircle, Clock,
  Plus, Search, Filter, ChevronRight, Eye, Send, ArrowUpRight, ArrowDownLeft,
  BarChart2, Receipt, Building2, TrendingUp, AlertCircle, PieChart, Layers,
  Download, Printer, X
} from 'lucide-react';
import api from '../../services/api';
import DataTable from '../common/DataTable';
import DebitCreditNotesView from './DebitCreditNotesView';
import BuyerAgingReportView from './BuyerAgingReportView';


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

export default function FinanceView({ initialSubTab = 'dashboard' }) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || 'dashboard');

  useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab);
  }, [initialSubTab]);
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
  const [viewingPdfSO, setViewingPdfSO] = useState(null);
  const [viewingPdfInvoice, setViewingPdfInvoice] = useState(null);
  const [notification, setNotification] = useState(null);

  const notify = (type, msg) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

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
      notify('success', 'Sales Order created successfully.');
      loadData();
    }
  };

  const handleStatusUpdate = async (soId, newStatus) => {
    setSalesOrders(prev => prev.map(so => {
      if (so.id === soId) {
        const grandTotal = Number(so.grand_total || 0);
        let paid = Number(so.paid_amount || 0);
        let out = Number(so.outstanding_amount ?? (grandTotal - paid));
        if (newStatus === 'PARTIALLY_PAID') {
          paid = Number((grandTotal * 0.5).toFixed(2));
          out = Number((grandTotal - paid).toFixed(2));
        } else if (newStatus === 'PAID') {
          paid = grandTotal;
          out = 0.0;
        } else if (newStatus === 'CLOSED') {
          if (paid < grandTotal) {
            paid = grandTotal;
            out = 0.0;
          }
        } else if (newStatus === 'DRAFT') {
          paid = 0.0;
          out = grandTotal;
        }
        return { ...so, status: newStatus, paid_amount: paid, outstanding_amount: out };
      }
      return so;
    }));

    if (selectedSO && selectedSO.id === soId) {
      setSelectedSO(prev => {
        if (!prev) return null;
        const grandTotal = Number(prev.grand_total || 0);
        let paid = Number(prev.paid_amount || 0);
        let out = Number(prev.outstanding_amount ?? (grandTotal - paid));
        if (newStatus === 'PARTIALLY_PAID') {
          paid = Number((grandTotal * 0.5).toFixed(2));
          out = Number((grandTotal - paid).toFixed(2));
        } else if (newStatus === 'PAID') {
          paid = grandTotal;
          out = 0.0;
        } else if (newStatus === 'CLOSED') {
          if (paid < grandTotal) {
            paid = grandTotal;
            out = 0.0;
          }
        } else if (newStatus === 'DRAFT') {
          paid = 0.0;
          out = grandTotal;
        }
        return { ...prev, status: newStatus, paid_amount: paid, outstanding_amount: out };
      });
    }

    notify('success', `Sales Order status advanced to ${newStatus.replace(/_/g, ' ')}.`);

    try {
      const res = await api.updateSOStatus(soId, { status: newStatus });
      if (res && res.data) {
        setSalesOrders(prev => prev.map(so => so.id === soId ? { ...so, ...res.data } : so));
        if (selectedSO && selectedSO.id === soId) {
          setSelectedSO(prev => (prev ? { ...prev, ...res.data } : null));
        }
      } else {
        loadData();
      }
    } catch (e) {
      console.warn('API status update failed, updated locally:', e);
    }
  };

  const handleCreateInvoice = async (formData) => {
    const res = await api.createInvoice(formData);
    if (res) {
      setShowCreateInvoice(false);
      notify('success', 'Commercial Invoice generated successfully.');
      loadData();
    }
  };

  const handleRecordPayment = async (formData) => {
    const res = await api.createPayment(formData);
    if (res) {
      setShowRecordPayment(false);
      notify('success', 'Payment entry posted successfully.');
      loadData();
    }
  };

  const handleAddAccount = async (formData) => {
    const res = await api.createAccount(formData);
    if (res) {
      setShowAddAccount(false);
      notify('success', 'Account added to Chart of Accounts.');
      loadData();
    }
  };

  const handleExportSOCsv = (singleSO = null) => {
    const listToExport = singleSO ? [singleSO] : salesOrders;
    if (!listToExport || listToExport.length === 0) {
      notify('error', 'No sales orders to export.');
      return;
    }
    const headers = [
      'SO Number', 'Customer Name', 'Customer PO Ref', 'Order Date', 'Delivery Date',
      'Currency', 'Payment Terms', 'Incoterms', 'Incoterms Location', 'Salesperson',
      'Territory', 'Subtotal', 'Tax Amount', 'Shipping Charges', 'Grand Total',
      'Paid Amount', 'Outstanding Balance', 'Status', 'Items Count'
    ];
    const rows = listToExport.map(so => [
      `"${so.so_number || ''}"`,
      `"${(so.customer_name || '').replace(/"/g, '""')}"`,
      `"${so.customer_po_number || ''}"`,
      so.order_date || '',
      so.delivery_date || '',
      so.currency || 'USD',
      `"${so.payment_terms || ''}"`,
      so.incoterms || '',
      `"${so.incoterms_location || ''}"`,
      `"${so.salesperson || ''}"`,
      `"${so.territory || ''}"`,
      so.subtotal || 0,
      so.tax_amount || 0,
      so.shipping_charges || 0,
      so.grand_total || 0,
      so.paid_amount || 0,
      so.outstanding_amount || 0,
      so.status || '',
      so.items ? so.items.length : 0
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = singleSO
      ? `soilex_so_${singleSO.so_number || singleSO.id}_${new Date().toISOString().slice(0, 10)}.csv`
      : `soilex_sales_orders_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify('success', `Exported ${listToExport.length} sales order${listToExport.length > 1 ? 's' : ''} to CSV.`);
  };

  const handleExportInvoiceCsv = (singleInvoice = null) => {
    const listToExport = singleInvoice ? [singleInvoice] : invoices;
    if (!listToExport || listToExport.length === 0) {
      notify('error', 'No invoices to export.');
      return;
    }
    const headers = [
      'Invoice Number', 'SO Ref', 'Customer Name', 'Invoice Date', 'Due Date',
      'Payment Terms', 'Subtotal', 'Tax Amount', 'Grand Total', 'Paid Amount',
      'Outstanding Amount', 'Status', 'Remarks'
    ];
    const rows = listToExport.map(inv => [
      `"${inv.invoice_number || ''}"`,
      `"${inv.so_number || ''}"`,
      `"${(inv.customer_name || '').replace(/"/g, '""')}"`,
      inv.invoice_date || '',
      inv.due_date || '',
      `"${inv.payment_terms || ''}"`,
      inv.subtotal || inv.grand_total || 0,
      inv.tax_amount || 0,
      inv.grand_total || 0,
      inv.paid_amount || 0,
      inv.outstanding_amount || 0,
      inv.status || '',
      `"${(inv.remarks || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = singleInvoice
      ? `soilex_invoice_${singleInvoice.invoice_number || singleInvoice.id}_${new Date().toISOString().slice(0, 10)}.csv`
      : `soilex_sales_invoices_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify('success', `Exported ${listToExport.length} invoice${listToExport.length > 1 ? 's' : ''} to CSV.`);
  };

  const subTabs = [
    { id: 'dashboard', label: 'Financial Overview', icon: BarChart2 },
    { id: 'sales_orders', label: 'Sales Orders', icon: DollarSign },
    { id: 'invoices', label: 'Invoicing & AR', icon: Receipt },
    { id: 'notes', label: 'Debit & Credit Notes', icon: Layers },
    { id: 'buyer_aging', label: 'Buyer Aging Report', icon: TrendingUp },
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
              onViewPdf={setViewingPdfSO}
              onExportCsv={() => handleExportSOCsv()}
            />
          )}

          {activeSubTab === 'invoices' && (
            <InvoiceList
              invoices={invoices}
              salesOrders={salesOrders}
              onCreateNew={() => setShowCreateInvoice(true)}
              onViewPdf={setViewingPdfInvoice}
              onExportCsv={() => handleExportInvoiceCsv()}
            />
          )}

          {activeSubTab === 'notes' && <DebitCreditNotesView />}
          {activeSubTab === 'buyer_aging' && <BuyerAgingReportView />}

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
          onViewPdf={setViewingPdfSO}
        />
      )}

      {/* Official Sales Order PDF / Print Modal */}
      {viewingPdfSO && (
        <SalesOrderPDFModal
          so={viewingPdfSO}
          onClose={() => setViewingPdfSO(null)}
          onExportCsv={() => handleExportSOCsv(viewingPdfSO)}
        />
      )}

      {/* Official Sales Invoice PDF / Print Modal */}
      {viewingPdfInvoice && (
        <SalesInvoicePDFModal
          invoice={viewingPdfInvoice}
          onClose={() => setViewingPdfInvoice(null)}
          onExportCsv={() => handleExportInvoiceCsv(viewingPdfInvoice)}
        />
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed bottom-5 right-5 z-[200] px-4 py-3 rounded-lg shadow-xl border flex items-center space-x-2 text-xs font-bold no-print ${
          notification.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{notification.msg}</span>
        </div>
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

function SalesOrderList({ orders, onSelect, onStatusUpdate, onCreateNew, onViewPdf, onExportCsv }) {
  const [filter, setFilter] = useState('ALL');
  const statuses = ['ALL', 'DRAFT', 'CONFIRMED', 'PARTIALLY_DELIVERED', 'FULLY_DELIVERED', 'INVOICED', 'PARTIALLY_PAID', 'PAID', 'CLOSED', 'CANCELLED'];

  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.status === filter);

  const columns = [
    {
      key: 'so_number',
      header: 'SO NUMBER',
      render: (val, so) => (
        <button onClick={() => onSelect(so)} className="text-xs font-bold text-[#1E40AF] hover:underline font-mono">
          {val}
        </button>
      )
    },
    {
      key: 'customer_name',
      header: 'CUSTOMER',
      render: (val) => <strong className="text-slate-800 text-xs">{val}</strong>
    },
    {
      key: 'order_date',
      header: 'ORDER DATE',
      render: (val) => <span className="text-slate-600 text-xs font-mono">{val}</span>
    },
    {
      key: 'incoterms',
      header: 'INCOTERMS',
      render: (val) => (
        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
          {val}
        </span>
      )
    },
    {
      key: 'payment_terms',
      header: 'PAYMENT TERMS',
      render: (val) => <span className="text-slate-600 text-xs">{val}</span>
    },
    {
      key: 'grand_total',
      header: 'TOTAL (USD)',
      align: 'right',
      render: (val) => <span className="font-mono font-bold text-slate-800 text-xs">${(val || 0).toLocaleString()}</span>
    },
    {
      key: 'outstanding_amount',
      header: 'BALANCE DUE',
      align: 'right',
      render: (val) => <span className="font-mono font-bold text-amber-600 text-xs">${(val || 0).toLocaleString()}</span>
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (val) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_COLORS[val] || 'bg-slate-100'}`}>
          {val?.replace(/_/g, ' ')}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      sortable: false,
      render: (_, so) => (
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
          {so.status === 'DRAFT' && (
            <>
              <button
                onClick={() => onStatusUpdate(so.id, 'CONFIRMED')}
                className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition whitespace-nowrap"
                title="Confirm Order"
              >
                Confirm
              </button>
              <button
                onClick={() => onStatusUpdate(so.id, 'CANCELLED')}
                className="text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition whitespace-nowrap"
                title="Cancel Order"
              >
                Cancel
              </button>
            </>
          )}
          {so.status === 'CONFIRMED' && (
            <>
              <button
                onClick={() => onStatusUpdate(so.id, 'FULLY_DELIVERED')}
                className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition whitespace-nowrap"
                title="Deliver Shipment"
              >
                Deliver
              </button>
              <button
                onClick={() => onStatusUpdate(so.id, 'INVOICED')}
                className="text-[10px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded transition whitespace-nowrap"
                title="Direct to Invoiced"
              >
                Invoice
              </button>
              <button
                onClick={() => onStatusUpdate(so.id, 'CANCELLED')}
                className="text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition whitespace-nowrap"
                title="Cancel Order"
              >
                Cancel
              </button>
            </>
          )}
          {so.status === 'PARTIALLY_DELIVERED' && (
            <>
              <button
                onClick={() => onStatusUpdate(so.id, 'FULLY_DELIVERED')}
                className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition whitespace-nowrap"
                title="Complete Delivery"
              >
                Full Deliver
              </button>
              <button
                onClick={() => onStatusUpdate(so.id, 'INVOICED')}
                className="text-[10px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded transition whitespace-nowrap"
                title="Invoice Delivered"
              >
                Invoice
              </button>
            </>
          )}
          {so.status === 'FULLY_DELIVERED' && (
            <>
              <button
                onClick={() => onStatusUpdate(so.id, 'INVOICED')}
                className="text-[10px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded transition whitespace-nowrap"
                title="Generate Commercial Invoice"
              >
                Invoice
              </button>
              <button
                onClick={() => onStatusUpdate(so.id, 'PAID')}
                className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition whitespace-nowrap"
                title="Direct Mark Paid"
              >
                Mark Paid
              </button>
            </>
          )}
          {so.status === 'INVOICED' && (
            <>
              <button
                onClick={() => onStatusUpdate(so.id, 'PARTIALLY_PAID')}
                className="text-[10px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded transition whitespace-nowrap"
                title="Record Partial Payment (50%)"
              >
                Partial Paid
              </button>
              <button
                onClick={() => onStatusUpdate(so.id, 'PAID')}
                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition whitespace-nowrap"
                title="Record Full Settlement (100%)"
              >
                Mark Paid
              </button>
              <button
                onClick={() => onStatusUpdate(so.id, 'CANCELLED')}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition whitespace-nowrap"
                title="Cancel Order"
              >
                Cancel
              </button>
            </>
          )}
          {so.status === 'PARTIALLY_PAID' && (
            <>
              <button
                onClick={() => onStatusUpdate(so.id, 'PAID')}
                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition whitespace-nowrap"
                title="Settle Balance & Mark Full Paid (100%)"
              >
                Mark Full Paid
              </button>
              <button
                onClick={() => onStatusUpdate(so.id, 'CLOSED')}
                className="text-[10px] font-bold text-slate-600 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition whitespace-nowrap"
                title="Close Short Settlement"
              >
                Close
              </button>
              <button
                onClick={() => onStatusUpdate(so.id, 'CANCELLED')}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition whitespace-nowrap"
                title="Cancel Balance"
              >
                Cancel
              </button>
            </>
          )}
          {so.status === 'PAID' && (
            <button
              onClick={() => onStatusUpdate(so.id, 'CLOSED')}
              className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition whitespace-nowrap"
              title="Close Completed Order"
            >
              Close
            </button>
          )}
          {so.status === 'CLOSED' && (
            <button
              onClick={() => onStatusUpdate(so.id, 'DRAFT')}
              className="text-[10px] font-bold text-slate-600 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition whitespace-nowrap"
              title="Reopen Order as Draft"
            >
              Reopen
            </button>
          )}
          {so.status === 'CANCELLED' && (
            <button
              onClick={() => onStatusUpdate(so.id, 'DRAFT')}
              className="text-[10px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded transition whitespace-nowrap"
              title="Reopen Order"
            >
              Reopen
            </button>
          )}
          <button
            onClick={() => onSelect(so)}
            className="text-[10px] font-bold text-slate-500 hover:text-[#1E40AF] bg-slate-50 hover:bg-blue-50 px-2 py-1 rounded transition"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {onViewPdf && (
            <button
              onClick={() => onViewPdf(so)}
              className="text-[10px] font-bold text-[#1E40AF] hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition flex items-center space-x-1"
              title="View & Download PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
              filter === s
                ? 'bg-[#1E40AF] text-white shadow-sm'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-[#1E40AF] hover:text-[#1E40AF]'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        title="Sales_Orders_Registry"
        searchPlaceholder="Search SO #, customer, incoterms, status..."
        onAdd={onCreateNew}
        addLabel="+ New Sales Order"
      />
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// 3. INVOICE & ACCOUNTS RECEIVABLE
// ═══════════════════════════════════════════════════════════

function InvoiceList({ invoices, salesOrders, onCreateNew, onViewPdf, onExportCsv }) {
  const columns = [
    {
      key: 'invoice_number',
      header: 'INVOICE NUMBER',
      render: (val) => <span className="font-mono font-bold text-[#1E40AF] text-xs">{val}</span>
    },
    {
      key: 'so_number',
      header: 'SO REF',
      render: (val) => <span className="font-mono text-xs font-semibold text-slate-600">{val || '—'}</span>
    },
    {
      key: 'customer_name',
      header: 'CUSTOMER',
      render: (val) => <strong className="text-slate-700 text-xs">{val}</strong>
    },
    {
      key: 'invoice_date',
      header: 'INVOICE DATE',
      render: (val) => <span className="font-mono text-xs text-slate-600">{val}</span>
    },
    {
      key: 'due_date',
      header: 'DUE DATE',
      render: (val) => <span className="font-mono text-xs text-slate-600">{val}</span>
    },
    {
      key: 'grand_total',
      header: 'TOTAL (USD)',
      align: 'right',
      render: (val) => <span className="font-mono font-bold text-slate-800 text-xs">${(val || 0).toLocaleString()}</span>
    },
    {
      key: 'paid_amount',
      header: 'PAID AMOUNT',
      align: 'right',
      render: (val) => <span className="font-mono font-semibold text-emerald-600 text-xs">${(val || 0).toLocaleString()}</span>
    },
    {
      key: 'outstanding_amount',
      header: 'BALANCE DUE',
      align: 'right',
      render: (val) => <span className="font-mono font-bold text-amber-600 text-xs">${(val || 0).toLocaleString()}</span>
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (val) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_COLORS[val] || 'bg-slate-100'}`}>
          {val}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      sortable: false,
      render: (_, inv) => (
        onViewPdf ? (
          <button
            onClick={() => onViewPdf(inv)}
            className="text-[10px] font-bold text-[#1E40AF] hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded transition flex items-center space-x-1"
            title="View & Download PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        ) : null
      )
    }
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={invoices}
        title="Commercial_Invoices_Registry"
        searchPlaceholder="Search invoice #, SO ref, customer..."
        onAdd={onCreateNew}
        addLabel="+ Generate Invoice"
      />
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

  const coaColumns = [
    {
      key: 'account_code',
      header: 'ACCOUNT CODE',
      render: (val) => <span className="font-mono font-bold text-slate-700 text-xs">{val}</span>
    },
    {
      key: 'account_name',
      header: 'ACCOUNT NAME',
      render: (val, acc) => (
        <span className={`text-xs ${acc.is_group ? 'font-bold text-slate-900' : 'text-slate-800'} ${acc.parent_account ? 'ml-4' : ''}`}>
          {acc.is_group ? '📁 ' : '📄 '}
          {val}
        </span>
      )
    },
    {
      key: 'account_type',
      header: 'TYPE',
      render: (val) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${ACCOUNT_TYPE_COLORS[val] || 'bg-slate-50'}`}>
          {val}
        </span>
      )
    },
    {
      key: 'currency',
      header: 'CURRENCY',
      render: (val) => <span className="text-xs text-slate-500 font-mono">{val}</span>
    },
    {
      key: 'balance',
      header: 'BALANCE (USD)',
      align: 'right',
      render: (val) => <span className="font-mono font-bold text-slate-800 text-xs">${(val || 0).toLocaleString()}</span>
    },
    {
      key: 'status',
      header: 'STATUS',
      align: 'center',
      render: () => <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Active</span>
    }
  ];

  const glColumns = [
    {
      key: 'entry_number',
      header: 'ENTRY #',
      render: (val) => <span className="font-mono font-bold text-[#1E40AF] text-xs">{val}</span>
    },
    {
      key: 'entry_date',
      header: 'DATE',
      render: (val) => <span className="font-mono text-xs text-slate-600">{val}</span>
    },
    {
      key: 'account_name',
      header: 'ACCOUNT NAME',
      render: (val) => <strong className="text-xs text-slate-800">{val}</strong>
    },
    {
      key: 'party_name',
      header: 'PARTY / ENTITY',
      render: (val) => <span className="text-xs text-slate-600">{val || '—'}</span>
    },
    {
      key: 'reference_type',
      header: 'REFERENCE',
      render: (val, je) => <span className="text-[10px] text-slate-500 font-mono">{val} #{je.reference_id}</span>
    },
    {
      key: 'debit',
      header: 'DEBIT (USD)',
      align: 'right',
      render: (val) => val > 0 ? <span className="font-mono font-bold text-emerald-600 text-xs">${val.toLocaleString()}</span> : '—'
    },
    {
      key: 'credit',
      header: 'CREDIT (USD)',
      align: 'right',
      render: (val) => val > 0 ? <span className="font-mono font-bold text-rose-600 text-xs">${val.toLocaleString()}</span> : '—'
    },
    {
      key: 'narration',
      header: 'NARRATION',
      render: (val) => <span className="text-xs text-slate-500 block truncate max-w-xs">{val}</span>
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setActiveTab('coa')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'coa'
              ? 'bg-[#1E40AF] text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Chart of Accounts ({accounts.length})
        </button>
        <button
          onClick={() => setActiveTab('gl')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'gl'
              ? 'bg-[#1E40AF] text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Journal Entries &amp; GL ({journalEntries.length})
        </button>
      </div>

      {activeTab === 'coa' ? (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            {['ALL', 'Asset', 'Liability', 'Equity', 'Income', 'Expense'].map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                  typeFilter === t
                    ? 'bg-[#1E40AF] text-white shadow-sm'
                    : 'bg-white text-slate-500 border border-slate-200 hover:text-[#1E40AF]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <DataTable
            columns={coaColumns}
            data={filteredAccounts}
            title="Chart_of_Accounts"
            searchPlaceholder="Search account code, name, type..."
            onAdd={onAddAccount}
            addLabel="+ Add GL Account"
          />
        </div>
      ) : (
        <DataTable
          columns={glColumns}
          data={journalEntries}
          title="General_Ledger_Journal_Entries"
          searchPlaceholder="Search entry #, account, party, narration..."
        />
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// 5. PAYMENT ENTRIES
// ═══════════════════════════════════════════════════════════

function PaymentList({ payments, invoices, onCreateNew }) {
  const columns = [
    {
      key: 'payment_number',
      header: 'PAYMENT #',
      render: (val) => <span className="font-mono font-bold text-[#1E40AF] text-xs">{val}</span>
    },
    {
      key: 'payment_type',
      header: 'TYPE',
      render: (val) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
          val === 'RECEIVE' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'
        }`}>
          {val}
        </span>
      )
    },
    {
      key: 'party_name',
      header: 'PARTY / ENTITY',
      render: (val) => <strong className="text-slate-700 text-xs">{val}</strong>
    },
    {
      key: 'payment_date',
      header: 'PAYMENT DATE',
      render: (val) => <span className="font-mono text-xs text-slate-600">{val}</span>
    },
    {
      key: 'mode_of_payment',
      header: 'MODE',
      render: (val) => <span className="text-xs text-slate-600">{val}</span>
    },
    {
      key: 'paid_amount',
      header: 'AMOUNT (USD)',
      align: 'right',
      render: (val) => <span className="font-mono font-bold text-slate-800 text-xs">${(val || 0).toLocaleString()}</span>
    },
    {
      key: 'reference_no',
      header: 'REFERENCE UTR/LC',
      render: (val) => <span className="font-mono text-xs text-slate-500">{val || '—'}</span>
    },
    {
      key: 'allocated_invoice_number',
      header: 'ALLOCATED INVOICE',
      render: (val) => <span className="font-mono text-xs text-[#1E40AF] font-bold">{val || '—'}</span>
    },
    {
      key: 'status',
      header: 'STATUS',
      align: 'center',
      render: () => <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Settled</span>
    }
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={payments}
        title="Payment_Entries_and_Settlements"
        searchPlaceholder="Search payment #, party, mode, UTR..."
        onAdd={onCreateNew}
        addLabel="+ Record Payment"
      />
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// MODALS & DRAWERS
// ═══════════════════════════════════════════════════════════

function CreateSOModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    customer_name: '', customer_po_number: '', order_date: new Date().toISOString().split('T')[0],
    delivery_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    currency: 'USD', payment_terms: 'LC at Sight',
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
              <label className="text-[10px] font-bold text-slate-500 uppercase">Customer PO Ref #</label>
              <input value={form.customer_po_number} onChange={e => setForm(f => ({ ...f, customer_po_number: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs" placeholder="e.g. PO-CUST-8839" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Order Date *</label>
              <input type="date" value={form.order_date} onChange={e => setForm(f => ({ ...f, order_date: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Expected Delivery Date *</label>
              <input type="date" value={form.delivery_date} onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value }))}
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
              <div className="grid grid-cols-2 gap-2 mt-1">
                <select value={form.incoterms} onChange={e => setForm(f => ({ ...f, incoterms: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs">
                  {['FOB', 'CIF', 'CFR', 'EXW', 'DDP'].map(i => <option key={i}>{i}</option>)}
                </select>
                <input value={form.incoterms_location} onChange={e => setForm(f => ({ ...f, incoterms_location: e.target.value }))}
                  placeholder="Port / Location" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" />
              </div>
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


function SODetailDrawer({ so, onClose, onStatusUpdate, onViewPdf }) {
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
          <div className="flex items-center space-x-2">
            {onViewPdf && (
              <button
                onClick={() => onViewPdf(so)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition shadow-sm"
                title="View & Download PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Official PDF</span>
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
          </div>
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

          {/* Order Lifecycle Actions */}
          <div className="border-t border-slate-200 pt-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Order Lifecycle Actions</p>
            <div className="flex flex-wrap gap-2">
              {so.status === 'DRAFT' && (
                <>
                  <button
                    onClick={() => onStatusUpdate(so.id, 'CONFIRMED')}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                  >
                    Confirm Order
                  </button>
                  <button
                    onClick={() => onStatusUpdate(so.id, 'CANCELLED')}
                    className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                  >
                    Cancel Order
                  </button>
                </>
              )}
              {so.status === 'CONFIRMED' && (
                <>
                  <button
                    onClick={() => onStatusUpdate(so.id, 'FULLY_DELIVERED')}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
                  >
                    Mark Fully Delivered
                  </button>
                  <button
                    onClick={() => onStatusUpdate(so.id, 'INVOICED')}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition"
                  >
                    Direct to Invoiced
                  </button>
                  <button
                    onClick={() => onStatusUpdate(so.id, 'CANCELLED')}
                    className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                  >
                    Cancel Order
                  </button>
                </>
              )}
              {so.status === 'PARTIALLY_DELIVERED' && (
                <>
                  <button
                    onClick={() => onStatusUpdate(so.id, 'FULLY_DELIVERED')}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
                  >
                    Mark Fully Delivered
                  </button>
                  <button
                    onClick={() => onStatusUpdate(so.id, 'INVOICED')}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition"
                  >
                    Generate Invoice
                  </button>
                </>
              )}
              {so.status === 'FULLY_DELIVERED' && (
                <>
                  <button
                    onClick={() => onStatusUpdate(so.id, 'INVOICED')}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition"
                  >
                    Generate Commercial Invoice
                  </button>
                  <button
                    onClick={() => onStatusUpdate(so.id, 'PAID')}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
                  >
                    Mark Paid
                  </button>
                  <button
                    onClick={() => onStatusUpdate(so.id, 'CANCELLED')}
                    className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                  >
                    Cancel Order
                  </button>
                </>
              )}
              {so.status === 'INVOICED' && (
                <>
                  <button
                    onClick={() => onStatusUpdate(so.id, 'PAID')}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
                  >
                    Mark Full Paid
                  </button>
                  <button
                    onClick={() => onStatusUpdate(so.id, 'PARTIALLY_PAID')}
                    className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                  >
                    Mark Partial Paid
                  </button>
                  <button
                    onClick={() => onStatusUpdate(so.id, 'CLOSED')}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  >
                    Close Order
                  </button>
                </>
              )}
              {so.status === 'PARTIALLY_PAID' && (
                <>
                  <button
                    onClick={() => onStatusUpdate(so.id, 'PAID')}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
                  >
                    Settle Balance & Mark Full Paid (100%)
                  </button>
                  <button
                    onClick={() => onStatusUpdate(so.id, 'CLOSED')}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  >
                    Close Order
                  </button>
                  <button
                    onClick={() => onStatusUpdate(so.id, 'CANCELLED')}
                    className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                  >
                    Cancel Balance
                  </button>
                </>
              )}
              {so.status === 'PAID' && (
                <button
                  onClick={() => onStatusUpdate(so.id, 'CLOSED')}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition"
                >
                  Close Completed Order
                </button>
              )}
              {so.status === 'CLOSED' && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded">✓ Completed & Closed</span>
                  <button
                    onClick={() => onStatusUpdate(so.id, 'DRAFT')}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  >
                    Reopen as Draft
                  </button>
                </div>
              )}
              {so.status === 'CANCELLED' && (
                <button
                  onClick={() => onStatusUpdate(so.id, 'DRAFT')}
                  className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                >
                  Reopen as Draft
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// OFFICIAL SALES ORDER PDF MODAL
// ═══════════════════════════════════════════════════════════

function SalesOrderPDFModal({ so, onClose, onExportCsv }) {
  if (!so) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Top Bar (no-print) */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 no-print">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#1E40AF] text-white rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Commercial Sales Order &amp; Export Contract</h2>
              <p className="text-[11px] text-slate-500 font-medium">Official trade confirmation for international delivery</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onExportCsv && onExportCsv(so)}
              className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition"
              title="Download CSV for this Sales Order"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto flex-1 font-sans bg-white print-document">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-[#1E40AF] pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tight text-[#1E40AF]">SOILEX</span>
                <span className="text-xs font-bold text-[#D97706] tracking-widest uppercase mt-1">LIFE SCIENCE LTD</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Agricultural Commodities, Spices, Extracts &amp; Global Trade</p>
              <div className="text-[10px] text-slate-400 mt-2 space-y-0.5">
                <p>Hanoi HQ: Charmvit Tower, 117 Tran Duy Hung, Cau Giay, Hanoi, Vietnam</p>
                <p>Export Terminal: Dinh Vu Industrial Logistics Hub, Hai An, Haiphong</p>
                <p>Tax / VAT Reg: <strong>VN-0108928374</strong> • Tel: +84 (24) 3782-9900 • Web: www.soilex.vn</p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-[#1E40AF] text-white text-xs font-black uppercase tracking-wider rounded">
                SALES ORDER
              </span>
              <p className="text-base font-black text-slate-800 font-mono mt-2">{so.so_number}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Order Date: <span className="font-semibold text-slate-700">{so.order_date}</span></p>
              <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_COLORS[so.status] || 'bg-slate-100'}`}>
                STATUS: {so.status?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Customer & Contract Info Grid */}
          <div className="grid grid-cols-2 gap-6 my-6 text-xs">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#1E40AF] mb-2">BUYER / CLIENT INFORMATION</p>
              <p className="text-sm font-bold text-slate-800">{so.customer_name}</p>
              <div className="text-[11px] text-slate-600 mt-2 space-y-1">
                <p><span className="text-slate-400">Customer PO Ref:</span> <strong>{so.customer_po_number || 'Direct Contract'}</strong></p>
                <p><span className="text-slate-400">Territory / Destination:</span> <strong>{so.territory || 'International'}</strong></p>
                <p><span className="text-slate-400">Sales Executive:</span> <strong>{so.salesperson || 'Vũ Thị Hoan'}</strong></p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#1E40AF] mb-2">COMMERCIAL &amp; SHIPPING TERMS</p>
              <div className="text-[11px] text-slate-600 space-y-1">
                <p><span className="text-slate-400">Incoterms 2020:</span> <strong>{so.incoterms} {so.incoterms_location || ''}</strong></p>
                <p><span className="text-slate-400">Payment Terms:</span> <strong>{so.payment_terms || 'LC at Sight'}</strong></p>
                <p><span className="text-slate-400">Target Delivery Date:</span> <strong>{so.delivery_date || 'As scheduled'}</strong></p>
                <p><span className="text-slate-400">Settlement Currency:</span> <strong>{so.currency || 'USD'}</strong></p>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3 text-left w-10">#</th>
                  <th className="py-2.5 px-3 text-left">Commodity / Product Grade</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-center">UOM</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate ({so.currency || 'USD'})</th>
                  <th className="py-2.5 px-3 text-right">Disc %</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(so.items && so.items.length > 0 ? so.items : [{
                  item_name: 'Standard Commodity Consignment',
                  quantity: 1,
                  uom: 'Lot',
                  rate: so.subtotal || so.grand_total,
                  discount_percent: 0,
                  amount: so.subtotal || so.grand_total
                }]).map((item, idx) => {
                  const lineAmt = item.amount || (item.quantity * item.rate * (1 - (item.discount_percent || 0) / 100));
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-800">{item.item_name}</p>
                        {item.warehouse && <p className="text-[10px] text-slate-400">Origin Warehouse: {item.warehouse}</p>}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-700">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-center font-medium text-slate-500">{item.uom}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700 font-mono">${(item.rate || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">{item.discount_percent ? `${item.discount_percent}%` : '—'}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">${lineAmt.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals & Notes */}
          <div className="grid grid-cols-2 gap-6 items-start mb-8 text-xs">
            <div className="space-y-3">
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-[11px] text-blue-900 leading-relaxed">
                <p className="font-bold mb-1 text-[10px] uppercase tracking-wider text-blue-800">Export Remittance &amp; Banking Details</p>
                <div className="space-y-0.5 text-[10px] text-slate-700">
                  <p><span className="text-slate-400">Beneficiary:</span> <strong>SOILEX Life Science Ltd</strong></p>
                  <p><span className="text-slate-400">Bank:</span> <strong>ICICI / HDFC Forex Settlement Branch</strong></p>
                  <p><span className="text-slate-400">SWIFT / BIC:</span> <strong className="font-mono">SLXVNVX</strong> • <span className="text-slate-400">Account:</span> <strong className="font-mono">0829-1100-2938-USD</strong></p>
                </div>
              </div>

              {so.remarks && (
                <div className="text-[11px] text-slate-500">
                  <span className="font-bold text-slate-700">Contract Notes: </span>{so.remarks}
                </div>
              )}
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Contract Subtotal:</span>
                <span className="font-semibold font-mono">${(so.subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping &amp; Ocean Freight:</span>
                <span className="font-semibold font-mono">${(so.shipping_charges || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-black text-[#1E40AF] border-t border-slate-200 pt-2 mt-2">
                <span>Grand Total (USD):</span>
                <span className="font-mono">${(so.grand_total || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-700 font-semibold border-t border-slate-100 pt-1">
                <span>Realized Collections:</span>
                <span className="font-mono">${(so.paid_amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-amber-600 font-bold">
                <span>Outstanding Balance:</span>
                <span className="font-mono">${(so.outstanding_amount || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Signatures & Seal Block */}
          <div className="pt-6 border-t border-slate-200 flex items-end justify-between text-xs">
            <div className="space-y-1">
              <div className="w-36 h-12 border-b border-slate-400 mb-1 flex items-center justify-center italic text-slate-400 text-[10px]">
                [Authorized Signatory]
              </div>
              <p className="font-bold text-slate-800">Vu Thi Hoan</p>
              <p className="text-slate-500 text-[11px]">Senior Commercial Director</p>
              <p className="text-slate-400 text-[10px]">SOILEX Life Science Ltd</p>
            </div>

            {/* Corporate Seal Emblem */}
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#1E40AF]/40 flex flex-col items-center justify-center p-1 text-center text-[#1E40AF] select-none">
              <Building2 className="w-5 h-5 text-[#1E40AF]/60" />
              <span className="text-[7px] font-black uppercase mt-0.5 tracking-tighter">SOILEX SEAL</span>
              <span className="text-[6px] font-semibold text-slate-400">COMMERCIAL</span>
            </div>

            <div className="space-y-1 text-right">
              <div className="w-36 h-12 border-b border-slate-400 mb-1 ml-auto flex items-center justify-center italic text-slate-400 text-[10px]">
                [Buyer Acceptance]
              </div>
              <p className="font-bold text-slate-800">{so.customer_name}</p>
              <p className="text-slate-500 text-[11px]">Authorized Purchasing Representative</p>
              <p className="text-slate-400 text-[10px]">Official Client Counterpart</p>
            </div>
          </div>

          <div className="text-center text-[9px] text-slate-400 border-t border-slate-100 pt-3 mt-6">
            Generated via SOILEX Life Science Enterprise ERP • Document Hash: {so.id}-COMM-EXPORT-VALIDATED
          </div>
        </div>

        {/* Modal Footer (no-print) */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between no-print">
          <span className="text-xs text-slate-500">
            Click <strong>Print / Save as PDF</strong> to generate high-resolution A4 document or print to PDF.
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white"
            >
              Close
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow flex items-center space-x-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// OFFICIAL COMMERCIAL TAX INVOICE PDF MODAL
// ═══════════════════════════════════════════════════════════

function SalesInvoicePDFModal({ invoice, onClose, onExportCsv }) {
  if (!invoice) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Top Bar (no-print) */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 no-print">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#1E40AF] text-white rounded-lg">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Commercial Tax Invoice &amp; Payment Statement</h2>
              <p className="text-[11px] text-slate-500 font-medium">Legally binding tax bill for export and customs reconciliation</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onExportCsv && onExportCsv(invoice)}
              className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition"
              title="Download CSV for this Invoice"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto flex-1 font-sans bg-white print-document">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-[#1E40AF] pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tight text-[#1E40AF]">SOILEX</span>
                <span className="text-xs font-bold text-[#D97706] tracking-widest uppercase mt-1">LIFE SCIENCE LTD</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Agricultural Commodities, Spices, Extracts &amp; Global Trade</p>
              <div className="text-[10px] text-slate-400 mt-2 space-y-0.5">
                <p>Hanoi HQ: Charmvit Tower, 117 Tran Duy Hung, Cau Giay, Hanoi, Vietnam</p>
                <p>Haiphong Maritime Logistics Hub: Dinh Vu Industrial Zone, Hai An, Haiphong</p>
                <p>Tax / VAT Reg: <strong>VN-0108928374</strong> • Tel: +84 (24) 3782-9900 • finance@soilex.vn</p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-[#1E40AF] text-white text-xs font-black uppercase tracking-wider rounded">
                COMMERCIAL INVOICE
              </span>
              <p className="text-base font-black text-slate-800 font-mono mt-2">{invoice.invoice_number}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Invoice Date: <span className="font-semibold text-slate-700">{invoice.invoice_date}</span></p>
              <p className="text-[11px] text-slate-500">Payment Due: <span className="font-bold text-red-600">{invoice.due_date}</span></p>
              <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_COLORS[invoice.status] || 'bg-slate-100'}`}>
                {invoice.status}
              </span>
            </div>
          </div>

          {/* Customer & Billing Info Grid */}
          <div className="grid grid-cols-2 gap-6 my-6 text-xs">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#1E40AF] mb-2">BILLED TO (BUYER / CONSIGNEE)</p>
              <p className="text-sm font-bold text-slate-800">{invoice.customer_name}</p>
              <div className="text-[11px] text-slate-600 mt-2 space-y-1">
                <p><span className="text-slate-400">Associated Sales Order:</span> <strong className="font-mono">{invoice.so_number || 'Direct Invoice'}</strong></p>
                <p><span className="text-slate-400">Payment Terms:</span> <strong>{invoice.payment_terms || 'Net 30 Days'}</strong></p>
                <p><span className="text-slate-400">Settlement Currency:</span> <strong>USD ($)</strong></p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#1E40AF] mb-2">SWIFT WIRE SETTLEMENT DETAILS</p>
              <div className="text-[11px] text-slate-600 space-y-1">
                <p><span className="text-slate-400">Beneficiary Name:</span> <strong>SOILEX Life Science Ltd</strong></p>
                <p><span className="text-slate-400">Settlement Bank:</span> <strong>Standard Chartered Bank / HDFC Forex</strong></p>
                <p><span className="text-slate-400">SWIFT / BIC:</span> <strong className="font-mono">SCBLVNVX</strong></p>
                <p><span className="text-slate-400">Forex Remittance IBAN:</span> <strong className="font-mono">8829-4402-9912-USD</strong></p>
              </div>
            </div>
          </div>

          {/* Billed Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3 text-left w-10">#</th>
                  <th className="py-2.5 px-3 text-left">Commodity / Billing Description</th>
                  <th className="py-2.5 px-3 text-right">Billed Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate</th>
                  <th className="py-2.5 px-3 text-right">Tax Rate</th>
                  <th className="py-2.5 px-3 text-right">Net Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(invoice.items && invoice.items.length > 0 ? invoice.items : [{
                  item_name: `Billed Consignment as per SO ${invoice.so_number || ''}`,
                  quantity: 1,
                  rate: invoice.subtotal || invoice.grand_total,
                  tax_rate: 0,
                  amount: invoice.subtotal || invoice.grand_total
                }]).map((item, idx) => {
                  const lineAmt = item.amount || (item.quantity * item.rate);
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-800">{item.item_name}</p>
                        {item.description && <p className="text-[10px] text-slate-400">{item.description}</p>}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-700">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700 font-mono">${(item.rate || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">{item.tax_rate ? `${item.tax_rate}%` : '0%'}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">${lineAmt.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals & Aging */}
          <div className="grid grid-cols-2 gap-6 items-start mb-8 text-xs">
            <div className="space-y-3">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-900 leading-relaxed">
                <p className="font-bold mb-1 text-[10px] uppercase tracking-wider text-emerald-800">Commercial Tax Compliance</p>
                <p className="text-[10px] text-emerald-800">
                  This document serves as an official electronic Commercial Tax Invoice under the General Department of Taxation regulations. Payment must be transferred strictly into the nominated corporate bank account above.
                </p>
              </div>

              {invoice.remarks && (
                <div className="text-[11px] text-slate-500">
                  <span className="font-bold text-slate-700">Remarks: </span>{invoice.remarks}
                </div>
              )}
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Subtotal:</span>
                <span className="font-semibold font-mono">${(invoice.subtotal || invoice.grand_total || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax / Duty (0% Export Zero-Rated):</span>
                <span className="font-semibold font-mono">${(invoice.tax_amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-black text-[#1E40AF] border-t border-slate-200 pt-2 mt-2">
                <span>Invoice Total:</span>
                <span className="font-mono">${(invoice.grand_total || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-700 font-semibold border-t border-slate-100 pt-1">
                <span>Amount Paid:</span>
                <span className="font-mono">${(invoice.paid_amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-amber-600 font-bold">
                <span>Outstanding Balance Due:</span>
                <span className="font-mono">${(invoice.outstanding_amount || invoice.grand_total || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Signatures & Seal Block */}
          <div className="pt-6 border-t border-slate-200 flex items-end justify-between text-xs">
            <div className="space-y-1">
              <div className="w-36 h-12 border-b border-slate-400 mb-1 flex items-center justify-center italic text-slate-400 text-[10px]">
                [Digital Authorization]
              </div>
              <p className="font-bold text-slate-800">Tran Thi Mai</p>
              <p className="text-slate-500 text-[11px]">Chief Financial Officer</p>
              <p className="text-slate-400 text-[10px]">SOILEX Life Science Ltd</p>
            </div>

            {/* Corporate Seal Emblem */}
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#1E40AF]/40 flex flex-col items-center justify-center p-1 text-center text-[#1E40AF] select-none">
              <Building2 className="w-5 h-5 text-[#1E40AF]/60" />
              <span className="text-[7px] font-black uppercase mt-0.5 tracking-tighter">SOILEX SEAL</span>
              <span className="text-[6px] font-semibold text-slate-400">FINANCE / TAX</span>
            </div>

            <div className="space-y-1 text-right">
              <div className="w-36 h-12 border-b border-slate-400 mb-1 ml-auto flex items-center justify-center italic text-slate-400 text-[10px]">
                [Accounts Receivable Stamp]
              </div>
              <p className="font-bold text-slate-800">Ho Chi Minh Treasury</p>
              <p className="text-slate-500 text-[11px]">Financial Clearing &amp; Audit</p>
              <p className="text-slate-400 text-[10px]">Document Hash: {invoice.id}-TAX-VALID</p>
            </div>
          </div>

          <div className="text-center text-[9px] text-slate-400 border-t border-slate-100 pt-3 mt-6">
            Official E-Invoice generated by SOILEX Life Science ERP • Recognized by Vietnam General Department of Taxation
          </div>
        </div>

        {/* Modal Footer (no-print) */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between no-print">
          <span className="text-xs text-slate-500">
            Click <strong>Print / Save as PDF</strong> to generate high-resolution A4 document or print to PDF.
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white"
            >
              Close
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow flex items-center space-x-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
