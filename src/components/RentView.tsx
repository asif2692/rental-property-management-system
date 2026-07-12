import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, Plus, Search, Filter, Trash2, Landmark, 
  Receipt, DollarSign, Calendar, Info, Check, X, AlertCircle,
  Table
} from 'lucide-react';
import { RentPayment, Tenant, Apartment, Building, Floor, UserRole } from '../types';
import { exportToCSV } from '../utils/export';

interface RentViewProps {
  payments: RentPayment[];
  tenants: Tenant[];
  apartments: Apartment[];
  buildings: Building[];
  floors: Floor[];
  userRole: UserRole;
  onRecordPayment: (p: Omit<RentPayment, 'id'>) => void;
  onDeletePayment: (id: string) => void;
}

export default function RentView({
  payments,
  tenants,
  apartments,
  buildings,
  floors,
  userRole,
  onRecordPayment,
  onDeletePayment
}: RentViewProps) {
  const isReadOnly = userRole === 'read_only';
  const canDelete = userRole === 'admin' || userRole === 'landlord';

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Filters for Rent History
  const [filterTenantId, setFilterTenantId] = useState('all');
  const [filterBuildingId, setFilterBuildingId] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Payment Form Fields
  const [tenantId, setTenantId] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [rentMonth, setRentMonth] = useState<number>(new Date().getMonth() + 1);
  const [rentYear, setRentYear] = useState<number>(new Date().getFullYear());
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [lateCharges, setLateCharges] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [utilityCharges, setUtilityCharges] = useState<number>(0);
  const [otherCharges, setOtherCharges] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank' | 'JazzCash' | 'EasyPaisa'>('Bank');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  // Resolve dependent information for chosen tenant
  const selectedTenant = tenants.find(t => t.id === tenantId);
  const associatedApt = selectedTenant ? apartments.find(a => a.id === selectedTenant.apartmentId) : null;
  const baseRent = associatedApt ? associatedApt.monthlyRent : 0;

  // Auto-calculations (live display)
  const totalCharges = baseRent + lateCharges + utilityCharges + otherCharges - discount;
  const remainingBalance = totalCharges - paidAmount;
  const pendingAmount = remainingBalance > 0 ? remainingBalance : 0;
  const advanceAmount = remainingBalance < 0 ? Math.abs(remainingBalance) : 0;

  const handleOpenPayment = () => {
    // Select first active tenant if available
    const firstActive = tenants.find(t => t.active);
    setTenantId(firstActive ? firstActive.id : '');
    setPaidAmount(firstActive ? (apartments.find(a => a.id === firstActive.apartmentId)?.monthlyRent || 0) : 0);
    setLateCharges(0);
    setDiscount(0);
    setUtilityCharges(0);
    setOtherCharges(0);
    setPaymentMethod('Bank');
    setReferenceNumber('');
    setRemarks('');
    setRentMonth(new Date().getMonth() + 1);
    setRentYear(new Date().getFullYear());
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setShowPaymentModal(true);
  };

  const handleTenantChange = (tid: string) => {
    setTenantId(tid);
    const tenant = tenants.find(t => t.id === tid);
    if (tenant) {
      const apt = apartments.find(a => a.id === tenant.apartmentId);
      setPaidAmount(apt ? apt.monthlyRent : 0);
    }
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !paymentDate || paidAmount <= 0) {
      alert('Please fill out all required payments details.');
      return;
    }

    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;
    const apt = apartments.find(a => a.id === tenant.apartmentId);
    if (!apt) return;

    onRecordPayment({
      tenantId,
      buildingId: apt.buildingId,
      floorId: apt.floorId,
      apartmentId: apt.id,
      paymentDate,
      rentMonth,
      rentYear,
      amount: Number(paidAmount),
      lateCharges: Number(lateCharges),
      discount: Number(discount),
      utilityCharges: Number(utilityCharges),
      otherCharges: Number(otherCharges),
      paymentMethod,
      referenceNumber,
      remarks
    });

    setShowPaymentModal(false);
  };

  // Filter history
  const filteredPayments = payments.filter(p => {
    const tenant = tenants.find(t => t.id === p.tenantId);
    const apt = apartments.find(a => a.id === p.apartmentId);

    const matchesTenant = filterTenantId === 'all' || p.tenantId === filterTenantId;
    const matchesBuilding = filterBuildingId === 'all' || p.buildingId === filterBuildingId;
    const matchesMonth = filterMonth === 'all' || p.rentMonth === Number(filterMonth);
    const matchesYear = filterYear === 'all' || p.rentYear === Number(filterYear);
    const matchesMethod = filterMethod === 'all' || p.paymentMethod === filterMethod;

    const matchesSearch = searchTerm === '' || 
      (tenant && tenant.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (apt && apt.number.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesTenant && matchesBuilding && matchesMonth && matchesYear && matchesMethod && matchesSearch;
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleExportCSV = () => {
    const headers = [
      'Tenant Name',
      'Building Name',
      'Apartment Unit',
      'Rent Month',
      'Rent Year',
      'Amount Paid (PKR)',
      'Late Charges (PKR)',
      'Utility Charges (PKR)',
      'Other Charges (PKR)',
      'Discount (PKR)',
      'Payment Method',
      'Date Logged',
      'Reference Number',
      'Remarks'
    ];

    const rows = filteredPayments.map(p => {
      const tenant = tenants.find(t => t.id === p.tenantId);
      const apt = apartments.find(a => a.id === p.apartmentId);
      const bldg = buildings.find(b => b.id === p.buildingId);

      return [
        tenant ? tenant.fullName : 'Deleted Tenant',
        bldg ? bldg.name.replace(/\s*\(Building\s+\w+\)/i, '') : 'N/A',
        apt ? apt.number : 'N/A',
        months[p.rentMonth - 1],
        p.rentYear,
        p.amount,
        p.lateCharges || 0,
        p.utilityCharges || 0,
        p.otherCharges || 0,
        p.discount || 0,
        p.paymentMethod,
        p.paymentDate,
        p.referenceNumber || 'N/A',
        p.remarks || ''
      ];
    });

    exportToCSV(headers, rows, 'rent_transactions_ledger');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Rent Collection / کرایہ کی وصولی</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Log monthly receipts, adjust discount packages, and track billing history / ماہانہ کرایہ کی وصولی اور کھاتہ کی تاریخ کا ریکارڈ
          </p>
        </div>
        {!isReadOnly && (
          <button
            onClick={handleOpenPayment}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 transition-colors text-white py-2 px-4 rounded-xl text-sm font-semibold cursor-pointer shadow-lg shadow-emerald-500/10"
          >
            <Plus className="w-4 h-4" />
            Record Monthly Rent / کرایہ کا اندراج
          </button>
        )}
      </div>

      {/* Rent History Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5 space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Rent History Filter Matrix</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          
          {/* Tenant */}
          <div>
            <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Tenant</label>
            <select
              value={filterTenantId}
              onChange={(e) => setFilterTenantId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl py-1.5 px-3 text-xs focus:outline-none"
            >
              <option value="all">All Tenants</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.fullName}</option>
              ))}
            </select>
          </div>

          {/* Building */}
          <div>
            <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Building</label>
            <select
              value={filterBuildingId}
              onChange={(e) => setFilterBuildingId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl py-1.5 px-3 text-xs focus:outline-none"
            >
              <option value="all">All Buildings</option>
              {buildings.map(b => (
                <option key={b.id} value={b.id}>{b.name.replace(/\s*\(Building\s+\w+\)/i, '')}</option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div>
            <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Rent Month</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl py-1.5 px-3 text-xs focus:outline-none"
            >
              <option value="all">All Months</option>
              {months.map((m, idx) => (
                <option key={idx} value={idx + 1}>{m}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Rent Year</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl py-1.5 px-3 text-xs focus:outline-none"
            >
              <option value="all">All Years</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          {/* Search text */}
          <div>
            <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Text Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Apt, Ref #..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl py-1.5 pl-8 pr-3 text-xs focus:outline-none"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Transaction list table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm">Rent Transactions Ledger</h3>
          <div className="flex items-center gap-2.5">
            {filteredPayments.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 transition-colors text-white py-1.5 px-3 rounded-lg text-[10px] font-bold cursor-pointer"
              >
                <Table className="w-3.5 h-3.5" />
                Export as CSV
              </button>
            )}
            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-500 py-1 px-2.5 rounded-full font-semibold">
              {filteredPayments.length} Payments found
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700/50">
              <tr>
                <th className="p-4 font-semibold text-slate-500 uppercase tracking-wider">Tenant</th>
                <th className="p-4 font-semibold text-slate-500 uppercase tracking-wider">Property</th>
                <th className="p-4 font-semibold text-slate-500 uppercase tracking-wider">Rent Period</th>
                <th className="p-4 font-semibold text-slate-500 uppercase tracking-wider">Amount Paid</th>
                <th className="p-4 font-semibold text-slate-500 uppercase tracking-wider">Payment Method</th>
                <th className="p-4 font-semibold text-slate-500 uppercase tracking-wider">Date Logged</th>
                <th className="p-4 font-semibold text-slate-500 uppercase tracking-wider">Ref Number</th>
                {!isReadOnly && canDelete && <th className="p-4 font-semibold text-slate-500 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50 font-mono">
              {filteredPayments.map((p) => {
                const tenant = tenants.find(t => t.id === p.tenantId);
                const apt = apartments.find(a => a.id === p.apartmentId);
                const bldg = buildings.find(b => b.id === p.buildingId);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="p-4 font-sans font-semibold text-slate-800 dark:text-slate-200">
                      {tenant ? tenant.fullName : 'Deleted Tenant'}
                    </td>
                    <td className="p-4 font-sans text-slate-500 dark:text-slate-400 text-[11px]">
                      {bldg ? bldg.name.replace(/\s*\(Building\s+\w+\)/i, '') : ''} - {apt ? apt.number : 'Unit'}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {months[p.rentMonth - 1]} {p.rentYear}
                    </td>
                    <td className="p-4 font-bold text-emerald-500">
                      PKR {p.amount.toLocaleString()}
                    </td>
                    <td className="p-4 font-sans">
                      <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] py-0.5 px-2 rounded-full uppercase font-medium">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {p.paymentDate}
                    </td>
                    <td className="p-4 text-slate-400">
                      {p.referenceNumber || 'N/A'}
                    </td>
                    {!isReadOnly && canDelete && (
                      <td className="p-4">
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this rent collection receipt?')) {
                              onDeletePayment(p.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-mono font-sans text-sm">
                    No transactions correspond to the filtered matrix.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RENT COLLECTION FORM MODAL */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl border border-slate-100 dark:border-slate-700 shadow-2xl relative my-8"
            >
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/50">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-500" />
                  Record Monthly Rent Collection
                </h3>
                <button onClick={() => setShowPaymentModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
                
                {/* Main Tenant Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider mb-1">Select Tenant *</label>
                    <select
                      value={tenantId}
                      onChange={(e) => handleTenantChange(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 focus:outline-none"
                    >
                      <option value="">-- Choose Tenant --</option>
                      {tenants.filter(t => t.active).map(t => {
                        const apt = apartments.find(a => a.id === t.apartmentId);
                        const label = `${t.fullName} (${apt ? apt.number : 'No Unit'})`;
                        return (
                          <option key={t.id} value={t.id}>{label}</option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider mb-1">Payment Date *</label>
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {/* Period assignment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider mb-1">Rent Month</label>
                    <select
                      value={rentMonth}
                      onChange={(e) => setRentMonth(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 focus:outline-none"
                    >
                      {months.map((m, idx) => (
                        <option key={idx} value={idx + 1}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider mb-1">Rent Year</label>
                    <select
                      value={rentYear}
                      onChange={(e) => setRentYear(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 focus:outline-none"
                    >
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                    </select>
                  </div>
                </div>

                {/* Ledger calculations */}
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                    <span>Base Apartment Rent:</span>
                    <span className="font-mono">PKR {baseRent.toLocaleString()}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div>
                      <label className="block text-slate-400 text-[9px] uppercase font-bold mb-1">Late Charges</label>
                      <input
                        type="number"
                        value={lateCharges}
                        onChange={(e) => setLateCharges(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 px-2 text-xs font-mono text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[9px] uppercase font-bold mb-1">Utility Charges</label>
                      <input
                        type="number"
                        value={utilityCharges}
                        onChange={(e) => setUtilityCharges(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 px-2 text-xs font-mono text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[9px] uppercase font-bold mb-1">Other Charges</label>
                      <input
                        type="number"
                        value={otherCharges}
                        onChange={(e) => setOtherCharges(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 px-2 text-xs font-mono text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[9px] uppercase font-bold mb-1">Discount Given</label>
                      <input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 px-2 text-xs font-mono text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between items-center text-slate-800 dark:text-slate-200">
                    <span className="font-bold">Total Bill (Due):</span>
                    <span className="font-mono font-bold text-sm">PKR {totalCharges.toLocaleString()}</span>
                  </div>
                </div>

                {/* Amount entered */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider mb-1">Amount Paid (PKR) *</label>
                    <input
                      type="number"
                      required
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-xs font-mono focus:outline-none font-bold"
                    />
                  </div>

                  <div className="col-span-2 grid grid-cols-2 gap-3 bg-indigo-50/30 dark:bg-slate-900/50 p-3 rounded-xl border border-indigo-100/50 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Remaining Balance</span>
                      <span className={`text-sm font-bold font-mono mt-1 block ${remainingBalance === 0 ? 'text-slate-500' : remainingBalance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        PKR {remainingBalance.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Adjusted Ledger Status</span>
                      <span className="text-[10px] font-bold mt-1.5 block">
                        {remainingBalance === 0 ? (
                          <span className="text-slate-500 uppercase">Fully Paid</span>
                        ) : remainingBalance > 0 ? (
                          <span className="text-rose-500 uppercase">Pending: {formatPKR(pendingAmount)}</span>
                        ) : (
                          <span className="text-emerald-500 uppercase">Advance: {formatPKR(advanceAmount)}</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment configurations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 focus:outline-none"
                    >
                      <option value="Bank">Bank Portal Transfer</option>
                      <option value="Cash">Cash Collected</option>
                      <option value="JazzCash">JazzCash Mobile</option>
                      <option value="EasyPaisa">EasyPaisa Wallet</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider mb-1">Reference Number</label>
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="e.g. FT12093812"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider mb-1">Remarks</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter short bank details or collect notes..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="py-2 px-4 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-xl text-sm flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10"
                  >
                    <Check className="w-4 h-4" />
                    Record Collection
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

const formatPKR = (num: number) => {
  return 'PKR ' + num.toLocaleString();
};
