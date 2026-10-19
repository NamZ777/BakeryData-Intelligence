/**
 * ผลลัพธ์จากโมเดล ML (โฟลเดอร์ ml/) ที่ส่งออกเป็น JSON
 * สร้างโดย ml/05_export_for_app.py -- อย่าแก้ไฟล์ .json ด้วยมือ
 *
 * หมายเหตุ: โมเดลเทรนจากข้อมูลจำลอง (synthetic) เพื่อสาธิตระบบเท่านั้น
 */
import raw from './modelOutputs.json';
import { MarketBasketRule } from '../types/bakery';

export type WasteSlotKey = 'Morning' | 'Midday' | 'Afternoon' | 'Evening';

export interface WasteSlotCell {
  risk: number;            // ความเสี่ยงที่โมเดลทาย (0-1) ใช้เทียบกันเอง
  actualWastePct: number;  // อัตราของเสียจริงในชุดทดสอบ (%)
  level: 'high' | 'mid' | 'low';
  n: number;
}

export interface BakingPlanRow {
  product: string;
  morning: number;
  midday: number;
  afternoon: number;
  total: number;
}

export interface UpsellSuggestion {
  suggest: string;
  lift: number;
  confidence: number;
  suggestPrice: number;
  regularPrice: number;
  bundlePrice: number;
  persona: string;
}

export interface UpsellEntry {
  trigger: string;
  triggerPrice: number;
  suggestions: UpsellSuggestion[];
}

export interface ModelOutputs {
  meta: {
    dataSource: 'synthetic';
    disclaimer: string;
    rows: number;
    transactions: number;
    dateFrom: string;
    dateTo: string;
  };
  metrics: {
    waste: { rocAuc: number; recall: number; precision: number; baseRatePct: number };
    basket: { totalRules: number; rulesLiftAbove1: number; maxLift: number; multiItemBaskets: number };
    demand: { mae: number; r2: number; testDays: number; dailyMapePct: number };
  };
  dailyForecast: { day: string; actual: number; forecast: number; accuracy: number }[];
  basketRules: MarketBasketRule[];
  upsell: UpsellEntry[];
  wasteRisk: { product: string; slots: Partial<Record<WasteSlotKey, WasteSlotCell>> }[];
  bakingPlan: { weekday: BakingPlanRow[]; weekend: BakingPlanRow[] };
  bakingPlanCheck: {
    plannedPerDayWeekday: number;
    actualAvgPerDayWeekday: number;
    plannedPerDayWeekend: number;
    actualAvgPerDayWeekend: number;
  };
}

export const MODEL_OUTPUTS = raw as unknown as ModelOutputs;
