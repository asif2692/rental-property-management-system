export type UserRole = 'admin' | 'manager' | 'read_only' | 'landlord' | 'tenant';

export interface User {
  username: string;
  role: UserRole;
  fullName: string;
  password?: string;
  cnic?: string;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  description: string;
}

export interface Floor {
  id: string;
  name: string; // e.g. "Floor 1", "Ground Floor"
  buildingId: string;
}

export interface Apartment {
  id: string;
  number: string; // e.g. "House 1" or "Apt 101"
  floorId: string;
  buildingId: string;
  monthlyRent: number;
  status: 'Occupied' | 'Vacant' | 'Maintenance';
  description: string;
}

export interface Tenant {
  id: string;
  fullName: string;
  fatherName: string;
  cnic: string;
  mobileNumber: string;
  whatsAppNumber: string;
  email: string;
  emergencyContact: string;
  permanentAddress: string;
  currentAddress: string;
  occupation: string;
  monthlyIncome: number;
  familyMembers: number;
  // File uploads stored as local URLs or simulated Base64 strings
  photoUrl: string;
  cnicFrontUrl: string;
  cnicBackUrl: string;
  agreementScanUrl: string;
  securityDeposit: number;
  advanceRent: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  apartmentId: string; // References Apartment
  notes: string;
  active: boolean; // Active or Inactive
}

export interface RentPayment {
  id: string;
  tenantId: string;
  buildingId: string;
  floorId: string;
  apartmentId: string;
  paymentDate: string; // YYYY-MM-DD
  rentMonth: number; // 1 - 12
  rentYear: number;
  amount: number;
  lateCharges: number;
  discount: number;
  utilityCharges: number;
  otherCharges: number;
  paymentMethod: 'Cash' | 'Bank' | 'JazzCash' | 'EasyPaisa';
  referenceNumber: string;
  remarks: string;
}

export interface RentIncreaseHistory {
  id: string;
  tenantId: string;
  apartmentId: string;
  oldRent: number;
  newRent: number;
  percentage: number;
  dateApplied: string;
  remarks: string;
}

export interface Renewal {
  id: string;
  tenantId: string;
  apartmentId: string;
  oldEndDate: string;
  newEndDate: string;
  rentAmount: number;
  dateRenewed: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO string
  username: string;
  role: UserRole;
  action: string; // e.g., "CREATE_BUILDING", "COLLECT_RENT"
  details: string;
}

export interface RentDue {
  tenantId: string;
  tenantName: string;
  apartmentId: string;
  apartmentNumber: string;
  buildingName: string;
  monthlyRent: number;
  lastPaidMonth: number | null;
  lastPaidYear: number | null;
  dueStatus: 'Due Today' | 'Due Tomorrow' | 'Due This Week' | 'Overdue' | 'Paid';
  dueDate: string;
  pendingMonthsCount: number;
  overdueDaysCount: number;
}
