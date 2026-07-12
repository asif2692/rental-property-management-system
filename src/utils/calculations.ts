import { Tenant, RentPayment, Apartment } from '../types';

/**
 * Calculates the mean (average) of an array of numbers, mimicking numpy.mean
 */
export function calculateMean(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sum = arr.reduce((acc, val) => acc + val, 0);
  return sum / arr.length;
}

/**
 * Calculates the median of an array of numbers, mimicking numpy.median
 */
export function calculateMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculates standard deviation mimicking numpy.std
 */
export function calculateStdDev(arr: number[]): number {
  if (arr.length <= 1) return 0;
  const mean = calculateMean(arr);
  const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

/**
 * Calculates dynamic metrics using pandas-like relational grouping and numpy-like aggregations
 */
export interface SystemMetrics {
  totalBuildings: number;
  totalFloors: number;
  totalApartments: number;
  occupiedCount: number;
  vacantCount: number;
  maintenanceCount: number;
  occupancyRate: number; // percentage
  
  // Financials
  monthlyRentReceived: number; // current month
  monthlyPendingRent: number; // current month
  totalAnnualIncome: number; // accumulated payments in current year
  expectedAnnualIncome: number; // expected yearly sum of current occupied rents
  collectionPercentage: number; // received / (received + pending)
  
  // Statistical Analysis (NumPy style)
  averageRent: number;
  medianRent: number;
  maxRent: number;
  minRent: number;
}

export function computeSystemMetrics(
  buildingsCount: number,
  floorsCount: number,
  apartments: Apartment[],
  tenants: Tenant[],
  payments: RentPayment[],
  activeMonth: number,
  activeYear: number
): SystemMetrics {
  const totalApartments = apartments.length;
  const occupiedCount = apartments.filter(a => a.status === 'Occupied').length;
  const vacantCount = apartments.filter(a => a.status === 'Vacant').length;
  const maintenanceCount = apartments.filter(a => a.status === 'Maintenance').length;
  const occupancyRate = totalApartments > 0 ? (occupiedCount / totalApartments) * 100 : 0;

  // Monthly financials for activeMonth/activeYear
  // 1. Received: Payments logged for this month and year
  const monthlyPayments = payments.filter(
    p => p.rentMonth === activeMonth && p.rentYear === activeYear
  );
  const monthlyRentReceived = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

  // 2. Pending: Occupied apartments that do NOT have a payment for activeMonth/activeYear
  // Group tenants by active status and apartment
  const activeTenants = tenants.filter(t => t.active);
  let monthlyPendingRent = 0;
  activeTenants.forEach(tenant => {
    // Check if this tenant paid for activeMonth/activeYear
    const hasPaid = payments.some(
      p => p.tenantId === tenant.id && p.rentMonth === activeMonth && p.rentYear === activeYear
    );
    if (!hasPaid) {
      // Find the rent of their apartment or use their contract rent
      const apt = apartments.find(a => a.id === tenant.apartmentId);
      monthlyPendingRent += apt ? apt.monthlyRent : tenant.securityDeposit / 2; // fallback
    }
  });

  // Expected Annual Income = expected rent from all occupied apartments * 12
  const expectedAnnualIncome = apartments
    .filter(a => a.status === 'Occupied')
    .reduce((sum, a) => sum + (a.monthlyRent * 12), 0);

  // Total Annual Income: Sum of all payments received in the current year
  const totalAnnualIncome = payments
    .filter(p => p.rentYear === activeYear)
    .reduce((sum, p) => sum + p.amount, 0);

  const collectionTotalDue = monthlyRentReceived + monthlyPendingRent;
  const collectionPercentage = collectionTotalDue > 0 ? (monthlyRentReceived / collectionTotalDue) * 100 : 0;

  // NumPy styled aggregations for rents of all active apartments
  const rents = apartments.map(a => a.monthlyRent);
  const averageRent = calculateMean(rents);
  const medianRent = calculateMedian(rents);
  const maxRent = rents.length > 0 ? Math.max(...rents) : 0;
  const minRent = rents.length > 0 ? Math.min(...rents) : 0;

  return {
    totalBuildings: buildingsCount,
    totalFloors: floorsCount,
    totalApartments,
    occupiedCount,
    vacantCount,
    maintenanceCount,
    occupancyRate,
    monthlyRentReceived,
    monthlyPendingRent,
    totalAnnualIncome,
    expectedAnnualIncome,
    collectionPercentage,
    averageRent,
    medianRent,
    maxRent,
    minRent
  };
}

/**
 * Builds data arrays for charts (mimics Pandas groupby and Pivot operations)
 */
export function getBuildingWiseIncome(buildings: any[], apartments: Apartment[], payments: RentPayment[], year: number) {
  return buildings.map(b => {
    const bPayments = payments.filter(p => p.buildingId === b.id && p.rentYear === year);
    const totalCollected = bPayments.reduce((sum, p) => sum + p.amount, 0);
    
    const bApartments = apartments.filter(a => a.buildingId === b.id);
    const occupied = bApartments.filter(a => a.status === 'Occupied').length;
    const rate = bApartments.length > 0 ? (occupied / bApartments.length) * 100 : 0;

    return {
      name: b.name.replace(/\s*\(Building\s+\w+\)/i, ''), // short name for charts
      income: totalCollected,
      occupancyRate: Math.round(rate)
    };
  });
}

/**
 * Monthly payment history for current year trend
 */
export function getMonthlyCollectionTrend(payments: RentPayment[], year: number) {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return months.map((monthName, idx) => {
    const monthNum = idx + 1;
    const mPayments = payments.filter(p => p.rentMonth === monthNum && p.rentYear === year);
    const collected = mPayments.reduce((sum, p) => sum + p.amount, 0);
    const utilities = mPayments.reduce((sum, p) => sum + p.utilityCharges, 0);
    const late = mPayments.reduce((sum, p) => sum + p.lateCharges, 0);
    const discount = mPayments.reduce((sum, p) => sum + p.discount, 0);

    return {
      month: monthName,
      Collected: collected,
      Utilities: utilities,
      LateCharges: late,
      Discounts: discount
    };
  });
}

/**
 * Rent Increase Forecast for the next 12 months using exponential growth based on custom increase rates
 * (NumPy style forecasting model)
 */
export function generateRentForecast(currentMonthlyTotal: number, ratePercent: number) {
  const forecast = [];
  let projected = currentMonthlyTotal;
  const growthFactor = 1 + (ratePercent / 100) / 12; // compound monthly

  for (let m = 1; m <= 6; m++) {
    projected = projected * growthFactor;
    forecast.push({
      period: `Month +${m}`,
      ProjectedRent: Math.round(projected)
    });
  }
  return forecast;
}
