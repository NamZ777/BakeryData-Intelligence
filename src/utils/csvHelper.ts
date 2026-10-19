import Papa from 'papaparse';
import { PosTransaction, MemberRecord, ProductionBatch } from '../types/bakery';

export function downloadFile(filename: string, content: string, contentType: string = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const SAMPLE_POS_CSV = `transaction_id,timestamp,items_description,total_amount,payment_method,member_id,customer_persona,time_slot
TX-2001,2026-09-19T07:10:00Z,"อเมริกาโน่ร้อน x1, ครัวซองต์เนยสด x1",160,PromptPay,MEM-001,Morning Commuter,Morning
TX-2002,2026-09-19T07:35:00Z,"แซนด์วิชแฮมชีส x1, ชาไทยเย็น x1",165,PromptPay,MEM-002,Morning Commuter,Morning
TX-2003,2026-09-19T13:40:00Z,"ชีสเค้กหน้าไหม้ x1, ชาเขียวมัทฉะ x1",255,CreditCard,MEM-003,Cafe Hopper,Afternoon
TX-2004,2026-09-19T16:20:00Z,"ขนมปังโฮลวีต 9 ธัญพืช x2, นมข้าวโอ๊ต x2",370,CreditCard,MEM-004,Health & Family,Afternoon
TX-2005,2026-09-19T19:05:00Z,"ครัวซองต์เนยสด (Markdown 20%) x2",136,Cash,,Evening Discount Hunter,Evening
TX-2006,2026-09-19T19:30:00Z,"ขนมปังเนยสด (Markdown 35%) x3",117,PromptPay,,Evening Discount Hunter,Evening`;

export const SAMPLE_CRM_CSV = `member_id,name,phone,join_date,total_visits,total_spent,last_visit,recency_days,assigned_persona,favorite_item,rfm_segment
MEM-101,คุณวรัญญา สิริโชค,081-222-XXXX,2026-01-10,26,4500,2026-09-18,0,Morning Commuter,"อเมริกาโน่ + ครัวซองต์",Champions
MEM-102,คุณอานนท์ ภักดี,089-333-XXXX,2026-02-15,18,3400,2026-09-18,0,Morning Commuter,"แซนด์วิชแฮมชีส",Loyal
MEM-103,คุณนภัสสร อัครเดช,086-444-XXXX,2026-03-20,15,5600,2026-09-15,3,Cafe Hopper,"บาสก์ชีสเค้กหน้าไหม้",Loyal
MEM-104,คุณกมลพร ทิพยรัตน์,082-555-XXXX,2025-12-05,32,10500,2026-09-17,1,Health & Family,"โฮลวีต 9 ธัญพืช",Champions
MEM-105,คุณชานนท์ ปรีชากุล,085-666-XXXX,2026-06-11,8,1800,2026-09-16,2,Evening Discount Hunter,"ขนมปังสดช่วงเย็น",Potential Loyalist`;

export const SAMPLE_KITCHEN_CSV = `batch_id,date,time_slot,product_name,planned_qty,actual_baked,actual_sold,waste_qty,unit_cost,selling_price,waste_reason
BAT-101,2026-09-18,Morning (05:30),ครัวซองต์เนยฝรั่งเศส,70,70,68,2,32,85,Aesthetic Defect
BAT-102,2026-09-18,Morning (05:30),แซนด์วิชแฮมชีสดับเบิ้ล,50,50,49,1,38,95,End of Shelf Life
BAT-103,2026-09-18,Mid-day (10:30),บาสก์ชีสเค้กหน้าไหม้,25,25,25,0,52,145,
BAT-104,2026-09-18,Mid-day (10:30),ช็อคโกแลตทาร์ตเบลเยี่ยม,20,20,19,1,48,135,Overbaked
BAT-105,2026-09-18,Afternoon (14:30),ขนมปังโฮลวีต 9 ธัญพืช,35,35,34,1,45,120,End of Shelf Life
BAT-106,2026-09-18,Afternoon (14:30),เดนิชผลไม้สดตามฤดูกาล,30,30,28,2,36,95,End of Shelf Life`;

// Flexible column finder helper
function findVal(row: Record<string, any>, aliases: string[], defaultVal: any = ''): any {
  const normalizedRowKeys = new Map<string, string>();
  for (const k of Object.keys(row)) {
    const cleanK = k.toLowerCase().replace(/[\s_.-]/g, '');
    normalizedRowKeys.set(cleanK, k);
  }

  for (const alias of aliases) {
    const cleanAlias = alias.toLowerCase().replace(/[\s_.-]/g, '');
    if (normalizedRowKeys.has(cleanAlias)) {
      const realKey = normalizedRowKeys.get(cleanAlias)!;
      const val = row[realKey];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return val;
      }
    }
  }
  return defaultVal;
}

