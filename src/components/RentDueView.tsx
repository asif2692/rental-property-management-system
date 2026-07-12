import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, Calendar, TrendingUp, RefreshCw, Zap, 
  HelpCircle, Check, Play, History, ShieldAlert, BadgePercent, Clock,
  MessageSquare, Mail, Copy, Send
} from 'lucide-react';
import { Tenant, Apartment, Building, RentPayment, RentIncreaseHistory, UserRole } from '../types';
import { useTranslation } from '../utils/language';

interface RentDueViewProps {
  tenants: Tenant[];
  apartments: Apartment[];
  buildings: Building[];
  payments: RentPayment[];
  increaseHistory: RentIncreaseHistory[];
  userRole: UserRole;
  onApplyRentIncrease: (tenantId: string, percentage: number, remarks: string) => void;
  onRenewContract: (tenantId: string, newEndDate: string, rentAmount: number) => void;
  onAddLog?: (action: string, details: string) => void;
  onShowAlert?: (options: any) => void;
}

export default function RentDueView({
  tenants,
  apartments,
  buildings,
  payments,
  increaseHistory,
  userRole,
  onApplyRentIncrease,
  onRenewContract,
  onAddLog,
  onShowAlert
}: RentDueViewProps) {
  const { t } = useTranslation();
  const isReadOnly = userRole === 'read_only';

  const [activeSubTab, setActiveSubTab] = useState<'due' | 'increase' | 'renewals'>('due');

  // Yearly Increase states
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [increasePercent, setIncreasePercent] = useState<number>(10);
  const [customPercent, setCustomPercent] = useState('');
  const [increaseRemarks, setIncreaseRemarks] = useState('Annual lease indexation');

  // Renewal states
  const [renewTenantId, setRenewTenantId] = useState('');
  const [renewEndDate, setRenewEndDate] = useState('');
  const [renewRent, setRenewRent] = useState(0);

  // Notification desk states
  const [notifyingTenant, setNotifyingTenant] = useState<any | null>(null);
  const [msgTemplate, setMsgTemplate] = useState<'standard' | 'friendly' | 'formal'>('standard');
  const [msgLang, setMsgLang] = useState<'ur' | 'en'>('ur');
  const [customMsg, setCustomMsg] = useState('');
  const [notificationSuccess, setNotificationSuccess] = useState(false);

  const formatPKR = (num: number) => {
    return 'PKR ' + num.toLocaleString();
  };

  const getNotificationText = (tenant: any, template: 'standard' | 'friendly' | 'formal', lang: 'ur' | 'en') => {
    if (!tenant) return '';
    const name = tenant.tenantName || 'Tenant';
    const apt = tenant.apartmentNumber || 'Apt';
    const bldg = tenant.buildingName || 'Building';
    const expiry = tenant.leaseEndDate || 'N/A';
    const rent = formatPKR(tenant.monthlyRent || 0);

    if (lang === 'ur') {
      if (template === 'friendly') {
        return `پیارے ${name}،\nہمیں آپ کو اپنے اپارٹمنٹ ${apt} (${bldg}) میں بطور کرایہ دار رکھنے پر بہت خوشی ہے۔ آپ کا معاہدہ ${expiry} کو ختم ہونے والا ہے۔ ہم اس معاہدے کی تجدید کے خواہشمند ہیں۔ رابطہ فرمائیں!`;
      }
      if (template === 'formal') {
        return `تنبِیہ برائے تجدید معاہدہ:\nمحترم ${name}،\nآپ کے زیرِ قبضہ یونٹ ${apt} (${bldg}) کا معاہدہ ${expiry} کو مکمل ہو رہا ہے۔ نئی شرائط اور سالانہ اضافہ لاگو ہونے کے بعد تجدیدِ معاہدہ کے لیے دفتر سے رابطہ کریں۔ شکریہ۔`;
      }
      return `محترم ${name} صاحب،\nامید ہے آپ خیریت سے ہوں گے۔\nآپ کے یونٹ ${apt} (${bldg}) کا کرایہ داری معاہدہ ${expiry} کو ختم ہو رہا ہے۔ برائے مہربانی تجدید معاہدہ کے لیے جلد از جلد رابطہ فرمائیں۔ شکریہ۔`;
    } else {
      if (template === 'friendly') {
        return `Dear ${name},\nWe hope you are enjoying your stay in Unit ${apt}! This is a friendly reminder that your lease is expiring on ${expiry}. We value you as our resident and would love to extend your stay. Please let us know when we can discuss the agreement renewal.`;
      }
      if (template === 'formal') {
        return `Formal Notice:\nDear ${name},\nThis is a formal notice that your tenancy agreement for Unit ${apt} at ${bldg} expires on ${expiry}. To continue occupancy, a renewed contract must be signed. Please note standard indexation rates will apply. Current Monthly Rent: ${rent}.`;
      }
      return `Dear ${name},\nYour lease agreement for Unit ${apt} at ${bldg} is scheduled to expire on ${expiry}. Please contact the management desk at your earliest convenience to initiate the contract renewal. Thank you!\nMonthly Rent: ${rent}.`;
    }
  };

  React.useEffect(() => {
    if (notifyingTenant) {
      setCustomMsg(getNotificationText(notifyingTenant, msgTemplate, msgLang));
    }
  }, [notifyingTenant?.tenantId, msgTemplate, msgLang]);

  // 1. RENT DUE LOGIC
  const today = new Date();
  
  // Calculate dynamic due states for each occupied apartment
  const rentDueList = tenants.filter(t => t.active).map(tenant => {
    const apt = apartments.find(a => a.id === tenant.apartmentId);
    const bldg = apt ? buildings.find(b => b.id === apt.buildingId) : null;
    
    // Find all payments of this tenant in the current year
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-12
    
    const tenantPayments = payments.filter(
      p => p.tenantId === tenant.id && p.rentYear === currentYear
    );

    // Find the latest paid month
    let lastPaidMonth: number | null = null;
    let lastPaidYear: number | null = null;
    if (tenantPayments.length > 0) {
      const sorted = [...tenantPayments].sort((a, b) => b.rentMonth - a.rentMonth);
      lastPaidMonth = sorted[0].rentMonth;
      lastPaidYear = sorted[0].rentYear;
    }

    // Determine due date (e.g. Day 5 of the current month)
    const dueDay = 5; // standard due day
    const dueDateObj = new Date(currentYear, today.getMonth(), dueDay);
    
    // Check due status
    let dueStatus: 'Paid' | 'Due Today' | 'Due Tomorrow' | 'Due This Week' | 'Overdue' = 'Overdue';
    
    const hasPaidCurrentMonth = payments.some(
      p => p.tenantId === tenant.id && p.rentMonth === currentMonth && p.rentYear === currentYear
    );

    if (hasPaidCurrentMonth) {
      dueStatus = 'Paid';
    } else {
      const diffTime = dueDateObj.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        dueStatus = 'Due Today';
      } else if (diffDays === 1) {
        dueStatus = 'Due Tomorrow';
      } else if (diffDays > 1 && diffDays <= 7) {
        dueStatus = 'Due This Week';
      } else {
        dueStatus = 'Overdue';
      }
    }

    // Pending months count
    // Simple estimation: months between lease start or last paid month and current month
    let pendingMonthsCount = 0;
    if (dueStatus !== 'Paid') {
      const lastPaidM = lastPaidMonth || (new Date(tenant.startDate).getMonth() + 1);
      const lastPaidY = lastPaidYear || new Date(tenant.startDate).getFullYear();
      
      const monthsDiff = (currentYear - lastPaidY) * 12 + (currentMonth - lastPaidM);
      pendingMonthsCount = Math.max(1, monthsDiff);
    }

    const overdueDaysCount = dueStatus === 'Overdue' 
      ? Math.ceil((today.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24)) 
      : 0;

    // Calculate lease expiry bounds
    const leaseEndDateObj = new Date(tenant.endDate);
    const leaseDiffTime = leaseEndDateObj.getTime() - today.getTime();
    const daysUntilLeaseExpiry = Math.ceil(leaseDiffTime / (1000 * 60 * 60 * 24));
    const isLeaseExpiringSoon = daysUntilLeaseExpiry >= 0 && daysUntilLeaseExpiry <= 30;
    const isLeaseExpired = daysUntilLeaseExpiry < 0;

    return {
      tenantId: tenant.id,
      tenantName: tenant.fullName,
      tenantPhone: tenant.mobileNumber,
      tenantWhatsApp: tenant.whatsAppNumber,
      tenantEmail: tenant.email,
      apartmentId: tenant.apartmentId,
      apartmentNumber: apt ? apt.number : 'Apt',
      buildingName: bldg ? bldg.name.replace(/\s*\(Building\s+\w+\)/i, '') : 'Building',
      monthlyRent: apt ? apt.monthlyRent : 0,
      lastPaidMonth,
      lastPaidYear,
      dueStatus,
      dueDate: dueDateObj.toISOString().split('T')[0],
      pendingMonthsCount,
      overdueDaysCount,
      leaseEndDate: tenant.endDate,
      daysUntilLeaseExpiry,
      isLeaseExpiringSoon,
      isLeaseExpired
    };
  });

  // 2. RENEWAL ALERTS & CALCULATIONS
  const renewalAlertList = tenants.filter(t => t.active).map(tenant => {
    const apt = apartments.find(a => a.id === tenant.apartmentId);
    const bldg = apt ? buildings.find(b => b.id === apt.buildingId) : null;
    
    const endDate = new Date(tenant.endDate);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Notifications before 30, 15, 7 days
    let alertSpan: 'None' | '30 Days' | '15 Days' | '7 Days' | 'Overdue' = 'None';
    if (diffDays < 0) {
      alertSpan = 'Overdue';
    } else if (diffDays <= 7) {
      alertSpan = '7 Days';
    } else if (diffDays <= 15) {
      alertSpan = '15 Days';
    } else if (diffDays <= 30) {
      alertSpan = '30 Days';
    }

    return {
      tenant,
      apt,
      bldg,
      diffDays,
      alertSpan
    };
  }).filter(r => r.alertSpan !== 'None' || r.diffDays < 60); // show upcoming ones

  const handleApplyIncrease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) return;

    const percent = increasePercent === 0 ? Number(customPercent) : increasePercent;
    if (percent <= 0 || isNaN(percent)) {
      if (onShowAlert) {
        onShowAlert({
          type: 'warning',
          title: 'Invalid Percentage / غلط شرحِ اضافہ',
          text: 'Please enter a valid growth percentage greater than zero.\nبراہ کرم اضافے کی درست شرح درج کریں۔',
          confirmButtonText: 'OK / ٹھیک ہے'
        });
      } else {
        alert('Please enter a valid growth percentage.');
      }
      return;
    }

    onApplyRentIncrease(selectedTenantId, percent, increaseRemarks);
    setSelectedTenantId('');
    setCustomPercent('');

    if (onShowAlert) {
      onShowAlert({
        type: 'success',
        title: 'Rent Increased / کرایہ بڑھا دیا گیا',
        text: `Rent increase of ${percent}% successfully registered and applied to future collections.\nکرائے میں اضافہ کامیابی سے لاگو ہو گیا ہے۔`,
        confirmButtonText: 'Excellent / بہترین'
      });
    } else {
      alert('Rent increase successfully registered and applied to future collections.');
    }
  };

  const handleRenewContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewTenantId || !renewEndDate || renewRent <= 0) {
      if (onShowAlert) {
        onShowAlert({
          type: 'warning',
          title: 'Incomplete Terms / نامکمل معلومات',
          text: 'Please specify all renewal terms (valid date and rent rate).\nبراہ کرم تجدید کی تمام معلومات پُر کریں۔',
          confirmButtonText: 'OK / ٹھیک ہے'
        });
      } else {
        alert('Please specify all renewal terms.');
      }
      return;
    }

    onRenewContract(renewTenantId, renewEndDate, Number(renewRent));
    setRenewTenantId('');

    if (onShowAlert) {
      onShowAlert({
        type: 'success',
        title: 'Contract Extended / معاہدے کی تجدید',
        text: 'Agreement contract extended successfully with new rent rate.\nکرایہ نامہ معاہدے کی کامیابی سے تجدید کر دی گئی ہے۔',
        confirmButtonText: 'Perfect / بہترین'
      });
    } else {
      alert('Agreement contract extended successfully.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Tab controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b border-slate-100 dark:border-slate-700/50">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('Due & Leases Control Room / واجبات اور تجدید معاہدہ')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {t('Monitor lease bounds, initiate auto-indexed rent increases, and renew agreements / کرایہ داری، واجبات اور کرایہ میں سالانہ اضافہ کا انتظام')}
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800 shrink-0">
          {[
            { id: 'due', label: t('Rent Due / بقایا جات'), icon: Clock },
            { id: 'increase', label: t('Rent Increase / کرایہ اضافہ'), icon: TrendingUp },
            { id: 'renewals', label: t('Renewal / تجدید معاہدہ'), icon: Calendar }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                activeSubTab === tab.id 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW DELEGATOR */}
      {activeSubTab === 'due' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Due Today', count: rentDueList.filter(r => r.dueStatus === 'Due Today').length, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
              { label: 'Due Tomorrow', count: rentDueList.filter(r => r.dueStatus === 'Due Tomorrow').length, color: 'text-sky-500 bg-sky-500/10 border-sky-500/20' },
              { label: 'Due This Week', count: rentDueList.filter(r => r.dueStatus === 'Due This Week').length, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
              { label: 'Overdue Rent', count: rentDueList.filter(r => r.dueStatus === 'Overdue').length, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' }
            ].map((st, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border ${st.color} text-center`}>
                <span className="text-[10px] uppercase font-bold tracking-wider block opacity-70">{st.label}</span>
                <span className="text-3xl font-extrabold block mt-2">{st.count} Units</span>
              </div>
            ))}
          </div>

          {/* Lease Expiry Warning Center */}
          {(() => {
            const expiringSoonList = rentDueList.filter(r => r.isLeaseExpiringSoon || r.isLeaseExpired);
            if (expiringSoonList.length === 0) return null;
            return (
              <div className="bg-amber-500/5 dark:bg-amber-950/10 border border-amber-500/20 dark:border-amber-900/30 rounded-2xl p-4 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      {t('Lease Expiry Warning Center / معاہدہ کی معیاد ختم ہونے کے الرٹس')}
                      <span className="bg-amber-500 text-white font-bold font-mono px-1.5 py-0.5 rounded text-[9px]">
                        {expiringSoonList.length} Active
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {t("The following active tenants' contracts are expiring within 30 days or have already expired. Action required to prevent uncontracted occupancy. / درج ذیل کرایہ داروں کے معاہدے 30 دن میں ختم ہو رہے ہیں یا ختم ہو چکے ہیں۔ غیر قانونی رہائش کو روکنے کے لیے کارروائی کی ضرورت ہے۔")}
                    </p>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {expiringSoonList.map((r, idx) => (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                            r.isLeaseExpired 
                              ? 'bg-rose-500/5 border-rose-500/20 dark:border-rose-900/30' 
                              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                          }`}
                        >
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{r.tenantName}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {r.buildingName} - {r.apartmentNumber} | Exp: {r.leaseEndDate}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                              r.isLeaseExpired 
                                ? 'bg-rose-500/10 text-rose-500 font-sans' 
                                : 'bg-amber-500/10 text-amber-500 font-sans'
                            }`}>
                              {r.isLeaseExpired ? 'Expired' : `${r.daysUntilLeaseExpiry}d left`}
                            </span>
                            <button
                              onClick={() => setNotifyingTenant(r)}
                              className="bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg cursor-pointer transition-all flex items-center gap-1 shrink-0"
                            >
                              <Zap className="w-3 h-3" />
                              Notify
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Rent Due Registers</h3>
              <p className="text-xs text-slate-400">Calculated dynamic rent due states based on payments logs</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 font-sans">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700/50">
                  <tr>
                    <th className="p-4 font-semibold text-slate-500 uppercase">Tenant</th>
                    <th className="p-4 font-semibold text-slate-500 uppercase">Property</th>
                    <th className="p-4 font-semibold text-slate-500 uppercase">Monthly Rent</th>
                    <th className="p-4 font-semibold text-slate-500 uppercase">Due Date</th>
                    <th className="p-4 font-semibold text-slate-500 uppercase">Status</th>
                    <th className="p-4 font-semibold text-slate-500 uppercase">Pending Months</th>
                    <th className="p-4 font-semibold text-slate-500 uppercase">Overdue Days</th>
                    <th className="p-4 font-semibold text-slate-500 uppercase">Lease & Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50 font-mono">
                  {rentDueList.map((r, idx) => (
                    <tr key={idx} className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/30 ${r.isLeaseExpired ? 'border-l-4 border-l-rose-500' : r.isLeaseExpiringSoon ? 'border-l-4 border-l-amber-500' : ''}`}>
                      <td className="p-4 font-sans font-semibold text-slate-800 dark:text-slate-100">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1.5 flex-wrap">
                            {r.tenantName}
                            {r.isLeaseExpired && (
                              <span className="text-[9px] font-bold bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded font-sans uppercase animate-pulse">
                                {t('Expired / زائد المیعاد')}
                              </span>
                            )}
                            {r.isLeaseExpiringSoon && (
                              <span className="text-[9px] font-bold bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-sans uppercase">
                                {t('Expiring / معیاد ختم ہو رہی ہے')} ({r.daysUntilLeaseExpiry}d)
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-medium mt-0.5">
                            Lease Ends: {r.leaseEndDate}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-sans text-slate-500 text-[11px]">
                        {r.buildingName} - {r.apartmentNumber}
                      </td>
                      <td className="p-4 text-slate-700 dark:text-slate-300">
                        {formatPKR(r.monthlyRent)}
                      </td>
                      <td className="p-4 text-slate-500 font-mono">
                        {r.dueDate}
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] py-0.5 px-2 rounded-full font-sans font-bold uppercase ${
                          r.dueStatus === 'Paid' 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : r.dueStatus === 'Overdue' 
                              ? 'bg-rose-500/10 text-rose-500 animate-pulse' 
                              : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {r.dueStatus}
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono">
                        {r.pendingMonthsCount > 0 ? (
                          <span className="text-rose-500 font-bold">{r.pendingMonthsCount}m</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center font-mono">
                        {r.overdueDaysCount > 0 ? (
                          <span className="text-rose-500 font-bold">{r.overdueDaysCount} Days</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          {(r.isLeaseExpiringSoon || r.isLeaseExpired) && (
                            <button
                              onClick={() => setNotifyingTenant(r)}
                              className="bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                              title="Send Renewal Notification"
                            >
                              <Zap className="w-3 h-3" />
                              Notify
                            </button>
                          )}
                          {!isReadOnly && (
                            <button
                              onClick={() => {
                                setActiveSubTab('renewals');
                                setRenewTenantId(r.tenantId);
                                setRenewRent(r.monthlyRent);
                                // Default extension
                                const currentEnd = new Date(r.leaseEndDate);
                                const baseDate = currentEnd > today ? currentEnd : today;
                                const nextYear = new Date(baseDate);
                                nextYear.setFullYear(nextYear.getFullYear() + 1);
                                nextYear.setDate(nextYear.getDate() - 1);
                                setRenewEndDate(nextYear.toISOString().split('T')[0]);
                              }}
                              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px] py-1 px-2 rounded-lg cursor-pointer transition-all font-semibold font-sans"
                            >
                              Renew
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'increase' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          {/* Rent Increase Form */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5 shadow-sm h-fit">
            <h3 className="font-extrabold text-slate-800 dark:text-white text-sm mb-1">Index Rent (Yearly Rule)</h3>
            <p className="text-xs text-slate-400 mb-4">Increases unit base rent once every 12 months, storing history.</p>

            {isReadOnly ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl flex gap-2.5 items-center text-xs text-slate-500">
                <ShieldAlert className="w-5 h-5 text-indigo-400" />
                <span>Rent increases require Manager/Admin write permissions.</span>
              </div>
            ) : (
              <form onSubmit={handleApplyIncrease} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Select Active Tenant</label>
                  <select
                    required
                    value={selectedTenantId}
                    onChange={(e) => {
                      setSelectedTenantId(e.target.value);
                      const t = tenants.find(ten => ten.id === e.target.value);
                      if (t) {
                        const apt = apartments.find(a => a.id === t.apartmentId);
                        setCustomPercent('');
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">-- Select Active Tenant --</option>
                    {tenants.filter(t => t.active).map(t => {
                      const apt = apartments.find(a => a.id === t.apartmentId);
                      return (
                        <option key={t.id} value={t.id}>
                          {t.fullName} ({apt ? apt.number : 'None'} - Rent: {formatPKR(apt ? apt.monthlyRent : 0)})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">Increase Percentage Rule</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 12, 15, 0].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setIncreasePercent(val)}
                        className={`py-2 px-1 text-center font-bold rounded-lg border transition-all cursor-pointer ${
                          increasePercent === val 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' 
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {val === 0 ? 'Custom' : `${val}%`}
                      </button>
                    ))}
                  </div>

                  {increasePercent === 0 && (
                    <div className="mt-3">
                      <label className="block text-slate-500 mb-1">Enter custom rate (%)</label>
                      <input
                        type="number"
                        required
                        value={customPercent}
                        onChange={(e) => setCustomPercent(e.target.value)}
                        placeholder="e.g. 8.5"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {selectedTenantId && (
                  <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl space-y-1">
                    {(() => {
                      const t = tenants.find(ten => ten.id === selectedTenantId);
                      const apt = apartments.find(a => a.id === t?.apartmentId);
                      const current = apt ? apt.monthlyRent : 0;
                      const rate = increasePercent === 0 ? Number(customPercent || 0) : increasePercent;
                      const added = (current * rate) / 100;
                      const projected = current + added;

                      return (
                        <>
                          <div className="flex justify-between text-slate-500 dark:text-slate-400">
                            <span>Current Rent:</span>
                            <span className="font-bold font-mono">{formatPKR(current)}</span>
                          </div>
                          <div className="flex justify-between text-slate-500 dark:text-slate-400">
                            <span>Projected Rent (+{rate}%):</span>
                            <span className="font-extrabold text-indigo-500 font-mono">{formatPKR(Math.round(projected))}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Remarks</label>
                  <input
                    type="text"
                    value={increaseRemarks}
                    onChange={(e) => setIncreaseRemarks(e.target.value)}
                    placeholder="e.g. Annual rent indexation"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 transition-all text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  <Play className="w-4 h-4" />
                  Execute Automatic Increase
                </button>
              </form>
            )}
          </div>

          {/* Rent Increase History */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5 shadow-sm col-span-2">
            <h3 className="font-extrabold text-slate-800 dark:text-white text-sm mb-1 flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-500" />
              Rent Increase Ledger
            </h3>
            <p className="text-xs text-slate-400 mb-4">Historical record of applied lease rate growth rules</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700/50">
                  <tr>
                    <th className="p-3 font-semibold text-slate-500 uppercase">Tenant</th>
                    <th className="p-3 font-semibold text-slate-500 uppercase">Apt</th>
                    <th className="p-3 font-semibold text-slate-500 uppercase">Old Rent</th>
                    <th className="p-3 font-semibold text-slate-500 uppercase">New Rent</th>
                    <th className="p-3 font-semibold text-slate-500 uppercase">Rate</th>
                    <th className="p-3 font-semibold text-slate-500 uppercase">Date Index</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50 font-mono">
                  {increaseHistory.map((h, idx) => {
                    const tenant = tenants.find(t => t.id === h.tenantId);
                    const apt = apartments.find(a => a.id === h.apartmentId);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="p-3 font-sans font-semibold text-slate-800 dark:text-slate-200">{tenant ? tenant.fullName : 'Tenant'}</td>
                        <td className="p-3 font-sans text-slate-500">{apt ? apt.number : 'Unit'}</td>
                        <td className="p-3 text-slate-500">{formatPKR(h.oldRent)}</td>
                        <td className="p-3 text-emerald-500 font-bold">{formatPKR(h.newRent)}</td>
                        <td className="p-3 text-indigo-500 font-bold">+{h.percentage}%</td>
                        <td className="p-3 text-slate-400 text-[10px]">{h.dateApplied}</td>
                      </tr>
                    );
                  })}
                  {increaseHistory.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-sans text-xs">
                        No rent increase ledger entries found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {activeSubTab === 'renewals' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          {/* Renew Lease Form */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5 shadow-sm h-fit">
            <h3 className="font-extrabold text-slate-800 dark:text-white text-sm mb-1">Renew Agreement Terms</h3>
            <p className="text-xs text-slate-400 mb-4">Extend tenant agreement contract, update rent bounds.</p>

            {isReadOnly ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl flex gap-2.5 items-center text-xs text-slate-500">
                <ShieldAlert className="w-5 h-5 text-indigo-400" />
                <span>Agreement renewals require Manager/Admin permissions.</span>
              </div>
            ) : (
              <form onSubmit={handleRenewContract} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Active Lease Tenant</label>
                  <select
                    required
                    value={renewTenantId}
                    onChange={(e) => {
                      setRenewTenantId(e.target.value);
                      const t = tenants.find(ten => ten.id === e.target.value);
                      if (t) {
                        const apt = apartments.find(a => a.id === t.apartmentId);
                        setRenewRent(apt ? apt.monthlyRent : 0);
                        
                        // Default extension: 1 year from their current end date or from today
                        const currentEnd = new Date(t.endDate);
                        const baseDate = currentEnd > today ? currentEnd : today;
                        const nextYear = new Date(baseDate);
                        nextYear.setFullYear(nextYear.getFullYear() + 1);
                        nextYear.setDate(nextYear.getDate() - 1);
                        setRenewEndDate(nextYear.toISOString().split('T')[0]);
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 focus:outline-none"
                  >
                    <option value="">-- Select Lease --</option>
                    {tenants.filter(t => t.active).map(t => {
                      const apt = apartments.find(a => a.id === t.apartmentId);
                      return (
                        <option key={t.id} value={t.id}>
                          {t.fullName} ({apt ? apt.number : 'None'} - Ends: {t.endDate})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">New Contract End Date *</label>
                  <input
                    type="date"
                    required
                    value={renewEndDate}
                    onChange={(e) => setRenewEndDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Renewed Monthly Rent (PKR) *</label>
                  <input
                    type="number"
                    required
                    value={renewRent}
                    onChange={(e) => setRenewRent(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 focus:outline-none font-mono font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 transition-all text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  <Check className="w-4 h-4" />
                  Extend Agreement
                </button>
              </form>
            )}
          </div>

          {/* Upcoming Renewals Lists with alerts (30, 15, 7 days) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5 shadow-sm col-span-2">
            <h3 className="font-extrabold text-slate-800 dark:text-white text-sm mb-1">Expiring Leases Alerts</h3>
            <p className="text-xs text-slate-400 mb-4">Urgent renewal notifications automatically segmented by time bounds</p>

            <div className="space-y-3">
              {renewalAlertList.map((r, idx) => {
                const isOverdue = r.diffDays < 0;
                let alertColor = 'text-slate-500 bg-slate-50 border-slate-100 dark:bg-slate-900 dark:border-slate-800';
                
                if (isOverdue) {
                  alertColor = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
                } else if (r.diffDays <= 7) {
                  alertColor = 'text-amber-600 bg-amber-500/10 border-amber-500/20 animate-pulse';
                } else if (r.diffDays <= 15) {
                  alertColor = 'text-amber-500 bg-amber-500/5 border-amber-500/10';
                } else if (r.diffDays <= 30) {
                  alertColor = 'text-indigo-500 bg-indigo-500/5 border-indigo-500/10';
                }

                return (
                  <div key={idx} className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${alertColor}`}>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                          {r.tenant.fullName}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-sans font-mono">
                          {r.bldg ? r.bldg.name.replace(/\s*\(Building\s+\w+\)/i, '') : ''} - {r.apt ? r.apt.number : 'Unit'} | Exp: {r.tenant.endDate}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <span className="text-xs font-extrabold block font-mono">
                          {isOverdue ? `Expired ${Math.abs(r.diffDays)} days ago` : `Expires in ${r.diffDays} days`}
                        </span>
                        <span className="text-[9px] text-slate-400 block font-mono">Current Rent: {formatPKR(r.apt ? r.apt.monthlyRent : 0)}</span>
                      </div>

                      {!isReadOnly && (
                        <button
                          onClick={() => {
                            setRenewTenantId(r.tenant.id);
                            setRenewRent(r.apt ? r.apt.monthlyRent : 0);
                            
                            // Default extension
                            const currentEnd = new Date(r.tenant.endDate);
                            const baseDate = currentEnd > today ? currentEnd : today;
                            const nextYear = new Date(baseDate);
                            nextYear.setFullYear(nextYear.getFullYear() + 1);
                            nextYear.setDate(nextYear.getDate() - 1);
                            setRenewEndDate(nextYear.toISOString().split('T')[0]);
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 transition-colors text-white py-1 px-3 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Quick Extend
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {renewalAlertList.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">
                  All active leases have long-term coverage. No renewals due.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* LEASE RENEWAL NOTIFICATION DESK MODAL */}
      <AnimatePresence>
        {notifyingTenant && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-start justify-center p-4 z-50 overflow-y-auto select-none font-sans sm:items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden relative my-auto sm:my-8"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-indigo-400">
                    <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
                    {t('Lease Renewal Notification Desk / معاہدہ تجدید نوٹس ڈیسک')}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{t('Draft, customize, and transmit official contract renewal warnings / معاہدہ کی تجدید کے نوٹس تیار اور روانہ کریں')}</p>
                </div>
                <button
                  onClick={() => {
                    setNotifyingTenant(null);
                    setNotificationSuccess(false);
                  }}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 space-y-4">
                {notificationSuccess ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-6 text-center space-y-3"
                  >
                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                      <Check className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">{t('Notification Successfully Broadcasted! / نوٹس کامیابی سے بھیج دیا گیا!')}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                        {t('The renewal alert notice was logged to the database system logs and simulated successfully. / معاہدہ کی تجدید کا نوٹس کامیابی سے سسٹم لاگ میں محفوظ کر لیا گیا ہے۔')}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl max-w-xs mx-auto text-[10px] text-slate-500 font-mono">
                      Logged Event: SEND_RENEWAL_NOTICE
                    </div>
                    <button
                      onClick={() => {
                        setNotifyingTenant(null);
                        setNotificationSuccess(false);
                      }}
                      className="bg-indigo-500 hover:bg-indigo-600 transition-colors text-white py-2 px-6 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      {t('Done / ٹھیک ہے')}
                    </button>
                  </motion.div>
                ) : (
                  <>
                    {/* Tenant Info Quick Specs */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl text-[11px]">
                      <div>
                        <span className="text-slate-400 block font-semibold text-[9px] uppercase">Resident Name</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{notifyingTenant.tenantName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[9px] uppercase">Unit Assigned</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{notifyingTenant.buildingName} - {notifyingTenant.apartmentNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[9px] uppercase">Lease Term Expiry</span>
                        <span className="font-extrabold text-rose-500">{notifyingTenant.leaseEndDate} ({notifyingTenant.isLeaseExpired ? 'Expired' : `${notifyingTenant.daysUntilLeaseExpiry} days left`})</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold text-[9px] uppercase">Active Monthly Rate</span>
                        <span className="font-bold text-indigo-500">{formatPKR(notifyingTenant.monthlyRent)}</span>
                      </div>
                    </div>

                    {/* Language Selector */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">{t('Select Language / زبان کا انتخاب کریں')}</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'ur', label: t('Urdu / اردو') },
                          { id: 'en', label: t('English / انگریزی') }
                        ].map((l) => (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => setMsgLang(l.id as any)}
                            className={`py-1.5 text-center font-bold rounded-lg border text-[11px] transition-all cursor-pointer ${
                              msgLang === l.id 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-950'
                            }`}
                          >
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Template Selectors */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">{t('Choose Alert Vibe / نوٹس کا انداز')}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'standard', label: t('Standard / عام') },
                          { id: 'friendly', label: t('Friendly / دوستانہ') },
                          { id: 'formal', label: t('Formal / سنجیدہ') }
                        ].map((tItem) => (
                          <button
                            key={tItem.id}
                            type="button"
                            onClick={() => setMsgTemplate(tItem.id as any)}
                            className={`py-1.5 text-center font-bold rounded-lg border text-[11px] transition-all cursor-pointer ${
                              msgTemplate === tItem.id 
                                ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30' 
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-950'
                            }`}
                          >
                            {tItem.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message Draft Textarea */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">{t('Message Draft / تحریر')}</label>
                        <span className="text-[9px] text-slate-400">{t('Editable / قابل ترمیم')}</span>
                      </div>
                      <textarea
                        value={customMsg}
                        onChange={(e) => setCustomMsg(e.target.value)}
                        rows={6}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed font-sans"
                        placeholder="Draft your notification message here..."
                      />
                    </div>

                    {/* Send Channels Grid */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{t('Select Transmission Channel / چینل کا انتخاب کریں')}</span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* WhatsApp */}
                        <button
                          type="button"
                          onClick={() => {
                            const waNum = notifyingTenant.tenantWhatsApp || notifyingTenant.tenantPhone || '';
                            const cleanNum = waNum.replace(/\D/g, '');
                            const encoded = encodeURIComponent(customMsg);
                            if (onAddLog) {
                              onAddLog('SEND_RENEWAL_NOTICE', `Dispatched lease renewal reminder to ${notifyingTenant.tenantName} for Unit ${notifyingTenant.apartmentNumber} via WhatsApp.`);
                            }
                            window.open(`https://wa.me/${cleanNum || '923000000000'}?text=${encoded}`, '_blank');
                            setNotificationSuccess(true);
                          }}
                          className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 py-2 px-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all font-semibold"
                        >
                          <MessageSquare className="w-4 h-4 shrink-0 text-emerald-500" />
                          <span>WhatsApp Channel</span>
                        </button>

                        {/* Email */}
                        <button
                          type="button"
                          onClick={() => {
                            const emailAddress = notifyingTenant.tenantEmail || '';
                            const subject = encodeURIComponent(t('Urgent: Lease Renewal Notice / کرایہ داری معاہدہ کی تجدید کا نوٹس'));
                            const encodedBody = encodeURIComponent(customMsg);
                            if (onAddLog) {
                              onAddLog('SEND_RENEWAL_NOTICE', `Sent lease renewal notice email to ${notifyingTenant.tenantName} (${emailAddress}) for Unit ${notifyingTenant.apartmentNumber}.`);
                            }
                            window.open(`mailto:${emailAddress}?subject=${subject}&body=${encodedBody}`, '_blank');
                            setNotificationSuccess(true);
                          }}
                          className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 py-2 px-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all font-semibold"
                        >
                          <Mail className="w-4 h-4 shrink-0 text-indigo-500" />
                          <span>Email Client</span>
                        </button>

                        {/* Copy Clipboard */}
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(customMsg);
                            if (onAddLog) {
                              onAddLog('SEND_RENEWAL_NOTICE', `Copied contract renewal alert to clipboard for tenant: ${notifyingTenant.tenantName}`);
                            }
                            if (onShowAlert) {
                              onShowAlert({
                                type: 'success',
                                title: 'Copied / کاپی ہو گیا',
                                text: 'Renewal notification message has been copied to your clipboard.\nتجدید کا پیغام کامیابی سے کاپی کر لیا گیا ہے۔',
                                confirmButtonText: 'OK / ٹھیک ہے'
                              });
                            } else {
                              alert('Renewal message copied to clipboard!');
                            }
                          }}
                          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 px-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all font-semibold"
                        >
                          <Copy className="w-4 h-4 shrink-0 text-slate-500" />
                          <span>Copy Draft Message</span>
                        </button>

                        {/* Simulate SMS */}
                        <button
                          type="button"
                          onClick={() => {
                            if (onAddLog) {
                              onAddLog('SEND_RENEWAL_NOTICE', `Simulated GSM SMS lease renewal alert to mobile ${notifyingTenant.tenantPhone} for ${notifyingTenant.tenantName}`);
                            }
                            setNotificationSuccess(true);
                          }}
                          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 px-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all font-semibold"
                        >
                          <Send className="w-4 h-4 shrink-0 text-slate-500" />
                          <span>Simulate GSM SMS</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
