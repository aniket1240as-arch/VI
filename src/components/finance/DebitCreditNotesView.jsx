import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Search,
  Filter,
  Download,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock
} from 'lucide-react';
import api from '../../services/api';
import DataTable from '../common/DataTable';

export default function DebitCreditNotesView() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [partyFilter, setPartyFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    note_no: '',
    note_type: 'DEBIT_NOTE',
    date: new Date().toISOString().split('T')[0],
    party_type: 'SUPPLIER',
    party_name: '',
    invoice_ref: '',
    amount: '',
    currency: 'USD',
    reason: '',
    payment_status: 'UNSETTLED'
  });

  const loadNotes = async () => {
    try {
      setLoading(true);
      const res = await api.getDebitCreditNotes(typeFilter, partyFilter, search);
      if (res.success && res.data) {
        setNotes(res.data || []);
      }
    } catch (err) {
      console.error('Error loading debit/credit notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [typeFilter, partyFilter, search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createDebitCreditNote({
        ...form,
        amount: parseFloat(form.amount || 0)
      });
      if (res.success) {
        setIsModalOpen(false);
        setForm({
          note_no: '',
          note_type: 'DEBIT_NOTE',
          date: new Date().toISOString().split('T')[0],
          party_type: 'SUPPLIER',
          party_name: '',
          invoice_ref: '',
          amount: '',
          currency: 'USD',
          reason: '',
          payment_status: 'UNSETTLED'
        });
        loadNotes();
      }
    } catch (err) {
      console.error('Error saving note:', err);
    }
  };

  const totalDebit = notes.filter(n => n.note_type === 'DEBIT_NOTE').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const totalCredit = notes.filter(n => n.note_type === 'CREDIT_NOTE').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Debit Notes</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">${totalDebit.toLocaleString()}</h3>
            <p className="text-xs text-blue-700 mt-1">Shortage claims & expense recoveries</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-700">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Credit Notes</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">${totalCredit.toLocaleString()}</h3>
            <p className="text-xs text-amber-700 mt-1">Discounts & commercial concessions</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Commercial Balance</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">${(totalDebit - totalCredit).toLocaleString()}</h3>
            <p className="text-xs text-emerald-700 mt-1">Active adjustments ledger</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={[
          {
            key: 'note_no',
            header: 'NOTE NO',
            render: (val) => <span className="font-mono font-bold text-slate-900">{val}</span>
          },
          {
            key: 'note_type',
            header: 'TYPE',
            render: (val) => (
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                val === 'DEBIT_NOTE'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {val === 'DEBIT_NOTE' ? 'DEBIT NOTE' : 'CREDIT NOTE'}
              </span>
            )
          },
          {
            key: 'party_type',
            header: 'PARTY ROLE',
            render: (val) => <span className="text-xs font-semibold text-slate-600">{val}</span>
          },
          {
            key: 'party_name',
            header: 'PARTY ENTITY',
            render: (val) => <strong className="text-slate-900">{val}</strong>
          },
          {
            key: 'invoice_ref',
            header: 'LINKED INVOICE',
            render: (val) => <span className="font-mono text-xs text-blue-700 font-semibold">{val || '-'}</span>
          },
          {
            key: 'amount',
            header: 'ADJUSTMENT AMOUNT',
            align: 'right',
            render: (val) => <span className="font-mono font-bold text-slate-900">${(val || 0).toLocaleString()}</span>
          },
          {
            key: 'reason',
            header: 'JUSTIFICATION',
            render: (val) => <span className="text-slate-600 max-w-xs block truncate text-xs">{val}</span>
          },
          {
            key: 'date',
            header: 'DATE',
            render: (val) => <span className="text-slate-500 font-mono text-xs">{val}</span>
          },
          {
            key: 'payment_status',
            header: 'STATUS',
            align: 'center',
            render: (val) => (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                val === 'SETTLED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {val}
              </span>
            )
          }
        ]}
        data={notes}
        title="Debit_and_Credit_Notes"
        searchPlaceholder="Search note #, party, invoice ref, reason..."
        onAdd={() => setIsModalOpen(true)}
        addLabel="+ Create Note"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Note Types</option>
              <option value="DEBIT_NOTE">Debit Notes</option>
              <option value="CREDIT_NOTE">Credit Notes</option>
            </select>
            <select
              value={partyFilter}
              onChange={(e) => setPartyFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Parties</option>
              <option value="BUYER">Buyer</option>
              <option value="SUPPLIER">Supplier</option>
            </select>
          </div>
        }
      />


      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Issue Commercial Debit / Credit Note</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Note Type</label>
                  <select
                    value={form.note_type}
                    onChange={(e) => setForm({ ...form, note_type: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2"
                  >
                    <option value="DEBIT_NOTE">DEBIT NOTE</option>
                    <option value="CREDIT_NOTE">CREDIT NOTE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Party Type</label>
                  <select
                    value={form.party_type}
                    onChange={(e) => setForm({ ...form, party_type: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2"
                  >
                    <option value="SUPPLIER">SUPPLIER</option>
                    <option value="BUYER">BUYER</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Note Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DN-2026-005"
                  value={form.note_no}
                  onChange={(e) => setForm({ ...form, note_no: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Party / Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VAST EXIM PRIVATE LIMITED"
                  value={form.party_name}
                  onChange={(e) => setForm({ ...form, party_name: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-118"
                    value={form.invoice_ref}
                    onChange={(e) => setForm({ ...form, invoice_ref: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 2400.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Commercial Reason</label>
                <textarea
                  rows="2"
                  required
                  placeholder="Reason for price concession, container shortage, or demurrage..."
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2"
                />
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
                  Issue Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