export function detectCsvType(csvText: string): 'pos' | 'crm' | 'kitchen' | 'unknown' {
  const firstLines = csvText.split('\n').slice(0, 3).join(' ').toLowerCase();
  if (firstLines.includes('total_visits') || firstLines.includes('recency') || firstLines.includes('rfm') || firstLines.includes('phone') || firstLines.includes('สมาชิก')) {
    return 'crm';
  }
  if (firstLines.includes('actual_baked') || firstLines.includes('planned_qty') || firstLines.includes('waste_qty') || firstLines.includes('อบสด') || firstLines.includes('ของเสีย')) {
    return 'kitchen';
  }
  if (firstLines.includes('transaction') || firstLines.includes('total_amount') || firstLines.includes('amount') || firstLines.includes('bill') || firstLines.includes('ยอดเงิน') || firstLines.includes('บิล')) {
    return 'pos';
  }
  return 'pos'; // default to POS for general sales lists
}

export function parsePosCsv(csvText: string): PosTransaction[] {
  const parsed = Papa.parse<Record<string, any>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  return parsed.data.map((row, index) => {
    const rawAmt = findVal(row, ['total_amount', 'totalamount', 'total', 'amount', 'price', 'net_amount', 'nettotal', 'ยอดเงิน', 'ยอดรวม', 'ราคา', 'จำนวนเงิน', 'ยอดขาย'], '150');
    const totalAmount = parseFloat(String(rawAmt).replace(/[^0-9.-]/g, '')) || 150;

    const rawId = findVal(row, ['transaction_id', 'id', 'bill_id', 'bill_no', 'receipt_no', 'order_id', 'invoice', 'เลขที่บิล', 'รหัสบิล'], `TX-IMP-${index + 1}`);
    const rawTs = findVal(row, ['timestamp', 'date', 'datetime', 'time', 'created_at', 'order_date', 'วันเวลา', 'วันที่'], new Date().toISOString());
    const rawItems = findVal(row, ['items_description', 'items', 'item_name', 'product_name', 'product', 'description', 'ชื่อสินค้า', 'รายการสินค้า', 'รายการ'], 'เบเกอรี่อบสดและเครื่องดื่ม');
    const rawPayment = findVal(row, ['payment_method', 'payment', 'payment_type', 'ช่องทางชำระ', 'วิธีชำระ'], 'PromptPay');
    const rawMember = findVal(row, ['member_id', 'member', 'customer_id', 'customer', 'รหัสสมาชิก'], '');
    let persona = findVal(row, ['customer_persona', 'persona', 'segment', 'customer_type', 'กลุ่มลูกค้า'], '');

    // Normalize persona or infer from hour/amount
    let timeSlot: 'Morning' | 'Noon' | 'Afternoon' | 'Evening' = 'Morning';
    const dateObj = new Date(rawTs);
    let hour = 8;
    if (!isNaN(dateObj.getTime())) {
      hour = dateObj.getHours();
    }

    if (hour >= 6 && hour < 11) timeSlot = 'Morning';
    else if (hour >= 11 && hour < 14) timeSlot = 'Noon';
    else if (hour >= 14 && hour < 18) timeSlot = 'Afternoon';
    else timeSlot = 'Evening';

    if (!persona) {
      if (timeSlot === 'Morning') persona = 'Morning Commuter';
      else if (timeSlot === 'Evening') persona = 'Evening Discount Hunter';
      else if (totalAmount >= 300 || String(rawItems).includes('โฮลวีต') || String(rawItems).includes('ธัญพืช')) persona = 'Health & Family';
      else persona = 'Cafe Hopper';
    }

    return {
      id: String(rawId),
      timestamp: String(rawTs),
      items: [
        {
          productId: `P-IMP-${index + 1}`,
          productName: String(rawItems),
          category: 'Pastry' as const,
          qty: 1,
          price: totalAmount,
        },
      ],
      totalAmount,
      paymentMethod: (String(rawPayment).includes('Credit') ? 'CreditCard' : String(rawPayment).includes('Cash') ? 'Cash' : 'PromptPay') as any,
      memberId: rawMember ? String(rawMember) : undefined,
      customerPersona: persona as any,
      timeSlot,
      isCombo: totalAmount > 150,
    };
  });
}

