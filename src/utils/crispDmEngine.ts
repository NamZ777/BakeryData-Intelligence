import { 
  PosTransaction, 
  MemberRecord, 
  ProductionBatch, 
  TargetKpis, 
  CustomerPersona 
} from '../types/bakery';
import { MODEL_OUTPUTS } from '../data/modelOutputs';

export interface PersonaMetrics {
  name: CustomerPersona;
  count: number;
  pct: number;
  totalSpent: number;
  avgTicket: number;
  peakHour: string;
  topItem: string;
  badgeColor: string;
  actionStrategy: string;
}

export function computeTargetKpis(
  transactions: PosTransaction[],
  members: MemberRecord[],
  batches: ProductionBatch[]
): TargetKpis {
  const baselineWasteRate = 18.5; // Initial baseline before CRISP-DM
  const targetWasteRate = baselineWasteRate * 0.8; // -20% reduction target (14.8%)
  const baselineTicketSize = 180; // Baseline before Combo and Upsell
  const targetTicketSize = baselineTicketSize * 1.15; // +15% target (207 THB)
  const baselineRetentionRate = 42.0; // Baseline before Personalized LINE OA
  const targetRetentionRate = baselineRetentionRate * 1.25; // +25% target (52.5%)

  // If no data uploaded yet, return clean zeroes
  if (transactions.length === 0 && members.length === 0 && batches.length === 0) {
    return {
      wasteRate: {
        current: 0,
        baseline: baselineWasteRate,
        target: Number(targetWasteRate.toFixed(1)),
        achievedPct: 0,
        costSavedBath: 0,
      },
      ticketSize: {
        current: 0,
        baseline: baselineTicketSize,
        target: Math.round(targetTicketSize),
        achievedPct: 0,
        extraRevenueBath: 0,
      },
      retentionRate: {
        current: 0,
        baseline: baselineRetentionRate,
        target: Number(targetRetentionRate.toFixed(1)),
        achievedPct: 0,
        activeMembers: 0,
      },
    };
  }

  // 1. Waste Rate
  const totalBaked = batches.reduce((acc, b) => acc + (b.actualBaked || 0), 0);
  const totalWaste = batches.reduce((acc, b) => acc + (b.wasteQty || 0), 0);
  const currentWasteRate = totalBaked > 0 ? (totalWaste / totalBaked) * 100 : 0;
  const wasteReductionPct = totalBaked > 0 ? ((baselineWasteRate - currentWasteRate) / baselineWasteRate) * 100 : 0;
  
  // Cost saved calculation (Avg unit cost ~ 38 THB per fresh item saved)
  const savedItems = totalBaked > 0 ? Math.max(0, Math.round((baselineWasteRate - currentWasteRate) / 100 * totalBaked)) : 0;
  const costSavedBath = savedItems * 38;

  // 2. Ticket Size
  const totalRevenue = transactions.reduce((acc, t) => acc + (t.totalAmount || 0), 0);
  const txCount = transactions.length;
  const currentTicketSize = txCount > 0 ? totalRevenue / txCount : 0;
  const ticketSizeGrowthPct = txCount > 0 ? ((currentTicketSize - baselineTicketSize) / baselineTicketSize) * 100 : 0;
  const extraRevenueBath = txCount > 0 ? Math.max(0, Math.round((currentTicketSize - baselineTicketSize) * txCount)) : 0;

  // 3. Retention Rate
  const activeMembers = members.filter(m => m.recencyDays <= 30 && m.totalVisits >= 2).length;
  const currentRetentionRate = members.length > 0 ? (activeMembers / members.length) * 100 : 0;
  const retentionGrowthPct = members.length > 0 ? ((currentRetentionRate - baselineRetentionRate) / baselineRetentionRate) * 100 : 0;

  return {
    wasteRate: {
      current: Number(currentWasteRate.toFixed(1)),
      baseline: baselineWasteRate,
      target: Number(targetWasteRate.toFixed(1)),
      achievedPct: Number(wasteReductionPct.toFixed(1)),
      costSavedBath,
    },
    ticketSize: {
      current: Math.round(currentTicketSize),
      baseline: baselineTicketSize,
      target: Math.round(targetTicketSize),
      achievedPct: Number(ticketSizeGrowthPct.toFixed(1)),
      extraRevenueBath,
    },
    retentionRate: {
      current: Number(currentRetentionRate.toFixed(1)),
      baseline: baselineRetentionRate,
      target: Number(targetRetentionRate.toFixed(1)),
      achievedPct: Number(retentionGrowthPct.toFixed(1)),
      activeMembers,
    },
  };
}

