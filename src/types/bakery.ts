export type UserRole = 'manager' | 'kitchen' | 'executive';

export type CustomerPersona = 
  | 'Morning Commuter'
  | 'Cafe Hopper'
  | 'Health & Family'
  | 'Evening Discount Hunter';

export interface PosTransaction {
  id: string;
  timestamp: string; // ISO string
  items: {
    productId: string;
    productName: string;
    category: 'Bread' | 'Pastry' | 'Cake' | 'Beverage' | 'Healthy' | 'Combo';
    qty: number;
    price: number;
  }[];
  totalAmount: number;
  paymentMethod: 'PromptPay' | 'CreditCard' | 'Cash' | 'LINE Pay';
  memberId?: string;
  customerPersona?: CustomerPersona;
  timeSlot: 'Morning' | 'Noon' | 'Afternoon' | 'Evening';
  isCombo?: boolean;
}

export interface MemberRecord {
  id: string;
  name: string;
  phone: string;
  joinDate: string;
  totalVisits: number;
  totalSpent: number;
  lastVisit: string;
  recencyDays: number;
  frequencyScore: number;
  monetaryScore: number;
  assignedPersona: CustomerPersona;
  favoriteItems: string[];
  lineOaConnected: boolean;
  rfmSegment: 'Champions' | 'Loyal' | 'Potential Loyalist' | 'At Risk' | 'Hibernating';
}

export interface ProductionBatch {
  id: string;
  date: string;
  timeSlot: 'Morning (05:30)' | 'Mid-day (10:30)' | 'Afternoon (14:30)';
  productId: string;
  productName: string;
  category: string;
  plannedQty: number;
  actualBaked: number;
  actualSold: number;
  wasteQty: number;
  unitCost: number;
  sellingPrice: number;
  wasteReason?: 'Overbaked' | 'End of Shelf Life' | 'Aesthetic Defect' | 'Over-forecasted';
}

export interface DemandForecastItem {
  hour: string;
  predictedDemand: number;
  recommendedBake: number;
  safetyStock: number;
  historicalAvg: number;
  productName: string;
  mapeScore: number; // Mean Absolute Percentage Error
}

export interface MarketBasketRule {
  id: string;
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
  bundleName: string;
  bundlePrice: number;
  regularPrice: number;
  targetPersona: CustomerPersona;
}

export interface DynamicMarkdownRule {
  timeSlot: string; // e.g. "18:30 - 19:15"
  discountPct: number;
  minRemainingStock: number;
  targetItems: string[];
  salvageRateExpected: number;
  status: 'Active' | 'Scheduled' | 'Standby';
}

export interface AbTestResult {
  campaignName: string;
  targetGroup: string;
  personalizedStrategy: {
    channel: string;
    message: string;
    sendTime: string;
    sentCount: number;
    openRate: number;
    redemptionRate: number;
    incrementalRevenue: number;
  };
  controlStrategy: {
    channel: string;
    message: string;
    sendTime: string;
    sentCount: number;
    openRate: number;
    redemptionRate: number;
    incrementalRevenue: number;
  };
  upliftPercent: number;
}

export interface TargetKpis {
  wasteRate: {
    current: number;
    baseline: number;
    target: number; // -20%
    achievedPct: number;
    costSavedBath: number;
  };
  ticketSize: {
    current: number;
    baseline: number;
    target: number; // +15%
    achievedPct: number;
    extraRevenueBath: number;
  };
  retentionRate: {
    current: number;
    baseline: number;
    target: number; // +25%
    achievedPct: number;
    activeMembers: number;
  };
}
