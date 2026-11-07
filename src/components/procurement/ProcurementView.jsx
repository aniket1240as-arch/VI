import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Package, FileText, Truck, CheckCircle, XCircle, Clock,
  Plus, Search, Filter, ChevronDown, ChevronRight, Eye, Send, ArrowRight,
  AlertTriangle, TrendingUp, DollarSign, BarChart2, ClipboardList,
  Download, Printer, Building2, X
} from 'lucide-react';
import api from '../../services/api';
import DataTable from '../common/DataTable';

const STATUS_COLORS = {
  DRAFT: 'bg-slate-100 text-slate-700',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  REJECTED: 'bg-red-100 text-red-700',
  SENT: 'bg-indigo-100 text-indigo-700',
  PARTIALLY_RECEIVED: 'bg-orange-100 text-orange-700',
  FULLY_RECEIVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-gray-100 text-gray-500',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-amber-100 text-amber-700',
  ACCEPTED: 'bg-green-100 text-green-700',
};

const INCOTERMS = ['FOB', 'CIF', 'CFR', 'EXW', 'DDP', 'FCA'];
const CURRENCIES = ['USD', 'EUR', 'INR', 'VND', 'AED'];
const PAYMENT_TERMS_LIST = ['Net 30', 'Net 60', 'Advance / Escrow', 'CAD', 'LC at Sight', 'TT Wire'];

