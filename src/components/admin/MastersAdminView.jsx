import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  ShieldCheck,
  Building2,
  Building,
  GitBranch,
  Warehouse,
  Boxes,
  Server,
  Database,
  UserPlus,
  RefreshCw,
  X,
  Pencil,
  Trash2,
  Key,
  Users,
  Check,
  AlertCircle,
  CreditCard,
  Anchor,
  FileCheck,
  Bell,
  DollarSign,
  Plus,
  Search,
  Truck,
  Settings,
  FileText,
  History,
  MapPin,
  Receipt,
  Download
} from 'lucide-react';
import api from '../../services/api';
import DataTable from '../common/DataTable';

const IAM_ROLES = [
  { id: 'EMPLOYEE', label: 'EMPLOYEE (Self-Service: Daily Hours, Clock-in, Overtime, Leave, Salary Slips)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'HR_MANAGER', label: 'HR_MANAGER (Workforce Directory, Recruitment, Leaves & Overtime Approval)', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'ADMIN', label: 'ADMIN (Full Enterprise System Access & IAM Control)', color: 'bg-blue-100 text-[#1E40AF] border-blue-200' },
  { id: 'TRADE_OFFICER', label: 'TRADE_OFFICER (Export/Import Logistics, BL Manifests, Trade Contracts)', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'QUALITY_MANAGER', label: 'QUALITY_MANAGER (QA Lab Directorship, FSSAI Testing, Phytosanitary)', color: 'bg-teal-100 text-teal-800 border-teal-200' },
];

export default function MastersAdminView({ viewType = 'masters', initialTab = null }) {
  const [activeTab, setActiveTab] = useState(() => (viewType === 'users' ? 'users' : initialTab || 'company_profile'));

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 14 Master States
  const [companyProfiles, setCompanyProfiles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [banks, setBanks] = useState([]);
  const [ports, setPorts] = useState([]);
  const [qcParties, setQcParties] = useState([]);
  const [notifyParties, setNotifyParties] = useState([]);
  const [payees, setPayees] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [globalSettings, setGlobalSettings] = useState([]);
  const [commonPages, setCommonPages] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [countries, setCountries] = useState([]);

  // IAM Modal State
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: 'emp' + Math.floor(100 + Math.random() * 900),
    role: 'EMPLOYEE',
    department: 'Sales & Export',
    status: 'ACTIVE'
  });

  const notify = (type, msg) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  const loadAllMasters = useCallback(async () => {
    setLoading(true);
    try {
            const [
        cpData, brData, whData, locData, bnkData, prtData,
        qcData, npData, pyData, vndData, expData, setData,
        cpPagesData, logData, usrData, trpData, ctyData
      ] = await Promise.all([
        api.getCompanyProfiles ? api.getCompanyProfiles() : Promise.resolve([]),
        api.getBranches ? api.getBranches() : Promise.resolve([]),
        api.getMasterWarehouses ? api.getMasterWarehouses() : Promise.resolve([]),
        api.getMasterLocations ? api.getMasterLocations() : Promise.resolve([]),
        api.getBanks ? api.getBanks() : Promise.resolve([]),
        api.getPorts ? api.getPorts() : Promise.resolve([]),
        api.getQcParties ? api.getQcParties() : Promise.resolve([]),
        api.getNotifyParties ? api.getNotifyParties() : Promise.resolve([]),
        api.getPayees ? api.getPayees() : Promise.resolve([]),
        api.getVendors ? api.getVendors() : Promise.resolve([]),
        api.getExpenseCategories ? api.getExpenseCategories() : Promise.resolve([]),
        api.getGlobalSettings ? api.getGlobalSettings() : Promise.resolve([]),
        api.getCommonPages ? api.getCommonPages() : Promise.resolve([]),
        api.getAccessLogs ? api.getAccessLogs() : Promise.resolve([]),
        api.getUsers ? api.getUsers() : Promise.resolve([]),
        api.getTransporters ? api.getTransporters() : Promise.resolve([]),
        api.getCountries ? api.getCountries() : Promise.resolve([])
      ]);

      if (cpData) setCompanyProfiles(cpData);
      if (brData) setBranches(brData);
      if (whData) setWarehouses(whData);
      if (locData) setLocations(locData);
      if (bnkData) setBanks(bnkData);
      if (prtData) setPorts(prtData);
      if (qcData) setQcParties(qcData);
      if (npData) setNotifyParties(npData);
      if (pyData) setPayees(pyData);
      if (vndData) setVendors(vndData);
      if (expData) setExpenseCategories(expData);
      if (setData) setGlobalSettings(setData);
      if (cpPagesData) setCommonPages(cpPagesData);
      if (logData) setAccessLogs(logData);
      if (usrData) setUsers(usrData);
      if (trpData) setTransporters(trpData);
      if (ctyData) setCountries(ctyData);
    } catch (err) {
      console.error('Error loading master data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllMasters();
  }, [loadAllMasters]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createUser(newUser);
      if (res) {
        notify('success', `IAM User ${newUser.name} created!`);
        setShowCreateUserModal(false);
        setNewUser({
          name: '',
          email: '',
          password: 'emp' + Math.floor(100 + Math.random() * 900),
          role: 'EMPLOYEE',
          department: 'Sales & Export',
          status: 'ACTIVE'
        });
        loadAllMasters();
      }
    } catch (err) {
      notify('error', 'Error creating user');
    }
  };

    const navTabs = [
    { id: 'company_profile', label: 'COMPANY PROFILE', icon: Building, count: companyProfiles.length },
    { id: 'branches', label: 'BRANCH', icon: GitBranch, count: branches.length },
    { id: 'vendors', label: 'VENDORS', icon: Truck, count: vendors.length },
    { id: 'warehouses', label: 'WAREHOUSE', icon: Warehouse, count: warehouses.length },
    { id: 'transporters', label: 'TRANSPORTERS', icon: Truck, count: transporters.length },
    { id: 'qc_parties', label: 'QC PARTY', icon: FileCheck, count: qcParties.length },
    { id: 'notify_parties', label: 'NOTIFY PARTY', icon: Bell, count: notifyParties.length },
    { id: 'locations', label: 'LOCATION', icon: Boxes, count: locations.length },
    { id: 'expense_categories', label: 'EXPENSE CATEGORY', icon: Receipt, count: expenseCategories.length },
    { id: 'ports', label: 'PORTMASTERS', icon: Anchor, count: ports.length },
    { id: 'payees', label: 'PAYMENT PAYEE', icon: DollarSign, count: payees.length },
    { id: 'banks', label: 'BANKS', icon: CreditCard, count: banks.length },
    { id: 'settings', label: 'MODULES', icon: Settings, count: globalSettings.length },
    { id: 'countries', label: 'COUNTRY', icon: MapPin, count: countries.length },
    { id: 'common_pages', label: 'BOILERPLATE', icon: FileText, count: commonPages.length },
    { id: 'access_logs', label: 'AUDIT LOGS', icon: History, count: accessLogs.length },
    { id: 'users', label: 'IAM ROLES', icon: ShieldCheck, count: users.length },
  ];

  const exportCurrentMasterCSV = () => {
    let rows = [];
    let filename = `master_${activeTab}.csv`;

    if (activeTab === 'company_profile') {
      rows = companyProfiles.map(c => ({ Code: c.code, 'Name (EN)': c.name_en, 'Name (VI)': c.name_vi, Phone: c.phone, Email: c.email, Address: c.address_en }));
    } else if (activeTab === 'branches') {
      rows = branches.map(b => ({ Code: b.code, Name: b.name, Phone: b.phone, Currency: b.currency, CashBalance: b.cash_balance, City: b.city, Country: b.country }));
    } else if (activeTab === 'warehouses') {
      rows = warehouses.map(w => ({ Name: w.name, Location: w.location, Status: w.status }));
    } else if (activeTab === 'banks') {
      rows = banks.map(b => ({ ShortName: b.short_name, BankName: b.bank_name, AccountNo: b.account_no, Currency: b.currency, Swift: b.swift_code, Branch: b.branch }));
    } else if (activeTab === 'ports') {
      rows = ports.map(p => ({ Name: p.name, Code: p.code, Country: p.country, ShortName: p.short_name }));
    } else if (activeTab === 'qc_parties') {
      rows = qcParties.map(q => ({ Name: q.name, Email: q.email, Phone: q.phone, Country: q.country, PanNo: q.pan_no }));
    } else if (activeTab === 'notify_parties') {
      rows = notifyParties.map(n => ({ Name: n.name, Phone: n.phone, City: n.city, Country: n.country }));
    } else if (activeTab === 'payees') {
      rows = payees.map(p => ({ Name: p.name, Phone: p.phone, Branch: p.branch, Status: p.status }));
    } else if (activeTab === 'vendors') {
      rows = vendors.map(v => ({ Code: v.code, Name: v.name, ShortName: v.short_name, Phone: v.phone, Email: v.email, City: v.city }));
    } else if (activeTab === 'expense_categories') {
      rows = expenseCategories.map(e => ({ Type: e.expense_type, Name: e.name, Group: e.group_name, Remark: e.remark }));
    } else if (activeTab === 'settings') {
      rows = globalSettings.map(s => ({ Type: s.setting_type, Key: s.setting_key, Value: s.setting_value }));
    } else if (activeTab === 'common_pages') {
      rows = commonPages.map(cp => ({ Name: cp.name, Key: cp.page_key, Type: cp.page_type, Details: cp.details }));
    } else if (activeTab === 'access_logs') {
      rows = accessLogs.map(l => ({ DateTime: l.date_time, User: l.user_name, Model: l.model_name, Event: l.event, URL: l.url }));
    } else if (activeTab === 'users') {
      rows = users.map(u => ({ Name: u.name, Email: u.email, Role: u.role, Department: u.department, Status: u.status }));
    }

    if (!rows.length) return;
    const headers = Object.keys(rows[0]).join(',');
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows.map(r => Object.values(r).map(v => `"${v || ''}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl border flex items-center space-x-2 text-xs font-semibold ${
          notification.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {notification.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-600" /> : <Check className="w-4 h-4 text-emerald-600" />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-7 h-7 text-blue-700" />
            System Masters & Enterprise Directories
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete live ERP configuration suite: company profiles, branch cash balances, storage bins, shipping parties, bank accounts, and audit access logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCurrentMasterCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>
          {activeTab === 'users' && (
            <button
              onClick={() => setShowCreateUserModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Add IAM User
            </button>
          )}
        </div>
      </div>

      {/* Master Sub-Navigation Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {navTabs.map(t => {
            const Icon = t.icon;
            const isSel = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSel
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isSel ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Master Content Section */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          Loading master directory...
        </div>
      ) : activeTab === 'company_profile' ? (
        <DataTable
          columns={[
            {
              key: 'code',
              header: 'CODE',
              render: (val) => <span className="font-mono font-bold text-blue-700">{val}</span>
            },
            {
              key: 'name_en',
              header: 'COMPANY NAME (EN)',
              render: (val) => <strong className="text-slate-900">{val}</strong>
            },
            {
              key: 'name_vi',
              header: 'TÊN CÔNG TY (VI)',
              render: (val) => <span className="text-slate-700">{val}</span>
            },
            {
              key: 'phone',
              header: 'PHONE',
              render: (val) => <span className="font-mono text-slate-600 text-xs">{val}</span>
            },
            {
              key: 'email',
              header: 'EMAIL',
              render: (val) => <span className="text-blue-600 text-xs">{val}</span>
            },
            {
              key: 'address_en',
              header: 'REGISTERED ADDRESS',
              render: (val) => <span className="text-slate-500 text-xs">{val}</span>
            },
            {
              key: 'status',
              header: 'STATUS',
              align: 'center',
              render: (val) => (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {val || 'ACTIVE'}
                </span>
              )
            }
          ]}
          data={companyProfiles}
          title="Master_Company_Profile"
          searchPlaceholder="Search company code, name, phone, address..."
        />
      ) : activeTab === 'branches' ? (
        <DataTable
          columns={[
            {
              key: 'code',
              header: 'BRANCH CODE',
              render: (val) => <span className="font-mono font-bold text-blue-700">{val}</span>
            },
            {
              key: 'name',
              header: 'BRANCH NAME',
              render: (val) => <strong className="text-slate-900">{val}</strong>
            },
            {
              key: 'phone',
              header: 'PHONE',
              render: (val) => <span className="font-mono text-slate-600 text-xs">{val}</span>
            },
            {
              key: 'address',
              header: 'LOCATION & ADDRESS',
              render: (val, b) => <span className="text-slate-600 text-xs">{val}, {b.city}, {b.country}</span>
            },
            {
              key: 'currency',
              header: 'CURRENCY',
              align: 'center',
              render: (val) => <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">{val}</span>
            },
            {
              key: 'cash_balance',
              header: 'CASH BALANCE',
              align: 'right',
              render: (val, b) => (
                <span className="font-mono font-bold text-slate-900">
                  {b.currency === 'VND' ? `${(val || 0).toLocaleString()} ₫` : `$${(val || 0).toLocaleString()}`}
                </span>
              )
            },
            {
              key: 'status',
              header: 'STATUS',
              align: 'center',
              render: (val) => (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {val || 'ACTIVE'}
                </span>
              )
            }
          ]}
          data={branches}
          title="Master_Branch_Directory"
          searchPlaceholder="Search branch code, name, address, currency..."
        />
      ) : activeTab === 'vendors' ? (
        <DataTable
          columns={[
            {
              key: 'code',
              header: 'VENDOR CODE',
              render: (val) => <span className="font-mono font-bold text-blue-700">{val}</span>
            },
            {
              key: 'name',
              header: 'COMPANY NAME',
              render: (val) => <strong className="text-slate-900">{val}</strong>
            },
            {
              key: 'short_name',
              header: 'SHORT NAME',
              render: (val) => <span className="font-semibold text-amber-700">{val}</span>
            },
            {
              key: 'phone',
              header: 'PHONE',
              render: (val) => <span className="font-mono text-slate-600 text-xs">{val}</span>
            },
            {
              key: 'email',
              header: 'EMAIL',
              render: (val) => <span className="text-blue-600 text-xs">{val}</span>
            },
            {
              key: 'city',
              header: 'LOCATION',
              render: (val, v) => <span className="text-slate-500 text-xs">{val}, {v.country}</span>
            },
            {
              key: 'status',
              header: 'STATUS',
              align: 'center',
              render: (val) => (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {val || 'ACTIVE'}
                </span>
              )
            }
          ]}
          data={vendors}
          title="Master_Vendors_and_Shipping_Lines"
          searchPlaceholder="Search vendor code, company name, phone..."
        />
      ) : activeTab === 'warehouses' ? (
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'WAREHOUSE HUB NAME',
              render: (val) => <strong className="text-slate-900 flex items-center gap-2"><Warehouse className="w-4 h-4 text-blue-700" />{val}</strong>
            },
            {
              key: 'location',
              header: 'COUNTRY & JURISDICTION',
              render: (val) => <span className="text-slate-600">{val}</span>
            },
            {
              key: 'status',
              header: 'STATUS',
              align: 'center',
              render: (val) => (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {val || 'ACTIVE'}
                </span>
              )
            }
          ]}
          data={warehouses}
          title="Master_Warehouse_Hubs"
          searchPlaceholder="Search warehouse hub name, jurisdiction..."
        />
      ) : activeTab === 'transporters' ? (
        <DataTable
          columns={[
            {
              key: 'code',
              header: 'TRANSPORTER CODE',
              render: (val) => <span className="font-mono font-bold text-blue-700">{val}</span>
            },
            {
              key: 'name',
              header: 'TRANSPORTER ENTITY',
              render: (val) => <strong className="text-slate-900">{val}</strong>
            },
            {
              key: 'contact_person',
              header: 'CONTACT PERSON',
              render: (val) => <span className="text-slate-700 font-medium">{val || '—'}</span>
            },
            {
              key: 'phone',
              header: 'PHONE',
              render: (val) => <span className="font-mono text-slate-600 text-xs">{val}</span>
            },
            {
              key: 'email',
              header: 'EMAIL',
              render: (val) => <span className="text-blue-600 text-xs">{val}</span>
            },
            {
              key: 'fleet_type',
              header: 'FLEET TYPE',
              render: (val) => <span className="text-xs bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-700">{val}</span>
            },
            {
              key: 'fleet_size',
              header: 'FLEET SIZE',
              align: 'right',
              render: (val) => <span className="font-mono font-bold text-slate-900">{val} units</span>
            },
            {
              key: 'hub',
              header: 'PRIMARY DEPOT / HUB',
              render: (val) => <span className="text-slate-600 text-xs">{val}</span>
            },
            {
              key: 'status',
              header: 'STATUS',
              align: 'center',
              render: (val) => (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {val || 'ACTIVE'}
                </span>
              )
            }
          ]}
          data={transporters}
          title="Master_Transporters_Directory"
          searchPlaceholder="Search transporter name, code, contact, fleet, hub..."
        />
      ) : activeTab === 'qc_parties' ? (
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'INSPECTION AGENCY NAME',
              render: (val) => <strong className="text-slate-900">{val}</strong>
            },
            {
              key: 'pan_no',
              header: 'REGISTRATION / PAN NO',
              render: (val) => <span className="font-mono font-bold text-blue-700 text-xs">{val || '—'}</span>
            },
            {
              key: 'email',
              header: 'EMAIL',
              render: (val) => <span className="text-blue-600 text-xs">{val}</span>
            },
            {
              key: 'phone',
              header: 'PHONE',
              render: (val) => <span className="font-mono text-slate-600 text-xs">{val}</span>
            },
            {
              key: 'country',
              header: 'COUNTRY',
              render: (val) => <span className="text-slate-700">{val}</span>
            },
            {
              key: 'city',
              header: 'CITY',
              render: (val) => <span className="text-slate-500 text-xs">{val}</span>
            },
            {
              key: 'status',
              header: 'STATUS',
              align: 'center',
              render: (val) => (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {val || 'ACTIVE'}
                </span>
              )
            }
          ]}
          data={qcParties}
          title="Master_QC_Inspection_Agencies"
          searchPlaceholder="Search QC party name, registration, city..."
        />
      ) : activeTab === 'notify_parties' ? (
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'NOTIFY PARTY NAME',
              render: (val) => <strong className="text-slate-900">{val}</strong>
            },
            {
              key: 'phone',
              header: 'PHONE',
              render: (val) => <span className="font-mono text-slate-600 text-xs">{val}</span>
            },
            {
              key: 'city',
              header: 'CITY',
              render: (val) => <span className="text-slate-700">{val}</span>
            },
            {
              key: 'country',
              header: 'COUNTRY',
              render: (val) => <span className="text-slate-600 font-semibold">{val}</span>
            },
            {
              key: 'status',
              header: 'STATUS',
              align: 'center',
              render: () => (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ACTIVE
                </span>
              )
            }
          ]}
          data={notifyParties}
          title="Master_Notify_Parties"
          searchPlaceholder="Search notify party name, phone, city, country..."
        />
      ) : activeTab === 'locations' ? (
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'STORAGE ZONE / BAY',
              render: (val) => <span className="font-mono font-bold text-blue-700">{val}</span>
            },
            {
              key: 'warehouse_name',
              header: 'LINKED WAREHOUSE HUB',
              render: (val) => <strong className="text-slate-900">{val}</strong>
            },
            {
              key: 'remark',
              header: 'TECHNICAL SPECIFICATION',
              render: (val) => <span className="text-slate-600 text-xs">{val}</span>
            },
            {
              key: 'status',
              header: 'STATUS',
              align: 'center',
              render: (val) => (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {val || 'ACTIVE'}
                </span>
              )
            }
          ]}
          data={locations}
          title="Master_Warehouse_Storage_Locations"
          searchPlaceholder="Search zone name, warehouse hub, specification..."
        />
      ) : activeTab === 'expense_categories' ? (
        <DataTable
          columns={[
            {
              key: 'expense_type',
              header: 'EXPENSE TYPE',
              render: (val) => (
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  val === 'OFFICE' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {val}
                </span>
              )
            },
            {
              key: 'name',
              header: 'CATEGORY NAME',
              render: (val) => <strong className="text-slate-900">{val}</strong>
            },
            {
              key: 'group_name',
              header: 'ACCOUNTING GROUP',
              render: (val) => <span className="text-slate-700 font-medium">{val}</span>
            },
            {
              key: 'remark',
              header: 'OPERATIONAL PURPOSE',
              render: (val) => <span className="text-slate-500 text-xs">{val}</span>
            },
            {
              key: 'status',
              header: 'STATUS',
              align: 'center',
              render: (val) => (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {val || 'ACTIVE'}
                </span>
              )
            }
          ]}
          data={expenseCategories}
          title="Master_Expense_Categories"
          searchPlaceholder="Search expense category name, type, group..."
        />
      ) : activeTab === 'ports' ? (
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'PORT NAME',
              render: (val) => <strong className="text-slate-900">{val}</strong>
            },
            {
              key: 'short_name',
              header: 'SHORT NAME',
              render: (val) => <span className="font-mono text-xs text-slate-600">{val}</span>
            },
            {
              key: 'code',
              header: 'UN/LOCODE',
              render: (val) => <span className="font-mono font-bold text-blue-700">{val}</span>
            },
            {
              key: 'country',
              header: 'COUNTRY',
              render: (val) => <span className="text-slate-700 font-medium">{val}</span>
            },
            {
              key: 'remark',
              header: 'MARITIME GATEWAY DESCRIPTION',
              render: (val) => <span className="text-slate-500 text-xs">{val}</span>
            },
            {
              key: 'status',
              header: 'STATUS',
              align: 'center',
              render: (val) => (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {val || 'ACTIVE'}
                </span>
              )
            }
          ]}
          data={ports}
          title="Master_Shipping_Ports_and_Gateways"
          searchPlaceholder="Search port name, UN/LOCODE, country..."
        />
      ) : activeTab === 'payees' ? (
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'PAYEE FULL TITLE',
              render: (val) => <strong className="text-slate-900">{val}</strong>
            },
            {
              key: 'phone',
              header: 'PHONE',
              render: (val) => <span className="font-mono text-slate-600 text-xs">{val}</span>
            },
            {
              key: 'branch',
              header: 'LINKED BRANCH',
              render: (val) => <span className="text-slate-700 font-medium">{val}</span>
            },
            {
              key: 'status',
              header: 'STATUS',
              align: 'center',
              render: (val) => (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {val || 'ACTIVE'}
                </span>
              )
            }
          ]}
          data={payees}
          title="Master_Payment_Payees"
          searchPlaceholder="Search payee name, phone, branch..."
        />
      ) : activeTab === 'banks' ? (
        <DataTable
          columns={[
            {
              key: 'short_name',
              header: 'SHORT NAME',
              render: (val) => <span className="font-mono font-bold text-blue-700">{val}</span>
            },
            {
              key: 'bank_name',
              header: 'BANK FULL TITLE',
              render: (val) => <strong className="text-slate-900">{val}</strong>
            },
            {
              key: 'account_name',
              header: 'ACCOUNT HOLDER',
              render: (val) => <span className="text-slate-700 font-medium">{val}</span>
            },
            {
              key: 'account_no',
              header: 'ACCOUNT NUMBER',
              render: (val) => <span className="font-mono text-xs text-slate-800 font-semibold">{val}</span>
            },
            {
              key: 'currency',
              header: 'CURRENCY',
              align: 'center',
              render: (val) => <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">{val}</span>
            },
            {
              key: 'swift_code',
              header: 'SWIFT / IFSC',
              render: (val, b) => <span className="font-mono text-xs text-slate-500">{val || b.ifsc_code}</span>
            },
            {
              key: 'branch',
              header: 'BRANCH',
              render: (val) => <span className="text-slate-600 text-xs">{val}</span>
            }
          ]}
          data={banks}
          title="Master_Bank_Accounts"
          searchPlaceholder="Search bank title, account number, SWIFT, branch..."
        />
      ) : activeTab === 'settings' ? (
        <DataTable
          columns={[
            {
              key: 'setting_type',
              header: 'SETTING SCOPE / MODULE',
              render: (val) => <span className="font-mono text-xs font-semibold text-slate-700">{val}</span>
            },
            {
              key: 'setting_key',
              header: 'SYSTEM KEY',
              render: (val) => <span className="font-mono font-bold text-blue-700">{val}</span>
            },
            {
              key: 'setting_value',
              header: 'PREFIX / SERIES VALUE',
              render: (val) => <span className="font-mono text-slate-900 font-bold bg-slate-50 px-3 py-1 rounded border border-slate-200">{val}</span>
            },
            {
              key: 'status',
              header: 'STATUS',
              align: 'center',
              render: (val) => (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {val || 'ACTIVE'}
                </span>
              )
            }
          ]}
          data={globalSettings}
          title="Master_Global_Settings_and_Series"
          searchPlaceholder="Search module scope, system key, value..."
        />
      ) : activeTab === 'countries' ? (
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'COUNTRY NAME',
              render: (val) => <strong className="text-slate-900 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-700" />{val}</strong>
            },
            {
              key: 'code',
              header: '2-LETTER ISO',
              align: 'center',
              render: (val) => <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{val}</span>
            },
            {
              key: 'iso3',
              header: '3-LETTER ISO3',
              align: 'center',
              render: (val) => <span className="font-mono font-semibold text-slate-700">{val}</span>
            },
            {
              key: 'currency',
              header: 'CURRENCY',
              align: 'center',
              render: (val) => <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">{val}</span>
            },
            {
              key: 'phone_code',
              header: 'PHONE CODE',
              render: (val) => <span className="font-mono text-xs text-slate-600">{val}</span>
            },
            {
              key: 'region',
              header: 'GLOBAL TRADE REGION',
              render: (val) => <span className="text-slate-600 text-xs font-medium">{val}</span>
            },
            {
              key: 'customs_status',
              header: 'CUSTOMS JURISDICTION',
              render: (val) => <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{val}</span>
            },
            {
              key: 'status',
              header: 'STATUS',
              align: 'center',
              render: (val) => (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {val || 'ACTIVE'}
                </span>
              )
            }
          ]}
          data={countries}
          title="Master_Country_Directory"
          searchPlaceholder="Search country name, ISO code, currency, region..."
        />
      ) : activeTab === 'common_pages' ? (
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'CLAUSE TITLE',
              render: (val) => <strong className="text-slate-900">{val}</strong>
            },
            {
              key: 'page_key',
              header: 'BOILERPLATE KEY',
              render: (val) => <span className="font-mono text-xs text-blue-700 font-bold">{val}</span>
            },
            {
              key: 'page_type',
              header: 'PAGE CONTEXT',
              render: (val) => <span className="text-xs font-semibold text-slate-700">{val}</span>
            },
            {
              key: 'details',
              header: 'CLAUSE TEXT',
              render: (val) => <span className="text-slate-600 text-xs block max-w-md truncate">{val}</span>
            },
            {
              key: 'status',
              header: 'STATUS',
              align: 'center',
              render: (val) => (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {val || 'ACTIVE'}
                </span>
              )
            }
          ]}
          data={commonPages}
          title="Master_Contract_Boilerplate"
          searchPlaceholder="Search clause title, boilerplate key, text..."
        />
      ) : activeTab === 'access_logs' ? (
        <DataTable
          columns={[
            {
              key: 'date_time',
              header: 'TIMESTAMP',
              render: (val) => <span className="font-mono text-xs text-slate-500">{val}</span>
            },
            {
              key: 'user_name',
              header: 'USER',
              render: (val) => <strong className="text-slate-900">{val}</strong>
            },
            {
              key: 'model_name',
              header: 'MODEL / ENTITY',
              render: (val) => <span className="font-mono text-xs text-blue-700 font-semibold">{val}</span>
            },
            {
              key: 'event',
              header: 'ACTION EVENT',
              align: 'center',
              render: (val) => (
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  val === 'CREATED' ? 'bg-emerald-50 text-emerald-700' : val === 'UPDATED' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {val}
                </span>
              )
            },
            {
              key: 'url',
              header: 'TARGET ENDPOINT URL',
              render: (val) => <span className="font-mono text-xs text-slate-600">{val}</span>
            }
          ]}
          data={accessLogs}
          title="Master_Audit_Access_Logs"
          searchPlaceholder="Search user, model, event, endpoint..."
        />
      ) : activeTab === 'users' ? (
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'FULL NAME',
              render: (val) => <strong className="text-slate-900">{val}</strong>
            },
            {
              key: 'email',
              header: 'EMAIL ADDRESS',
              render: (val) => <span className="text-blue-600 font-mono text-xs">{val}</span>
            },
            {
              key: 'role',
              header: 'IAM RBAC ROLE',
              render: (val) => (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                  {val}
                </span>
              )
            },
            {
              key: 'department',
              header: 'DEPARTMENT',
              render: (val) => <span className="text-slate-700 font-medium">{val}</span>
            },
            {
              key: 'status',
              header: 'STATUS',
              align: 'center',
              render: (val) => (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {val || 'ACTIVE'}
                </span>
              )
            }
          ]}
          data={users}
          title="Master_IAM_Users_and_Roles"
          searchPlaceholder="Search user name, email, role, department..."
          onAdd={() => setShowCreateUserModal(true)}
          addLabel="+ Add IAM User"
        />
      ) : (
        <div className="p-8 text-center text-slate-500">Select a master directory from above.</div>
      )}


      {/* IAM User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Create New IAM User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@ivicl.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2"
                >
                  {IAM_ROLES.map(r => (
                    <option key={r.id} value={r.id}>{r.id}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
