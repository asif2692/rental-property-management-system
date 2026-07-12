import { createClient } from '@supabase/supabase-js';
import { Building, Floor, Apartment, Tenant, RentPayment, ActivityLog, User } from '../types';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

// Create a single Supabase client instance.
// If credentials are not provided yet, we return null to prevent runtime crashes.
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && supabase);
};

// ==========================================
// DB MAPPERS (snake_case <-> camelCase)
// ==========================================

export function mapBuildingFromDB(data: any): Building {
  return {
    id: data.id,
    name: data.name,
    address: data.address,
    description: data.description || '',
  };
}

export function mapBuildingToDB(b: Building) {
  return {
    id: b.id,
    name: b.name,
    address: b.address,
    description: b.description,
  };
}

export function mapFloorFromDB(data: any): Floor {
  return {
    id: data.id,
    name: data.name,
    buildingId: data.building_id,
  };
}

export function mapFloorToDB(f: Floor) {
  return {
    id: f.id,
    name: f.name,
    building_id: f.buildingId,
  };
}

export function mapApartmentFromDB(data: any): Apartment {
  return {
    id: data.id,
    number: data.number,
    floorId: data.floor_id,
    buildingId: data.building_id,
    monthlyRent: Number(data.monthly_rent || 0),
    status: (data.status || 'Vacant') as any,
    description: data.description || '',
  };
}

export function mapApartmentToDB(a: Apartment) {
  return {
    id: a.id,
    number: a.number,
    floor_id: a.floorId,
    building_id: a.buildingId,
    monthly_rent: a.monthlyRent,
    status: a.status,
    description: a.description,
  };
}

export function mapTenantFromDB(data: any): Tenant {
  return {
    id: data.id,
    fullName: data.full_name,
    fatherName: data.father_name || '',
    cnic: data.cnic || '',
    mobileNumber: data.mobile_number || '',
    whatsAppNumber: data.whatsapp_number || '',
    email: data.email || '',
    emergencyContact: data.emergency_contact || '',
    permanentAddress: data.permanent_address || '',
    currentAddress: data.current_address || '',
    occupation: data.occupation || '',
    monthlyIncome: Number(data.monthly_income || 0),
    familyMembers: Number(data.family_members || 1),
    photoUrl: data.photo_url || '',
    cnicFrontUrl: data.cnic_front_url || '',
    cnicBackUrl: data.cnic_back_url || '',
    agreementScanUrl: data.agreement_scan_url || '',
    securityDeposit: Number(data.security_deposit || 0),
    advanceRent: Number(data.advance_rent || 0),
    startDate: data.start_date || '',
    endDate: data.end_date || '',
    apartmentId: data.apartment_id || '',
    notes: data.notes || '',
    active: data.active !== false,
  };
}

export function mapTenantToDB(t: Tenant) {
  return {
    id: t.id,
    full_name: t.fullName,
    father_name: t.fatherName,
    cnic: t.cnic,
    mobile_number: t.mobileNumber,
    whatsapp_number: t.whatsAppNumber,
    email: t.email,
    emergency_contact: t.emergencyContact,
    permanent_address: t.permanentAddress,
    current_address: t.currentAddress,
    occupation: t.occupation,
    monthly_income: t.monthlyIncome,
    family_members: t.familyMembers,
    photo_url: t.photoUrl,
    cnic_front_url: t.cnicFrontUrl,
    cnic_back_url: t.cnicBackUrl,
    agreement_scan_url: t.agreementScanUrl,
    security_deposit: t.securityDeposit,
    advance_rent: t.advanceRent,
    start_date: t.startDate || null,
    end_date: t.endDate || null,
    apartment_id: t.apartmentId || null,
    notes: t.notes,
    active: t.active,
  };
}

export function mapPaymentFromDB(data: any): RentPayment {
  return {
    id: data.id,
    tenantId: data.tenant_id,
    buildingId: data.building_id || '',
    floorId: data.floor_id || '',
    apartmentId: data.apartment_id || '',
    paymentDate: data.payment_date || '',
    rentMonth: Number(data.rent_month || 1),
    rentYear: Number(data.rent_year || 2026),
    amount: Number(data.amount || 0),
    lateCharges: Number(data.late_charges || 0),
    discount: Number(data.discount || 0),
    utilityCharges: Number(data.utility_charges || 0),
    otherCharges: Number(data.other_charges || 0),
    paymentMethod: (data.payment_method || 'Cash') as any,
    referenceNumber: data.reference_number || '',
    remarks: data.remarks || '',
  };
}

export function mapPaymentToDB(p: RentPayment) {
  return {
    id: p.id,
    tenant_id: p.tenantId,
    building_id: p.buildingId || null,
    floor_id: p.floorId || null,
    apartment_id: p.apartmentId || null,
    payment_date: p.paymentDate || null,
    rent_month: p.rentMonth,
    rent_year: p.rentYear,
    amount: p.amount,
    late_charges: p.lateCharges,
    discount: p.discount,
    utility_charges: p.utilityCharges,
    other_charges: p.otherCharges,
    payment_method: p.paymentMethod,
    reference_number: p.referenceNumber,
    remarks: p.remarks,
  };
}

