import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Plus,
  Search,
  Filter,
  Download,
  Ship,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  CheckCircle2,
  Briefcase,
  DollarSign,
  Container,
  FileText
} from 'lucide-react';
import api from '../../services/api';
import DataTable from '../common/DataTable';

const TABS = [
  { id: 'executions', label: 'PO Milestone Execution', icon: Ship },
  { id: 'documents', label: 'Document Submissions', icon: FileSpreadsheet },
  { id: 'claims', label: 'Delivery Claims', icon: AlertCircle },
];

export default function OrderExecutionView({ initialTab = 'executions' }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'executions');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);
  const [executions, setExecutions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [claims, setClaims] = useState([]);
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    totalValueUsd: 0,
    completed: 0,
    inProcess: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formExec, setFormExec] = useState({
    po_no: '',
    date: new Date().toISOString().split('T')[0],
    supplier_name: '',
    purchase_manager: 'Nguyen Thu Ha',
    contract_no: '',
    quantity_mt: '',
    total_amount: '',
    currency: 'USD',
    execution_status: 'IN_PROCESS',
    container_no: '',
    bl_no: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'executions') {
        const res = await api.getOrderExecutions(statusFilter, search);
        if (res.success && res.data) {
          setExecutions(res.data.executions || []);
          if (res.data.metrics) setMetrics(res.data.metrics);
        }
      } else if (activeTab === 'documents') {
        const res = await api.getDocumentSubmissions(statusFilter, search);
        if (res.success && res.data) {
          setDocuments(res.data || []);
        }
      } else if (activeTab === 'claims') {
        const res = await api.getDeliveryClaims(statusFilter, search);
        if (res.success && res.data) {
          setClaims(res.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching operations data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, statusFilter, search]);

  const handleCreateExecution = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formExec,
        quantity_mt: parseFloat(formExec.quantity_mt || 0),
        total_amount: parseFloat(formExec.total_amount || 0)
      };
      const res = await api.createOrderExecution(payload);
      if (res.success) {
        setIsModalOpen(false);
        setFormExec({
          po_no: '',
          date: new Date().toISOString().split('T')[0],
          supplier_name: '',
          purchase_manager: 'Nguyen Thu Ha',
          contract_no: '',
          quantity_mt: '',
          total_amount: '',
          currency: 'USD',
          execution_status: 'IN_PROCESS',
          container_no: '',
          bl_no: ''
        });
        loadData();
      }
    } catch (err) {
      console.error('Error registering execution milestone:', err);
    }
  };

  const exportCSV = () => {
    let rows = [];
    if (activeTab === 'executions') {
      rows = executions.map(e => ({
        'PO No': e.po_no,
        'Date': e.date,
        'Supplier': e.supplier_name,
        'Manager': e.purchase_manager,
        'Contract': e.contract_no,
        'Qty (MT)': e.quantity_mt,
        'Total ($)': e.total_amount,
        'Status': e.execution_status,
        'Container': e.container_no,
        'BL No': e.bl_no
      }));
    } else if (activeTab === 'documents') {
      rows = documents.map(d => ({
        'Submission No': d.submission_no,
        'Date': d.date,
        'Ref PO': d.ref_no,
        'Contract': d.contract_no,
        'Supplier': d.supplier_name,
        'Document Types': d.document_types,
        'Status': d.status,
        'Reviewer': d.reviewer
      }));
    } else {
      rows = claims.map(c => ({
        'Claim No': c.claim_no,
        'Date': c.date,
        'Delivery Ref': c.delivery_ref,
        'Customer': c.customer_name,
        'Amount ($)': c.claim_amount,
        'Reason': c.reason,
        'Status': c.status
      }));
    }

    if (!rows.length) return;
    const headers = Object.keys(rows[0]).join(',');
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows.map(r => Object.values(r).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `operations_${activeTab}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Ship className="w-7 h-7 text-blue-700" />
            Operations & Order Execution
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            End-to-end import purchase milestone tracking, shipping compliance documents, and customer delivery claims.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Execution Milestone
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Monitored Contracts</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalOrders} <span className="text-sm font-medium text-slate-500">POs</span></h3>
            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" />
              Active purchase orders in cycle
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-700">
            <Container className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">In-Process Shipments</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{metrics.inProcess}</h3>
            <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              High seas or customs inspection
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <Ship className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Completed Port Deliveries</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{metrics.completed}</h3>
            <p className="text-xs text-emerald-700 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Customs cleared & GRN generated
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <FileCheck2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Milestone Trade Value</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">${metrics.totalValueUsd.toLocaleString()}</h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-blue-700" />
              Total PO portfolio under execution
            </p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-700">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 flex flex-wrap gap-1 p-2 bg-slate-50/50">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Table */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Loading operations data...
          </div>
        ) : activeTab === 'executions' ? (
          <DataTable
            className="border-0 shadow-none rounded-t-none"
            columns={[
              {
                key: 'po_no',
                header: 'PO NUMBER',
                render: (val) => <span className="font-mono font-bold text-blue-700">{val}</span>
              },
              {
                key: 'date',
                header: 'DATE',
                render: (val) => <span className="font-mono text-slate-500 text-xs">{val}</span>
              },
              {
                key: 'supplier_name',
                header: 'SUPPLIER EXPORTER',
                render: (val) => <strong className="text-slate-900">{val}</strong>
              },
              {
                key: 'contract_no',
                header: 'CONTRACT REF',
                render: (val) => <span className="font-mono text-xs text-slate-600">{val}</span>
              },
              {
                key: 'quantity_mt',
                header: 'QUANTITY',
                align: 'right',
                render: (val) => <span className="font-mono font-semibold text-slate-900">{val} MT</span>
              },
              {
                key: 'total_amount',
                header: 'PO TOTAL',
                align: 'right',
                render: (val) => <span className="font-mono font-black text-slate-900">${(val || 0).toLocaleString()}</span>
              },
              {
                key: 'container_no',
                header: 'CONTAINER NO',
                render: (val) => <span className="font-mono text-xs text-slate-600">{val || '-'}</span>
              },
              {
                key: 'bl_no',
                header: 'BILL OF LADING',
                render: (val) => <span className="font-mono text-xs text-blue-600 font-semibold">{val || '-'}</span>
              },
              {
                key: 'execution_status',
                header: 'STATUS',
                align: 'center',
                render: (val) => (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    val === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : val === 'IN_PROCESS'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {val}
                  </span>
                )
              }
            ]}
            data={executions}
            title="PO_Execution_Milestones"
            searchPlaceholder="Search PO #, supplier, contract, BL..."
            actions={
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="IN_PROCESS">IN_PROCESS</option>
                  <option value="PENDING">PENDING</option>
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                </select>
              </div>
            }
            onAdd={() => setIsModalOpen(true)}
            addLabel="+ New Milestone"
          />
        ) : activeTab === 'documents' ? (
          <DataTable
            className="border-0 shadow-none rounded-t-none"
            columns={[
              {
                key: 'submission_no',
                header: 'SUBMISSION NO',
                render: (val) => <span className="font-mono font-bold text-slate-900">{val}</span>
              },
              {
                key: 'date',
                header: 'DATE',
                render: (val) => <span className="font-mono text-slate-500 text-xs">{val}</span>
              },
              {
                key: 'ref_no',
                header: 'REFERENCE PO',
                render: (val) => <span className="font-mono text-xs text-blue-700 font-bold">{val}</span>
              },
              {
                key: 'contract_no',
                header: 'CONTRACT',
                render: (val) => <span className="font-mono text-xs text-slate-600">{val}</span>
              },
              {
                key: 'supplier_name',
                header: 'SUPPLIER EXPORTER',
                render: (val) => <strong className="text-slate-900">{val}</strong>
              },
              {
                key: 'document_types',
                header: 'DOCUMENT PACK TYPES',
                render: (val) => <span className="text-slate-700 max-w-sm block truncate text-xs">{val}</span>
              },
              {
                key: 'reviewer',
                header: 'REVIEWER',
                render: (val) => <span className="text-slate-700 font-medium">{val || '-'}</span>
              },
              {
                key: 'status',
                header: 'STATUS',
                align: 'center',
                render: (val) => (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    val === 'VERIFIED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {val}
                  </span>
                )
              }
            ]}
            data={documents}
            title="Document_Submissions"
            searchPlaceholder="Search submission #, PO ref, supplier, doc types..."
            actions={
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                </select>
              </div>
            }
          />
        ) : (
          <DataTable
            className="border-0 shadow-none rounded-t-none"
            columns={[
              {
                key: 'claim_no',
                header: 'CLAIM NO',
                render: (val) => <span className="font-mono font-bold text-slate-900">{val}</span>
              },
              {
                key: 'date',
                header: 'DATE',
                render: (val) => <span className="font-mono text-slate-500 text-xs">{val}</span>
              },
              {
                key: 'delivery_ref',
                header: 'DELIVERY REF',
                render: (val) => <span className="font-mono text-xs text-blue-700 font-semibold">{val}</span>
              },
              {
                key: 'customer_name',
                header: 'CONSIGNEE CUSTOMER',
                render: (val) => <strong className="text-slate-900">{val}</strong>
              },
              {
                key: 'claim_amount',
                header: 'CLAIM AMOUNT',
                align: 'right',
                render: (val) => <span className="font-mono font-bold text-red-600">${(val || 0).toLocaleString()}</span>
              },
              {
                key: 'reason',
                header: 'DISPUTE REASON',
                render: (val) => <span className="text-slate-600 text-xs max-w-sm block truncate">{val}</span>
              },
              {
                key: 'status',
                header: 'STATUS',
                align: 'center',
                render: (val) => (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    val === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {val}
                  </span>
                )
              }
            ]}
            data={claims}
            title="Delivery_Claims_and_Disputes"
            searchPlaceholder="Search claim #, delivery ref, consignee..."
            actions={
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>
            }
          />
        )}
      </div>
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Record New PO Execution Milestone</h3>
            <form onSubmit={handleCreateExecution} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PO Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IMP/IV/PO/2026-60"
                    value={formExec.po_no}
                    onChange={(e) => setFormExec({ ...formExec, po_no: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contract No</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CT-2026-09"
                    value={formExec.contract_no}
                    onChange={(e) => setFormExec({ ...formExec, contract_no: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Exporter Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VAST EXIM PRIVATE LIMITED"
                  value={formExec.supplier_name}
                  onChange={(e) => setFormExec({ ...formExec, supplier_name: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity (MT)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 100.0"
                    value={formExec.quantity_mt}
                    onChange={(e) => setFormExec({ ...formExec, quantity_mt: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Value ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 54000.0"
                    value={formExec.total_amount}
                    onChange={(e) => setFormExec({ ...formExec, total_amount: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Container Number</label>
                  <input
                    type="text"
                    placeholder="e.g. MSKU9921440"
                    value={formExec.container_no}
                    onChange={(e) => setFormExec({ ...formExec, container_no: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bill of Lading (BL)</label>
                  <input
                    type="text"
                    placeholder="e.g. BL-MSK-2026-881"
                    value={formExec.bl_no}
                    onChange={(e) => setFormExec({ ...formExec, bl_no: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Execution Status</label>
                <select
                  value={formExec.execution_status}
                  onChange={(e) => setFormExec({ ...formExec, execution_status: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2"
                >
                  <option value="PENDING">PENDING (Contract Signed)</option>
                  <option value="IN_PROCESS">IN_PROCESS (On Water / Customs)</option>
                  <option value="COMPLETED">COMPLETED (Port Cleared & Delivered)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
                >
                  Create Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

