import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  X, 
  RefreshCw,
  Building,
  User,
  Calendar,
  Layers,
  DollarSign,
  TrendingDown,
  Tag
} from 'lucide-react';
import api from '../../services/api';
import DataTable from '../common/DataTable';

export default function AssetManagement() {
  const [activeSubTab, setActiveSubTab] = useState('assets'); // 'assets' | 'types'
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  const [metrics, setMetrics] = useState({
    totalAssets: 0,
    allocatedCount: 0,
    inStockCount: 0,
    totalValuationUsd: 0,
    avgDepreciationRate: 0
  });
  const [types, setTypes] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  // Modal State for Asset Create/Edit
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [assetForm, setAssetForm] = useState({
    code: '',
    name: '',
    type_name: '',
    type_id: '',
    assigned_to: '',
    branch: 'Hanoi HQ',
    brand: '',
    model: '',
    serial_no: '',
    purchase_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    depreciation_rate: 10.0,
    cost: 0.0,
    status: 'ACTIVE'
  });

  // Type Create Form State
  const [typeForm, setTypeForm] = useState({
    name: '',
    status: 'ACTIVE'
  });
  const [submittingType, setSubmittingType] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const branches = [
    'ALL',
    'Hanoi HQ',
    'Hai Phong Plant',
    'Hai Phong Port Logistics Depot',
    'Kochi Spices Lab',
    'Kochi Export Terminal'
  ];

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [assetsData, typesData, empData] = await Promise.all([
        api.getAssets(selectedBranch, selectedType, searchTerm),
        api.getAssetTypes(),
        api.getEmployees ? api.getEmployees() : Promise.resolve([])
      ]);

      if (assetsData) {
        setAssets(assetsData.assets || []);
        if (assetsData.metrics) {
          setMetrics(assetsData.metrics);
        }
      }

      if (typesData) {
        setTypes(typesData);
        if (!assetForm.type_name && typesData.length > 0) {
          setAssetForm(prev => ({
            ...prev,
            type_name: typesData[0].name,
            type_id: typesData[0].id
          }));
        }
      }

      if (empData && Array.isArray(empData)) {
        setEmployees(empData);
      }
    } catch (err) {
      console.error('Failed to load asset data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBranch, selectedType]);

  const showToast = (text, isError = false) => {
    setActionMessage({ text, isError });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  // Asset Form Handlers
  const handleOpenCreateModal = () => {
    setEditingAsset(null);
    setAssetForm({
      code: `AST-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      type_name: types.length > 0 ? types[0].name : 'LAPTOP',
      type_id: types.length > 0 ? types[0].id : '',
      assigned_to: '',
      branch: 'Hanoi HQ',
      brand: '',
      model: '',
      serial_no: '',
      purchase_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      depreciation_rate: 10.0,
      cost: 1000.0,
      status: 'ACTIVE'
    });
    setIsAssetModalOpen(true);
  };

  const handleOpenEditModal = (asset) => {
    setEditingAsset(asset);
    setAssetForm({
      code: asset.code || '',
      name: asset.name || '',
      type_name: asset.type_name || '',
      type_id: asset.type_id || '',
      assigned_to: asset.assigned_to || '',
      branch: asset.branch || 'Hanoi HQ',
      brand: asset.brand || '',
      model: asset.model || '',
      serial_no: asset.serial_no || '',
      purchase_date: asset.purchase_date || '',
      expiry_date: asset.expiry_date || '',
      depreciation_rate: asset.depreciation_rate ?? 10.0,
      cost: asset.cost ?? 0.0,
      status: asset.status || 'ACTIVE'
    });
    setIsAssetModalOpen(true);
  };

  const handleSaveAsset = async (e) => {
    e.preventDefault();
    if (!assetForm.name.trim() || !assetForm.code.trim()) {
      showToast('Asset Name and Code are required.', true);
      return;
    }

    try {
      if (editingAsset) {
        await api.updateAsset(editingAsset.id, assetForm);
        showToast(`Asset '${assetForm.name}' updated successfully.`);
      } else {
        await api.createAsset(assetForm);
        showToast(`Asset '${assetForm.name}' created successfully.`);
      }
      setIsAssetModalOpen(false);
      fetchData();
    } catch (err) {
      showToast('Failed to save asset. Check unique code.', true);
    }
  };

  const handleDeleteAsset = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete asset '${name}'?`)) return;
    try {
      await api.deleteAsset(id);
      showToast(`Asset '${name}' deleted successfully.`);
      fetchData();
    } catch (err) {
      showToast('Failed to delete asset.', true);
    }
  };

  // Asset Type Handlers
  const handleCreateType = async (e) => {
    e.preventDefault();
    if (!typeForm.name.trim()) return;
    setSubmittingType(true);
    try {
      await api.createAssetType(typeForm);
      showToast(`Asset Type '${typeForm.name.toUpperCase()}' created.`);
      setTypeForm({ name: '', status: 'ACTIVE' });
      const typesData = await api.getAssetTypes();
      if (typesData) setTypes(typesData);
    } catch (err) {
      showToast('Failed to create asset type. It might already exist.', true);
    } finally {
      setSubmittingType(false);
    }
  };

  const handleDeleteType = async (id, name) => {
    if (!window.confirm(`Delete asset type '${name}'?`)) return;
    try {
      const res = await api.deleteAssetType(id);
      if (res) {
        showToast(`Asset type '${name}' removed.`);
        const typesData = await api.getAssetTypes();
        if (typesData) setTypes(typesData);
      } else {
        showToast(`Cannot delete: Active assets are linked to this type.`, true);
      }
    } catch (err) {
      showToast(`Error deleting type. Ensure no assets use it.`, true);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (assets.length === 0) return;
    const headers = ["CODE", "NAME", "TYPE", "BRANCH", "ASSIGNED TO", "BRAND", "MODEL", "SERIAL NO", "PURCHASE DATE", "EXPIRY DATE", "DEPRECIATION %", "COST USD", "STATUS"];
    const rows = assets.map(a => [
      a.code,
      `"${(a.name || '').replace(/"/g, '""')}"`,
      a.type_name,
      `"${a.branch}"`,
      `"${a.assigned_to || 'Unassigned'}"`,
      `"${a.brand || ''}"`,
      `"${a.model || ''}"`,
      `"${a.serial_no || ''}"`,
      a.purchase_date || '',
      a.expiry_date || '',
      a.depreciation_rate,
      a.cost,
      a.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `soilex_enterprise_assets_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Alert / Toast */}
      {actionMessage && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-sm shadow-md transition-all ${
          actionMessage.isError 
            ? 'bg-rose-50 text-rose-800 border border-rose-200' 
            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <div className="flex items-center space-x-3">
            {actionMessage.isError ? <AlertCircle className="w-5 h-5 text-rose-600" /> : <CheckCircle className="w-5 h-5 text-emerald-600" />}
            <span className="font-semibold">{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header and Sub-tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1E40AF]">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              ASSET MANAGEMENT
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                LIVE ERP REVERSE-ENGINEERED
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enterprise fixed assets tracking, equipment lifecycle, branch allocations & depreciation registers.
            </p>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('assets')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'assets'
                ? 'bg-white text-[#1E40AF] shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Box className="w-4 h-4" />
            MANAGE ASSETS ({metrics.totalAssets})
          </button>
          <button
            onClick={() => setActiveSubTab('types')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'types'
                ? 'bg-white text-[#1E40AF] shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            ASSET TYPES ({types.length})
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Assets</span>
            <Box className="w-4 h-4 text-[#1E40AF]" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{metrics.totalAssets}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across all global hubs</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Allocated</span>
            <User className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{metrics.allocatedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Assigned to workforce</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">In Stock</span>
            <Building className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600">{metrics.inStockCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Available in depot</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Valuation</span>
            <DollarSign className="w-4 h-4 text-[#1E40AF]" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ${metrics.totalValuationUsd?.toLocaleString() || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Historical cost basis</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Depreciation</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600">{metrics.avgDepreciationRate}%</div>
          <div className="text-[11px] text-slate-500 mt-1">Annual straight-line</div>
        </div>
      </div>

      {/* ──────────────────── SUB-TAB 1: MANAGE ASSETS ──────────────────── */}
      {activeSubTab === 'assets' && (
        <DataTable
          columns={[
            {
              key: 'code',
              header: 'ASSET CODE',
              render: (val) => <span className="font-mono font-bold text-[#1E40AF]">{val}</span>
            },
            {
              key: 'name',
              header: 'ASSET NAME',
              render: (val) => <strong className="text-slate-900">{val}</strong>
            },
            {
              key: 'type_name',
              header: 'TYPE',
              render: (val) => (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {val}
                </span>
              )
            },
            {
              key: 'assigned_to',
              header: 'ASSIGN TO',
              render: (val) => val ? (
                <div className="flex items-center space-x-1 text-slate-800 font-semibold">
                  <User className="w-3 h-3 text-emerald-600" />
                  <span>{val}</span>
                </div>
              ) : (
                <span className="text-slate-400 italic">Unassigned</span>
              )
            },
            {
              key: 'branch',
              header: 'BRANCH',
              render: (val) => <span className="text-slate-600">{val}</span>
            },
            {
              key: 'brand',
              header: 'BRAND & MODEL',
              render: (val, a) => (
                <span>
                  <strong className="text-slate-800 font-semibold">{val || '-'}</strong> {a.model ? `(${a.model})` : ''}
                </span>
              )
            },
            {
              key: 'serial_no',
              header: 'SERIAL NO.',
              render: (val) => <span className="font-mono text-slate-500 text-xs">{val || '-'}</span>
            },
            {
              key: 'purchase_date',
              header: 'PURCHASE DATE',
              render: (val) => <span className="font-mono text-slate-600 text-xs">{val || '-'}</span>
            },
            {
              key: 'expiry_date',
              header: 'EXPIRY DATE',
              render: (val) => <span className="font-mono text-slate-600 text-xs">{val || '-'}</span>
            },
            {
              key: 'depreciation_rate',
              header: 'DEP. (%)',
              align: 'right',
              render: (val) => <span className="font-mono font-bold text-rose-600">{val}%</span>
            },
            {
              key: 'cost',
              header: 'COST ($)',
              align: 'right',
              render: (val) => <span className="font-mono font-bold text-slate-900">${(val || 0).toLocaleString()}</span>
            },
            {
              key: 'actions',
              header: 'ACTIONS',
              sortable: false,
              align: 'center',
              render: (_, a) => (
                <div className="flex items-center justify-center space-x-1.5">
                  <button
                    onClick={() => handleOpenEditModal(a)}
                    title="Edit Asset"
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded-md transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteAsset(a.id, a.name)}
                    title="Delete Asset"
                    className="p-1 text-rose-500 hover:bg-rose-100 rounded-md transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            }
          ]}
          data={assets}
          title="Enterprise_Assets_Register"
          searchPlaceholder="Search asset code, name, serial, brand..."
          onAdd={handleOpenCreateModal}
          addLabel="+ Add Asset"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                <span className="font-semibold text-slate-400 uppercase text-[10px]">Branch:</span>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {branches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                <span className="font-semibold text-slate-400 uppercase text-[10px]">Type:</span>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">ALL TYPES</option>
                  {types.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          }
        />
      )}

      {/* ──────────────────── SUB-TAB 2: ASSET TYPES ──────────────────── */}
      {activeSubTab === 'types' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Form: CREATE ASSET TYPE matching Asset type.png */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#1E40AF]" />
              CREATE ASSET TYPE
            </h2>
            <form onSubmit={handleCreateType} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  NAME:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LAB EQUIPMENT, VEHICLE, TABLET"
                  value={typeForm.name}
                  onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] outline-none uppercase font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  STATUS:
                </label>
                <select
                  value={typeForm.status}
                  onChange={(e) => setTypeForm({ ...typeForm, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] outline-none font-semibold cursor-pointer"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={submittingType}
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  {submittingType ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  CREATE
                </button>
                <button
                  type="button"
                  onClick={() => setTypeForm({ name: '', status: 'ACTIVE' })}
                  className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  RESET
                </button>
              </div>
            </form>
          </div>

          {/* Right Table: ASSET TYPE Table matching Asset type.png */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#1E40AF]" />
                ASSET TYPES DIRECTORY
              </h2>
              <span className="text-xs text-slate-500 font-semibold">
                {types.length} Categories Registered
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-20 text-center">ACTION</th>
                    <th className="py-3 px-4">TYPE NAME</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4 text-center">REGISTERED ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {types.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteType(t.id, t.name)}
                          title="Delete Type"
                          className="p-1 text-rose-500 hover:bg-rose-100 rounded-md transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 uppercase">
                        {t.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-center text-slate-400">
                        {t.id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────── MODAL: CREATE / EDIT ASSET ──────────────────── */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Box className="w-5 h-5 text-[#1E40AF]" />
                <h3 className="font-bold text-slate-900 uppercase">
                  {editingAsset ? `Edit Asset: ${editingAsset.code}` : '+ Add Enterprise Asset'}
                </h3>
              </div>
              <button 
                onClick={() => setIsAssetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAsset} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Asset Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AST-IT-008"
                    value={assetForm.code}
                    onChange={(e) => setAssetForm({ ...assetForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#1E40AF] outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Asset Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dell Precision 7680 Workstation"
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#1E40AF] outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Asset Type *
                  </label>
                  <select
                    value={assetForm.type_name}
                    onChange={(e) => {
                      const sel = types.find(t => t.name === e.target.value);
                      setAssetForm({
                        ...assetForm,
                        type_name: e.target.value,
                        type_id: sel ? sel.id : ''
                      });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#1E40AF] outline-none font-semibold cursor-pointer"
                  >
                    {types.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Branch / Facility *
                  </label>
                  <select
                    value={assetForm.branch}
                    onChange={(e) => setAssetForm({ ...assetForm, branch: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#1E40AF] outline-none font-semibold cursor-pointer"
                  >
                    {branches.filter(b => b !== 'ALL').map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Assign To (Personnel)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vũ Thị Hoan or Rajesh Sharma"
                    value={assetForm.assigned_to}
                    onChange={(e) => setAssetForm({ ...assetForm, assigned_to: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#1E40AF] outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apple, Toyota, Shimadzu"
                    value={assetForm.brand}
                    onChange={(e) => setAssetForm({ ...assetForm, brand: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#1E40AF] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MacBook Pro M3"
                    value={assetForm.model}
                    onChange={(e) => setAssetForm({ ...assetForm, model: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#1E40AF] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. C02G41ABMD6M"
                    value={assetForm.serial_no}
                    onChange={(e) => setAssetForm({ ...assetForm, serial_no: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#1E40AF] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={assetForm.purchase_date}
                    onChange={(e) => setAssetForm({ ...assetForm, purchase_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#1E40AF] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Expiry / Warranty Date
                  </label>
                  <input
                    type="date"
                    value={assetForm.expiry_date}
                    onChange={(e) => setAssetForm({ ...assetForm, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#1E40AF] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Depreciation Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={assetForm.depreciation_rate}
                    onChange={(e) => setAssetForm({ ...assetForm, depreciation_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#1E40AF] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Cost ($ USD)
                  </label>
                  <input
                    type="number"
                    step="10"
                    value={assetForm.cost}
                    onChange={(e) => setAssetForm({ ...assetForm, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#1E40AF] outline-none font-mono"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAssetModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  {editingAsset ? 'UPDATE ASSET' : 'SAVE ASSET'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