export function computePersonaMetrics(
  transactions: PosTransaction[],
  members: MemberRecord[]
): PersonaMetrics[] {
  const personas: CustomerPersona[] = [
    'Morning Commuter',
    'Cafe Hopper',
    'Health & Family',
    'Evening Discount Hunter',
  ];

  const configMap: Record<CustomerPersona, {
    peakHour: string;
    topItem: string;
    badgeColor: string;
    actionStrategy: string;
  }> = {
    'Morning Commuter': {
      peakHour: '07:00 - 09:00 น.',
      topItem: 'กาแฟอเมริกาโน่ + ครัวซองต์เนยสด',
      badgeColor: 'amber',
      actionStrategy: 'ส่ง LINE ข้อความสั่งล่วงหน้า 06:45 น. รับของทันทีไม่ต้องรอคิว พร้อมสปีดการจ่ายเงิน PromptPay',
    },
    'Cafe Hopper': {
      peakHour: '13:30 - 16:30 น.',
      topItem: 'บาสก์ชีสเค้กหน้าไหม้ + ชาเขียวมัทฉะ',
      badgeColor: 'rose',
      actionStrategy: 'ภาพ Seasonal Menu & ถ่ายรูปสวยลง IG/TikTok คูปองส่วนลดเครื่องดื่ม Signature วันเสาร์-อาทิตย์',
    },
    'Health & Family': {
      peakHour: '16:00 - 18:00 น.',
      topItem: 'ขนมปังโฮลวีต 9 ธัญพืช + นมแอลมอนด์',
      badgeColor: 'emerald',
      actionStrategy: 'จัดโปร Bundle ซื้อขนมปังเพื่อสุขภาพคู่เครื่องดื่มลด 15% ทุกเย็นวันศุกร์สำหรับตุนช่วงวันหยุด',
    },
    'Evening Discount Hunter': {
      peakHour: '18:30 - 20:00 น.',
      topItem: 'เบเกอรี่อบสดลดราคา Dynamic Markdown',
      badgeColor: 'indigo',
      actionStrategy: 'ระบบแจ้งเตือน Happy Hour ก่อนร้านปิด ลด 20-35% เคลียร์สต็อกสดให้เหลือทิ้งเป็น 0%',
    },
  };

  // If no transactions and no members, return 0s for all personas
  if (transactions.length === 0 && members.length === 0) {
    return personas.map((persona) => {
      const conf = configMap[persona];
      return {
        name: persona,
        count: 0,
        pct: 0,
        totalSpent: 0,
        avgTicket: 0,
        peakHour: conf.peakHour,
        topItem: conf.topItem,
        badgeColor: conf.badgeColor,
        actionStrategy: conf.actionStrategy,
      };
    });
  }

  // Fast single-pass aggregation over transactions and members
  const txStats = new Map<string, { count: number; totalSpent: number }>();
  for (const p of personas) {
    txStats.set(p, { count: 0, totalSpent: 0 });
  }

  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    const p = t.customerPersona || 'Morning Commuter';
    const entry = txStats.get(p);
    if (entry) {
      entry.count += 1;
      entry.totalSpent += t.totalAmount || 0;
    } else {
      const fallback = txStats.get('Morning Commuter')!;
      fallback.count += 1;
      fallback.totalSpent += t.totalAmount || 0;
    }
  }

  const memberCounts = new Map<string, number>();
  for (const m of members) {
    const p = m.assignedPersona || 'Morning Commuter';
    memberCounts.set(p, (memberCounts.get(p) || 0) + 1);
  }

  const totalMembers = members.length || transactions.length || 1;

  return personas.map((persona) => {
    const stat = txStats.get(persona) || { count: 0, totalSpent: 0 };
    const mCount = memberCounts.get(persona) || 0;
    const count = mCount || stat.count || 0;
    const pct = totalMembers > 0 ? Number(((count / totalMembers) * 100).toFixed(1)) : 0;
    const totalSpent = stat.totalSpent || 0;
    const avgTicket = stat.count > 0 ? Math.round(stat.totalSpent / stat.count) : 0;

    const conf = configMap[persona];

    return {
      name: persona,
      count,
      pct,
      totalSpent,
      avgTicket,
      peakHour: conf.peakHour,
      topItem: conf.topItem,
      badgeColor: conf.badgeColor,
      actionStrategy: conf.actionStrategy,
    };
  });
}

