import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Users, Receipt, CalendarClock, FileBarChart, 
  Settings, LogOut, Sun, Moon, Database, Clock, ShieldAlert,
  Menu, X
} from 'lucide-react';

import { 
  Building, Floor, Apartment, Tenant, RentPayment, 
  RentIncreaseHistory, ActivityLog, UserRole, User 
} from './types';

import { 
  isSupabaseConfigured, 
  fetchAllFromSupabase, 
  dbUpsertBuilding, 
  dbDeleteBuilding, 
  dbUpsertFloor, 
  dbDeleteFloor, 
  dbUpsertApartment, 
  dbDeleteApartment, 
  dbUpsertTenant, 
  dbDeleteTenant, 
  dbUpsertPayment, 
  dbDeletePayment, 
  dbUpsertLog 
} from './lib/supabase';

import { 
  INITIAL_BUILDINGS, INITIAL_FLOORS, INITIAL_APARTMENTS, 
  INITIAL_TENANTS, INITIAL_PAYMENTS, INITIAL_RENT_INCREASES, 
  INITIAL_AUDIT_LOGS 
} from './data/mockData';

import { 
  computeSystemMetrics, getBuildingWiseIncome, getMonthlyCollectionTrend 
} from './utils/calculations';

import { useTranslation, translateText } from './utils/language';

// Views
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import BuildingView from './components/BuildingView';
import TenantView from './components/TenantView';
import RentView from './components/RentView';
import RentDueView from './components/RentDueView';
import ReportView from './components/ReportView';
import ExtraFeaturesView from './components/ExtraFeaturesView';
import TenantPortalView from './components/TenantPortalView';
import { SweetAlert, SweetAlertOptions } from './components/SweetAlert';

type TabType = 'dashboard' | 'properties' | 'tenants' | 'rent' | 'due' | 'reports' | 'extra' | 'tenant-portal';