export default function ProcurementView({ initialSubTab = 'dashboard' }) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || 'dashboard');

  useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab);
  }, [initialSubTab]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [grns, setGrns] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPO, setSelectedPO] = useState(null);
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [showCreateGRN, setShowCreateGRN] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewingPdfPO, setViewingPdfPO] = useState(null);
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
    const [posData, grnsData, summaryData] = await Promise.all([
      api.getPurchaseOrders(),
      api.getGRNs(),
      api.getProcurementSummary(),
    ]);
    if (posData) setPurchaseOrders(posData);
    if (grnsData) setGrns(grnsData);
    if (summaryData) setSummary(summaryData);
    setLoading(false);
  };

  const handleCreatePO = async (formData) => {
    const result = await api.createPurchaseOrder(formData);
    if (result) {
      setShowCreatePO(false);
      notify('success', 'Purchase Order created successfully.');
      loadData();
    }
  };

  const handleStatusUpdate = async (poId, newStatus) => {
    setPurchaseOrders(prev => prev.map(po => po.id === poId ? { ...po, status: newStatus } : po));
    if (selectedPO && selectedPO.id === poId) {
      setSelectedPO(prev => (prev ? { ...prev, status: newStatus } : null));
    }
    notify('success', `Purchase Order status updated to ${newStatus.replace(/_/g, ' ')}.`);

    try {
      const result = await api.updatePOStatus(poId, { status: newStatus });
      if (result) {
        loadData();
      }
    } catch (e) {
      console.warn('API status update failed, updated locally:', e);
    }
  };

  const handleCreateGRN = async (formData) => {
    const result = await api.createGRN(formData);
    if (result) {
      setShowCreateGRN(false);
      notify('success', 'Goods Receipt Note created successfully.');
      loadData();
    }
  };

  const handleExportPOCsv = (singlePO = null) => {
    const listToExport = singlePO ? [singlePO] : filteredPOs;
    if (!listToExport || listToExport.length === 0) {
      notify('error', 'No purchase orders to export.');
      return;
    }
    const headers = [
      'PO Number', 'Supplier Name', 'Order Date', 'Delivery Date', 'Currency',
      'Incoterms', 'Incoterms Location', 'Delivery Warehouse', 'Payment Terms',
      'Subtotal', 'Tax Amount', 'Shipping Charges', 'Grand Total', 'Status',
      'Approval Status', 'Approved By', 'Items Count'
    ];
    const rows = listToExport.map(po => [
      `"${po.po_number || ''}"`,
      `"${(po.supplier_name || '').replace(/"/g, '""')}"`,
      po.order_date || '',
      po.expected_delivery_date || '',
      po.currency || 'USD',
      po.incoterms || '',
      `"${po.incoterms_location || ''}"`,
      `"${(po.delivery_warehouse || '').replace(/"/g, '""')}"`,
      `"${po.payment_terms || ''}"`,
      po.subtotal || 0,
      po.tax_amount || 0,
      po.shipping_charges || 0,
      po.grand_total || 0,
      po.status || '',
      po.approval_status || '',
      `"${po.approved_by || ''}"`,
      po.items ? po.items.length : 0
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = singlePO
      ? `soilex_po_${singlePO.po_number || singlePO.id}_${new Date().toISOString().slice(0, 10)}.csv`
      : `soilex_purchase_orders_${statusFilter}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify('success', `Exported ${listToExport.length} purchase order${listToExport.length > 1 ? 's' : ''} to CSV.`);
  };

  const filteredPOs = statusFilter === 'ALL'
    ? purchaseOrders
    : purchaseOrders.filter(po => po.status === statusFilter);

  const subTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { id: 'purchase_orders', label: 'Purchase Orders', icon: ShoppingCart },
    { id: 'grn', label: 'Goods Receipts', icon: Package },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Sub-Navigation */}
      <div className="flex items-center space-x-1 bg-white rounded-xl shadow-sm border border-slate-200 p-1.5">
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
          {activeSubTab === 'dashboard' && <ProcurementDashboard summary={summary} onNavigate={setActiveSubTab} />}
          {activeSubTab === 'purchase_orders' && (
            <PurchaseOrderList
              orders={filteredPOs}
              statusFilter={statusFilter}
              onFilterChange={setStatusFilter}
              onSelect={setSelectedPO}
              onStatusUpdate={handleStatusUpdate}
              onCreateNew={() => setShowCreatePO(true)}
              onViewPdf={setViewingPdfPO}
              onExportCsv={() => handleExportPOCsv()}
            />
          )}
          {activeSubTab === 'grn' && (
            <GRNList
              grns={grns}
              purchaseOrders={purchaseOrders}
              onCreateNew={() => setShowCreateGRN(true)}
            />
          )}
        </>
      )}

      {/* Create PO Modal */}
      {showCreatePO && (
        <CreatePOModal onClose={() => setShowCreatePO(false)} onSubmit={handleCreatePO} />
      )}

      {/* Create GRN Modal */}
      {showCreateGRN && (
        <CreateGRNModal
          purchaseOrders={purchaseOrders.filter(po => ['APPROVED', 'SENT', 'PARTIALLY_RECEIVED'].includes(po.status))}
          onClose={() => setShowCreateGRN(false)}
          onSubmit={handleCreateGRN}
        />
      )}

      {/* PO Detail Drawer */}
      {selectedPO && (
        <PODetailDrawer
          po={selectedPO}
          onClose={() => setSelectedPO(null)}
          onStatusUpdate={handleStatusUpdate}
          onViewPdf={setViewingPdfPO}
        />
      )}

      {/* Official PO PDF / Print Modal */}
      {viewingPdfPO && (
        <PurchaseOrderPDFModal
          po={viewingPdfPO}
          onClose={() => setViewingPdfPO(null)}
          onExportCsv={() => handleExportPOCsv(viewingPdfPO)}
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


// ═══════════ PROCUREMENT DASHBOARD ═══════════

function ProcurementDashboard({ summary, onNavigate }) {
  if (!summary) return null;

  const kpis = [
    { label: 'Total Purchase Orders', value: summary.total_pos, icon: ShoppingCart, color: 'text-[#1E40AF]', bg: 'bg-blue-50' },
    { label: 'Open PO Value', value: `$${(summary.open_po_value || 0).toLocaleString()}`, icon: DollarSign, color: 'text-[#D97706]', bg: 'bg-amber-50' },
    { label: 'Pending Approvals', value: summary.pending_approvals, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Total Spend', value: `$${(summary.total_spend || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'GRNs This Month', value: summary.grns_this_month, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Active Suppliers', value: summary.suppliers_active, icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{kpi.value}</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* PO Status Distribution & Recent POs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4">PO STATUS DISTRIBUTION</h3>
          <div className="space-y-3">
            {Object.entries(summary.pos_by_status || {}).map(([status, count]) => {
              const total = summary.total_pos || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-600'}`}>
                      {status.replace(/_/g, ' ')}
                    </span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-[#1E40AF] h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-600 ml-3 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent POs */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700">RECENT PURCHASE ORDERS</h3>
            <button
              onClick={() => onNavigate('purchase_orders')}
              className="text-xs font-semibold text-[#1E40AF] hover:underline flex items-center"
            >
              View All <ChevronRight className="w-3 h-3 ml-1" />
            </button>
          </div>
          <div className="space-y-2.5">
            {(summary.recent_pos || []).map(po => (
              <div key={po.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs font-bold text-slate-700">{po.po_number}</p>
                  <p className="text-[10px] text-slate-500">{po.supplier_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-700">${(po.grand_total || 0).toLocaleString()}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${STATUS_COLORS[po.status] || 'bg-slate-100'}`}>
                    {po.status?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══════════ PURCHASE ORDER LIST ═══════════

function PurchaseOrderList({ orders, statusFilter, onFilterChange, onSelect, onStatusUpdate, onCreateNew, onViewPdf, onExportCsv }) {
  const statusOptions = ['ALL', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CLOSED', 'CANCELLED'];

  const columns = [
    {
      key: 'po_number',
      header: 'PO NUMBER',
      render: (val, row) => (
        <button
          onClick={() => onSelect(row)}
          className="text-xs font-bold text-[#1E40AF] hover:underline font-mono"
        >
          {val}
        </button>
      )
    },
    {
      key: 'supplier_name',
      header: 'SUPPLIER',
      render: (val) => <span className="font-semibold text-slate-800 truncate block max-w-[200px]">{val}</span>
    },
    {
      key: 'order_date',
      header: 'ORDER DATE',
      render: (val) => <span className="font-mono text-slate-600">{val}</span>
    },
    {
      key: 'expected_delivery_date',
      header: 'DELIVERY',
      render: (val) => <span className="font-mono text-slate-600">{val || '—'}</span>
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
      key: 'grand_total',
      header: 'TOTAL VALUE',
      align: 'right',
      render: (val) => <span className="font-bold text-slate-900 font-mono">${(val || 0).toLocaleString()}</span>
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (val) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${STATUS_COLORS[val] || 'bg-slate-100 text-slate-700'}`}>
          {val?.replace(/_/g, ' ')}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      sortable: false,
      render: (_, po) => (
        <div className="flex items-center space-x-1 flex-wrap gap-y-1">
          {po.status === 'DRAFT' && (
            <>
              <button
                onClick={() => onStatusUpdate(po.id, 'PENDING_APPROVAL')}
                className="text-[10px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded transition whitespace-nowrap"
                title="Submit for Approval"
              >
                Submit
              </button>
              <button
                onClick={() => onStatusUpdate(po.id, 'CANCELLED')}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition whitespace-nowrap"
                title="Cancel PO"
              >
                Cancel
              </button>
            </>
          )}
          {po.status === 'PENDING_APPROVAL' && (
            <>
              <button
                onClick={() => onStatusUpdate(po.id, 'APPROVED')}
                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition whitespace-nowrap"
                title="Approve PO"
              >
                Approve
              </button>
              <button
                onClick={() => onStatusUpdate(po.id, 'REJECTED')}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition whitespace-nowrap"
                title="Reject PO"
              >
                Reject
              </button>
            </>
          )}
          {po.status === 'APPROVED' && (
            <button
              onClick={() => onStatusUpdate(po.id, 'SENT')}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition whitespace-nowrap"
              title="Mark as Sent to Supplier"
            >
              Send
            </button>
          )}
          <button
            onClick={() => onViewPdf(po)}
            className="text-[10px] font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition whitespace-nowrap"
            title="View Official Purchase Order PDF"
          >
            PDF
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Purchase Orders</h2>
          <p className="text-xs text-slate-500 mt-0.5">{orders.length} purchase orders recorded</p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center space-x-2 px-4 py-2 bg-[#1E40AF] text-white rounded-lg text-xs font-bold hover:bg-blue-800 transition shadow-sm"
        >
          <Plus className="w-4 h-4 text-[#FDE68A]" />
          <span>NEW PURCHASE ORDER</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2 flex-wrap">
        {statusOptions.map(s => (
          <button
            key={s}
            onClick={() => onFilterChange(s)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
              statusFilter === s
                ? 'bg-[#1E40AF] text-white'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-[#1E40AF] hover:text-[#1E40AF]'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Production Universal DataTable */}
      <DataTable
        columns={columns}
        data={orders}
        title="Purchase_Orders_Registry"
        searchPlaceholder="Search PO #, supplier, incoterms, total..."
        onAdd={onCreateNew}
        addLabel="+ New PO"
      />
    </div>
  );
}


// ═══════════ GRN LIST ═══════════

function GRNList({ grns, purchaseOrders, onCreateNew }) {
  const grnColumns = [
    {
      key: 'grn_number',
      header: 'GRN NUMBER',
      render: (val) => <span className="text-xs font-bold text-[#1E40AF] font-mono">{val}</span>
    },
    {
      key: 'po_number',
      header: 'PO REFERENCE',
      render: (val) => <span className="font-mono font-semibold text-slate-700">{val}</span>
    },
    {
      key: 'supplier_name',
      header: 'SUPPLIER',
      render: (val) => <span className="font-semibold text-slate-800">{val}</span>
    },
    {
      key: 'receipt_date',
      header: 'RECEIPT DATE',
      render: (val) => <span className="font-mono text-slate-600">{val}</span>
    },
    {
      key: 'receiving_warehouse',
      header: 'WAREHOUSE HUB',
      render: (val) => <span className="text-slate-700 font-medium">{val}</span>
    },
    {
      key: 'transporter',
      header: 'TRANSPORTER',
      render: (val) => <span className="text-slate-600">{val || '—'}</span>
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (val) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${STATUS_COLORS[val] || 'bg-slate-100 text-slate-700'}`}>
          {val}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Goods Receipt Notes</h2>
          <p className="text-xs text-slate-500 mt-0.5">{grns.length} receipts recorded</p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center space-x-2 px-4 py-2 bg-[#1E40AF] text-white rounded-lg text-xs font-bold hover:bg-blue-800 transition shadow-sm"
        >
          <Plus className="w-4 h-4 text-[#FDE68A]" />
          <span>NEW GRN</span>
        </button>
      </div>

      <DataTable
        columns={grnColumns}
        data={grns}
        title="Goods_Receipt_Notes_Registry"
        searchPlaceholder="Search GRN #, PO ref, supplier, warehouse..."
        onAdd={onCreateNew}
        addLabel="+ New GRN"
      />

      {/* GRN Items Detail */}
      {grns.filter(g => g.items && g.items.length > 0).map(grn => (
        <div key={grn.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h4 className="text-xs font-bold text-slate-700 mb-3">{grn.grn_number} — Line Items</h4>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Item', 'Ordered', 'Received', 'Accepted', 'Rejected', 'Batch', 'Quality'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[10px] font-bold text-slate-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grn.items.map(item => (
                <tr key={item.id} className="border-b border-slate-50">
                  <td className="px-3 py-2 text-xs font-semibold text-slate-700">{item.item_name}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{item.ordered_qty} {item.uom}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{item.received_qty} {item.uom}</td>
                  <td className="px-3 py-2 text-xs font-bold text-green-600">{item.accepted_qty}</td>
                  <td className="px-3 py-2 text-xs font-bold text-red-600">{item.rejected_qty}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">{item.batch_no || '—'}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_COLORS[item.quality_status] || 'bg-slate-100'}`}>
                      {item.quality_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}


// ═══════════ CREATE PO MODAL ═══════════

function CreatePOModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    supplier_name: '', order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '', currency: 'USD', exchange_rate: 1.0,
    payment_terms: 'Net 30', incoterms: 'FOB', incoterms_location: '',
    delivery_warehouse: 'Hanoi HQ', remarks: '',
    items: [{ item_name: '', quantity: 0, uom: 'MT', rate: 0, discount_percent: 0, quality_grade: '' }]
  });

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { item_name: '', quantity: 0, uom: 'MT', rate: 0, discount_percent: 0, quality_grade: '' }] }));
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx, field, val) => {
    setForm(f => ({
      ...f,
      items: f.items.map((item, i) => i === idx ? { ...item, [field]: field === 'quantity' || field === 'rate' || field === 'discount_percent' ? parseFloat(val) || 0 : val } : item)
    }));
  };

  const subtotal = form.items.reduce((sum, i) => sum + (i.quantity * i.rate * (1 - i.discount_percent / 100)), 0);

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-start justify-center pt-10 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 mb-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-800">Create Purchase Order</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Header Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Supplier Name *</label>
              <input value={form.supplier_name} onChange={e => setForm(f => ({ ...f, supplier_name: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent" placeholder="Enter supplier name" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Order Date *</label>
              <input type="date" value={form.order_date} onChange={e => setForm(f => ({ ...f, order_date: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Expected Delivery</label>
              <input type="date" value={form.expected_delivery_date} onChange={e => setForm(f => ({ ...f, expected_delivery_date: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Currency</label>
              <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Payment Terms</label>
              <select value={form.payment_terms} onChange={e => setForm(f => ({ ...f, payment_terms: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs">
                {PAYMENT_TERMS_LIST.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Incoterms</label>
              <select value={form.incoterms} onChange={e => setForm(f => ({ ...f, incoterms: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs">
                {INCOTERMS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Delivery Warehouse</label>
              <input value={form.delivery_warehouse} onChange={e => setForm(f => ({ ...f, delivery_warehouse: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Remarks</label>
              <input value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs" placeholder="Internal notes" />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-700">LINE ITEMS</h3>
              <button onClick={addItem} className="text-[10px] font-bold text-[#1E40AF] hover:underline flex items-center">
                <Plus className="w-3 h-3 mr-1" /> Add Item
              </button>
            </div>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    {['Item Name', 'Qty', 'UOM', 'Rate', 'Disc %', 'Amount', ''].map(h => (
                      <th key={h} className="text-left px-2 py-2 text-[10px] font-bold text-slate-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, idx) => (
                    <tr key={idx} className="border-t border-slate-100">
                      <td className="px-2 py-1.5">
                        <input value={item.item_name} onChange={e => updateItem(idx, 'item_name', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs" placeholder="Item name" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)}
                          className="w-16 px-2 py-1.5 border border-slate-200 rounded text-xs" />
                      </td>
                      <td className="px-2 py-1.5">
                        <select value={item.uom} onChange={e => updateItem(idx, 'uom', e.target.value)}
                          className="px-2 py-1.5 border border-slate-200 rounded text-xs">
                          {['MT', 'KG', 'Bags', 'Units'].map(u => <option key={u}>{u}</option>)}
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

          {/* Total */}
          <div className="flex justify-end">
            <div className="bg-slate-50 rounded-lg px-6 py-3 text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Grand Total</p>
              <p className="text-xl font-bold text-[#1E40AF]">${subtotal.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
          <button
            onClick={() => onSubmit(form)}
            disabled={!form.supplier_name || form.items.every(i => !i.item_name)}
            className="px-6 py-2.5 bg-[#1E40AF] text-white rounded-lg text-xs font-bold hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
          >
            Create Purchase Order
          </button>
        </div>
      </div>
    </div>
  );
}


// ═══════════ CREATE GRN MODAL ═══════════

function CreateGRNModal({ purchaseOrders, onClose, onSubmit }) {
  const [selectedPO, setSelectedPO] = useState('');
  const [form, setForm] = useState({
    receipt_date: new Date().toISOString().split('T')[0],
    receiving_warehouse: 'Hanoi HQ', transporter: '', vehicle_no: '', remarks: '', items: []
  });

  const handlePOSelect = (poId) => {
    setSelectedPO(poId);
    const po = purchaseOrders.find(p => p.id === poId);
    if (po && po.items) {
      setForm(f => ({
        ...f,
        items: po.items.map(item => ({
          po_item_id: item.id, item_code: item.item_code, item_name: item.item_name,
          ordered_qty: item.quantity, received_qty: 0, accepted_qty: 0, rejected_qty: 0,
          uom: item.uom, batch_no: '', quality_status: 'PENDING'
        }))
      }));
    }
  };

  const updateItem = (idx, field, val) => {
    setForm(f => ({
      ...f,
      items: f.items.map((item, i) => i === idx ? { ...item, [field]: ['received_qty', 'accepted_qty', 'rejected_qty'].includes(field) ? parseFloat(val) || 0 : val } : item)
    }));
  };

  const po = purchaseOrders.find(p => p.id === selectedPO);

  const handleSubmit = () => {
    if (!po) return;
    onSubmit({
      po_id: po.id, po_number: po.po_number, supplier_id: po.supplier_id,
      supplier_name: po.supplier_name, ...form
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-start justify-center pt-10 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 mb-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-800">Create Goods Receipt Note</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Select Purchase Order *</label>
              <select value={selectedPO} onChange={e => handlePOSelect(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs">
                <option value="">— Select PO —</option>
                {purchaseOrders.map(po => (
                  <option key={po.id} value={po.id}>{po.po_number} — {po.supplier_name} (${po.grand_total?.toLocaleString()})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Receipt Date</label>
              <input type="date" value={form.receipt_date} onChange={e => setForm(f => ({ ...f, receipt_date: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Receiving Warehouse</label>
              <input value={form.receiving_warehouse} onChange={e => setForm(f => ({ ...f, receiving_warehouse: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Transporter</label>
              <input value={form.transporter} onChange={e => setForm(f => ({ ...f, transporter: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs" placeholder="Transport company" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Vehicle No.</label>
              <input value={form.vehicle_no} onChange={e => setForm(f => ({ ...f, vehicle_no: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs" />
            </div>
          </div>

          {form.items.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-700 mb-2">RECEIVE ITEMS</h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      {['Item', 'Ordered', 'Received Qty', 'Accepted', 'Rejected', 'Batch No'].map(h => (
                        <th key={h} className="text-left px-2 py-2 text-[10px] font-bold text-slate-400 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, idx) => (
                      <tr key={idx} className="border-t border-slate-100">
                        <td className="px-2 py-1.5 text-xs font-semibold text-slate-700">{item.item_name}</td>
                        <td className="px-2 py-1.5 text-xs text-slate-600">{item.ordered_qty} {item.uom}</td>
                        <td className="px-2 py-1.5">
                          <input type="number" value={item.received_qty} onChange={e => updateItem(idx, 'received_qty', e.target.value)}
                            className="w-16 px-2 py-1.5 border border-slate-200 rounded text-xs" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" value={item.accepted_qty} onChange={e => updateItem(idx, 'accepted_qty', e.target.value)}
                            className="w-16 px-2 py-1.5 border border-slate-200 rounded text-xs" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" value={item.rejected_qty} onChange={e => updateItem(idx, 'rejected_qty', e.target.value)}
                            className="w-16 px-2 py-1.5 border border-slate-200 rounded text-xs" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input value={item.batch_no} onChange={e => updateItem(idx, 'batch_no', e.target.value)}
                            className="w-24 px-2 py-1.5 border border-slate-200 rounded text-xs" placeholder="LOT-..." />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!selectedPO || form.items.length === 0}
            className="px-6 py-2.5 bg-[#1E40AF] text-white rounded-lg text-xs font-bold hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
          >
            Submit GRN
          </button>
        </div>
      </div>
    </div>
  );
}


// ═══════════ PO DETAIL DRAWER ═══════════

function PODetailDrawer({ po, onClose, onStatusUpdate, onViewPdf }) {
  return (
    <div className="fixed inset-0 bg-black/30 z-[100] flex justify-end">
      <div className="w-full max-w-lg bg-white shadow-2xl h-full overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-slate-800">{po.po_number}</h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_COLORS[po.status]}`}>
              {po.status?.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {onViewPdf && (
              <button
                onClick={() => onViewPdf(po)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition shadow-sm"
                title="View & Print Official PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Official PDF</span>
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Supplier', po.supplier_name],
              ['Order Date', po.order_date],
              ['Delivery', po.expected_delivery_date || '—'],
              ['Currency', po.currency],
              ['Payment Terms', po.payment_terms],
              ['Incoterms', `${po.incoterms} ${po.incoterms_location || ''}`],
              ['Warehouse', po.delivery_warehouse],
              ['Approval', po.approval_status],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">{val}</p>
              </div>
            ))}
          </div>

          {/* Line Items */}
          {po.items && po.items.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-700 mb-2">LINE ITEMS</h3>
              <div className="space-y-2">
                {po.items.map(item => (
                  <div key={item.id} className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-700">{item.item_name}</p>
                      <p className="text-xs font-bold text-[#1E40AF]">${(item.amount || 0).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center space-x-4 mt-1.5 text-[10px] text-slate-500">
                      <span>Qty: {item.quantity} {item.uom}</span>
                      <span>Rate: ${item.rate?.toLocaleString()}/{item.uom}</span>
                      <span>Received: {item.received_qty || 0} {item.uom}</span>
                      {item.quality_grade && <span>Grade: {item.quality_grade}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="bg-[#1E40AF]/5 rounded-lg p-4 space-y-1.5">
            <div className="flex justify-between text-xs"><span className="text-slate-500">Subtotal</span><span className="font-bold">${(po.subtotal || 0).toLocaleString()}</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-500">Tax</span><span className="font-bold">${(po.tax_amount || 0).toLocaleString()}</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-500">Shipping</span><span className="font-bold">${(po.shipping_charges || 0).toLocaleString()}</span></div>
            <div className="flex justify-between text-sm border-t border-slate-200 pt-2 mt-2"><span className="font-bold text-slate-700">Grand Total</span><span className="font-bold text-[#1E40AF]">${(po.grand_total || 0).toLocaleString()}</span></div>
          </div>

          {po.remarks && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Remarks</p>
              <p className="text-xs text-slate-600">{po.remarks}</p>
            </div>
          )}

          {/* Lifecycle Action Bar */}
          <div className="border-t border-slate-200 pt-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">PO Lifecycle Actions</p>
            <div className="flex flex-wrap gap-2">
              {po.status === 'DRAFT' && (
                <>
                  <button
                    onClick={() => onStatusUpdate(po.id, 'PENDING_APPROVAL')}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition"
                  >
                    Submit for Approval
                  </button>
                  <button
                    onClick={() => onStatusUpdate(po.id, 'CANCELLED')}
                    className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                  >
                    Cancel PO
                  </button>
                </>
              )}
              {po.status === 'PENDING_APPROVAL' && (
                <>
                  <button
                    onClick={() => onStatusUpdate(po.id, 'APPROVED')}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
                  >
                    Approve PO
                  </button>
                  <button
                    onClick={() => onStatusUpdate(po.id, 'REJECTED')}
                    className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                  >
                    Reject PO
                  </button>
                  <button
                    onClick={() => onStatusUpdate(po.id, 'CANCELLED')}
                    className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                  >
                    Cancel PO
                  </button>
                </>
              )}
              {po.status === 'APPROVED' && (
                <>
                  <button
                    onClick={() => onStatusUpdate(po.id, 'SENT')}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition flex items-center space-x-1"
                  >
                    <Send className="w-3.5 h-3.5 mr-1" />
                    <span>Send to Supplier</span>
                  </button>
                  <button
                    onClick={() => onStatusUpdate(po.id, 'FULLY_RECEIVED')}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
                  >
                    Receive Full Shipment
                  </button>
                  <button
                    onClick={() => onStatusUpdate(po.id, 'PARTIALLY_RECEIVED')}
                    className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                  >
                    Receive Partial
                  </button>
                  <button
                    onClick={() => onStatusUpdate(po.id, 'CANCELLED')}
                    className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                  >
                    Cancel PO
                  </button>
                </>
              )}
              {po.status === 'SENT' && (
                <>
                  <button
                    onClick={() => onStatusUpdate(po.id, 'PARTIALLY_RECEIVED')}
                    className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                  >
                    Receive Partial Shipment
                  </button>
                  <button
                    onClick={() => onStatusUpdate(po.id, 'FULLY_RECEIVED')}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
                  >
                    Receive Full Shipment
                  </button>
                  <button
                    onClick={() => onStatusUpdate(po.id, 'CANCELLED')}
                    className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                  >
                    Cancel PO
                  </button>
                </>
              )}
              {po.status === 'PARTIALLY_RECEIVED' && (
                <>
                  <button
                    onClick={() => onStatusUpdate(po.id, 'FULLY_RECEIVED')}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
                  >
                    Receive Remaining (Full)
                  </button>
                  <button
                    onClick={() => onStatusUpdate(po.id, 'CLOSED')}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  >
                    Close Order
                  </button>
                  <button
                    onClick={() => onStatusUpdate(po.id, 'CANCELLED')}
                    className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                  >
                    Cancel Balance
                  </button>
                </>
              )}
              {po.status === 'FULLY_RECEIVED' && (
                <>
                  <button
                    onClick={() => onStatusUpdate(po.id, 'CLOSED')}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition"
                  >
                    Close Completed PO
                  </button>
                  <button
                    onClick={() => onStatusUpdate(po.id, 'CANCELLED')}
                    className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </>
              )}
              {po.status === 'REJECTED' && (
                <>
                  <button
                    onClick={() => onStatusUpdate(po.id, 'DRAFT')}
                    className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                  >
                    Reopen as Draft
                  </button>
                  <button
                    onClick={() => onStatusUpdate(po.id, 'CANCELLED')}
                    className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                  >
                    Cancel PO
                  </button>
                </>
              )}
              {po.status === 'CANCELLED' && (
                <button
                  onClick={() => onStatusUpdate(po.id, 'DRAFT')}
                  className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                >
                  Reopen as Draft
                </button>
              )}
              {po.status === 'CLOSED' && (
                <span className="text-xs text-slate-400 italic">This purchase order is completed and closed.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// OFFICIAL PURCHASE ORDER PDF MODAL
// ═══════════════════════════════════════════════════════════

function PurchaseOrderPDFModal({ po, onClose, onExportCsv }) {
  if (!po) return null;

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
              <h2 className="text-sm font-bold text-slate-900">Official Purchase Order &amp; Procurement Document</h2>
              <p className="text-[11px] text-slate-500 font-medium">Verified commercial agreement for agricultural commodities</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onExportCsv && onExportCsv(po)}
              className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition"
              title="Download CSV for this PO"
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
                <p>Maritime Logistics: Dinh Vu Industrial Logistics Hub, Hai An, Haiphong</p>
                <p>Tax / VAT Reg: <strong>VN-0108928374</strong> • Tel: +84 (24) 3782-9900 • Web: www.soilex.vn</p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-[#1E40AF] text-white text-xs font-black uppercase tracking-wider rounded">
                PURCHASE ORDER
              </span>
              <p className="text-base font-black text-slate-800 font-mono mt-2">{po.po_number}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Order Date: <span className="font-semibold text-slate-700">{po.order_date}</span></p>
              <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_COLORS[po.status] || 'bg-slate-100'}`}>
                STATUS: {po.status?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Supplier & Delivery Info Grid */}
          <div className="grid grid-cols-2 gap-6 my-6 text-xs">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#1E40AF] mb-2">VENDOR / SUPPLIER DETAILS</p>
              <p className="text-sm font-bold text-slate-800">{po.supplier_name}</p>
              <div className="text-[11px] text-slate-600 mt-2 space-y-1">
                <p><span className="text-slate-400">Payment Terms:</span> <strong>{po.payment_terms || 'Net 30'}</strong></p>
                <p><span className="text-slate-400">Currency:</span> <strong>{po.currency || 'USD'}</strong></p>
                <p><span className="text-slate-400">Order Reference:</span> <span className="font-mono">{po.id}</span></p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#1E40AF] mb-2">DELIVERY &amp; LOGISTICS INSTRUCTIONS</p>
              <div className="text-[11px] text-slate-600 space-y-1">
                <p><span className="text-slate-400">Receiving Warehouse:</span> <strong>{po.delivery_warehouse || 'Haiphong Port Warehouse'}</strong></p>
                <p><span className="text-slate-400">Expected Delivery:</span> <strong>{po.expected_delivery_date || 'Prompt / As per schedule'}</strong></p>
                <p><span className="text-slate-400">Incoterms:</span> <strong>{po.incoterms} {po.incoterms_location || ''}</strong></p>
                <p><span className="text-slate-400">Approval Signoff:</span> <strong>{po.approval_status || 'APPROVED'}</strong> {po.approved_by ? `(by ${po.approved_by})` : ''}</p>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3 text-left w-10">#</th>
                  <th className="py-2.5 px-3 text-left">Item Description / Commodity Grade</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-center">UOM</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate ({po.currency || 'USD'})</th>
                  <th className="py-2.5 px-3 text-right">Disc %</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(po.items && po.items.length > 0 ? po.items : [{
                  item_name: 'Commodity Consignment Lot',
                  quantity: 1,
                  uom: 'Lot',
                  rate: po.subtotal || po.grand_total,
                  discount_percent: 0,
                  amount: po.subtotal || po.grand_total
                }]).map((item, idx) => {
                  const lineAmt = item.amount || (item.quantity * item.rate * (1 - (item.discount_percent || 0) / 100));
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-800">{item.item_name}</p>
                        {item.quality_grade && <p className="text-[10px] text-slate-400">Grade: {item.quality_grade}</p>}
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
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 leading-relaxed">
                <p className="font-bold mb-1 text-[10px] uppercase tracking-wider text-amber-800">Commercial &amp; Quality Mandate</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-amber-800">
                  <li>Goods must strictly adhere to contractual export specifications (ASTA / FAO standards).</li>
                  <li>Original Certificate of Analysis (COA) &amp; Phytosanitary certificate required at arrival.</li>
                  <li>Final acceptance subject to QA sampling and Goods Receipt Note (GRN) signoff.</li>
                </ul>
              </div>

              {po.remarks && (
                <div className="text-[11px] text-slate-500">
                  <span className="font-bold text-slate-700">Remarks: </span>{po.remarks}
                </div>
              )}
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({po.currency || 'USD'}):</span>
                <span className="font-semibold font-mono">${(po.subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax / Duty Amount:</span>
                <span className="font-semibold font-mono">${(po.tax_amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Freight &amp; Handling:</span>
                <span className="font-semibold font-mono">${(po.shipping_charges || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-black text-[#1E40AF] border-t border-slate-200 pt-2 mt-2">
                <span>Net Purchase Total:</span>
                <span className="font-mono">${(po.grand_total || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Signatures & Seal Block */}
          <div className="pt-6 border-t border-slate-200 flex items-end justify-between text-xs">
            <div className="space-y-1">
              <div className="w-36 h-12 border-b border-slate-400 mb-1 flex items-center justify-center italic text-slate-400 text-[10px]">
                [Digital Authorization]
              </div>
              <p className="font-bold text-slate-800">Nguyen Van Binh</p>
              <p className="text-slate-500 text-[11px]">Head of Global Procurement</p>
              <p className="text-slate-400 text-[10px]">SOILEX Life Science Ltd</p>
            </div>

            {/* Corporate Seal Emblem */}
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#1E40AF]/40 flex flex-col items-center justify-center p-1 text-center text-[#1E40AF] select-none">
              <Building2 className="w-5 h-5 text-[#1E40AF]/60" />
              <span className="text-[7px] font-black uppercase mt-0.5 tracking-tighter">SOILEX SEAL</span>
              <span className="text-[6px] font-semibold text-slate-400">PROCUREMENT</span>
            </div>

            <div className="space-y-1 text-right">
              <div className="w-36 h-12 border-b border-slate-400 mb-1 ml-auto flex items-center justify-center italic text-slate-400 text-[10px]">
                [Authorized Approval]
              </div>
              <p className="font-bold text-slate-800">Dr. Nguyen Minh Triet</p>
              <p className="text-slate-500 text-[11px]">Executive Vice President</p>
              <p className="text-slate-400 text-[10px]">Supply Chain &amp; Corporate Affairs</p>
            </div>
          </div>

          <div className="text-center text-[9px] text-slate-400 border-t border-slate-100 pt-3 mt-6">
            Generated via SOILEX Life Science Enterprise ERP • Document Hash: {po.id}-SLX-SECURE-VERIFIED
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