export function computeHourlyTraffic(transactions: PosTransaction[]) {
  const hours = [
    { label: '07:00', hour: 7 },
    { label: '08:00', hour: 8 },
    { label: '09:00', hour: 9 },
    { label: '10:00', hour: 10 },
    { label: '11:00', hour: 11 },
    { label: '12:00', hour: 12 },
    { label: '13:00', hour: 13 },
    { label: '14:00', hour: 14 },
    { label: '15:00', hour: 15 },
    { label: '16:00', hour: 16 },
    { label: '17:00', hour: 17 },
    { label: '18:00', hour: 18 },
    { label: '19:00', hour: 19 },
  ];

  // If no transactions uploaded, return 0s
  if (transactions.length === 0) {
    return hours.map((h) => ({
      hour: h.label,
      bills: 0,
      revenue: 0,
      isPeak: false,
    }));
  }

  // Efficient single-pass aggregation
  const hourMap = new Map<number, { bills: number; revenue: number }>();
  for (const h of hours) {
    hourMap.set(h.hour, { bills: 0, revenue: 0 });
  }

  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    let hour = -1;

    // Fast hour parse
    if (t.timestamp) {
      if (t.timestamp.includes('T')) {
        const timePart = t.timestamp.split('T')[1];
        if (timePart && timePart.length >= 2) {
          hour = parseInt(timePart.slice(0, 2), 10);
        }
      } else if (t.timestamp.includes(' ')) {
        const timePart = t.timestamp.split(' ')[1];
        if (timePart && timePart.length >= 2) {
          hour = parseInt(timePart.slice(0, 2), 10);
        }
      } else {
        const d = new Date(t.timestamp);
        if (!isNaN(d.getTime())) {
          hour = d.getHours();
        }
      }
    }

    if (isNaN(hour) || hour < 0) {
      if (t.timeSlot === 'Morning') hour = 8;
      else if (t.timeSlot === 'Noon') hour = 12;
      else if (t.timeSlot === 'Afternoon') hour = 15;
      else if (t.timeSlot === 'Evening') hour = 18;
      else hour = 9;
    }

    // Map into range 7-19
    const clampedHour = Math.min(19, Math.max(7, hour));
    const entry = hourMap.get(clampedHour);
    if (entry) {
      entry.bills += 1;
      entry.revenue += (t.totalAmount || 0);
    }
  }

  return hours.map((h) => {
    const entry = hourMap.get(h.hour) || { bills: 0, revenue: 0 };
    const billsCount = entry.bills;
    const revenue = entry.revenue;
    const isPeak = (h.hour === 7 || h.hour === 8 || h.hour === 14 || h.hour === 18) && billsCount > 0;

    return {
      hour: h.label,
      bills: billsCount,
      revenue,
      isPeak,
    };
  });
}

/**
 * พยากรณ์ยอดขายรายวัน (เฉลี่ยตามวันในสัปดาห์) จากโมเดล Baking Demand (Random Forest)
 * ค่าถูกคำนวณล่วงหน้าโดย ml/05_export_for_app.py บนชุดทดสอบที่แยกตามวันที่
 * ** โมเดลเทรนจากข้อมูลจำลองเพื่อสาธิต ไม่ใช่ข้อมูลจริงของร้าน **
 */
export function computeDailyForecast() {
  return MODEL_OUTPUTS.dailyForecast;
}
