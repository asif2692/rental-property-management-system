import React, { useState } from 'react';
import { 
  Users, Search, Filter, Plus, FileText, Image as ImageIcon, 
  Phone, Mail, MapPin, Briefcase, Calendar, DollarSign, 
  Eye, Edit2, Trash2, X, Check, AlertCircle, ShieldAlert 
} from 'lucide-react';
import { Tenant, Apartment, Building, UserRole } from '../types';
import { useTranslation } from '../utils/language';

interface TenantViewProps {
  tenants: Tenant[];
  apartments: Apartment[];
  buildings: Building[];
  userRole: UserRole;
  onAddTenant: (t: Omit<Tenant, 'id'>) => boolean; // returns success
  onUpdateTenant: (t: Tenant) => boolean; // returns success
  onDeleteTenant: (id: string) => void;
  onShowAlert?: (options: any) => void;
}

export default function TenantView({
  tenants,
  apartments,
  buildings,
  userRole,
  onAddTenant,
  onUpdateTenant,
  onDeleteTenant,
  onShowAlert
}: TenantViewProps) {
  const { t } = useTranslation();
  const isReadOnly = userRole === 'read_only';
  const canDelete = userRole === 'admin' || userRole === 'landlord';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterBuildingId, setFilterBuildingId] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive

  // Selected tenant for detail modal
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // Form modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [cnic, setCnic] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [whatsAppNumber, setWhatsAppNumber] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [familyMembers, setFamilyMembers] = useState(1);
  
  // File streams/base64 strings
  const [photoUrl, setPhotoUrl] = useState('');
  const [cnicFrontUrl, setCnicFrontUrl] = useState('');
  const [cnicBackUrl, setCnicBackUrl] = useState('');
  const [agreementScanUrl, setAgreementScanUrl] = useState('');

  const [securityDeposit, setSecurityDeposit] = useState(0);
  const [advanceRent, setAdvanceRent] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [apartmentId, setApartmentId] = useState('');
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState(true);

  // CNIC format validation: XXXXX-XXXXXXX-X
  const validateCNIC = (val: string) => {
    return /^\d{5}-\d{7}-\d$/.test(val);
  };

  // Phone format validation: 03XX-XXXXXXX or 03XXXXXXXXX (Pakistan formats)
  const validatePhone = (val: string) => {
    return /^03\d{2}-?\d{7}$/.test(val);
  };

  // Handle Base64 file inputs
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setEditingTenant(null);
    setFormError('');
    setFullName('');
    setFatherName('');
    setCnic('');
    setMobileNumber('');
    setWhatsAppNumber('');
    setEmail('');
    setEmergencyContact('');
    setPermanentAddress('');
    setCurrentAddress('');
    setOccupation('');
    setMonthlyIncome(100000);
    setFamilyMembers(2);
    setPhotoUrl('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'); // placeholder
    setCnicFrontUrl('');
    setCnicBackUrl('');
    setAgreementScanUrl('');
    setSecurityDeposit(90000);
    setAdvanceRent(45000);
    
    // Set default dates
    const todayStr = new Date().toISOString().split('T')[0];
    setStartDate(todayStr);
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    nextYear.setDate(nextYear.getDate() - 1);
    setEndDate(nextYear.toISOString().split('T')[0]);

    // Choose first vacant apartment
    const vacantApt = apartments.find(a => a.status === 'Vacant');
    setApartmentId(vacantApt ? vacantApt.id : '');
    
    setNotes('');
    setActive(true);
    setShowFormModal(true);
  };

  const openEditModal = (t: Tenant) => {
    setEditingTenant(t);
    setFormError('');
    setFullName(t.fullName);
    setFatherName(t.fatherName);
    setCnic(t.cnic);
    setMobileNumber(t.mobileNumber);
    setWhatsAppNumber(t.whatsAppNumber);
    setEmail(t.email);
    setEmergencyContact(t.emergencyContact);
    setPermanentAddress(t.permanentAddress);
    setCurrentAddress(t.currentAddress);
    setOccupation(t.occupation);
    setMonthlyIncome(t.monthlyIncome);
    setFamilyMembers(t.familyMembers);
    setPhotoUrl(t.photoUrl);
    setCnicFrontUrl(t.cnicFrontUrl);
    setCnicBackUrl(t.cnicBackUrl);
    setAgreementScanUrl(t.agreementScanUrl);
    setSecurityDeposit(t.securityDeposit);
    setAdvanceRent(t.advanceRent);
    setStartDate(t.startDate);
    setEndDate(t.endDate);
    setApartmentId(t.apartmentId);
    setNotes(t.notes);
    setActive(t.active);
    setShowFormModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // 1. Validation Checks
    if (!fullName || !cnic || !mobileNumber || !apartmentId) {
      const errMsg = 'Please fill out all required field markers (*). / براہ کرم تمام لازمی فیلڈز پُر کریں۔';
      setFormError(errMsg);
      if (onShowAlert) {
        onShowAlert({
          type: 'warning',
          title: 'Missing Fields / معلومات نامکمل ہے',
          text: 'Please fill out all required fields marked with (*).\nبراہ کرم تمام لازمی معلومات فراہم کریں۔',
          confirmButtonText: 'OK / ٹھیک ہے'
        });
      }
      return;
    }

    if (!validateCNIC(cnic)) {
      const errMsg = 'Invalid CNIC format. Required: XXXXX-XXXXXXX-X';
      setFormError(errMsg);
      if (onShowAlert) {
        onShowAlert({
          type: 'warning',
          title: 'Invalid CNIC / غلط شناختی کارڈ نمبر',
          text: 'Invalid CNIC format. Please enter as: XXXXX-XXXXXXX-X\nبراہ کرم شناختی کارڈ نمبر درست فارمیٹ میں لکھیں۔',
          confirmButtonText: 'Correct it / درست کریں'
        });
      }
      return;
    }

    if (!validatePhone(mobileNumber)) {
      const errMsg = 'Invalid Pakistan mobile format. Required: 03XX-XXXXXXX or 03XXXXXXXXX';
      setFormError(errMsg);
      if (onShowAlert) {
        onShowAlert({
          type: 'warning',
          title: 'Invalid Phone Number / غلط موبائل نمبر',
          text: 'Please use a valid Pakistani mobile number format (e.g. 03001234567 or 0300-1234567).\nبراہ کرم موبائل نمبر درست لکھیں۔',
          confirmButtonText: 'Correct it / درست کریں'
        });
      }
      return;
    }

    // 2. Duplicate CNIC check (excluding the tenant being edited)
    const duplicateCNIC = tenants.some(t => t.cnic === cnic && t.id !== editingTenant?.id);
    if (duplicateCNIC) {
      const errMsg = 'This CNIC number is already registered in the system.';
      setFormError(errMsg);
      if (onShowAlert) {
        onShowAlert({
          type: 'error',
          title: 'Duplicate CNIC / شناختی کارڈ پہلے سے موجود ہے',
          text: 'This CNIC number is already registered for another tenant.\nیہ شناختی کارڈ نمبر پہلے ہی رجسٹرڈ ہے۔',
          confirmButtonText: 'OK / ٹھیک ہے'
        });
      }
      return;
    }

    // 3. Duplicate Apartment Assignment check (if apartment is already assigned to an active tenant)
    const alreadyAssigned = tenants.some(
      t => t.apartmentId === apartmentId && t.active && t.id !== editingTenant?.id
    );
    if (alreadyAssigned && active) {
      const errMsg = 'This apartment is already occupied by an active tenant.';
      setFormError(errMsg);
      if (onShowAlert) {
        onShowAlert({
          type: 'error',
          title: 'Apartment Occupied / فلیٹ پہلے سے بک ہے',
          text: 'This apartment/house is already occupied by another active tenant.\nیہ فلیٹ/مکان پہلے ہی کسی اور کرایہ دار کے پاس ہے۔',
          confirmButtonText: 'OK / ٹھیک ہے'
        });
      }
      return;
    }

    // 4. Save
    const tenantPayload = {
      fullName,
      fatherName,
      cnic,
      mobileNumber,
      whatsAppNumber: whatsAppNumber || mobileNumber,
      email,
      emergencyContact,
      permanentAddress,
      currentAddress,
      occupation,
      monthlyIncome,
      familyMembers,
      photoUrl,
      cnicFrontUrl,
      cnicBackUrl,
      agreementScanUrl,
      securityDeposit,
      advanceRent,
      startDate,
      endDate,
      apartmentId,
      notes,
      active
    };

    let success = false;
    if (editingTenant) {
      success = onUpdateTenant({ ...editingTenant, ...tenantPayload });
    } else {
      success = onAddTenant(tenantPayload);
    }

    if (success) {
      setShowFormModal(false);
      if (onShowAlert) {
        onShowAlert({
          type: 'success',
          title: editingTenant ? 'Profile Updated / تبدیلی کامیاب' : 'Tenant Registered / اندراج کامیاب',
          text: editingTenant
            ? 'Tenant details have been updated successfully in the system.'
            : 'New tenant has been registered successfully.',
          confirmButtonText: 'Perfect / بہترین'
        });
      }
    } else {
      const errMsg = 'Operation failed due to database or duplicate values.';
      setFormError(errMsg);
      if (onShowAlert) {
        onShowAlert({
          type: 'error',
          title: 'Saving Failed / محفوظ کرنے میں ناکامی',
          text: 'Database operation failed. Please verify connection and ensure there are no duplicates.\nڈیٹا بیس میں محفوظ کرنے میں ناکامی ہوئی۔',
          confirmButtonText: 'Try Again / دوبارہ کوشش کریں'
        });
      }
    }
  };

  // Searching & Filtering
  const filteredTenants = tenants.filter(t => {
    const apt = apartments.find(a => a.id === t.apartmentId);
    const bldg = apt ? buildings.find(b => b.id === apt.buildingId) : null;
    
    const matchesSearch = 
      t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.cnic.includes(searchTerm) ||
      t.mobileNumber.includes(searchTerm) ||
      (apt && apt.number.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesBuilding = filterBuildingId === 'all' || (bldg && bldg.id === filterBuildingId);
    
    let matchesStatus = true;
    if (filterStatus === 'active') matchesStatus = t.active;
    if (filterStatus === 'inactive') matchesStatus = !t.active;

    return matchesSearch && matchesBuilding && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('Tenant Directory / کرایہ داروں کی فہرست')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {t('Store and review lease agreements, CNICs, and emergency info / معاہدے، شناختی کارڈز اور ایمرجنسی نمبرز کا ریکارڈ')}
          </p>
        </div>
        {!isReadOnly && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 transition-colors text-white py-2 px-4 rounded-xl text-sm font-semibold cursor-pointer shadow-lg shadow-emerald-500/10"
          >
            <Plus className="w-4 h-4" />
            {t('Register Tenant / کرایہ دار کا اندراج')}
          </button>
        )}
      </div>

      {/* Filter panel */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, CNIC, phone number or house..."
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-4 pl-10 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterBuildingId}
              onChange={(e) => setFilterBuildingId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Buildings</option>
              {buildings.map(b => (
                <option key={b.id} value={b.id}>{b.name.replace(/\s*\(Building\s+\w+\)/i, '')}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Tenants</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTenants.map((t) => {
          const apt = apartments.find(a => a.id === t.apartmentId);
          const bldg = apt ? buildings.find(b => b.id === apt.buildingId) : null;

          return (
            <div
              key={t.id}
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <img 
                    src={t.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'} 
                    alt={t.fullName}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 dark:border-slate-700"
                  />
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-1">
                      {t.fullName}
                    </h3>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      CNIC: {t.cnic}
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-50 dark:border-slate-700/50 pt-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">House:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {bldg ? bldg.name.replace(/\s*\(Building\s+\w+\)/i, '') : 'None'} - {apt ? apt.number : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mobile:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">
                      {t.mobileNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lease Ends:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">
                      {t.endDate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-50 dark:border-slate-700/50 flex items-center justify-between">
                <span className={`text-[9px] font-bold py-0.5 px-2 rounded-full uppercase ${
                  t.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                }`}>
                  {t.active ? 'Active' : 'Inactive'}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedTenant(t)}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-900/80 border border-slate-100 dark:border-slate-800 text-slate-500 hover:text-indigo-500 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {!isReadOnly && (
                    <>
                      <button
                        onClick={() => openEditModal(t)}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-900/80 border border-slate-100 dark:border-slate-800 text-slate-500 hover:text-indigo-500 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${t.fullName}?`)) {
                              onDeleteTenant(t.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-900/80 border border-slate-100 dark:border-slate-800 text-slate-500 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredTenants.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No tenants found</h3>
            <p className="text-slate-400 text-xs mt-1">Adjust search terms or filters and retry.</p>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      <>
        {selectedTenant && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto sm:items-center">
            <div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl border border-slate-100 dark:border-slate-700 shadow-2xl relative my-4 sm:my-8 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedTenant(null)} 
                className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col md:flex-row gap-6">
                {/* Photo & Basic stats */}
                <div className="w-full md:w-1/3 text-center md:border-r border-slate-100 dark:border-slate-700/50 md:pr-6">
                  <img 
                    src={selectedTenant.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'} 
                    alt={selectedTenant.fullName}
                    referrerPolicy="no-referrer"
                    className="w-28 h-28 rounded-2xl object-cover mx-auto border-4 border-slate-100 dark:border-slate-700 shadow-sm"
                  />
                  <h3 className="font-extrabold text-slate-800 dark:text-white mt-4 text-lg">
                    {selectedTenant.fullName}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1 font-mono">{selectedTenant.cnic}</p>
                  
                  <div className="mt-5 p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-left">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Lease Terms</span>
                    <div className="space-y-1.5 mt-2 text-xs">
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Security:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">PKR {selectedTenant.securityDeposit.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Advance Rent:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">PKR {selectedTenant.advanceRent.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Extensive Details */}
                <div className="flex-1 space-y-5">
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Personal Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2"><Plus className="w-4 h-4 text-slate-400 shrink-0" /> Father Name: <span className="font-semibold">{selectedTenant.fatherName || 'N/A'}</span></div>
                      <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400 shrink-0" /> Mobile: <span className="font-semibold font-mono">{selectedTenant.mobileNumber}</span></div>
                      <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400 shrink-0" /> WhatsApp: <span className="font-semibold font-mono">{selectedTenant.whatsAppNumber}</span></div>
                      <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400 shrink-0" /> Email: <span className="font-semibold">{selectedTenant.email || 'N/A'}</span></div>
                      <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-400 shrink-0" /> Occupation: <span className="font-semibold">{selectedTenant.occupation || 'N/A'}</span></div>
                      <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-slate-400 shrink-0" /> Income: <span className="font-semibold font-mono">PKR {selectedTenant.monthlyIncome.toLocaleString()}</span></div>
                      <div className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-400 shrink-0" /> Family Size: <span className="font-semibold">{selectedTenant.familyMembers}</span></div>
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400 shrink-0" /> Lease Span: <span className="font-semibold font-mono">{selectedTenant.startDate} to {selectedTenant.endDate}</span></div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Addresses & Contacts</h4>
                    <div className="mt-2.5 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                      <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" /> <span>Permanent: <span className="font-semibold">{selectedTenant.permanentAddress || 'N/A'}</span></span></div>
                      <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" /> <span>Emergency Contact: <span className="font-semibold">{selectedTenant.emergencyContact || 'N/A'}</span></span></div>
                    </div>
                  </div>

                  {selectedTenant.notes && (
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Special Notes</h4>
                      <p className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl mt-2 text-xs italic text-slate-500 dark:text-slate-400">
                        {selectedTenant.notes}
                      </p>
                    </div>
                  )}

                  {/* Documents Section */}
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Scanned Documents & Attachments</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { label: 'CNIC Front', url: selectedTenant.cnicFrontUrl },
                        { label: 'CNIC Back', url: selectedTenant.cnicBackUrl },
                        { label: 'Agreement Contract', url: selectedTenant.agreementScanUrl }
                      ].map((doc, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl text-center flex flex-col justify-between">
                          <span className="text-[10px] text-slate-400 block font-semibold truncate">{doc.label}</span>
                          <div className="my-2 flex items-center justify-center">
                            {doc.url ? (
                              doc.url.startsWith('data:') ? (
                                <img src={doc.url} alt={doc.label} className="w-12 h-12 object-cover rounded border border-slate-200" />
                              ) : (
                                <ImageIcon className="w-8 h-8 text-indigo-400" />
                              )
                            ) : (
                              <FileText className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                            )}
                          </div>
                          {doc.url ? (
                            <a 
                              href={doc.url} 
                              download={`${selectedTenant.fullName.replace(/\s+/g, '_')}_${doc.label.replace(/\s+/g, '_')}`}
                              className="text-[10px] text-emerald-500 hover:underline cursor-pointer block font-semibold"
                            >
                              Download File
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400 block">Not uploaded</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>

      {/* FORM MODAL */}
      <>
        {showFormModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto sm:items-center">
            <div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl border border-slate-100 dark:border-slate-700 shadow-2xl relative my-4 sm:my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/50">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {editingTenant ? 'Edit Registered Tenant' : 'Register New Tenant'}
                </h3>
                <button onClick={() => setShowFormModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-rose-300 text-xs">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Photo upload row */}
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl">
                  <img src={photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'} alt="Preview" className="w-14 h-14 rounded-full object-cover border-2 border-slate-200" />
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Tenant Profile Photo</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setPhotoUrl)}
                      className="text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-slate-800 dark:file:text-slate-300 file:cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Muhammad Ali Khan"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider mb-1">Father Name</label>
                    <input
                      type="text"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      placeholder="Sajjad Ali"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider mb-1">CNIC Number *</label>
                    <input
                      type="text"
                      required
                      value={cnic}
                      onChange={(e) => setCnic(e.target.value)}
                      placeholder="37405-1234567-9"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider mb-1">Mobile Number *</label>
                    <input
                      type="text"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="0300-1234567"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-xs focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider mb-1">WhatsApp Number</label>
                    <input
                      type="text"
                      value={whatsAppNumber}
                      onChange={(e) => setWhatsAppNumber(e.target.value)}
                      placeholder="0300-1234567"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-xs focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ali@gmail.com"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider mb-1">Occupation</label>
                    <input
                      type="text"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      placeholder="Software Engineer"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider mb-1">Monthly Income (PKR)</label>
                    <input
                      type="number"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-xs focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider mb-1">Permanent Address</label>
                    <input
                      type="text"
                      value={permanentAddress}
                      onChange={(e) => setPermanentAddress(e.target.value)}
                      placeholder="House 123, Block 2, Faisalabad"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider mb-1">Emergency Contact Info</label>
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="0333-1234567 (Brother Sajid)"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider mb-1">Apartment Assigned *</label>
                    <select
                      value={apartmentId}
                      onChange={(e) => setApartmentId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-xs focus:outline-none"
                    >
                      <option value="">-- Choose Unit --</option>
                      {apartments.map(apt => {
                        const bldg = buildings.find(b => b.id === apt.buildingId);
                        const isThisApt = apt.id === editingTenant?.apartmentId;
                        const label = `${bldg ? bldg.name.replace(/\s*\(Building\s+\w+\)/i, '') : ''} - ${apt.number} (${apt.status})`;
                        return (
                          <option key={apt.id} value={apt.id} disabled={apt.status === 'Occupied' && !isThisApt}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider mb-1">Security Deposit *</label>
                    <input
                      type="number"
                      value={securityDeposit}
                      onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider mb-1">Advance Rent Paid</label>
                    <input
                      type="number"
                      value={advanceRent}
                      onChange={(e) => setAdvanceRent(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider mb-1">Contract Start Date *</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider mb-1">Contract End Date *</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Scans file inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase mb-1">CNIC Front Scan</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setCnicFrontUrl)}
                      className="text-[9px] text-slate-500 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase mb-1">CNIC Back Scan</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setCnicBackUrl)}
                      className="text-[9px] text-slate-500 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase mb-1">Agreement Scan</label>
                    <input 
                      type="file" 
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, setAgreementScanUrl)}
                      className="text-[9px] text-slate-500 w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider mb-1">Lease Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter any administrative or cooperative remarks..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-xs resize-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="tenant-active"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <label htmlFor="tenant-active" className="text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider">
                    Mark lease contract as active
                  </label>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="py-2 px-4 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10"
                  >
                    <Check className="w-4 h-4" />
                    {editingTenant ? 'Update Lease' : 'Register Lease'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>

    </div>
  );
}
