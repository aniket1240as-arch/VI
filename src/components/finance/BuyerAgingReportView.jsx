import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Download,
  Search,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users
} from 'lucide-react';
import api from '../../services/api';
import DataTable from '../common/DataTable';

export default function BuyerAgingReportView() {
  const [data, setData] = useState({
    breakdown: [],
    summary: {
      totalCurrent: 0,
      total30Days: 0,
      total60Days: 0,
      total90Plus: 0,
      grandTotal: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadAging = async () => {
    try {
      setLoading(true);
      const res = await api.getBuyerAgingReport();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching aging report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAging();
  }, []);

  const filteredBuyers = (data.breakdown || []).filter(b =>
    b.customer.toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    if (!filteredBuyers.length) return;
    const headers = ['Customer Buyer', 'Current (0-30 Days)', '31-60 Days', '61-90 Days', '90+ Days Overdue', 'Total Outstanding'];
    const rows = filteredBuyers.map(b => [
      `"${b.customer}"`,
      b.current_usd,
      b.days_30,
      b.days_60,
      b.days_90_plus,
      b.total
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `buyer_aging_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Receivables</p>
          <h3 className="text-xl font-bold text-slate-900 mt-1">${(data.summary?.grandTotal || 0).toLocaleString()}</h3>
          <p className="text-xs text-blue-700 mt-1">Across all trade accounts</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-emerald-600 uppercase">Current (0-30 Days)</p>
          <h3 className="text-xl font-bold text-emerald-600 mt-1">${(data.summary?.totalCurrent || 0).toLocaleString()}</h3>
          <p className="text-xs text-emerald-700 mt-1">Within standard credit terms</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-amber-600 uppercase">31 - 60 Days</p>
          <h3 className="text-xl font-bold text-amber-600 mt-1">${(data.summary?.total30Days || 0).toLocaleString()}</h3>
          <p className="text-xs text-amber-700 mt-1">Follow-up reminder sent</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-orange-600 uppercase">61 - 90 Days</p>
          <h3 className="text-xl font-bold text-orange-600 mt-1">${(data.summary?.total60Days || 0).toLocaleString()}</h3>
          <p className="text-xs text-orange-700 mt-1">Escalated commercial alert</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-red-600 uppercase">90+ Days Overdue</p>
          <h3 className="text-xl font-bold text-red-600 mt-1">${(data.summary?.total90Plus || 0).toLocaleString()}</h3>
          <p className="text-xs text-red-700 mt-1">Credit hold enforcement</p>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={[
          {
            key: 'customer',
            header: 'BUYER CUSTOMER',
            render: (val) => <strong className="text-slate-900">{val}</strong>
          },
          {
            key: 'current_usd',
            header: '0 - 30 DAYS (CURRENT)',
            align: 'right',
            render: (val) => <span className="font-mono text-emerald-600 font-bold">${(val || 0).toLocaleString()}</span>
          },
          {
            key: 'days_30',
            header: '31 - 60 DAYS',
            align: 'right',
            render: (val) => <span className="font-mono text-amber-600 font-medium">${(val || 0).toLocaleString()}</span>
          },
          {
            key: 'days_60',
            header: '61 - 90 DAYS',
            align: 'right',
            render: (val) => <span className="font-mono text-orange-600 font-semibold">${(val || 0).toLocaleString()}</span>
          },
          {
            key: 'days_90_plus',
            header: '90+ DAYS OVERDUE',
            align: 'right',
            render: (val) => <span className="font-mono text-red-600 font-black">${(val || 0).toLocaleString()}</span>
          },
          {
            key: 'total',
            header: 'TOTAL RECEIVABLES',
            align: 'right',
            render: (val) => <span className="font-mono font-black text-slate-900">${(val || 0).toLocaleString()}</span>
          },
          {
            key: 'status',
            header: 'CREDIT STATUS',
            align: 'center',
            render: (_, b) => {
              const hasOverdue = (b.days_90_plus || 0) > 0;
              const hasWarning = (b.days_60 || 0) > 0;
              return (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  hasOverdue
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : hasWarning
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {hasOverdue ? 'CREDIT HOLD' : hasWarning ? 'PAYMENT ALERT' : 'GOOD STANDING'}
                </span>
              );
            }
          }
        ]}
        data={data.breakdown || []}
        title="Buyer_Aging_Receivables_Report"
        searchPlaceholder="Search buyer customer..."
      />
    </div>
  );
}
