import React from 'react';
import { 
  Building2, Calendar, Receipt, CreditCard, ShieldAlert, 
  Clock, DollarSign, Home, User, CheckCircle2, AlertTriangle, FileText
} from 'lucide-react';
import { Tenant, Apartment, Building, Floor, RentPayment, User as UserType } from '../types';
import { useTranslation } from '../utils/language';

interface TenantPortalViewProps {
  currentUser: UserType;
  tenants: Tenant[];
  apartments: Apartment[];
  buildings: Building[];
  floors: Floor[];
  payments: RentPayment[];
}

export default function TenantPortalView({
  currentUser,
  tenants,
  apartments,
  buildings,
  floors,
  payments
}: TenantPortalViewProps) {
  const { t } = useTranslation();
  const cleanCNIC = (val: string) => val.replace(/[^0-9]/g, '');

  // Find the tenant profile linked to this user's CNIC
  const tenant = tenants.find(t => {
    if (!t.cnic || !currentUser.cnic) return false;
    return cleanCNIC(t.cnic) === cleanCNIC(currentUser.cnic);
  });

  // Find matching apartment
  const apartment = tenant ? apartments.find(a => a.id === tenant.apartmentId) : null;
  // Find matching building & floor
  const building = apartment ? buildings.find(b => b.id === apartment.buildingId) : null;
  const floor = apartment ? floors.find(f => f.id === apartment.floorId) : null;

  // Filter payments belonging strictly to this tenant
  const tenantPayments = tenant 
    ? payments.filter(p => p.tenantId === tenant.id)
    : [];

  // Sort payments by year and month descending
  const sortedPayments = [...tenantPayments].sort((a, b) => {
    if (a.rentYear !== b.rentYear) return b.rentYear - a.rentYear;
    return b.rentMonth - a.rentMonth;
  });

  // Calculate some statistics
  const totalPaid = tenantPayments.reduce((sum, p) => sum + p.amount + p.utilityCharges + p.lateCharges - p.discount, 0);
  const totalUtilityPaid = tenantPayments.reduce((sum, p) => sum + p.utilityCharges, 0);

  // Calculate days remaining in contract
  const getContractDaysLeft = () => {
    if (!tenant?.endDate) return 0;
    const end = new Date(tenant.endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = getContractDaysLeft();

  const getMonthNameUrdu = (m: number) => {
    const months = [
      'جنوری (January)', 'فروری (February)', 'مارچ (March)', 'اپریل (April)', 
      'مئی (May)', 'جون (June)', 'جولائی (July)', 'اگست (August)', 
      'ستمبر (September)', 'اکتوبر (October)', 'نومبر (November)', 'دسمبر (December)'
    ];
    return months[m - 1] || '';
  };

  if (!tenant) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div 
          className="bg-white dark:bg-slate-950 p-8 rounded-2xl border border-rose-500/20 shadow-xl text-center transition-all"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            {t('Profile Not Linked / کرایہ دار کا ریکارڈ نہیں ملا')}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
            {t('Dear Resident, your CNIC / شناختی کارڈ number is not linked to any active profile. Please contact the landlord to update it. / پیارے کرایہ دار، آپ کا شناختی کارڈ نمبر فعال کرایہ داروں کی لسٹ میں نہیں مل سکا۔ برائے مہربانی اپنے مالک مکان یا ایڈمن سے رابطہ کریں۔')}
          </p>
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl text-left font-mono text-xs text-slate-500 space-y-1 border border-slate-200/60 dark:border-slate-800">
            <p><strong>Username:</strong> {currentUser.username}</p>
            <p><strong>Linked CNIC:</strong> {currentUser.cnic || 'Not Specified'}</p>
            <p><strong>Role:</strong> {currentUser.role}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 text-indigo-300 text-xs font-bold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t('Tenant Portal / کرایہ دار پورٹل')}</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {t('Welcome / خوش آمدید')}, {tenant.fullName}
            </h1>
            <p className="text-slate-300 text-xs mt-1">
              {t('Here you can see the details of your rent, electricity, gas bills and receipts. / یہاں آپ اپنے کرایے، بجلی، گیس کے بلوں کی تفصیلات اور رسیدیں دیکھ سکتے ہیں۔')}
            </p>
          </div>
          <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold font-mono text-sm uppercase">
              {currentUser.username.substring(0, 2)}
            </div>
            <div>
              <span className="text-xs font-bold block text-slate-200">{currentUser.fullName}</span>
              <span className="text-[10px] text-indigo-400 font-extrabold uppercase font-mono">{tenant.cnic}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Monthly Rent / ماہانہ کرایہ')}</p>
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold dark:text-white">
            PKR {apartment?.monthlyRent.toLocaleString() || '0'}
          </p>
          <span className="text-[10px] text-slate-400 block mt-1">{t('Due on the due date of every month / ہر ماہ کی مقررہ تاریخ کو قابلِ ادائیگی')}</span>
        </div>

        <div className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Security Deposit / سیکیورٹی')}</p>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            PKR {tenant.securityDeposit.toLocaleString() || '0'}
          </p>
          <span className="text-[10px] text-slate-400 block mt-1">{t('Refundable Advance Security Deposit / قابلِ واپسی ایڈوانس سیکیورٹی ڈپازٹ')}</span>
        </div>

        <div className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Contract Remaining / معاہدہ')}</p>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold dark:text-white">
            {daysLeft > 0 ? `${daysLeft} Days` : t('Expired / زائد المیعاد')}
          </p>
          <span className="text-[10px] text-slate-400 block mt-1">{t('Agreement Expiry Date / معاہدے کے خاتمے کی تاریخ')}: {tenant.endDate}</span>
        </div>

        <div className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('Total Paid to Date / کل ادا شدہ')}</p>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            PKR {totalPaid.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 block mt-1">{t('Including electricity, gas and utility bills / بشمول بجلی، گیس اور یوٹیلیٹی بلز')}</span>
        </div>
      </div>

      {/* Main Info Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Lease & Apartment Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50 dark:bg-slate-900/40">
              <Home className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">Lease Details / معاہدے کی تفصیل</h3>
                <p className="text-[10px] text-slate-400">آپ کے کرائے کے فلیٹ اور بلڈنگ کی معلومات</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Building2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Building & Location / بلڈنگ اور پتہ</span>
                  <span className="text-sm font-bold block text-slate-800 dark:text-slate-200">
                    {building ? building.name : 'N/A'}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    {building ? building.address : 'Address not specified'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">House/Unit / فلیٹ نمبر</span>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                    {apartment ? apartment.number : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Floor / منزل</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {floor ? floor.name : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Start Date / آغاز کی تاریخ</span>
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    {tenant.startDate}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">End Date / اختتام کی تاریخ</span>
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    {tenant.endDate}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Advance Rent / پیشگی کرایہ</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    PKR {tenant.advanceRent.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Security Status / سیکیورٹی ڈپازٹ</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    جمع شدہ (Received)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Guidelines info card */}
          <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2 text-indigo-700 dark:text-indigo-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider">کرایہ داروں کے لیے ہدایات (Instructions)</h4>
            </div>
            <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-2 list-disc pl-4 leading-relaxed">
              <li>ہر مہینے کا کرایہ ۵ تاریخ سے پہلے ادا کرنا لازمی ہے۔</li>
              <li>بجلی، گیس اور پانی کا بل کرائے کے ساتھ شامل کر کے دیا جا سکتا ہے۔</li>
              <li>ادائیگی کے بعد ہمیشہ رسید کا حوالہ نمبر چیک کریں کہ وہ لیجر میں اپ ڈیٹ ہو گیا ہے۔</li>
              <li>کسی بھی شکایت یا مسئلہ کی صورت میں ایڈمنسٹریٹر سے رابطہ کریں۔</li>
            </ul>
          </div>
        </div>

        {/* Right Columns: Rent Ledger / Bills */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/40">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-white text-xs uppercase tracking-wider">My Payments Ledger / کرائے کا ریکارڈ</h3>
                <p className="text-[10px] text-slate-400">آپ کی تمام ادا شدہ اقساط اور رسیدوں کی تاریخ</p>
              </div>
              <span className="text-[9px] font-mono bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 py-1 px-2.5 rounded font-bold uppercase">
                {tenantPayments.length} Total Receipts
              </span>
            </div>

            <div className="overflow-x-auto">
              {sortedPayments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  کوئی ادائیگی نہیں پائی گئی (No payment records registered yet).
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-400 uppercase tracking-wider text-[9px] border-b border-slate-100 dark:border-slate-800 font-mono">
                      <th className="py-3 px-4">Month / Year</th>
                      <th className="py-3 px-4 text-right">Rent Paid</th>
                      <th className="py-3 px-4 text-right">Utilities / Bills</th>
                      <th className="py-3 px-4 text-right">Total Paid</th>
                      <th className="py-3 px-4">Method / Ref</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sortedPayments.map((p) => {
                      const totalBillAmount = p.amount + p.utilityCharges + p.lateCharges - p.discount;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800 dark:text-white block">
                              {getMonthNameUrdu(p.rentMonth)}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400">{p.rentYear} &bull; Paid on {p.paymentDate}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-800 dark:text-white font-mono">
                            PKR {p.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-500 font-mono">
                            PKR {p.utilityCharges.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                            PKR {totalBillAmount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold px-1.5 py-0.5 rounded text-[9px] font-mono">
                              {p.paymentMethod}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono mt-0.5 truncate max-w-[80px]">
                              {p.referenceNumber || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 py-1 px-2.5 rounded-lg text-[9px] font-bold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              تصدیق شدہ (Paid)
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