export function parseCrmCsv(csvText: string): MemberRecord[] {
  const parsed = Papa.parse<Record<string, any>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  return parsed.data.map((row, index) => {
    const rawVisits = findVal(row, ['total_visits', 'visits', 'visit_count', 'จำนวนครั้ง', 'ความถี่'], '5');
    const visits = parseInt(String(rawVisits).replace(/[^0-9]/g, ''), 10) || 5;

    const rawSpent = findVal(row, ['total_spent', 'spent', 'spending', 'total_amount', 'ยอดใช้จ่ายรวม', 'ยอดซื้อรวม'], '1000');
    const spent = parseFloat(String(rawSpent).replace(/[^0-9.-]/g, '')) || 1000;

    const rawRecency = findVal(row, ['recency_days', 'recency', 'days_since_last_visit', 'จำนวนวันที่ไม่ได้มา'], '1');
    const recency = parseInt(String(rawRecency).replace(/[^0-9]/g, ''), 10) || 1;

    const memberId = findVal(row, ['member_id', 'id', 'customer_id', 'รหัสสมาชิก'], `MEM-IMP-${index + 1}`);
    const name = findVal(row, ['name', 'customer_name', 'full_name', 'ชื่อสมาชิก', 'ชื่อ'], `สมาชิกท่านที่ ${index + 1}`);
    const phone = findVal(row, ['phone', 'tel', 'mobile', 'เบอร์โทร'], '08X-XXX-XXXX');
    const joinDate = findVal(row, ['join_date', 'registered_date', 'created_at', 'วันที่สมัคร'], '2026-01-01');
    const lastVisit = findVal(row, ['last_visit', 'last_order_date', 'วันซื้อล่าสุด'], '2026-09-18');
    const persona = findVal(row, ['assigned_persona', 'persona', 'segment', 'กลุ่มลูกค้า'], 'Morning Commuter');
    const favItem = findVal(row, ['favorite_item', 'fav_item', 'top_item', 'สินค้าโปรด'], 'ครัวซองต์เนยฝรั่งเศส');
    const rfmSegment = findVal(row, ['rfm_segment', 'segment_rfm', 'ระดับสมาชิก'], visits >= 20 ? 'Champions' : 'Loyal');

    return {
      id: String(memberId),
      name: String(name),
      phone: String(phone),
      joinDate: String(joinDate),
      totalVisits: visits,
      totalSpent: spent,
      lastVisit: String(lastVisit),
      recencyDays: recency,
      frequencyScore: Math.min(5, Math.max(1, Math.round(visits / 6))),
      monetaryScore: Math.min(5, Math.max(1, Math.round(spent / 2000))),
      assignedPersona: persona as any,
      favoriteItems: [String(favItem)],
      lineOaConnected: true,
      rfmSegment: rfmSegment as any,
    };
  });
}

export function parseKitchenCsv(csvText: string): ProductionBatch[] {
  const parsed = Papa.parse<Record<string, any>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  return parsed.data.map((row, index) => {
    const planned = parseInt(String(findVal(row, ['planned_qty', 'planned', 'แผนการผลิต'], '50')).replace(/[^0-9]/g, ''), 10) || 50;
    const baked = parseInt(String(findVal(row, ['actual_baked', 'baked', 'อบจริง'], '50')).replace(/[^0-9]/g, ''), 10) || 50;
    const sold = parseInt(String(findVal(row, ['actual_sold', 'sold', 'ขายได้'], '48')).replace(/[^0-9]/g, ''), 10) || 48;
    const waste = parseInt(String(findVal(row, ['waste_qty', 'waste', 'ของเสีย', 'เหลือทิ้ง'], '2')).replace(/[^0-9]/g, ''), 10) || 0;
    const cost = parseFloat(String(findVal(row, ['unit_cost', 'cost', 'ต้นทุน'], '35')).replace(/[^0-9.-]/g, '')) || 35;
    const price = parseFloat(String(findVal(row, ['selling_price', 'price', 'ราคาขาย'], '90')).replace(/[^0-9.-]/g, '')) || 90;
    const batchId = findVal(row, ['batch_id', 'id', 'รหัสล็อต'], `BAT-IMP-${index + 1}`);
    const date = findVal(row, ['date', 'datetime', 'วันที่'], '2026-09-18');
    const timeSlot = findVal(row, ['time_slot', 'slot', 'รอบการอบ'], 'Morning (05:30)');
    const productName = findVal(row, ['product_name', 'product', 'name', 'ชื่อเบเกอรี่'], 'เบเกอรี่อบสดประจำวัน');
    const wasteReason = findVal(row, ['waste_reason', 'reason', 'สาเหตุของเสีย'], 'End of Shelf Life');

    return {
      id: String(batchId),
      date: String(date),
      timeSlot: String(timeSlot) as any,
      productId: `PROD-${index + 1}`,
      productName: String(productName),
      category: 'Pastry',
      plannedQty: planned,
      actualBaked: baked,
      actualSold: sold,
      wasteQty: waste,
      unitCost: cost,
      sellingPrice: price,
      wasteReason: String(wasteReason) as any,
    };
  });
}