export function mapLogFromDB(data: any): ActivityLog {
  return {
    id: data.id,
    timestamp: data.timestamp || new Date().toISOString(),
    username: data.username || 'SYSTEM',
    role: (data.role || 'admin') as any,
    action: data.action || '',
    details: data.details || '',
  };
}

export function mapLogToDB(l: ActivityLog) {
  return {
    id: l.id,
    timestamp: l.timestamp,
    username: l.username,
    role: l.role,
    action: l.action,
    details: l.details,
  };
}

// Helper to log errors descriptively and dispatch a custom event for UI feedback
function handleDbError(context: string, error: any) {
  const message = error?.message || '';
  const details = error?.details || '';
  const hint = error?.hint || '';
  console.error(`${context}:`, message, details, hint, error);
  
  // Dispatch a custom event so the UI can notify the user with a descriptive banner
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('supabase-db-error', {
      detail: {
        context,
        message,
        details,
        hint,
        raw: error
      }
    });
    window.dispatchEvent(event);
  }
}

// ==========================================
// SUPABASE OPERATIONS UTILITIES
// ==========================================

export async function fetchAllFromSupabase() {
  if (!supabase) return null;

  try {
    const [bRes, fRes, aRes, tRes, pRes, lRes] = await Promise.all([
      supabase.from('buildings').select('*'),
      supabase.from('floors').select('*'),
      supabase.from('apartments').select('*'),
      supabase.from('tenants').select('*'),
      supabase.from('payments').select('*'),
      supabase.from('logs').select('*').order('timestamp', { ascending: false }).limit(200),
    ]);

    let hasErrors = false;
    if (bRes.error) { handleDbError('Error loading buildings', bRes.error); hasErrors = true; }
    if (fRes.error) { handleDbError('Error loading floors', fRes.error); hasErrors = true; }
    if (aRes.error) { handleDbError('Error loading apartments', aRes.error); hasErrors = true; }
    if (tRes.error) { handleDbError('Error loading tenants', tRes.error); hasErrors = true; }
    if (pRes.error) { handleDbError('Error loading payments', pRes.error); hasErrors = true; }
    if (lRes.error) { handleDbError('Error loading logs', lRes.error); hasErrors = true; }

    if (hasErrors) {
      // Return partial or empty data if some tables failed (e.g. they don't exist yet)
    }

    return {
      buildings: (bRes.data || []).map(mapBuildingFromDB),
      floors: (fRes.data || []).map(mapFloorFromDB),
      apartments: (aRes.data || []).map(mapApartmentFromDB),
      tenants: (tRes.data || []).map(mapTenantFromDB),
      payments: (pRes.data || []).map(mapPaymentFromDB),
      logs: (lRes.data || []).map(mapLogFromDB),
    };
  } catch (error) {
    handleDbError('Failed to query Supabase tables', error);
    return null;
  }
}

// CRUD Operations pushing to Supabase dynamically

export async function dbUpsertBuilding(b: Building) {
  if (!supabase) return;
  const { error } = await supabase.from('buildings').upsert(mapBuildingToDB(b));
  if (error) handleDbError('Error saving building to Supabase', error);
}

export async function dbDeleteBuilding(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('buildings').delete().eq('id', id);
  if (error) handleDbError('Error deleting building from Supabase', error);
}

export async function dbUpsertFloor(f: Floor) {
  if (!supabase) return;
  const { error } = await supabase.from('floors').upsert(mapFloorToDB(f));
  if (error) handleDbError('Error saving floor to Supabase', error);
}

export async function dbDeleteFloor(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('floors').delete().eq('id', id);
  if (error) handleDbError('Error deleting floor from Supabase', error);
}

export async function dbUpsertApartment(a: Apartment) {
  if (!supabase) return;
  const { error } = await supabase.from('apartments').upsert(mapApartmentToDB(a));
  if (error) handleDbError('Error saving apartment to Supabase', error);
}

export async function dbDeleteApartment(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('apartments').delete().eq('id', id);
  if (error) handleDbError('Error deleting apartment from Supabase', error);
}

export async function dbUpsertTenant(t: Tenant) {
  if (!supabase) return;
  const { error } = await supabase.from('tenants').upsert(mapTenantToDB(t));
  if (error) handleDbError('Error saving tenant to Supabase', error);
}

export async function dbDeleteTenant(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('tenants').delete().eq('id', id);
  if (error) handleDbError('Error deleting tenant from Supabase', error);
}

export async function dbUpsertPayment(p: RentPayment) {
  if (!supabase) return;
  const { error } = await supabase.from('payments').upsert(mapPaymentToDB(p));
  if (error) handleDbError('Error saving payment to Supabase', error);
}

export async function dbDeletePayment(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('payments').delete().eq('id', id);
  if (error) handleDbError('Error deleting payment from Supabase', error);
}

export async function dbUpsertLog(l: ActivityLog) {
  if (!supabase) return;
  const { error } = await supabase.from('logs').upsert(mapLogToDB(l));
  if (error) handleDbError('Error saving log to Supabase', error);
}


