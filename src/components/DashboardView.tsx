import React from 'react';
import { motion } from 'motion/react';
import { 
  Building, Layers, Home, UserCheck, UserX, Landmark, 
  Hourglass, TrendingUp, Calendar, AlertTriangle, 
  ArrowRight, ShieldCheck, Database, Zap, Sparkles 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { SystemMetrics } from '../utils/calculations';
import { Tenant, RentPayment, Apartment } from '../types';

interface DashboardViewProps {
  metrics: SystemMetrics;
  payments: RentPayment[];
  tenants: Tenant[];
  apartments: Apartment[];
  onNavigate: (tab: string) => void;
  buildingWiseIncome: any[];
  collectionTrend: any[];
}

export default function DashboardView({ 
  metrics, 
  payments, 
  tenants, 
  apartments, 
  onNavigate,
  buildingWiseIncome,
  collectionTrend
}: DashboardViewProps) {

  // Colors for charts (Polished corporate Indigo & Slate palette)
  const COLORS = ['#6366f1', '#94a3b8', '#f59e0b', '#3b82f6', '#8b5cf6'];

  // Latest 5 payments
  const latestPayments = [...payments]
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    .slice(0, 5);

  // Upcoming renewals (Contract end date within next 30 days or already overdue!)
  const today = new Date();
  const upcomingRenewals = tenants
    .filter(t => t.active)
    .map(t => {
      const endDate = new Date(t.endDate);
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...t, diffDays };
    })
    .filter(t => t.diffDays <= 30)
    .sort((a, b) => a.diffDays - b.diffDays)
    .slice(0, 5);

  const formatPKR = (num: number) => {
    return 'PKR ' + num.toLocaleString('en-US');
  };

  const occupancyPieData = [
    { name: 'Occupied', value: metrics.occupiedCount },
    { name: 'Vacant', value: metrics.vacantCount },
    { name: 'Maintenance', value: metrics.maintenanceCount }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title & Stats Refresh Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Property Dashboard / پراپرٹی ڈیش بورڈ
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Real-time analytics and financial forecasting / ریئل ٹائم تجزیات اور مالیاتی پیش گوئی
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 py-1.5 px-3 rounded-full border border-indigo-100 dark:border-indigo-900/40">
          <Database className="w-3.5 h-3.5 animate-pulse" />
          <span>Pandas & NumPy Engines Live / شماریاتی انجن</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { 
            title: 'Total Buildings / کل عمارتیں', 
            val: metrics.totalBuildings, 
            icon: Building, 
            color: 'bg-indigo-600', 
            desc: 'Multi-property assets / جائیدادیں' 
          },
          { 
            title: 'Total Floors / کل منزلیں', 
            val: metrics.totalFloors, 
            icon: Layers, 
            color: 'bg-slate-700', 
            desc: 'Dynamic height scales / فلور' 
          },
          { 
            title: 'Total Apartments / کل فلیٹ', 
            val: metrics.totalApartments, 
            icon: Home, 
            color: 'bg-slate-900 dark:bg-slate-800', 
            desc: `${metrics.occupiedCount} active families / کرایہ دار` 
          },
          { 
            title: 'Occupancy Rate / شرح کرایہ داری', 
            val: `${Math.round(metrics.occupancyRate)}%`, 
            icon: UserCheck, 
            color: 'bg-indigo-500', 
            desc: `${metrics.vacantCount} vacant properties / خالی فلیٹ` 
          }
        ].map((kpi, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider block">
                  {kpi.title}
                </span>
                <span className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white mt-1 block">
                  {kpi.val}
                </span>
              </div>
              <div className={`${kpi.color} text-white p-3 rounded-xl shadow-sm shadow-black/10 group-hover:scale-105 transition-transform`}>
                <kpi.icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-700/50 mt-4 pt-2.5 text-xs text-slate-400 dark:text-slate-400 font-mono">
              {kpi.desc}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Financial KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          {
            title: 'Monthly Rent Collected / وصول شدہ کرایہ',
            val: formatPKR(metrics.monthlyRentReceived),
            icon: Landmark,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
            desc: 'Logged for active month / موجودہ مہینہ'
          },
          {
            title: 'Monthly Rent Pending / بقایا کرایہ',
            val: formatPKR(metrics.monthlyPendingRent),
            icon: Hourglass,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10 border-rose-500/20',
            desc: 'Due from occupied apts / فلیٹوں کے ذمہ'
          },
          {
            title: 'Rent Collection Rate / شرح وصولی',
            val: `${Math.round(metrics.collectionPercentage)}%`,
            icon: TrendingUp,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10 border-amber-500/20',
            desc: 'Target is 95% threshold / ہدف 95 فیصد'
          },
          {
            title: 'Actual Year Revenue / سالانہ آمدنی',
            val: formatPKR(metrics.totalAnnualIncome),
            icon: ShieldCheck,
            color: 'text-indigo-500',
            bg: 'bg-indigo-500/10 border-indigo-500/20',
            desc: `Expected: ${formatPKR(Math.round(metrics.expectedAnnualIncome))} / متوقع`
          }
        ].map((fKpi, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (idx + 4) * 0.05 }}
            className={`p-5 rounded-2xl border ${fKpi.bg} shadow-sm hover:shadow-md transition-all flex flex-col justify-between group`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider block">
                  {fKpi.title}
                </span>
                <span className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white mt-1 block font-mono">
                  {fKpi.val}
                </span>
              </div>
              <div className={`${fKpi.color} p-2 rounded-lg`}>
                <fKpi.icon className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-xs text-slate-500 dark:text-slate-400">
              {fKpi.desc}
            </div>
          </motion.div>
        ))}
      </div>

      {/* NumPy Statistics Panel */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 border border-slate-700/80 shadow-xl relative overflow-hidden"
      >
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 top-0 -translate-y-10 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2 mb-6">
          <div className="bg-indigo-500/10 text-indigo-400 p-2 rounded-lg border border-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Statistical Analysis Models (NumPy Engine) / شماریاتی تجزیہ ماڈل</h3>
            <p className="text-xs text-slate-400">Calculated across dynamic properties / میٹرکس پر مبنی تقسیم کا خودکار حساب</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
          <div className="border-r border-slate-700/50 last:border-0 pr-4">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Average Rent / اوسط کرایہ</span>
            <span className="text-xl font-bold font-mono text-emerald-400 block mt-1">
              {formatPKR(Math.round(metrics.averageRent))}
            </span>
            <span className="text-[10px] text-slate-500">Arithmetic Mean / اوسط قیمت</span>
          </div>

          <div className="border-r border-slate-700/50 last:border-0 pr-4">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Median Rent / درمیانی کرایہ</span>
            <span className="text-xl font-bold font-mono text-indigo-400 block mt-1">
              {formatPKR(Math.round(metrics.medianRent))}
            </span>
            <span className="text-[10px] text-slate-500">50th Percentile / درمیانی شرح</span>
          </div>

          <div className="border-r border-slate-700/50 last:border-0 pr-4">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Maximum Rent / زیادہ سے زیادہ کرایہ</span>
            <span className="text-xl font-bold font-mono text-amber-400 block mt-1">
              {formatPKR(metrics.maxRent)}
            </span>
            <span className="text-[10px] text-slate-500">Max Peak / سب سے زیادہ کرایہ</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Minimum Rent / کم سے کم کرایہ</span>
            <span className="text-xl font-bold font-mono text-sky-400 block mt-1">
              {formatPKR(metrics.minRent)}
            </span>
            <span className="text-[10px] text-slate-500">Min Floor / سب سے کم کرایہ</span>
          </div>
        </div>
      </motion.div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Rent Collection & Expense Trend */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm col-span-1 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Monthly Income Collection Trends / ماہانہ آمدنی کا رجحان</h3>
              <p className="text-xs text-slate-400">Tracking rental cashflows and late charges collections / کرایہ اور تاخیر چارجز کا چارٹ</p>
            </div>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-700 font-mono py-1 px-2.5 rounded text-slate-500 dark:text-slate-400">
              Year 2026
            </span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={collectionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    color: '#fff', 
                    borderRadius: '8px', 
                    border: 'none',
                    fontSize: '12px'
                  }} 
                />
                <Legend verticalAlign="top" height={36} iconType="circle" fontSize={12} />
                <Line type="monotone" dataKey="Collected" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Utilities" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="3 3" />
                <Line type="monotone" dataKey="LateCharges" stroke="#ef4444" strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupancy Rate Pie */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white text-base mb-1">Occupancy Rates</h3>
          <p className="text-xs text-slate-400 mb-6">Portfolio composition and unit statuses</p>
          <div className="h-64 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={occupancyPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {occupancyPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center percentage */}
            <div className="absolute text-center">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white block">
                {Math.round(metrics.occupancyRate)}%
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Occupied
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center mt-4">
            {occupancyPieData.map((d, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{d.value}</span>
                </div>
                <span className="text-[10px] text-slate-400">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Building-wise performance */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
        <h3 className="font-bold text-slate-800 dark:text-white text-base mb-1">Building Cashflow Distributions</h3>
        <p className="text-xs text-slate-400 mb-6">Total rental collections across distinct real estate holdings</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buildingWiseIncome}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  color: '#fff', 
                  borderRadius: '8px', 
                  border: 'none',
                  fontSize: '12px'
                }} 
              />
              <Legend verticalAlign="top" height={32} iconType="circle" fontSize={12} />
              <Bar dataKey="income" name="PKR Income Received" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={40} />
              <Bar dataKey="occupancyRate" name="Occupancy %" fill="#10b981" radius={[8, 8, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Alert Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Transactions List */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Latest Payments</h3>
                <p className="text-xs text-slate-400">Recently registered monthly rent collection events</p>
              </div>
              <button 
                onClick={() => onNavigate('rent')}
                className="text-xs text-indigo-500 font-medium hover:underline flex items-center gap-1 cursor-pointer"
              >
                View History <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="space-y-3.5">
              {latestPayments.map((p) => {
                const tenant = tenants.find(t => t.id === p.tenantId);
                const apt = apartments.find(a => a.id === p.apartmentId);
                return (
                  <div key={p.id} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-slate-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 flex items-center justify-center rounded-xl border border-emerald-500/20">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-white block">
                          {tenant ? tenant.fullName : 'Unknown Tenant'}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {apt ? apt.number : 'Apt'} - Month {p.rentMonth}/{p.rentYear}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-emerald-500 dark:text-emerald-400 block">
                        +{formatPKR(p.amount)}
                      </span>
                      <span className="text-[9px] bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono py-0.5 px-2 rounded-full uppercase">
                        {p.paymentMethod}
                      </span>
                    </div>
                  </div>
                );
              })}
              {latestPayments.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-sm font-mono">
                  No rent collections recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contract Renewal Warnings */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Contract Renewals Alert</h3>
                <p className="text-xs text-slate-400">Leases expiring in the next 30 days or already overdue</p>
              </div>
              <button 
                onClick={() => onNavigate('renewals')}
                className="text-xs text-amber-500 font-medium hover:underline flex items-center gap-1 cursor-pointer"
              >
                Manage Renewals <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="space-y-3.5">
              {upcomingRenewals.map((t) => {
                const apt = apartments.find(a => a.id === t.apartmentId);
                const isOverdue = t.diffDays < 0;
                return (
                  <div key={t.id} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-slate-200 transition-colors">
                    <div className="flex items-center gap-3">
                      {isOverdue ? (
                        <div className="w-10 h-10 bg-rose-500/10 text-rose-500 flex items-center justify-center rounded-xl border border-rose-500/20">
                          <AlertTriangle className="w-5 h-5 animate-bounce" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-amber-500/10 text-amber-500 flex items-center justify-center rounded-xl border border-amber-500/20">
                          <Calendar className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-white block">
                          {t.fullName}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {apt ? apt.number : 'Apt'} - Exp: {t.endDate}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {isOverdue ? (
                        <span className="text-xs font-bold text-rose-500 block">
                          Overdue {Math.abs(t.diffDays)}d
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-500 block">
                          Due in {t.diffDays}d
                        </span>
                      )}
                      <span className="text-[9px] text-slate-400 font-mono">
                        Rent: {formatPKR(apt ? apt.monthlyRent : 0)}
                      </span>
                    </div>
                  </div>
                );
              })}
              {upcomingRenewals.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-sm font-mono">
                  No upcoming renewals. Leases are fully up to date.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
