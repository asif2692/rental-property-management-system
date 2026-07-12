import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileSpreadsheet, FileText, Printer, BarChart3, TrendingUp, PieChart as PieIcon, 
  Percent, ShieldCheck, UserCheck, CalendarDays, ArrowUpRight, HelpCircle, Table 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, 
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';
import { Tenant, Apartment, Building, Floor, RentPayment, RentIncreaseHistory } from '../types';
import { computeSystemMetrics, getMonthlyCollectionTrend } from '../utils/calculations';
import { exportToCSV, exportToExcel, triggerPDFPrint } from '../utils/export';
import { useTranslation } from '../utils/language';

interface ReportViewProps {
  tenants: Tenant[];
  apartments: Apartment[];
  buildings: Building[];
  floors: Floor[];
  payments: RentPayment[];
  increaseHistory: RentIncreaseHistory[];
}

type ReportType = 
  | 'monthly' | 'annual' | 'building' | 'floor' | 'apartment' 
  | 'tenant' | 'pending' | 'paid' | 'vacant' | 'security_deposit' 
  | 'rent_increase' | 'renewals';

export default function ReportView({
  tenants,
  apartments,
  buildings,
  floors,
  payments,
  increaseHistory
}: ReportViewProps) {
  const { t } = useTranslation();
  const [selectedReport, setSelectedReport] = useState<ReportType>('monthly');

  // Year & Month configurations for filtering reports
  const [reportMonth, setReportMonth] = useState<number>(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());
  const [reportBuildingId, setReportBuildingId] = useState<string>('all');

  // KPIs computed dynamically
  const kpis = {
    occupancyRate: apartments.length > 0 ? (apartments.filter(a => a.status === 'Occupied').length / apartments.length) * 100 : 0
  };

  const monthlyData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, idx) => {
    const monthNum = idx + 1;
    const mPayments = payments.filter(p => p.rentMonth === monthNum && p.rentYear === reportYear);
    const total = mPayments.reduce((sum, p) => sum + p.amount, 0);
    return { month: m, total };
  });

  const buildingAverages = buildings.map(b => {
    const bApts = apartments.filter(a => a.buildingId === b.id);
    const avg = bApts.length > 0 ? bApts.reduce((sum, a) => sum + a.monthlyRent, 0) / bApts.length : 0;
    return {
      building: b.name.replace(/\s*\(Building\s+\w+\)/i, ''),
      averageRent: avg
    };
  });

  // Recharts color palettes (Polished Indigo & Slate corporate theme)
  const COLORS = ['#6366f1', '#4f46e5', '#3b82f6', '#f59e0b', '#8b5cf6', '#94a3b8'];

  // Run/Generate filtered data for the selected report
  const generateReportData = () => {
    switch (selectedReport) {
      case 'monthly': {
        const filtered = payments.filter(p => p.rentMonth === reportMonth && p.rentYear === reportYear);
        return {
          headers: ['Date', 'Tenant', 'Apt', 'Month/Year', 'Amount', 'Payment Method', 'Ref Num'],
          rows: filtered.map(p => {
            const tenant = tenants.find(t => t.id === p.tenantId);
            const apt = apartments.find(a => a.id === p.apartmentId);
            return [
              p.paymentDate,
              tenant?.fullName || 'N/A',
              apt?.number || 'Apt',
              `${p.rentMonth}/${p.rentYear}`,
              p.amount,
              p.paymentMethod,
              p.referenceNumber || 'N/A'
            ];
          }),
          title: `Monthly Collections Report (${reportMonth}/${reportYear})`
        };
      }
      case 'annual': {
        const filtered = payments.filter(p => p.rentYear === reportYear);
        return {
          headers: ['Period', 'Total Receipts (PKR)', 'Late Charges (PKR)', 'Discount Given (PKR)', 'Utility (PKR)'],
          rows: filtered.map(p => [
            `${p.rentMonth}/${p.rentYear}`,
            p.amount,
            p.lateCharges,
            p.discount,
            p.utilityCharges
          ]),
          title: `Annual Financial Ledger Report (${reportYear})`
        };
      }
      case 'building': {
        return {
          headers: ['Building Name', 'Address', 'Total Units', 'Occupied Units', 'Vacant Units', 'Total Assets Value'],
          rows: buildings.map(b => {
            const bApts = apartments.filter(a => a.buildingId === b.id);
            const occupied = bApts.filter(a => a.status === 'Occupied').length;
            const vacant = bApts.filter(a => a.status === 'Vacant').length;
            const assetVal = bApts.reduce((acc, curr) => acc + curr.monthlyRent, 0);
            return [
              b.name,
              b.address,
              bApts.length,
              occupied,
              vacant,
              assetVal
            ];
          }),
          title: 'Building Estate Status Summary Report'
        };
      }
      case 'floor': {
        return {
          headers: ['Building Name', 'Floor Level', 'Total Apartments', 'Occupancy Rate'],
          rows: floors.map(f => {
            const bldg = buildings.find(b => b.id === f.buildingId);
            const fApts = apartments.filter(a => a.floorId === f.id);
            const occupied = fApts.filter(a => a.status === 'Occupied').length;
            const rate = fApts.length > 0 ? `${Math.round((occupied / fApts.length) * 100)}%` : '0%';
            return [
              bldg?.name || 'N/A',
              f.name,
              fApts.length,
              rate
            ];
          }),
          title: 'Floor-wise Structural Occupancy Report'
        };
      }
      case 'apartment': {
        return {
          headers: ['Apt Number', 'Building', 'Monthly Rent', 'Current Status', 'Description'],
          rows: apartments.map(a => {
            const bldg = buildings.find(b => b.id === a.buildingId);
            return [
              a.number,
              bldg?.name || 'N/A',
              a.monthlyRent,
              a.status,
              a.description || 'N/A'
            ];
          }),
          title: 'Full Apartment Specifications Report'
        };
      }
      case 'tenant': {
        return {
          headers: ['Tenant Full Name', 'Mobile', 'WhatsApp', 'Email', 'Occupation', 'Active Lease'],
          rows: tenants.map(t => [
            t.fullName,
            t.mobileNumber,
            t.whatsAppNumber,
            t.email || 'N/A',
            t.occupation || 'N/A',
            t.active ? 'Active' : 'Inactive'
          ]),
          title: 'Tenant Directory Information Ledger'
        };
      }
      case 'pending': {
        // Find tenants who have not logged current month's payment
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const activeTenants = tenants.filter(t => t.active);
        const pending = activeTenants.filter(t => {
          const hasPaid = payments.some(p => p.tenantId === t.id && p.rentMonth === currentMonth && p.rentYear === currentYear);
          return !hasPaid;
        });

        return {
          headers: ['Tenant', 'Apt Unit', 'Base Rent (PKR)', 'Lease Span', 'Mobile'],
          rows: pending.map(t => {
            const apt = apartments.find(a => a.id === t.apartmentId);
            return [
              t.fullName,
              apt?.number || 'Apt',
              apt?.monthlyRent || 0,
              `${t.startDate} to ${t.endDate}`,
              t.mobileNumber
            ];
          }),
          title: `Pending Rent Report for Current Month (${currentMonth}/${currentYear})`
        };
      }
      case 'paid': {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const paid = payments.filter(p => p.rentMonth === currentMonth && p.rentYear === currentYear);

        return {
          headers: ['Receipt Date', 'Tenant', 'Apt Unit', 'Amount Paid', 'Payment Method', 'Ref Number'],
          rows: paid.map(p => {
            const tenant = tenants.find(t => t.id === p.tenantId);
            const apt = apartments.find(a => a.id === p.apartmentId);
            return [
              p.paymentDate,
              tenant?.fullName || 'N/A',
              apt?.number || 'Apt',
              p.amount,
              p.paymentMethod,
              p.referenceNumber || 'N/A'
            ];
          }),
          title: `Successfully Paid Rent Report (${currentMonth}/${currentYear})`
        };
      }
      case 'vacant': {
        const vacantApts = apartments.filter(a => a.status === 'Vacant');
        return {
          headers: ['Apt Unit', 'Building', 'Monthly Rent (PKR)', 'Description'],
          rows: vacantApts.map(a => {
            const bldg = buildings.find(b => b.id === a.buildingId);
            return [
              a.number,
              bldg?.name || 'N/A',
              a.monthlyRent,
              a.description || 'N/A'
            ];
          }),
          title: 'Vacant Apartments Ledger'
        };
      }
      case 'security_deposit': {
        const activeTenants = tenants.filter(t => t.active);
        return {
          headers: ['Tenant Name', 'Apt Unit', 'Security Deposit (PKR)', 'Advance Rent Paid (PKR)', 'Lease Start'],
          rows: activeTenants.map(t => {
            const apt = apartments.find(a => a.id === t.apartmentId);
            return [
              t.fullName,
              apt?.number || 'Apt',
              t.securityDeposit,
              t.advanceRent,
              t.startDate
            ];
          }),
          title: 'Security Deposit & Lease Holdbacks Report'
        };
      }
      case 'rent_increase': {
        return {
          headers: ['Tenant Name', 'Apt Unit', 'Old Rent (PKR)', 'New Rent (PKR)', 'Rate (%)', 'Date Index'],
          rows: increaseHistory.map(h => {
            const tenant = tenants.find(t => t.id === h.tenantId);
            const apt = apartments.find(a => a.id === h.apartmentId);
            return [
              tenant?.fullName || 'N/A',
              apt?.number || 'Apt',
              h.oldRent,
              h.newRent,
              `+${h.percentage}%`,
              h.dateApplied
            ];
          }),
          title: 'Historical Rent Increase indexation Report'
        };
      }
      case 'renewals': {
        const activeTenants = tenants.filter(t => t.active);
        return {
          headers: ['Tenant Name', 'Apt Unit', 'Lease End Date', 'Emergency Contact', 'Mobile'],
          rows: activeTenants.map(t => {
            const apt = apartments.find(a => a.id === t.apartmentId);
            return [
              t.fullName,
              apt?.number || 'Apt',
              t.endDate,
              t.emergencyContact,
              t.mobileNumber
            ];
          }),
          title: 'Active Leases Renewal Timeline Report'
        };
      }
    }
  };

  const currentReport = generateReportData();

  // Export handlers
  const handleExportCSV = () => {
    exportToCSV(currentReport.headers, currentReport.rows, `${selectedReport}_report`);
  };

  const handleExportExcel = () => {
    exportToExcel(currentReport.title, currentReport.headers, currentReport.rows, `${selectedReport}_report`);
  };

  const handlePrintPDF = () => {
    triggerPDFPrint(currentReport.title, currentReport.headers, currentReport.rows);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      
      {/* Analytics Dashboard section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Occupancy Rate Pie */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Occupancy Rate Overview</span>
            <h3 className="text-xl font-extrabold mt-1 text-slate-800 dark:text-white">{kpis.occupancyRate.toFixed(1)}% Active</h3>
          </div>
          <div className="h-44 w-full mt-4 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Occupied', value: tenants.filter(t => t.active).length },
                    { name: 'Vacant', value: apartments.filter(a => a.status === 'Vacant').length },
                    { name: 'Maintenance', value: apartments.filter(a => a.status === 'Maintenance').length }
                  ]}
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#64748b" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip formatter={(value) => [`${value} Units`]} />
                <Legend iconSize={8} layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Building-wise Average Rent */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Building Average Base Rent</span>
            <h3 className="text-xl font-extrabold mt-1 text-slate-800 dark:text-white">Estate Benchmarks</h3>
          </div>
          <div className="h-44 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buildingAverages}>
                <XAxis dataKey="building" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} formatter={(v: number) => `${Math.round(v/1000)}k`} />
                <Tooltip formatter={(value: any) => [`PKR ${value.toLocaleString()}`, 'Avg Rent']} />
                <Bar dataKey="averageRent" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rent Collection trend */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Collection Velocity Trend</span>
            <h3 className="text-xl font-extrabold mt-1 text-slate-800 dark:text-white">Month-on-Month Growth</h3>
          </div>
          <div className="h-44 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} formatter={(v: number) => `${Math.round(v/1000)}k`} />
                <Tooltip formatter={(value: any) => [`PKR ${value.toLocaleString()}`]} />
                <Area type="monotone" dataKey="total" stroke="#10b981" fillOpacity={0.1} fill="#10b981" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* REPORT CONTROLLER & EXPORTER */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-6 space-y-6">
        
        {/* Picker and options */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/50 pb-5">
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              {t('Report Customizer & Compiler / رپورٹ میکر')}
            </h2>
            <p className="text-xs text-slate-400">{t('Generate on-demand analytical spreadsheets, vacancy lists, and deposit ledgers / رپورٹس اور کھاتہ جات تیار کریں')}</p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value as ReportType)}
              className="bg-slate-100 dark:bg-slate-900 border-0 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl py-2 px-3.5 focus:outline-none cursor-pointer"
            >
              <option value="monthly">{t('Monthly Receipts / ماہانہ وصولیاں')}</option>
              <option value="annual">{t('Annual Financials / سالانہ حسابات')}</option>
              <option value="building">{t('Building Status / عمارت کی تفصیل')}</option>
              <option value="floor">{t('Floor Occupancies / منزل کی تفصیل')}</option>
              <option value="apartment">{t('Apartment Catalog / فلیٹ کی تفصیل')}</option>
              <option value="tenant">{t('Tenant Contacts / کرایہ دار رابطہ')}</option>
              <option value="pending">{t('Current Unpaid Units / بقایا دار فلیٹ')}</option>
              <option value="paid">{t('Current Paid Units / ادا شدہ فلیٹ')}</option>
              <option value="vacant">{t('Vacant Apartments / خالی فلیٹ')}</option>
              <option value="security_deposit">{t('Security Deposits / سیکورٹی ڈپازٹ')}</option>
              <option value="rent_increase">{t('Rent Increases Log / کرایہ اضافہ لاگ')}</option>
              <option value="renewals">{t('Renewal Deadlines / معاہدہ کی تجدید')}</option>
            </select>

            {/* Sub-Filters based on Report */}
            {selectedReport === 'monthly' && (
              <div className="flex gap-1.5">
                <select
                  value={reportMonth}
                  onChange={(e) => setReportMonth(Number(e.target.value))}
                  className="bg-slate-100 dark:bg-slate-900 border-0 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl py-2 px-3 focus:outline-none cursor-pointer"
                >
                  {months.map((m, idx) => (
                    <option key={idx} value={idx + 1}>{m}</option>
                  ))}
                </select>
                <select
                  value={reportYear}
                  onChange={(e) => setReportYear(Number(e.target.value))}
                  className="bg-slate-100 dark:bg-slate-900 border-0 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl py-2 px-3 focus:outline-none cursor-pointer"
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>
            )}

            {selectedReport === 'annual' && (
              <select
                value={reportYear}
                onChange={(e) => setReportYear(Number(e.target.value))}
                className="bg-slate-100 dark:bg-slate-900 border-0 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl py-2 px-4 focus:outline-none cursor-pointer"
              >
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            )}
          </div>
        </div>

        {/* Compiled Preview Table */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-300">
              Compiled: {currentReport.title} ({currentReport.rows.length} rows)
            </span>

            <div className="flex gap-2">
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 transition-colors text-white py-1.5 px-3 rounded-lg text-[10px] font-bold cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export to Excel
              </button>
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 transition-colors text-white py-1.5 px-3 rounded-lg text-[10px] font-bold cursor-pointer"
              >
                <Table className="w-3.5 h-3.5" />
                Export to CSV
              </button>
              <button
                onClick={handlePrintPDF}
                className="inline-flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 transition-colors text-white py-1.5 px-3 rounded-lg text-[10px] font-bold cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 dark:border-slate-700/50 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700/50">
                <tr>
                  {currentReport.headers.map((h, idx) => (
                    <th key={idx} className="p-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50 font-mono">
                {currentReport.rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20">
                    {row.map((val, cellIdx) => (
                      <td key={cellIdx} className="p-3 text-slate-700 dark:text-slate-300 font-medium">
                        {typeof val === 'number' ? `PKR ${val.toLocaleString()}` : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}

                {currentReport.rows.length === 0 && (
                  <tr>
                    <td colSpan={currentReport.headers.length} className="p-10 text-center text-slate-400 font-sans text-xs">
                      No matching compilations corresponding to standard filter scopes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
