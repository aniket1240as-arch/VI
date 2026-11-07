import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  RotateCcw,
  AlertTriangle,
  Scale,
  Warehouse,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  PackageCheck
} from 'lucide-react';
import api from '../../services/api';
import DataTable from '../common/DataTable';

const TABS = [
  { id: 'stock', label: 'Current Stock & Lots', icon: Boxes },
  { id: 'stock_in', label: 'Stock In (GRN)', icon: ArrowDownLeft },
  { id: 'delivery', label: 'WH Delivery', icon: ArrowUpRight },
  { id: 'delivery_note', label: 'Delivery Notes', icon: FileText },
  { id: 'returns', label: 'Delivery Returns', icon: RotateCcw },
  { id: 'damages', label: 'Damage & Loss', icon: AlertTriangle },
];

export default function WarehouseInventory({ initialTab = 'stock' }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'stock');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);
  const [items, setItems] = useState([]);
  const [metrics, setMetrics] = useState({
    totalStockMt: 0,
    allocatedMt: 0,
    availableMt: 0,
    totalValuationUsd: 0,
    totalLots: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [damages, setDamages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    item_code: '',
    item_name: '',
    category: 'SPICES',
    warehouse_name: 'Hanoi Bonded Warehouse',
    stock_mt: '',
    unit_cost_usd: '',
    reorder_level_mt: '10'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'stock') {
        const res = await api.getInventoryItems(selectedWarehouse, null, search);
        if (res.success && res.data) {
          setItems(res.data.items || []);
          if (res.data.metrics) setMetrics(res.data.metrics);
        }
      } else if (['stock_in', 'delivery', 'delivery_note', 'returns'].includes(activeTab)) {
        let typeMap = {
          stock_in: 'STOCK_IN',
          delivery: 'WH_DELIVERY',
          delivery_note: 'WH_NOTE',
          returns: 'WH_RETURN'
        };
        const res = await api.getWarehouseTransactions(typeMap[activeTab], search);
        if (res.success && res.data) {
          setTransactions(res.data || []);
        }
      } else if (activeTab === 'damages') {
        const res = await api.getWarehouseDamages(null, search);
        if (res.success && res.data) {
          setDamages(res.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, selectedWarehouse, search]);

  const handleCreateLot = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        item_code: formData.item_code,
        item_name: formData.item_name,
        category: formData.category,
        warehouse_name: formData.warehouse_name,
        stock_mt: parseFloat(formData.stock_mt || 0),
        allocated_mt: 0.0,
        available_mt: parseFloat(formData.stock_mt || 0),
        reorder_level_mt: parseFloat(formData.reorder_level_mt || 5),
        unit_cost_usd: parseFloat(formData.unit_cost_usd || 0),
        status: 'IN_STOCK'
      };
      const res = await api.createInventoryItem(payload);
      if (res.success) {
        setIsModalOpen(false);
        setFormData({
          item_code: '',
          item_name: '',
          category: 'SPICES',
          warehouse_name: 'Hanoi Bonded Warehouse',
          stock_mt: '',
          unit_cost_usd: '',
          reorder_level_mt: '10'
        });
        loadData();
      }
    } catch (err) {
      console.error('Error registering inventory lot:', err);
    }
  };

  const exportCSV = () => {
    let rows = [];
    if (activeTab === 'stock') {
      rows = items.map(i => ({
        Code: i.item_code,
        Name: i.item_name,
        Category: i.category,
        Warehouse: i.warehouse_name,
        'Stock (MT)': i.stock_mt,
        'Allocated (MT)': i.allocated_mt,
        'Available (MT)': i.available_mt,
        'Unit Cost ($)': i.unit_cost_usd,
        'Status': i.status
      }));
    } else if (activeTab === 'damages') {
      rows = damages.map(d => ({
        LogNo: d.log_no,
        Type: d.log_type,
        Item: d.item_name,
        Warehouse: d.warehouse_name,
        'Loss (MT)': d.loss_mt,
        Reason: d.reason,
        Date: d.date,
        Status: d.status
      }));
    } else {
      rows = transactions.map(t => ({
        TxnNo: t.transaction_no,
        Type: t.transaction_type,
        Item: t.item_name,
        Warehouse: t.warehouse_name,
        'Qty (MT)': t.quantity_mt,
        RefOrder: t.reference_order_no,
        Partner: t.partner_name,
        Truck: t.driver_truck_no,
        Date: t.date,
        Status: t.status
      }));
    }

    if (!rows.length) return;
    const headers = Object.keys(rows[0]).join(',');
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows.map(r => Object.values(r).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `warehouse_${activeTab}_report.csv`);
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
            <Warehouse className="w-7 h-7 text-blue-700" />
            Warehouse & Inventory Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track multi-hub commodity stocks, incoming receipts, dispatches, delivery notes, and damage shrinkage.
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
            Register Lot
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Physical Stock</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalStockMt.toLocaleString()} <span className="text-sm font-medium text-slate-500">MT</span></h3>
            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
              <PackageCheck className="w-3.5 h-3.5" />
              Across {metrics.totalLots} inventory lots
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-700">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Allocated for Dispatch</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{metrics.allocatedMt.toLocaleString()} <span className="text-sm font-medium text-slate-500">MT</span></h3>
            <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Locked against active sales orders
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Net Available Stock</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{metrics.availableMt.toLocaleString()} <span className="text-sm font-medium text-slate-500">MT</span></h3>
            <p className="text-xs text-emerald-700 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Available for immediate contracting
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Inventory Valuation</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">${metrics.totalValuationUsd.toLocaleString()}</h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-700" />
              Estimated FIFO valuation
            </p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-700">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
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
            Loading warehouse data...
          </div>
        ) : activeTab === 'stock' ? (
          <DataTable
            className="border-0 shadow-none rounded-t-none"
            columns={[
              {
                key: 'item_code',
                header: 'ITEM CODE',
                render: (val) => <span className="font-mono font-bold text-blue-700">{val}</span>
              },
              {
                key: 'item_name',
                header: 'ITEM DESCRIPTION',
                render: (val) => <strong className="text-slate-900">{val}</strong>
              },
              {
                key: 'category',
                header: 'CATEGORY',
                render: (val) => (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                    {val}
                  </span>
                )
              },
              {
                key: 'warehouse_name',
                header: 'WAREHOUSE HUB',
                render: (val) => <span className="text-slate-600">{val}</span>
              },
              {
                key: 'stock_mt',
                header: 'PHYSICAL STOCK',
                align: 'right',
                render: (val) => <span className="font-mono font-semibold text-slate-900">{val} MT</span>
              },
              {
                key: 'allocated_mt',
                header: 'ALLOCATED',
                align: 'right',
                render: (val) => <span className="font-mono font-medium text-amber-600">{val} MT</span>
              },
              {
                key: 'available_mt',
                header: 'NET AVAILABLE',
                align: 'right',
                render: (val) => <span className="font-mono font-bold text-emerald-600">{val} MT</span>
              },
              {
                key: 'valuation',
                header: 'VALUATION',
                align: 'right',
                render: (_, row) => (
                  <span className="font-mono font-bold text-slate-900">
                    ${(parseFloat(row.stock_mt || 0) * parseFloat(row.unit_cost_usd || 0)).toLocaleString()}
                  </span>
                )
              },
              {
                key: 'status',
                header: 'STATUS',
                align: 'center',
                render: (val) => (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {val || 'AVAILABLE'}
                  </span>
                )
              }
            ]}
            data={items}
            title="Warehouse_Current_Stock"
            searchPlaceholder="Search items, code, category, warehouse..."
            actions={
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="ALL">All Hubs & Warehouses</option>
                  <option value="Hanoi Bonded Warehouse">Hanoi Bonded Warehouse</option>
                  <option value="Hai Phong Central Port Depot">Hai Phong Central Port Depot</option>
                  <option value="Kochi Spices Terminal">Kochi Spices Terminal</option>
                  <option value="Buon Ma Thuot Depot">Buon Ma Thuot Depot</option>
                  <option value="Kolkata Port Silo 4">Kolkata Port Silo 4</option>
                </select>
              </div>
            }
            onAdd={() => setIsModalOpen(true)}
            addLabel="+ Register Lot"
          />
        ) : activeTab === 'damages' ? (
          <DataTable
            className="border-0 shadow-none rounded-t-none"
            columns={[
              {
                key: 'log_no',
                header: 'LOG NO',
                render: (val) => <span className="font-mono font-semibold text-slate-900">{val}</span>
              },
              {
                key: 'log_type',
                header: 'DISCREPANCY TYPE',
                render: (val) => (
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    val === 'DAMAGE' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {val}
                  </span>
                )
              },
              {
                key: 'item_name',
                header: 'ITEM NAME',
                render: (val) => <strong className="text-slate-900">{val}</strong>
              },
              {
                key: 'warehouse_name',
                header: 'WAREHOUSE HUB',
                render: (val) => <span className="text-slate-600">{val}</span>
              },
              {
                key: 'loss_mt',
                header: 'LOSS QUANTITY',
                align: 'right',
                render: (val) => <span className="font-mono font-bold text-red-600">-{val} MT</span>
              },
              {
                key: 'reason',
                header: 'REASON / NOTE',
                render: (val) => <span className="text-slate-600 text-xs max-w-xs block truncate">{val}</span>
              },
              {
                key: 'inspection_officer',
                header: 'OFFICER',
                render: (val) => <span className="text-slate-700 font-medium">{val || '-'}</span>
              },
              {
                key: 'date',
                header: 'LOG DATE',
                render: (val) => <span className="font-mono text-slate-500 text-xs">{val}</span>
              },
              {
                key: 'status',
                header: 'STATUS',
                align: 'center',
                render: (val) => (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {val || 'LOGGED'}
                  </span>
                )
              }
            ]}
            data={damages}
            title="Warehouse_Damages_and_Shrinkage"
            searchPlaceholder="Search log #, discrepancy, item, officer..."
          />
        ) : (
          <DataTable
            className="border-0 shadow-none rounded-t-none"
            columns={[
              {
                key: 'transaction_no',
                header: 'TXN NO',
                render: (val) => <span className="font-mono font-bold text-slate-900">{val}</span>
              },
              {
                key: 'transaction_type',
                header: 'MOVEMENT TYPE',
                render: (val) => (
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    val === 'STOCK_IN'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : val === 'WH_DELIVERY'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                  }`}>
                    {val}
                  </span>
                )
              },
              {
                key: 'item_name',
                header: 'COMMODITY',
                render: (val) => <strong className="text-slate-900">{val}</strong>
              },
              {
                key: 'warehouse_name',
                header: 'WAREHOUSE HUB',
                render: (val) => <span className="text-slate-600">{val}</span>
              },
              {
                key: 'quantity_mt',
                header: 'QUANTITY',
                align: 'right',
                render: (val) => <span className="font-mono font-bold text-slate-900">{val} MT</span>
              },
              {
                key: 'reference_order_no',
                header: 'ORDER REF / GRN',
                render: (val) => <span className="font-mono text-xs font-semibold text-blue-700">{val || '-'}</span>
              },
              {
                key: 'partner_name',
                header: 'PARTNER / CONSIGNEE',
                render: (val) => <span className="text-slate-700 font-medium">{val || '-'}</span>
              },
              {
                key: 'driver_truck_no',
                header: 'TRUCK / CONTAINER',
                render: (val) => <span className="font-mono text-xs text-slate-600">{val || '-'}</span>
              },
              {
                key: 'date',
                header: 'DATE',
                render: (val) => <span className="font-mono text-slate-500 text-xs">{val}</span>
              },
              {
                key: 'status',
                header: 'STATUS',
                align: 'center',
                render: (val) => (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {val || 'CONFIRMED'}
                  </span>
                )
              }
            ]}
            data={transactions}
            title={`Warehouse_${activeTab.toUpperCase()}`}
            searchPlaceholder="Search txn #, commodity, order ref, partner, truck..."
          />
        )}
      </div>
      {/* Register Lot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Register Warehouse Inventory Lot</h3>
            <form onSubmit={handleCreateLot} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Item Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CASSIA-SPL-A"
                    value={formData.item_code}
                    onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2"
                  >
                    <option value="SPICES">SPICES</option>
                    <option value="GRAINS & COFFEE">GRAINS & COFFEE</option>
                    <option value="ANIMAL FEED">ANIMAL FEED</option>
                    <option value="EDIBLE OILS">EDIBLE OILS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cassia Split Grade A FAQ"
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Warehouse Hub</label>
                <select
                  value={formData.warehouse_name}
                  onChange={(e) => setFormData({ ...formData, warehouse_name: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2"
                >
                  <option value="Hanoi Bonded Warehouse">Hanoi Bonded Warehouse</option>
                  <option value="Hai Phong Central Port Depot">Hai Phong Central Port Depot</option>
                  <option value="Kochi Spices Terminal">Kochi Spices Terminal</option>
                  <option value="Buon Ma Thuot Depot">Buon Ma Thuot Depot</option>
                  <option value="Kolkata Port Silo 4">Kolkata Port Silo 4</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Stock (MT)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 50.0"
                    value={formData.stock_mt}
                    onChange={(e) => setFormData({ ...formData, stock_mt: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Cost ($/MT)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 3100"
                    value={formData.unit_cost_usd}
                    onChange={(e) => setFormData({ ...formData, unit_cost_usd: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2"
                  />
                </div>
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
                  Register Lot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

