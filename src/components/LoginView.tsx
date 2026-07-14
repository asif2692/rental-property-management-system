import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldAlert, Lock, User as UserIcon, UserCheck, ShieldCheck, UserPlus, CreditCard } from 'lucide-react';
import { User, UserRole, Tenant } from '../types';
import { useTranslation } from '../utils/language';

interface LoginViewProps {
  tenants: Tenant[];
  onLoginSuccess: (user: User) => void;
}

export default function LoginView({ tenants, onLoginSuccess }: LoginViewProps) {
  const { t, language, setLanguage } = useTranslation();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  
  // Sign In States
  const [signInUsername, setSignInUsername] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInRole, setSignInRole] = useState<UserRole>('admin');

  // Sign Up States
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpRole, setSignUpRole] = useState<UserRole>('tenant');
  const [signUpCnic, setSignUpCnic] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Registered users state
  const [registeredUsers, setRegisteredUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('rm_registered_users');
    if (saved) return JSON.parse(saved);
    return [];
  });

  // Keep localStorage synced
  useEffect(() => {
    localStorage.setItem('rm_registered_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  const cleanCNIC = (val: string) => val.replace(/[^0-9]/g, '');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    setTimeout(() => {
      const u = signInUsername.trim().toLowerCase();
      
      // Look for user in registered users list
      const matchedUser = registeredUsers.find(
        usr => usr.username.toLowerCase() === u && usr.password === signInPassword
      );

      if (matchedUser) {
        onLoginSuccess(matchedUser);
      } else {
        setError('یوزر نیم یا پاسورڈ درست نہیں ہے۔ دوبارہ کوشش کریں۔\nInvalid username or password credentials.');
      }
      setIsLoading(false);
    }, 600);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!signUpUsername.trim() || !signUpPassword) {
      setError('براہ کرم تمام فیلڈز پُر کریں۔\nPlease fill in all fields.');
      return;
    }

    const u = signUpUsername.trim().toLowerCase();

    // Check if username already exists
    if (registeredUsers.some(usr => usr.username.toLowerCase() === u)) {
      setError('یہ یوزر نیم پہلے سے موجود ہے۔\nUsername already exists.');
      return;
    }

    // Validation for Tenant role (NIC check)
    let finalFullName = signUpFullName.trim();
    let linkedCnic = '';

    if (signUpRole === 'tenant') {
      const enteredCnicClean = cleanCNIC(signUpCnic);
      if (!enteredCnicClean) {
        setError('کرایہ دار کے لیے شناختی کارڈ نمبر درج کرنا لازمی ہے۔\nCNIC is required for tenant registration.');
        return;
      }

      // Find tenant in registered tenants list
      const matchedTenant = tenants.find(t => cleanCNIC(t.cnic) === enteredCnicClean);

      if (!matchedTenant) {
        setError(
          'یہ شناختی کارڈ نمبر کرایہ داروں کے ریکارڈ میں نہیں ملا۔ برائے مہربانی پہلے ایڈمن سے رابطہ کریں۔\nThis CNIC is not registered in our tenants database. Please contact Admin/Landlord first.'
        );
        return;
      }

      finalFullName = `${matchedTenant.fullName} (کرایہ دار)`;
      linkedCnic = matchedTenant.cnic;
    }

    if (signUpRole === 'landlord' && !finalFullName) {
      finalFullName = 'Landlord / مالک مکان';
    }

    if (signUpRole === 'admin' && !finalFullName) {
      finalFullName = 'Admin User';
    }

    const newUser: User = {
      username: signUpUsername.trim(),
      password: signUpPassword,
      role: signUpRole,
      fullName: finalFullName,
      cnic: signUpRole === 'tenant' ? linkedCnic : undefined,
    };

    setRegisteredUsers(prev => [...prev, newUser]);
    setSuccess('اکاؤنٹ کامیابی کے ساتھ رجسٹر ہو گیا ہے! اب آپ لاگ ان کر سکتے ہیں۔\nAccount registered successfully! You can now log in.');
    
    // Switch to Sign In tab and autofill
    setTimeout(() => {
      setActiveTab('signin');
      setSignInUsername(newUser.username);
      setSignInPassword(newUser.password || '');
      setSignInRole(newUser.role);
      setSuccess('');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Language Switcher in Login Page */}
      <div className="absolute top-4 right-4 flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px] font-extrabold shadow-inner z-20">
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
            language === 'en' 
              ? 'bg-indigo-600 text-white shadow-xs' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => setLanguage('ur')}
          className={`px-2.5 py-1 rounded-md transition-all font-sans cursor-pointer ${
            language === 'ur' 
              ? 'bg-indigo-600 text-white shadow-xs' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          اردو
        </button>
      </div>

      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-90" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-lg bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-8 shadow-2xl z-10 transition-all">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600/10 text-indigo-400 rounded-2xl border border-indigo-500/20 mb-4 shadow-inner">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            Rental Elite Portal
          </h2>
          <p className="text-slate-400 text-xs mt-2 font-medium">
            {t('Admin • Landlord • Tenant / ایڈمن • مالک مکان • کرایہ دار')}
          </p>
        </div>

        {/* First-time setup notice */}
        {registeredUsers.length === 0 && (
          <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 text-xs text-center">
            <div className="font-bold mb-1">{t('First time setup? Sign up as Admin first! / پہلی بار استعمال کر رہے ہیں؟ پہلے ایڈمن کے طور پر سائن اپ کریں!')}</div>
            <p className="opacity-90">{t('Create your Admin account first, then you can add tenants later. / پہلے اپنا ایڈمن اکاؤنٹ بنائیں، پھر بعد میں کرایہ دار بنا سکتے ہیں۔')}</p>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => { setActiveTab('signin'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'signin'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            {t('Sign In / لاگ ان')}
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('signup'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'signup'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            {t('Sign Up / نیا اکاؤنٹ بنائیں')}
          </button>
        </div>

        {/* Error or Success notification */}
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-300 text-xs whitespace-pre-line transition-all">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{t(error)}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-emerald-300 text-xs whitespace-pre-line transition-all">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{t(success)}</span>
          </div>
        )}

        {activeTab === 'signin' ? (
          /* ================= SIGN IN FORM ================= */
          <form onSubmit={handleSignIn} className="space-y-5">
            <div>
              <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2 flex justify-between">
                <span>{t('System Role / کردار')}</span>
                <span className="text-indigo-400 text-[10px]">{t('Select role for login / لاگ ان کے لیے کردار منتخب کریں')}</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { r: 'admin', label: 'Admin', urdu: 'ایڈمن' },
                  { r: 'landlord', label: 'Landlord', urdu: 'مالک مکان' },
                  { r: 'tenant', label: 'Tenant', urdu: 'کرایہ دار' },
                ].map(({ r, label, urdu }) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setSignInRole(r as UserRole);
                      setSignInUsername('');
                      setSignInPassword('');
                    }}
                    className={`py-2.5 px-3 rounded-lg border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      signInRole === r 
                        ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40 font-bold' 
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="text-xs">{t(`${label} / ${urdu}`)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">
                {t('Username / یوزر نیم')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={signInUsername}
                  onChange={(e) => setSignInUsername(e.target.value)}
                  placeholder={t('Enter login username / یوزر نیم درج کریں')}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/80 focus:border-indigo-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">
                {t('Password / پاسورڈ')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/80 focus:border-indigo-500 transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <span className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  {t('Sign In Securely / محفوظ لاگ ان کریں')}
                </>
              )}
            </button>
          </form>
        ) : (
          /* ================= SIGN UP FORM ================= */
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">
                {t('Select Signup Role / کردار منتخب کریں')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { r: 'admin', label: 'Admin', urdu: 'ایڈمن' },
                  { r: 'landlord', label: 'Landlord', urdu: 'مالک مکان' },
                  { r: 'tenant', label: 'Tenant', urdu: 'کرایہ دار' },
                ].map(({ r, label, urdu }) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSignUpRole(r as UserRole)}
                    className={`py-2.5 px-3 rounded-lg border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      signUpRole === r 
                        ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40 font-bold' 
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="text-xs">{t(`${label} / ${urdu}`)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5">
                {t('Username / یوزر نیم')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={signUpUsername}
                  onChange={(e) => setSignUpUsername(e.target.value)}
                  placeholder={t('Choose unique username / منفرد یوزر نیم منتخب کریں')}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/80 focus:border-indigo-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5">
                {t('Password / پاسورڈ')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder={t('Enter secure password / محفوظ پاسورڈ درج کریں')}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/80 focus:border-indigo-500 transition-all font-mono"
                />
              </div>
            </div>

            {signUpRole !== 'tenant' ? (
              <div>
                <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5">
                  {t('Full Name / پورا نام')}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required={signUpRole !== 'tenant'}
                    value={signUpFullName}
                    onChange={(e) => setSignUpFullName(e.target.value)}
                    placeholder={t('Enter full name / پورا نام درج کریں')}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/80 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            ) : (
              <div
                className="space-y-1.5"
              >
                <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider flex justify-between">
                  <span>{t('NIC / CNIC Number / شناختی کارڈ نمبر')}</span>
                  <span className="text-amber-400 font-semibold text-[10px]">{t('Required Verification / لازمی تصدیق')}</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                    <CreditCard className="w-4 h-4 text-amber-500" />
                  </span>
                  <input
                    type="text"
                    required
                    value={signUpCnic}
                    onChange={(e) => setSignUpCnic(e.target.value)}
                    placeholder="e.g. 35201-1234567-1"
                    className="w-full bg-slate-950 border border-amber-950/50 text-white rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/80 focus:border-amber-500 transition-all font-mono"
                  />
                </div>
                <p className="text-[10px] text-amber-400/90 leading-relaxed pt-1">
                  {t('* To register a tenant account, enter the CNIC that your landlord has registered. Your details will be automatically matched. / * کرایہ دار کا اکاؤنٹ بنانے کے لیے وہ شناختی کارڈ نمبر لکھیں جو مالک مکان نے درج کیا ہوا ہے۔ نام خود بخود ڈیٹا بیس سے مل جائے گا۔')}
                </p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 mt-4"
            >
              <UserPlus className="w-4 h-4" />
              {t('Register New Account / اکاؤنٹ رجسٹر کریں')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
