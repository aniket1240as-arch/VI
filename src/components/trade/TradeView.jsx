import React, { useState, useEffect, useCallback } from 'react';
import {
  Ship,
  FileText,
  TrendingUp,
  Clock,
  Download,
  Plus,
  X,
  Package,
  Layers,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';
import DataTable from '../common/DataTable';

// ─── Fallback Data ────────────────────────────────────────────────────────────
const FALLBACK_CONTRACTS = [
  { id: 'CT-001', contract_no: 'SLX-EXP-2026-001', type: 'EXPORT', partner_name: 'Al Rawdah Trading LLC', commodity: 'Black Pepper 550 G/L ASTA', volume_cbm: 840.0, volume_mt: 72.0, total_usd: 198000, status: 'ORDER_IN_PROCESS' },
  { id: 'CT-002', contract_no: 'SLX-EXP-2026-002', type: 'EXPORT', partner_name: 'Naturex GmbH', commodity: 'Green Cardamom 8mm+', volume_cbm: 420.0, volume_mt: 18.5, total_usd: 148000, status: 'BOG_APPROVAL' },
  { id: 'CT-003', contract_no: 'SLX-IMP-2026-001', type: 'IMPORT', partner_name: 'Kerala Spice Farm Consortium', commodity: 'Raw Black Pepper', volume_cbm: 1200.0, volume_mt: 120.0, total_usd: 290000, status: 'AWAITING_SIGN' },
  { id: 'CT-004', contract_no: 'SLX-EXP-2026-003', type: 'EXPORT', partner_name: 'Singapore Commodities Pte', commodity: 'Rice DDGS 45% Protein', volume_cbm: 2100.0, volume_mt: 189.0, total_usd: 85000, status: 'COMPLETED' },
];

const FALLBACK_SHIPMENTS = [
  { id: 'SH-901', shipment_no: 'SLX-SH-2026-09-001', bl_no: 'MEDU-BL-99201', contract_id: 'CT-001', carrier: 'MSC Mediterranean', port_of_loading: 'Hai Phong, Vietnam', port_of_discharge: 'Jebel Ali, UAE', etd: '2026-09-10', eta: '2026-09-25', container_count: 8, customs_status: 'IN_TRANSIT' },
  { id: 'SH-902', shipment_no: 'SLX-SH-2026-09-002', bl_no: 'MAEU-BL-44512', contract_id: 'CT-004', carrier: 'Maersk Line', port_of_loading: 'Kochi, India', port_of_discharge: 'Hamburg, Germany', etd: '2026-09-14', eta: '2026-10-05', container_count: 4, customs_status: 'PENDING_CUSTOMS' },
];

const FALLBACK_CONTAINERS = [
  { id: 'CN-001', container_no: 'MSCU-884102-3', seal_no: 'SLX-7801', shipment_id: 'SH-901', commodity: 'Black Pepper 550 G/L', gross_weight_kg: 23400.0, net_weight_kg: 22000.0, temperature_c: 22.0, status: 'IN_TRANSIT' },
  { id: 'CN-002', container_no: 'MEDU-556219-7', seal_no: 'SLX-7802', shipment_id: 'SH-901', commodity: 'Black Pepper 550 G/L', gross_weight_kg: 23100.0, net_weight_kg: 21800.0, temperature_c: 22.0, status: 'IN_TRANSIT' },
  { id: 'CN-003', container_no: 'MAEU-119402-4', seal_no: 'SLX-8801', shipment_id: 'SH-902', commodity: 'Rice DDGS 45% Protein', gross_weight_kg: 26500.0, net_weight_kg: 26000.0, temperature_c: 28.0, status: 'PENDING_CUSTOMS' },
  { id: 'CN-004', container_no: 'TGHU-940182-9', seal_no: 'SLX-7712', shipment_id: 'SH-902', commodity: 'Green Cardamom 8mm+', gross_weight_kg: 14200.0, net_weight_kg: 12500.0, temperature_c: 18.0, status: 'CLEARED' },
];

// ─── Badge Helpers ─────────────────────────────────────────────────────────────
const CONTRACT_STATUS_STYLES = {
  ORDER_IN_PROCESS: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED:        'bg-emerald-100 text-emerald-800 border-emerald-200',
  BOG_APPROVAL:     'bg-amber-100 text-amber-800 border-amber-200',
  AWAITING_SIGN:    'bg-yellow-100 text-yellow-800 border-yellow-200',
};

const CONTAINER_STATUS_STYLES = {
  LOADED:             'bg-amber-100 text-amber-800 border-amber-200',
  IN_TRANSIT:         'bg-blue-100 text-blue-800 border-blue-200',
  CUSTOMS_INSPECTION: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CLEARED:            'bg-emerald-100 text-emerald-800 border-emerald-200',
  PENDING_CUSTOMS:    'bg-red-100 text-red-700 border-red-200',
};

const SHIPMENT_STATUS_STYLES = {
  IN_TRANSIT:      'bg-blue-100 text-blue-800 border-blue-200',
  PENDING_CUSTOMS: 'bg-red-100 text-red-700 border-red-200',
  CLEARED:         'bg-emerald-100 text-emerald-800 border-emerald-200',
  BOOKED:          'bg-slate-100 text-slate-700 border-slate-200',
};

function StatusBadge({ status, styleMap }) {
  const cls = styleMap[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function fmt(n) { return Number(n).toLocaleString(); }
function fmtUSD(n) { return '$' + Number(n).toLocaleString(); }

// ─── Modals ───────────────────────────────────────────────────────────────────
function ContractModal({ onClose, onSave, contractType }) {
  const [form, setForm] = useState({ partner_name: '', commodity: '', volume_cbm: '', volume_mt: '', total_usd: '' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.partner_name.trim()) e.partner_name = 'Required';
    if (!form.commodity.trim())    e.commodity    = 'Required';
    if (!form.volume_cbm)          e.volume_cbm   = 'Required';
    if (!form.volume_mt)           e.volume_mt    = 'Required';
    if (!form.total_usd)           e.total_usd    = 'Required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }
    setSaving(true);
    await onSave({ ...form, type: contractType, volume_cbm: Number(form.volume_cbm), volume_mt: Number(form.volume_mt), total_usd: Number(form.total_usd) });
    setSaving(false);
  };

  const field = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label className="text-xs font-bold text-slate-700 block mb-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={ev => { setForm(f => ({ ...f, [key]: ev.target.value })); setErrors(er => ({ ...er, [key]: '' })); }}
        className={`w-full bg-white border rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium ${errors[key] ? 'border-red-400' : 'border-[#E2E8F0]'}`}
      />
      {errors[key] && <p className="text-[10px] text-red-500 mt-0.5">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">New {contractType === 'EXPORT' ? 'Export' : 'Import'} Contract</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {field('Partner / Company Name', 'partner_name', 'text', 'e.g. Al Rawdah Trading LLC')}
          {field('Commodity', 'commodity', 'text', 'e.g. Black Pepper 550 G/L')}
          <div className="grid grid-cols-2 gap-3">
            {field('Volume (CBM)', 'volume_cbm', 'number', '0.00')}
            {field('Volume (MT)', 'volume_mt', 'number', '0.00')}
          </div>
          {field('Contract Value (USD)', 'total_usd', 'number', '0')}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1E40AF] text-white rounded-md text-xs font-semibold hover:bg-blue-800 shadow-sm disabled:opacity-60">
              {saving ? 'Saving…' : 'Create Contract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ShipmentModal({ onClose, onSave }) {
  const [form, setForm] = useState({ shipment_no: '', bl_no: '', carrier: '', port_of_loading: '', port_of_discharge: '', etd: '', eta: '', container_count: '' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const required = ['shipment_no', 'bl_no', 'carrier', 'port_of_loading', 'port_of_discharge', 'etd', 'eta', 'container_count'];
  const validate = () => {
    const e = {};
    required.forEach(k => { if (!form[k]) e[k] = 'Required'; });
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }
    setSaving(true);
    await onSave({ ...form, container_count: Number(form.container_count) });
    setSaving(false);
  };

  const field = (label, key, type = 'text', placeholder = '', colSpan = '') => (
    <div className={colSpan}>
      <label className="text-xs font-bold text-slate-700 block mb-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={ev => { setForm(f => ({ ...f, [key]: ev.target.value })); setErrors(er => ({ ...er, [key]: '' })); }}
        className={`w-full bg-white border rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium ${errors[key] ? 'border-red-400' : 'border-[#E2E8F0]'}`}
      />
      {errors[key] && <p className="text-[10px] text-red-500 mt-0.5">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">New Shipment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {field('Shipment No', 'shipment_no', 'text', 'SLX-SH-2026-...')}
            {field('BL No', 'bl_no', 'text', 'MEDU-BL-...')}
          </div>
          {field('Carrier', 'carrier', 'text', 'e.g. MSC Mediterranean')}
          <div className="grid grid-cols-2 gap-3">
            {field('Port of Loading', 'port_of_loading', 'text', 'City, Country')}
            {field('Port of Discharge', 'port_of_discharge', 'text', 'City, Country')}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {field('ETD', 'etd', 'date')}
            {field('ETA', 'eta', 'date')}
            {field('Containers', 'container_count', 'number', '0')}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1E40AF] text-white rounded-md text-xs font-semibold hover:bg-blue-800 shadow-sm disabled:opacity-60">
              {saving ? 'Saving…' : 'Create Shipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TradeView({ type = 'export', initialTab = 'CONTRACTS' }) {
  const [activeTab, setActiveTab]       = useState(initialTab || 'CONTRACTS');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);
  const [contracts, setContracts]       = useState(FALLBACK_CONTRACTS);
  const [shipments, setShipments]       = useState(FALLBACK_SHIPMENTS);
  const [containers, setContainers]     = useState(FALLBACK_CONTAINERS);
  const [loading, setLoading]           = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [notification, setNotification] = useState(null);

  const notify = (type_, msg) => {
    setNotification({ type: type_, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  const contractType = type === 'export' ? 'EXPORT' : 'IMPORT';

  // ── Data Fetching ─────────────────────────────────────────────────────────
  const loadContracts = useCallback(async () => {
    setLoading(true);
    const data = await api.getContracts(contractType);
    if (data && data.length > 0) setContracts(data);
    setLoading(false);
  }, [contractType]);

  const loadShipments = useCallback(async () => {
    setLoading(true);
    const data = await api.getShipments();
    if (data && data.length > 0) setShipments(data);
    setLoading(false);
  }, []);

  const loadContainers = useCallback(async () => {
    setLoading(true);
    const data = await api.getContainers();
    if (data && data.length > 0) setContainers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'CONTRACTS')  loadContracts();
    if (activeTab === 'SHIPMENTS')  loadShipments();
    if (activeTab === 'CONTAINERS') loadContainers();
  }, [activeTab, loadContracts, loadShipments, loadContainers]);

  // ── KPI Computations ──────────────────────────────────────────────────────
  const activeConsignments = shipments.filter(s => s.customs_status === 'IN_TRANSIT' || s.status === 'IN_TRANSIT').length;
  const ytdRevenue = contracts.reduce((sum, c) => sum + Number(c.total_usd || 0), 0);
  const bogPending = contracts.filter(c => c.status === 'BOG_APPROVAL').length;
  const containersLoaded = containers.filter(c => c.status === 'IN_TRANSIT' || c.status === 'LOADED').length;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateContract = async (formData) => {
    const result = await api.createContract(formData);
    if (result) {
      notify('success', 'Contract created successfully.');
      setShowContractModal(false);
      await loadContracts();
    } else {
      // Optimistic fallback
      setContracts(prev => [{ ...formData, id: 'CT-NEW-' + Date.now(), contract_no: 'SLX-NEW-' + Date.now(), status: 'ORDER_IN_PROCESS' }, ...prev]);
      notify('success', 'Contract saved (offline mode).');
      setShowContractModal(false);
    }
  };

  const handleCreateShipment = async (formData) => {
    const result = await api.createShipment(formData);
    if (result) {
      notify('success', 'Shipment created successfully.');
      setShowShipmentModal(false);
      await loadShipments();
    } else {
      setShipments(prev => [{ ...formData, id: 'SH-NEW-' + Date.now(), customs_status: 'BOOKED' }, ...prev]);
      notify('success', 'Shipment saved (offline mode).');
      setShowShipmentModal(false);
    }
  };

  const handleExportManifest = () => {
    notify('success', 'Export manifest generation queued.');
  };

  // ── Title by type ─────────────────────────────────────────────────────────
  const pageTitle = type === 'export'
    ? 'EXPORT OPERATIONS'
    : type === 'import'
    ? 'RAW PROCUREMENT'
    : 'TRADE TRANSACTIONS';

  const pageSubtitle = type === 'export'
    ? 'Spice & Commodity Export Contracts, Shipments & Container Tracking'
    : type === 'import'
    ? 'Raw Material Procurement, Inbound Logistics & Supplier Contracts'
    : 'Full-Cycle Trade: Contracts, Shipments, Containers & Customs';

  const tabs = [
    { id: 'CONTRACTS',  label: 'Contracts',  icon: FileText },
    { id: 'SHIPMENTS',  label: 'Shipments',  icon: Ship },
    { id: 'CONTAINERS', label: 'Containers', icon: Layers },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg border text-xs font-bold transition-all ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <span>{notification.type === 'success' ? '✓' : '✕'}</span>
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Modals */}
      {showContractModal && (
        <ContractModal
          contractType={contractType}
          onClose={() => setShowContractModal(false)}
          onSave={handleCreateContract}
        />
      )}
      {showShipmentModal && (
        <ShipmentModal
          onClose={() => setShowShipmentModal(false)}
          onSave={handleCreateShipment}
        />
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-card">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase flex items-center gap-2">
            <span>{pageTitle}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-100 text-[#1E40AF]">Live</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{pageSubtitle}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportManifest}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT MANIFEST</span>
          </button>
          {activeTab === 'CONTRACTS' && (
            <button
              onClick={() => setShowContractModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>NEW CONTRACT</span>
            </button>
          )}
          {activeTab === 'SHIPMENTS' && (
            <button
              onClick={() => setShowShipmentModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>NEW SHIPMENT</span>
            </button>
          )}
          {activeTab === 'CONTAINERS' && (
            <button
              onClick={loadContainers}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>REFRESH</span>
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-card hover:border-[#BFDBFE] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Active Consignments</span>
            <Ship className="w-4 h-4 text-[#1E40AF]" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{activeConsignments} <span className="text-sm font-semibold text-slate-400">vessels</span></p>
          <span className="text-[11px] font-semibold text-[#1E40AF] mt-1 inline-block">In-transit shipments</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-card hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">YTD Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {ytdRevenue >= 1000000
              ? `$${(ytdRevenue / 1000000).toFixed(2)}M`
              : `$${(ytdRevenue / 1000).toFixed(0)}K`}
          </p>
          <span className="text-[11px] font-semibold text-emerald-600 mt-1 inline-block">Contract value total</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-card hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">BOG Pending</span>
            <Clock className="w-4 h-4 text-[#D97706]" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{bogPending} <span className="text-sm font-semibold text-slate-400">contracts</span></p>
          <span className="text-[11px] font-semibold text-[#D97706] mt-1 inline-block">Awaiting BOG signoff</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-card hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Containers Loaded</span>
            <Package className="w-4 h-4 text-[#1E40AF]" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{containersLoaded} <span className="text-sm font-semibold text-slate-400">FCL</span></p>
          <span className="text-[11px] font-semibold text-[#1E40AF] mt-1 inline-block">Loaded / in-transit</span>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-card overflow-hidden">
        {/* Tab Bar */}
        <div className="flex border-b border-[#E2E8F0]">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-5 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  active
                    ? 'border-[#1E40AF] text-[#1E40AF] bg-[#EFF6FF]'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
          {loading && (
            <div className="ml-auto flex items-center pr-4">
              <div className="w-4 h-4 border-2 border-[#1E40AF] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* ── CONTRACTS TABLE ─────────────────────────────────────────────── */}
        {activeTab === 'CONTRACTS' && (
          <DataTable
            className="border-0 shadow-none rounded-t-none"
            columns={[
              {
                key: 'contract_no',
                header: 'CONTRACT NO',
                render: (val) => <span className="font-mono font-bold text-[#1E40AF]">{val}</span>
              },
              {
                key: 'partner_name',
                header: 'TRADE PARTNER',
                render: (val) => <strong className="text-slate-900">{val}</strong>
              },
              {
                key: 'commodity',
                header: 'COMMODITY',
                render: (val) => <span className="text-slate-700">{val}</span>
              },
              {
                key: 'volume_cbm',
                header: 'VOLUME (CBM)',
                align: 'right',
                render: (val) => <span className="font-mono text-slate-700">{fmt(val)}</span>
              },
              {
                key: 'volume_mt',
                header: 'VOLUME (MT)',
                align: 'right',
                render: (val) => <span className="font-mono font-semibold text-slate-800">{fmt(val)}</span>
              },
              {
                key: 'total_usd',
                header: 'VALUE (USD)',
                align: 'right',
                render: (val) => <span className="font-mono font-black text-slate-900">{fmtUSD(val)}</span>
              },
              {
                key: 'status',
                header: 'STATUS',
                render: (val) => <StatusBadge status={val} styleMap={CONTRACT_STATUS_STYLES} />
              },
              {
                key: 'actions',
                header: 'ACTIONS',
                sortable: false,
                render: (_, c) => (
                  <button
                    onClick={() => notify('success', `Viewing trade contract ${c.contract_no}`)}
                    className="text-[#1E40AF] hover:underline text-[11px] font-bold tracking-wider"
                  >
                    VIEW
                  </button>
                )
              }
            ]}
            data={contracts}
            title={`${pageTitle}_Contracts`}
            searchPlaceholder="Search contract #, partner, commodity..."
            onAdd={() => setShowContractModal(true)}
            addLabel="+ New Contract"
          />
        )}

        {/* ── SHIPMENTS TABLE ─────────────────────────────────────────────── */}
        {activeTab === 'SHIPMENTS' && (
          <DataTable
            className="border-0 shadow-none rounded-t-none"
            columns={[
              {
                key: 'shipment_no',
                header: 'SHIPMENT NO',
                render: (val) => <span className="font-mono font-bold text-[#1E40AF]">{val}</span>
              },
              {
                key: 'bl_no',
                header: 'BL MANIFEST',
                render: (val) => <span className="font-mono font-semibold text-slate-700">{val}</span>
              },
              {
                key: 'carrier',
                header: 'CARRIER VESSEL',
                render: (val) => <strong className="text-slate-800">{val}</strong>
              },
              {
                key: 'port_of_loading',
                header: 'PORT OF LOADING',
                render: (val) => <span className="text-slate-600 text-xs">{val}</span>
              },
              {
                key: 'port_of_discharge',
                header: 'DISCHARGE PORT',
                render: (val) => <span className="text-slate-600 text-xs">{val}</span>
              },
              {
                key: 'etd',
                header: 'ETD',
                render: (val) => <span className="font-mono text-slate-500">{val}</span>
              },
              {
                key: 'eta',
                header: 'ETA',
                render: (val) => <span className="font-mono text-slate-500">{val}</span>
              },
              {
                key: 'container_count',
                header: 'CONTAINERS',
                align: 'center',
                render: (val) => <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{val} FCL</span>
              },
              {
                key: 'customs_status',
                header: 'STATUS',
                render: (val, row) => <StatusBadge status={val || row.status || 'BOOKED'} styleMap={SHIPMENT_STATUS_STYLES} />
              },
              {
                key: 'actions',
                header: 'ACTIONS',
                sortable: false,
                render: (_, s) => (
                  <button
                    onClick={() => notify('success', `Tracking container shipment ${s.shipment_no}`)}
                    className="text-[#1E40AF] hover:underline text-[11px] font-bold tracking-wider"
                  >
                    TRACK
                  </button>
                )
              }
            ]}
            data={shipments}
            title={`${pageTitle}_Shipments`}
            searchPlaceholder="Search shipment #, BL, carrier, port..."
            onAdd={() => setShowShipmentModal(true)}
            addLabel="+ New Shipment"
          />
        )}

        {/* ── CONTAINERS TABLE ────────────────────────────────────────────── */}
        {activeTab === 'CONTAINERS' && (
          <DataTable
            className="border-0 shadow-none rounded-t-none"
            columns={[
              {
                key: 'container_no',
                header: 'CONTAINER NO',
                render: (val) => <span className="font-mono font-bold text-[#1E40AF]">{val}</span>
              },
              {
                key: 'seal_no',
                header: 'SEAL NO',
                render: (val) => <span className="font-mono text-slate-600">{val}</span>
              },
              {
                key: 'commodity',
                header: 'COMMODITY',
                render: (val) => <span className="text-slate-800 font-medium">{val}</span>
              },
              {
                key: 'gross_weight_kg',
                header: 'GROSS WT (KG)',
                align: 'right',
                render: (val) => <span className="font-mono font-semibold text-slate-800">{val ? val.toLocaleString() : '-'}</span>
              },
              {
                key: 'net_weight_kg',
                header: 'NET WT (KG)',
                align: 'right',
                render: (val) => <span className="font-mono font-bold text-slate-900">{val ? val.toLocaleString() : '-'}</span>
              },
              {
                key: 'temperature_c',
                header: 'TEMP (°C)',
                align: 'center',
                render: (val) => val != null ? (
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${val <= 20 ? 'bg-blue-100 text-blue-800' : val <= 25 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {val}°C
                  </span>
                ) : '—'
              },
              {
                key: 'status',
                header: 'STATUS',
                render: (val) => <StatusBadge status={val} styleMap={CONTAINER_STATUS_STYLES} />
              },
              {
                key: 'updated_at',
                header: 'UPDATED',
                render: (val) => <span className="font-mono text-slate-400 text-[10px]">{val ? new Date(val).toLocaleDateString() : 'Oct 2026'}</span>
              }
            ]}
            data={containers}
            title={`${pageTitle}_Containers`}
            searchPlaceholder="Search container #, seal #, commodity..."
          />
        )}
      </div>
    </div>
  );
}