export default function App() {
  const { language, setLanguage, t } = useTranslation();

  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('rm_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Dark Mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('rm_dark_mode');
    return saved === 'true';
  });

  // Main application state with LocalStorage/Supabase conditional initial state
  const [buildings, setBuildings] = useState<Building[]>(() => {
    if (isSupabaseConfigured()) return [];
    const saved = localStorage.getItem('rm_buildings');
    return saved ? JSON.parse(saved) : INITIAL_BUILDINGS;
  });

  const [floors, setFloors] = useState<Floor[]>(() => {
    if (isSupabaseConfigured()) return [];
    const saved = localStorage.getItem('rm_floors');
    return saved ? JSON.parse(saved) : INITIAL_FLOORS;
  });

  const [apartments, setApartments] = useState<Apartment[]>(() => {
    if (isSupabaseConfigured()) return [];
    const saved = localStorage.getItem('rm_apartments');
    return saved ? JSON.parse(saved) : INITIAL_APARTMENTS;
  });

  const [tenants, setTenants] = useState<Tenant[]>(() => {
    if (isSupabaseConfigured()) return [];
    const saved = localStorage.getItem('rm_tenants');
    return saved ? JSON.parse(saved) : INITIAL_TENANTS;
  });

  const [payments, setPayments] = useState<RentPayment[]>(() => {
    if (isSupabaseConfigured()) return [];
    const saved = localStorage.getItem('rm_payments');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [increaseHistory, setIncreaseHistory] = useState<RentIncreaseHistory[]>(() => {
    if (isSupabaseConfigured()) return [];
    const saved = localStorage.getItem('rm_increase_history');
    return saved ? JSON.parse(saved) : INITIAL_RENT_INCREASES;
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    if (isSupabaseConfigured()) return [];
    const saved = localStorage.getItem('rm_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [isDbLoading, setIsDbLoading] = useState<boolean>(() => isSupabaseConfigured());
  const [dbSyncError, setDbSyncError] = useState<{ context: string; message: string; details?: string; hint?: string } | null>(null);

  // SweetAlert state and trigger
  const [alertOptions, setAlertOptions] = useState<SweetAlertOptions | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const showAlert = (options: SweetAlertOptions) => {
    setAlertOptions(options);
    setIsAlertOpen(true);
  };

  // Custom Event Listener to catch database sync warnings
  useEffect(() => {
    const handleSyncError = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setDbSyncError(customEvent.detail);
        showAlert({
          type: 'error',
          title: 'Database Sync Error / ڈیٹا بیس کی خرابی',
          text: `There was a problem syncing data with Supabase.\n\nContext: ${customEvent.detail.context}\nMessage: ${customEvent.detail.message}\n\n* Please make sure RLS is disabled or required columns exist.`,
          confirmButtonText: 'Understood / سمجھ گیا'
        });
      }
    };
    window.addEventListener('supabase-db-error', handleSyncError);
    return () => window.removeEventListener('supabase-db-error', handleSyncError);
  }, []);

  // Load from Supabase on mount
  useEffect(() => {
    async function loadData() {
      if (isSupabaseConfigured()) {
        try {
          const data = await fetchAllFromSupabase();
          if (data) {
            setBuildings(data.buildings);
            setFloors(data.floors);
            setApartments(data.apartments);
            setTenants(data.tenants);
            setPayments(data.payments);
            setLogs(data.logs);
          }
        } catch (err) {
          console.error("Failed loading Supabase tables:", err);
        } finally {
          setIsDbLoading(false);
        }
      } else {
        setIsDbLoading(false);
      }
    }
    loadData();
  }, []);

  // Current selected tab
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Time-ticking clock for header status bar
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync state back to local storage
  useEffect(() => {
    localStorage.setItem('rm_buildings', JSON.stringify(buildings));
    localStorage.setItem('rm_floors', JSON.stringify(floors));
    localStorage.setItem('rm_apartments', JSON.stringify(apartments));
    localStorage.setItem('rm_tenants', JSON.stringify(tenants));
    localStorage.setItem('rm_payments', JSON.stringify(payments));
    localStorage.setItem('rm_increase_history', JSON.stringify(increaseHistory));
    localStorage.setItem('rm_logs', JSON.stringify(logs));
  }, [buildings, floors, apartments, tenants, payments, increaseHistory, logs]);

  // Dark Mode class toggler
  useEffect(() => {
    localStorage.setItem('rm_dark_mode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auth Success helper
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('rm_current_user', JSON.stringify(user));
    addLog('USER_LOGIN', `Successfully validated user session: ${user.username} (${user.role})`);
    if (user.role === 'tenant') {
      setActiveTab('tenant-portal');
    } else {
      setActiveTab('dashboard');
    }
  };

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'tenant') {
        setActiveTab('tenant-portal');
      } else if (activeTab === 'tenant-portal') {
        setActiveTab('dashboard');
      }
    }
  }, [currentUser]);

  const handleLogout = () => {
    if (currentUser) {
      addLog('USER_LOGOUT', `User terminated session: ${currentUser.username}`);
    }
    setCurrentUser(null);
    localStorage.removeItem('rm_current_user');
  };

  // Activity Log Creator
  const addLog = (action: string, details: string) => {
    const newLog: ActivityLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      username: currentUser?.username || 'SYSTEM',
      role: currentUser?.role || 'admin',
      action,
      details
    };
    setLogs(prev => {
      const updated = [newLog, ...prev];
      if (isSupabaseConfigured()) {
        dbUpsertLog(newLog).catch(err => console.error("Log sync failed:", err));
      }
      return updated;
    });
  };

  // Security Role Check Helper
  const isAdminOrLandlord = (role?: string) => role === 'admin' || role === 'landlord';

  // 1. BUILDING CRUD
  const handleAddBuilding = (b: Omit<Building, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newB: Building = { id, ...b };
    setBuildings(prev => {
      const updated = [...prev, newB];
      if (isSupabaseConfigured()) {
        dbUpsertBuilding(newB).catch(err => console.error("Building insert failed:", err));
      }
      return updated;
    });
    addLog('CREATE_BUILDING', `Constructed new building entity: "${b.name}" at ${b.address}`);
  };

  const handleUpdateBuilding = (b: Building) => {
    setBuildings(prev => {
      const updated = prev.map(item => item.id === b.id ? b : item);
      if (isSupabaseConfigured()) {
        dbUpsertBuilding(b).catch(err => console.error("Building update failed:", err));
      }
      return updated;
    });
    addLog('UPDATE_BUILDING', `Modified building details: "${b.name}"`);
  };

  const handleDeleteBuilding = (id: string) => {
    if (!isAdminOrLandlord(currentUser?.role)) return;
    const deleted = buildings.find(b => b.id === id);
    setBuildings(prev => {
      const updated = prev.filter(item => item.id !== id);
      if (isSupabaseConfigured()) {
        dbDeleteBuilding(id).catch(err => console.error("Building delete failed:", err));
      }
      return updated;
    });
    // Orphan associated floors & apartments
    setFloors(prev => {
      const updated = prev.filter(f => f.buildingId !== id);
      return updated;
    });
    setApartments(prev => {
      const updated = prev.filter(a => a.buildingId !== id);
      return updated;
    });
    addLog('DELETE_BUILDING', `Demolished building structure: "${deleted?.name || 'Unknown'}" and deleted floors/apartments inside.`);
  };

  // 2. FLOOR CRUD
  const handleAddFloor = (f: Omit<Floor, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newF: Floor = { id, ...f };
    setFloors(prev => {
      const updated = [...prev, newF];
      if (isSupabaseConfigured()) {
        dbUpsertFloor(newF).catch(err => console.error("Floor insert failed:", err));
      }
      return updated;
    });
    const bName = buildings.find(b => b.id === f.buildingId)?.name || '';
    addLog('CREATE_FLOOR', `Added floor level "${f.name}" to building "${bName}"`);
  };

  const handleUpdateFloor = (f: Floor) => {
    setFloors(prev => {
      const updated = prev.map(item => item.id === f.id ? f : item);
      if (isSupabaseConfigured()) {
        dbUpsertFloor(f).catch(err => console.error("Floor update failed:", err));
      }
      return updated;
    });
    addLog('UPDATE_FLOOR', `Updated floor level attributes: "${f.name}"`);
  };

  const handleDeleteFloor = (id: string) => {
    if (!isAdminOrLandlord(currentUser?.role)) return;
    const deleted = floors.find(f => f.id === id);
    setFloors(prev => {
      const updated = prev.filter(item => item.id !== id);
      if (isSupabaseConfigured()) {
        dbDeleteFloor(id).catch(err => console.error("Floor delete failed:", err));
      }
      return updated;
    });
    setApartments(prev => prev.filter(a => a.floorId !== id));
    addLog('DELETE_FLOOR', `Removed floor level "${deleted?.name || 'Unknown'}" and units inside.`);
  };

  // 3. APARTMENT CRUD
  const handleAddApartment = (a: Omit<Apartment, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newA: Apartment = { id, ...a };
    setApartments(prev => {
      const updated = [...prev, newA];
      if (isSupabaseConfigured()) {
        dbUpsertApartment(newA).catch(err => console.error("Apartment insert failed:", err));
      }
      return updated;
    });
    addLog('CREATE_APARTMENT', `Created apartment listing "${a.number}" with rate PKR ${a.monthlyRent.toLocaleString()}`);
  };

  const handleUpdateApartment = (a: Apartment) => {
    setApartments(prev => {
      const updated = prev.map(item => item.id === a.id ? a : item);
      if (isSupabaseConfigured()) {
        dbUpsertApartment(a).catch(err => console.error("Apartment update failed:", err));
      }
      return updated;
    });
    addLog('UPDATE_APARTMENT', `Modified apartment listing: "${a.number}"`);
  };

  const handleDeleteApartment = (id: string) => {
    if (!isAdminOrLandlord(currentUser?.role)) return;
    const deleted = apartments.find(a => a.id === id);
    setApartments(prev => {
      const updated = prev.filter(item => item.id !== id);
      if (isSupabaseConfigured()) {
        dbDeleteApartment(id).catch(err => console.error("Apartment delete failed:", err));
      }
      return updated;
    });
    addLog('DELETE_APARTMENT', `Deleted apartment listing "${deleted?.number || 'Unknown'}"`);
  };

  // 4. TENANT CRUD
  const handleAddTenant = (t: Omit<Tenant, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newT: Tenant = { id, ...t };
    setTenants(prev => {
      const updated = [...prev, newT];
      if (isSupabaseConfigured()) {
        dbUpsertTenant(newT).catch(err => console.error("Tenant insert failed:", err));
      }
      return updated;
    });

    // Update apartment status to occupied if lease active
    if (t.active) {
      setApartments(prev => {
        const updated = prev.map(a => {
          if (a.id === t.apartmentId) {
            const upA: Apartment = { ...a, status: 'Occupied' };
            if (isSupabaseConfigured()) {
              dbUpsertApartment(upA).catch(err => console.error("Apartment status sync failed:", err));
            }
            return upA;
          }
          return a;
        });
        return updated;
      });
    }

    addLog('REGISTER_TENANT', `Registered tenant lease for "${t.fullName}" at Unit: "${apartments.find(a => a.id === t.apartmentId)?.number}"`);
    return true;
  };

  const handleUpdateTenant = (t: Tenant) => {
    // Check original state
    const original = tenants.find(item => item.id === t.id);
    setTenants(prev => {
      const updated = prev.map(item => item.id === t.id ? t : item);
      if (isSupabaseConfigured()) {
        dbUpsertTenant(t).catch(err => console.error("Tenant update failed:", err));
      }
      return updated;
    });

    // Handle apartment occupancy changes
    if (t.active) {
      // Free up old apartment if changed
      if (original && original.apartmentId !== t.apartmentId) {
        setApartments(prev => {
          const updated = prev.map(a => {
            if (a.id === original.apartmentId) {
              const upA: Apartment = { ...a, status: 'Vacant' };
              if (isSupabaseConfigured()) {
                dbUpsertApartment(upA).catch(err => console.error("Old apartment vacate failed:", err));
              }
              return upA;
            }
            return a;
          });
          return updated;
        });
      }
      setApartments(prev => {
        const updated = prev.map(a => {
          if (a.id === t.apartmentId) {
            const upA: Apartment = { ...a, status: 'Occupied' };
            if (isSupabaseConfigured()) {
              dbUpsertApartment(upA).catch(err => console.error("New apartment occupy failed:", err));
            }
            return upA;
          }
          return a;
        });
        return updated;
      });
    } else {
      setApartments(prev => {
        const updated = prev.map(a => {
          if (a.id === t.apartmentId) {
            const upA: Apartment = { ...a, status: 'Vacant' };
            if (isSupabaseConfigured()) {
              dbUpsertApartment(upA).catch(err => console.error("Apartment vacate failed:", err));
            }
            return upA;
          }
          return a;
        });
        return updated;
      });
    }

    addLog('UPDATE_TENANT', `Updated tenant lease metrics for: "${t.fullName}"`);
    return true;
  };

  const handleDeleteTenant = (id: string) => {
    if (!isAdminOrLandlord(currentUser?.role)) return;
    const deleted = tenants.find(t => t.id === id);
    setTenants(prev => {
      const updated = prev.filter(item => item.id !== id);
      if (isSupabaseConfigured()) {
        dbDeleteTenant(id).catch(err => console.error("Tenant delete failed:", err));
      }
      return updated;
    });
    
    // Free up apartment
    if (deleted) {
      setApartments(prev => {
        const updated = prev.map(a => {
          if (a.id === deleted.apartmentId) {
            const upA: Apartment = { ...a, status: 'Vacant' };
            if (isSupabaseConfigured()) {
              dbUpsertApartment(upA).catch(err => console.error("Tenant vacate apartment failed:", err));
            }
            return upA;
          }
          return a;
        });
        return updated;
      });
    }

    addLog('DELETE_TENANT', `De-registered tenant profile: "${deleted?.fullName || 'Unknown'}"`);
  };

  // 5. RENT COLLECTION CRUD
  const handleRecordPayment = (p: Omit<RentPayment, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newP: RentPayment = { id, ...p };
    setPayments(prev => {
      const updated = [newP, ...prev];
      if (isSupabaseConfigured()) {
        dbUpsertPayment(newP).catch(err => console.error("Payment sync failed:", err));
      }
      return updated;
    });

    const tenantName = tenants.find(t => t.id === p.tenantId)?.fullName || '';
    addLog('RECORD_RENT_PAYMENT', `Logged PKR ${p.amount.toLocaleString()} receipt from "${tenantName}" for Month ${p.rentMonth}/${p.rentYear}`);
  };

  const handleDeletePayment = (id: string) => {
    if (!isAdminOrLandlord(currentUser?.role)) return;
    const deleted = payments.find(p => p.id === id);
    setPayments(prev => {
      const updated = prev.filter(item => item.id !== id);
      if (isSupabaseConfigured()) {
        dbDeletePayment(id).catch(err => console.error("Payment delete failed:", err));
      }
      return updated;
    });
    addLog('DELETE_RENT_PAYMENT', `Deleted rent collection receipt: PKR ${deleted?.amount.toLocaleString()} logged on ${deleted?.paymentDate}`);
  };

  // 6. BUSINESS ENGINE: AUTOMATIC RENT INCREASE (YEARLY INDEXATION)
  const handleApplyRentIncrease = (tenantId: string, percentage: number, remarks: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const apt = apartments.find(a => a.id === tenant.apartmentId);
    if (!apt) return;

    const oldRent = apt.monthlyRent;
    const addedAmount = (oldRent * percentage) / 100;
    const newRent = Math.round(oldRent + addedAmount);

    // Apply base rent increase on the apartment listing
    setApartments(prev => {
      const updated = prev.map(item => {
        if (item.id === apt.id) {
          const upA: Apartment = { ...item, monthlyRent: newRent };
          if (isSupabaseConfigured()) {
            dbUpsertApartment(upA).catch(err => console.error("Rent increase sync failed:", err));
          }
          return upA;
        }
        return item;
      });
      return updated;
    });

    // Store in increase history ledger
    const newHist: RentIncreaseHistory = {
      id: Math.random().toString(36).substring(2, 9),
      tenantId,
      apartmentId: apt.id,
      oldRent,
      newRent,
      percentage,
      dateApplied: new Date().toISOString().split('T')[0],
      remarks
    };
    setIncreaseHistory(prev => [newHist, ...prev]);

    addLog('RENT_AUTOMATIC_INCREASE', `Applied ${percentage}% rent increase to "${tenant.fullName}". Rate changed from PKR ${oldRent} to ${newRent}.`);
  };

  // 7. LEASE CONTRACT RENEWALS
  const handleRenewContract = (tenantId: string, newEndDate: string, rentAmount: number) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const apt = apartments.find(a => a.id === tenant.apartmentId);
    if (!apt) return;

    // Extend contract end date on tenant
    setTenants(prev => {
      const updated = prev.map(item => {
        if (item.id === tenantId) {
          const upT: Tenant = { ...item, endDate: newEndDate };
          if (isSupabaseConfigured()) {
            dbUpsertTenant(upT).catch(err => console.error("Contract renewal sync failed:", err));
          }
          return upT;
        }
        return item;
      });
      return updated;
    });

    // Adjust monthly rent for the renewed contract
    setApartments(prev => {
      const updated = prev.map(item => {
        if (item.id === apt.id) {
          const upA: Apartment = { ...item, monthlyRent: rentAmount };
          if (isSupabaseConfigured()) {
            dbUpsertApartment(upA).catch(err => console.error("Renewal rent sync failed:", err));
          }
          return upA;
        }
        return item;
      });
      return updated;
    });

    addLog('LEASE_RENEWAL', `Renewed contract for "${tenant.fullName}" till ${newEndDate} at rate PKR ${rentAmount.toLocaleString()}`);
  };

  // 8. BACKUP & RESTORE UTILITIES
  const handleBackupState = () => {
    const fullState = {
      buildings,
      floors,
      apartments,
      tenants,
      payments,
      increaseHistory,
      logs
    };
    const blob = new Blob([JSON.stringify(fullState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rental_system_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addLog('SYSTEM_BACKUP', 'Exported database transaction logs and business states to local system.');
  };

  const handleRestoreState = (fileContent: string) => {
    if (!isAdminOrLandlord(currentUser?.role)) return false;
    try {
      const data = JSON.parse(fileContent);
      if (data.buildings) setBuildings(data.buildings);
      if (data.floors) setFloors(data.floors);
      if (data.apartments) setApartments(data.apartments);
      if (data.tenants) setTenants(data.tenants);
      if (data.payments) setPayments(data.payments);
      if (data.increaseHistory) setIncreaseHistory(data.increaseHistory);
      if (data.logs) setLogs(data.logs);

      addLog('SYSTEM_RESTORE', 'Overrode local runtime database with uploaded file state backup.');
      return true;
    } catch {
      return false;
    }
  };

  const handleClearLogs = () => {
    if (!isAdminOrLandlord(currentUser?.role)) return;
    setLogs([]);
  };

  // Render loading state while database is connecting
  if (isDbLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-indigo-500 border-r-indigo-500 rounded-full animate-spin" />
        </div>
        <h1 className="text-xl font-bold text-white mb-1.5">ڈیٹا بیس سے رابطہ قائم کیا جا رہا ہے...</h1>
        <p className="text-slate-400 text-xs">Connecting to Supabase Database & retrieving records</p>
      </div>
    );
  }

  // Redirect to login if user not validated
  if (!currentUser) {
    return (
      <LoginView 
        tenants={tenants}
        onLoginSuccess={handleLoginSuccess} 
      />
    );
  }

  // Live statistical analysis and ledger compilations (NumPy/Pandas style)
  const metrics = computeSystemMetrics(
    buildings.length,
    floors.length,
    apartments,
    tenants,
    payments,
    new Date().getMonth() + 1,
    new Date().getFullYear()
  );

  const buildingWiseIncome = getBuildingWiseIncome(
    buildings,
    apartments,
    payments,
    new Date().getFullYear()
  );

  const collectionTrend = getMonthlyCollectionTrend(
    payments,
    new Date().getFullYear()
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors flex font-sans select-none antialiased">
      
      {/* MOBILE DRAWER NAVIGATION */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            {/* Sidebar content */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-72 max-w-[80vw] bg-slate-900 dark:bg-slate-950 border-r border-slate-800 dark:border-slate-900 h-full flex flex-col justify-between p-0 text-slate-400 z-10 shadow-2xl"
            >
              <div>
                {/* Close button & Brand */}
                <div className="p-6 border-b border-slate-800 dark:border-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500 rounded-lg text-white shadow-lg shadow-indigo-500/30">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-extrabold text-white tracking-tight text-sm block">Rental Elite</span>
                      <span className="text-[10px] text-slate-500 block font-semibold">Management System</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tab lists */}
                <nav className="p-4 space-y-1">
                  {(currentUser.role === 'tenant'
                    ? [{ id: 'tenant-portal', label: 'My Rent Portal / میرا رینٹ پورٹل', icon: Receipt }]
                    : [
                        { id: 'dashboard', label: 'Dashboard / ڈیش بورڈ', icon: Building2 },
                        { id: 'properties', label: 'Properties & Houses / جائیدادیں', icon: Settings },
                        { id: 'tenants', label: 'Tenant Directory / کرایہ دار', icon: Users },
                        { id: 'rent', label: 'Rent Ledger / کرایہ کا کھاتہ', icon: Receipt },
                        { id: 'due', label: 'Due & Renewals / واجبات', icon: CalendarClock },
                        { id: 'reports', label: 'Reports & Compiler / رپورٹ', icon: FileBarChart },
                        { id: 'extra', label: 'Backup & Audit / بیک اپ اور آڈٹ', icon: Database }
                      ]
                  ).map((tab) => {
                    const isSelected = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id as any);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full text-left py-2.5 px-4 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-3 ${
                          isSelected 
                            ? 'bg-slate-800 text-white font-bold' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <tab.icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                        {t(tab.label)}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* User Identity bottom footer */}
              <div className="p-4 border-t border-slate-800 dark:border-slate-900 space-y-3 bg-slate-950/40">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center font-bold font-mono text-sm uppercase">
                    {currentUser.username.substring(0, 2)}
                  </div>
                  <div>
                    <span className="font-bold text-white block text-xs truncate max-w-[120px]">{currentUser.username}</span>
                    <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide block font-mono">
                      {t(`Role: ${currentUser.role} / عہدہ: ${currentUser.role}`)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 border border-slate-800 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all py-1.5 px-3 rounded-lg text-[10px] text-slate-400 font-bold cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {t('End Session / سیشن ختم کریں')}
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 border-r border-slate-800 dark:border-slate-900 bg-slate-900 dark:bg-slate-950 flex flex-col justify-between shrink-0 h-screen sticky top-0 hidden md:flex text-slate-400">
        <div>
          
          {/* Logo Brand */}
          <div className="p-6 border-b border-slate-800 dark:border-slate-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-lg text-white shadow-lg shadow-indigo-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-white tracking-tight text-sm block">Rental Elite</span>
              <span className="text-[10px] text-slate-500 block font-semibold">Management System</span>
            </div>
          </div>

          {/* Tab lists */}
          <nav className="p-4 space-y-1">
            {(currentUser.role === 'tenant'
              ? [{ id: 'tenant-portal', label: 'My Rent Portal / میرا رینٹ پورٹل', icon: Receipt }]
              : [
                  { id: 'dashboard', label: 'Dashboard / ڈیش بورڈ', icon: Building2 },
                  { id: 'properties', label: 'Properties & Houses / جائیدادیں', icon: Settings },
                  { id: 'tenants', label: 'Tenant Directory / کرایہ دار', icon: Users },
                  { id: 'rent', label: 'Rent Ledger / کرایہ کا کھاتہ', icon: Receipt },
                  { id: 'due', label: 'Due & Renewals / واجبات', icon: CalendarClock },
                  { id: 'reports', label: 'Reports & Compiler / رپورٹ', icon: FileBarChart },
                  { id: 'extra', label: 'Backup & Audit / بیک اپ اور آڈٹ', icon: Database }
                ]
            ).map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left py-2.5 px-4 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-3 ${
                    isSelected 
                      ? 'bg-slate-800 text-white font-bold' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                  {t(tab.label)}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Identity bottom footer */}
        <div className="p-4 border-t border-slate-800 dark:border-slate-900 space-y-3 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center font-bold font-mono text-sm uppercase">
              {currentUser.username.substring(0, 2)}
            </div>
            <div>
              <span className="font-bold text-white block text-xs truncate max-w-[120px]">{currentUser.username}</span>
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide block font-mono">
                {t(`Role: ${currentUser.role} / عہدہ: ${currentUser.role}`)}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 border border-slate-800 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all py-1.5 px-3 rounded-lg text-[10px] text-slate-400 font-bold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t('End Session / سیشن ختم کریں')}
          </button>
        </div>
      </aside>

      {/* MAIN VIEW CONTENT CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* TOP STATUS BAR HEADER */}
        <header className="bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 py-3.5 px-6 flex items-center justify-between sticky top-0 z-40">
          
          {/* Left: Clock / mobile layout launcher */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 dark:bg-slate-900 py-1 px-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2 font-mono text-xs text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>{currentTime.toLocaleTimeString()} UTC</span>
            </div>
          </div>

          {/* Center/Right controls */}
          <div className="flex items-center gap-4">
            
            {/* Language Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200/50 text-[10px] font-extrabold shadow-inner">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  language === 'en' 
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('ur')}
                className={`px-2 py-1 rounded-md transition-all font-sans cursor-pointer ${
                  language === 'ur' 
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                اردو
              </button>
            </div>

            {/* Dark Mode toggle */}
            <button
              onClick={() => setDarkMode(prev => !prev)}
              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-500 border border-slate-100 dark:border-slate-800 transition-colors cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Mobile Navigation Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 py-1.5 px-3 rounded-lg text-xs font-bold border border-indigo-100 dark:border-indigo-900/50 transition-all cursor-pointer shadow-xs"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>{t('Menu / مینیو')}</span>
            </button>

            <span className="text-[10px] font-extrabold uppercase tracking-wide bg-emerald-50 dark:bg-slate-900 text-emerald-500 border border-emerald-500/20 py-1 px-2.5 rounded-lg font-mono">
              {t(`Role: ${currentUser.role} / عہدہ: ${currentUser.role}`)}
            </span>
          </div>

        </header>

        {dbSyncError && (
          <div className="bg-rose-50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/50 py-3.5 px-6 text-rose-800 dark:text-rose-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
            <div className="flex items-start gap-2.5">
              <span className="p-1 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-lg shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">ڈیٹا بیس سنکرونائزیشن کی خرابی (Database Sync Alert):</p>
                <p className="opacity-90 mt-0.5 font-medium text-slate-700 dark:text-slate-300">
                  Supabase ڈیٹا بیس کے ساتھ رابطہ قائم کرنے یا ڈیٹا محفوظ کرنے میں مسئلہ آرہا ہے۔
                  <span className="font-mono bg-rose-100 dark:bg-rose-900/40 px-1 py-0.5 rounded text-[10px] ml-1.5 inline-block text-rose-700 dark:text-rose-300 font-bold">
                    {dbSyncError.context}: {dbSyncError.message}
                  </span>
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  * <strong>حل:</strong> براہ کرم یقینی بنائیں کہ آپ نے اپنے Supabase پروجیکٹ کے SQL Editor میں <code>/supabase_schema.sql</code> فائل میں موجود تمام کیوریز چلائی ہیں اور Row Level Security (RLS) کو غیر فعال (Disable) کیا ہوا ہے۔
                </p>
              </div>
            </div>
            <button 
              onClick={() => setDbSyncError(null)}
              className="text-[10px] uppercase tracking-wider font-extrabold text-rose-600 dark:text-rose-400 hover:underline px-2 py-1 bg-rose-100 dark:bg-rose-900/40 rounded cursor-pointer self-start md:self-auto shrink-0 transition-all"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* COMPONENT ROUTER CONTAINER */}
        <section className="p-6 max-w-7xl w-full mx-auto flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'dashboard' && (
                <DashboardView 
                  metrics={metrics}
                  tenants={tenants} 
                  apartments={apartments} 
                  payments={payments} 
                  onNavigate={(tab) => setActiveTab(tab as any)}
                  buildingWiseIncome={buildingWiseIncome}
                  collectionTrend={collectionTrend}
                />
              )}

              {activeTab === 'properties' && (
                <BuildingView 
                  buildings={buildings}
                  floors={floors}
                  apartments={apartments}
                  userRole={currentUser.role}
                  onAddBuilding={handleAddBuilding}
                  onUpdateBuilding={handleUpdateBuilding}
                  onDeleteBuilding={handleDeleteBuilding}
                  onAddFloor={handleAddFloor}
                  onUpdateFloor={handleUpdateFloor}
                  onDeleteFloor={handleDeleteFloor}
                  onAddApartment={handleAddApartment}
                  onUpdateApartment={handleUpdateApartment}
                  onDeleteApartment={handleDeleteApartment}
                  onShowAlert={showAlert}
                />
              )}

              {activeTab === 'tenants' && (
                <TenantView 
                  tenants={tenants}
                  apartments={apartments}
                  buildings={buildings}
                  userRole={currentUser.role}
                  onAddTenant={handleAddTenant}
                  onUpdateTenant={handleUpdateTenant}
                  onDeleteTenant={handleDeleteTenant}
                  onShowAlert={showAlert}
                />
              )}

              {activeTab === 'rent' && (
                <RentView 
                  payments={payments}
                  tenants={tenants}
                  apartments={apartments}
                  buildings={buildings}
                  floors={floors}
                  userRole={currentUser.role}
                  onRecordPayment={handleRecordPayment}
                  onDeletePayment={handleDeletePayment}
                  onShowAlert={showAlert}
                />
              )}

              {activeTab === 'due' && (
                <RentDueView 
                  tenants={tenants}
                  apartments={apartments}
                  buildings={buildings}
                  payments={payments}
                  increaseHistory={increaseHistory}
                  userRole={currentUser.role}
                  onApplyRentIncrease={handleApplyRentIncrease}
                  onRenewContract={handleRenewContract}
                  onAddLog={addLog}
                  onShowAlert={showAlert}
                />
              )}

              {activeTab === 'reports' && (
                <ReportView 
                  tenants={tenants}
                  apartments={apartments}
                  buildings={buildings}
                  floors={floors}
                  payments={payments}
                  increaseHistory={increaseHistory}
                />
              )}

              {activeTab === 'extra' && (
                <ExtraFeaturesView 
                  logs={logs}
                  userRole={currentUser.role}
                  darkMode={darkMode}
                  onToggleDarkMode={() => setDarkMode(prev => !prev)}
                  onBackupState={handleBackupState}
                  onRestoreState={handleRestoreState}
                  onClearLogs={handleClearLogs}
                />
              )}

              {activeTab === 'tenant-portal' && (
                <TenantPortalView 
                  currentUser={currentUser}
                  tenants={tenants}
                  apartments={apartments}
                  buildings={buildings}
                  floors={floors}
                  payments={payments}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </section>

      </main>
      
      {/* SweetAlert Component */}
      <SweetAlert 
        isOpen={isAlertOpen} 
        options={alertOptions} 
        onClose={() => setIsAlertOpen(false)} 
      />

    </div>
  );
}
