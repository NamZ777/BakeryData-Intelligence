import { 
  PosTransaction, 
  MemberRecord, 
  ProductionBatch, 
  MarketBasketRule, 
  DynamicMarkdownRule,
  AbTestResult 
} from '../types/bakery';

export const INITIAL_PRODUCTS = [
  { id: 'P01', name: 'ครัวซองต์เนยฝรั่งเศส (Butter Croissant)', category: 'Pastry', price: 85, cost: 32 },
  { id: 'P02', name: 'แซนด์วิชแฮมชีสดับเบิ้ล (Ham & Cheese Sandwich)', category: 'Bread', price: 95, cost: 38 },
  { id: 'P03', name: 'กาแฟอเมริกาโน่ร้อน (Hot Americano)', category: 'Beverage', price: 75, cost: 18 },
  { id: 'P04', name: 'ชาเขียวมัทฉะลาเต้เย็น (Uji Matcha Latte)', category: 'Beverage', price: 110, cost: 35 },
  { id: 'P05', name: 'บาสก์ชีสเค้กหน้าไหม้ (Burnt Cheesecake)', category: 'Cake', price: 145, cost: 52 },
  { id: 'P06', name: 'ช็อคโกแลตทาร์ตเบลเยี่ยม (Belgian Choc Tart)', category: 'Cake', price: 135, cost: 48 },
  { id: 'P07', name: 'ขนมปังโฮลวีต 9 ธัญพืช (9-Grain Wholewheat)', category: 'Healthy', price: 120, cost: 45 },
  { id: 'P08', name: 'ขนมปังซาวเวอร์โดว์สูตรธรรมชาติ (Sourdough Loaf)', category: 'Healthy', price: 140, cost: 40 },
  { id: 'P09', name: 'นมแอลมอนด์ออร์แกนิก (Organic Almond Milk)', category: 'Beverage', price: 65, cost: 28 },
  { id: 'P10', name: 'ชุดมอร์นิ่งคอมโบ (Americano + Croissant)', category: 'Combo', price: 145, cost: 50 },
  { id: 'P11', name: 'เดนิชผลไม้สดตามฤดูกาล (Seasonal Fruit Danish)', category: 'Pastry', price: 95, cost: 36 },
  { id: 'P12', name: 'ขนมปังเนยสดน้ำตาลไอซิ่ง (Soft Butter Bread)', category: 'Bread', price: 60, cost: 22 },
];

export const INITIAL_TRANSACTIONS: PosTransaction[] = [
  {
    id: 'TX-1001',
    timestamp: '2026-09-18T07:15:00Z',
    items: [
      { productId: 'P03', productName: 'กาแฟอเมริกาโน่ร้อน (Hot Americano)', category: 'Beverage', qty: 1, price: 75 },
      { productId: 'P01', productName: 'ครัวซองต์เนยฝรั่งเศส (Butter Croissant)', category: 'Pastry', qty: 1, price: 85 }
    ],
    totalAmount: 160,
    paymentMethod: 'PromptPay',
    memberId: 'MEM-001',
    customerPersona: 'Morning Commuter',
    timeSlot: 'Morning',
    isCombo: true
  },
  {
    id: 'TX-1002',
    timestamp: '2026-09-18T07:42:00Z',
    items: [
      { productId: 'P02', productName: 'แซนด์วิชแฮมชีสดับเบิ้ล (Ham & Cheese Sandwich)', category: 'Bread', qty: 1, price: 95 },
      { productId: 'P03', productName: 'กาแฟอเมริกาโน่ร้อน (Hot Americano)', category: 'Beverage', qty: 1, price: 75 }
    ],
    totalAmount: 170,
    paymentMethod: 'PromptPay',
    memberId: 'MEM-002',
    customerPersona: 'Morning Commuter',
    timeSlot: 'Morning',
    isCombo: true
  },
  {
    id: 'TX-1003',
    timestamp: '2026-09-18T08:10:00Z',
    items: [
      { productId: 'P10', productName: 'ชุดมอร์นิ่งคอมโบ (Americano + Croissant)', category: 'Combo', qty: 1, price: 145 },
      { productId: 'P12', productName: 'ขนมปังเนยสดน้ำตาลไอซิ่ง (Soft Butter Bread)', category: 'Bread', qty: 1, price: 60 }
    ],
    totalAmount: 205,
    paymentMethod: 'CreditCard',
    memberId: 'MEM-003',
    customerPersona: 'Morning Commuter',
    timeSlot: 'Morning',
    isCombo: true
  },
  {
    id: 'TX-1004',
    timestamp: '2026-09-18T13:20:00Z',
    items: [
      { productId: 'P04', productName: 'ชาเขียวมัทฉะลาเต้เย็น (Uji Matcha Latte)', category: 'Beverage', qty: 1, price: 110 },
      { productId: 'P05', productName: 'บาสก์ชีสเค้กหน้าไหม้ (Burnt Cheesecake)', category: 'Cake', qty: 1, price: 145 },
      { productId: 'P11', productName: 'เดนิชผลไม้สดตามฤดูกาล (Seasonal Fruit Danish)', category: 'Pastry', qty: 1, price: 95 }
    ],
    totalAmount: 350,
    paymentMethod: 'CreditCard',
    memberId: 'MEM-004',
    customerPersona: 'Cafe Hopper',
    timeSlot: 'Afternoon'
  },
  {
    id: 'TX-1005',
    timestamp: '2026-09-18T14:45:00Z',
    items: [
      { productId: 'P04', productName: 'ชาเขียวมัทฉะลาเต้เย็น (Uji Matcha Latte)', category: 'Beverage', qty: 2, price: 110 },
      { productId: 'P06', productName: 'ช็อคโกแลตทาร์ตเบลเยี่ยม (Belgian Choc Tart)', category: 'Cake', qty: 1, price: 135 }
    ],
    totalAmount: 355,
    paymentMethod: 'LINE Pay',
    memberId: 'MEM-005',
    customerPersona: 'Cafe Hopper',
    timeSlot: 'Afternoon'
  },
  {
    id: 'TX-1006',
    timestamp: '2026-09-18T16:10:00Z',
    items: [
      { productId: 'P07', productName: 'ขนมปังโฮลวีต 9 ธัญพืช (9-Grain Wholewheat)', category: 'Healthy', qty: 2, price: 120 },
      { productId: 'P08', productName: 'ขนมปังซาวเวอร์โดว์สูตรธรรมชาติ (Sourdough Loaf)', category: 'Healthy', qty: 1, price: 140 },
      { productId: 'P09', productName: 'นมแอลมอนด์ออร์แกนิก (Organic Almond Milk)', category: 'Beverage', qty: 2, price: 65 }
    ],
    totalAmount: 510,
    paymentMethod: 'CreditCard',
    memberId: 'MEM-006',
    customerPersona: 'Health & Family',
    timeSlot: 'Afternoon'
  },
  {
    id: 'TX-1007',
    timestamp: '2026-09-18T17:30:00Z',
    items: [
      { productId: 'P07', productName: 'ขนมปังโฮลวีต 9 ธัญพืช (9-Grain Wholewheat)', category: 'Healthy', qty: 1, price: 120 },
      { productId: 'P02', productName: 'แซนด์วิชแฮมชีสดับเบิ้ล (Ham & Cheese Sandwich)', category: 'Bread', qty: 2, price: 95 }
    ],
    totalAmount: 310,
    paymentMethod: 'PromptPay',
    memberId: 'MEM-007',
    customerPersona: 'Health & Family',
    timeSlot: 'Afternoon'
  },
  {
    id: 'TX-1008',
    timestamp: '2026-09-18T18:50:00Z',
    items: [
      { productId: 'P01', productName: 'ครัวซองต์เนยฝรั่งเศส (Butter Croissant)', category: 'Pastry', qty: 2, price: 68 }, // 20% off markdown
      { productId: 'P11', productName: 'เดนิชผลไม้สดตามฤดูกาล (Seasonal Fruit Danish)', category: 'Pastry', qty: 2, price: 76 }
    ],
    totalAmount: 288,
    paymentMethod: 'PromptPay',
    customerPersona: 'Evening Discount Hunter',
    timeSlot: 'Evening'
  },
  {
    id: 'TX-1009',
    timestamp: '2026-09-18T19:25:00Z',
    items: [
      { productId: 'P12', productName: 'ขนมปังเนยสดน้ำตาลไอซิ่ง (Soft Butter Bread)', category: 'Bread', qty: 3, price: 42 }, // 30% off markdown
      { productId: 'P06', productName: 'ช็อคโกแลตทาร์ตเบลเยี่ยม (Belgian Choc Tart)', category: 'Cake', qty: 1, price: 95 }
    ],
    totalAmount: 221,
    paymentMethod: 'Cash',
    customerPersona: 'Evening Discount Hunter',
    timeSlot: 'Evening'
  }
];

export const INITIAL_MEMBERS: MemberRecord[] = [
  {
    id: 'MEM-001',
    name: 'คุณธีรภัทร ชาญวิทย์',
    phone: '081-944-XXXX',
    joinDate: '2026-01-12',
    totalVisits: 28,
    totalSpent: 4820,
    lastVisit: '2026-09-18',
    recencyDays: 0,
    frequencyScore: 5,
    monetaryScore: 4,
    assignedPersona: 'Morning Commuter',
    favoriteItems: ['กาแฟอเมริกาโน่ร้อน (Hot Americano)', 'ครัวซองต์เนยฝรั่งเศส (Butter Croissant)'],
    lineOaConnected: true,
    rfmSegment: 'Champions'
  },
  {
    id: 'MEM-002',
    name: 'คุณวริศรา นภดล',
    phone: '089-211-XXXX',
    joinDate: '2026-02-05',
    totalVisits: 22,
    totalSpent: 3950,
    lastVisit: '2026-09-18',
    recencyDays: 0,
    frequencyScore: 4,
    monetaryScore: 4,
    assignedPersona: 'Morning Commuter',
    favoriteItems: ['แซนด์วิชแฮมชีสดับเบิ้ล (Ham & Cheese Sandwich)', 'กาแฟอเมริกาโน่ร้อน (Hot Americano)'],
    lineOaConnected: true,
    rfmSegment: 'Champions'
  },
  {
    id: 'MEM-003',
    name: 'คุณณัฐชนก สิริกุล',
    phone: '086-455-XXXX',
    joinDate: '2026-03-14',
    totalVisits: 14,
    totalSpent: 5120,
    lastVisit: '2026-09-15',
    recencyDays: 3,
    frequencyScore: 4,
    monetaryScore: 5,
    assignedPersona: 'Cafe Hopper',
    favoriteItems: ['บาสก์ชีสเค้กหน้าไหม้ (Burnt Cheesecake)', 'ชาเขียวมัทฉะลาเต้เย็น (Uji Matcha Latte)'],
    lineOaConnected: true,
    rfmSegment: 'Loyal'
  },
  {
    id: 'MEM-004',
    name: 'คุณพิมพ์ใจ รัตนศิริ',
    phone: '082-333-XXXX',
    joinDate: '2025-11-20',
    totalVisits: 31,
    totalSpent: 9840,
    lastVisit: '2026-09-16',
    recencyDays: 2,
    frequencyScore: 5,
    monetaryScore: 5,
    assignedPersona: 'Health & Family',
    favoriteItems: ['ขนมปังโฮลวีต 9 ธัญพืช (9-Grain Wholewheat)', 'ขนมปังซาวเวอร์โดว์สูตรธรรมชาติ (Sourdough Loaf)'],
    lineOaConnected: true,
    rfmSegment: 'Champions'
  },
  {
    id: 'MEM-005',
    name: 'คุณกิตติศักดิ์ เจริญพร',
    phone: '085-789-XXXX',
    joinDate: '2026-05-18',
    totalVisits: 9,
    totalSpent: 1650,
    lastVisit: '2026-09-17',
    recencyDays: 1,
    frequencyScore: 3,
    monetaryScore: 2,
    assignedPersona: 'Evening Discount Hunter',
    favoriteItems: ['เดนิชผลไม้สดตามฤดูกาล (Seasonal Fruit Danish)', 'ขนมปังเนยสดน้ำตาลไอซิ่ง (Soft Butter Bread)'],
    lineOaConnected: false,
    rfmSegment: 'Potential Loyalist'
  },
  {
    id: 'MEM-006',
    name: 'คุณสลิลทิพย์ เมธาวี',
    phone: '091-665-XXXX',
    joinDate: '2026-04-02',
    totalVisits: 17,
    totalSpent: 6300,
    lastVisit: '2026-09-14',
    recencyDays: 4,
    frequencyScore: 4,
    monetaryScore: 5,
    assignedPersona: 'Cafe Hopper',
    favoriteItems: ['ช็อคโกแลตทาร์ตเบลเยี่ยม (Belgian Choc Tart)', 'ชาเขียวมัทฉะลาเต้เย็น (Uji Matcha Latte)'],
    lineOaConnected: true,
    rfmSegment: 'Loyal'
  },
  {
    id: 'MEM-007',
    name: 'คุณธวัชชัย วงศ์สว่าง',
    phone: '087-124-XXXX',
    joinDate: '2025-10-10',
    totalVisits: 8,
    totalSpent: 2100,
    lastVisit: '2026-08-20',
    recencyDays: 29,
    frequencyScore: 2,
    monetaryScore: 3,
    assignedPersona: 'Health & Family',
    favoriteItems: ['ขนมปังโฮลวีต 9 ธัญพืช (9-Grain Wholewheat)'],
    lineOaConnected: true,
    rfmSegment: 'At Risk'
  }
];

export const INITIAL_BATCHES: ProductionBatch[] = [
  {
    id: 'BAT-20260918-01',
    date: '2026-09-18',
    timeSlot: 'Morning (05:30)',
    productId: 'P01',
    productName: 'ครัวซองต์เนยฝรั่งเศส (Butter Croissant)',
    category: 'Pastry',
    plannedQty: 60,
    actualBaked: 60,
    actualSold: 56,
    wasteQty: 2,
    unitCost: 32,
    sellingPrice: 85,
    wasteReason: 'Aesthetic Defect'
  },
  {
    id: 'BAT-20260918-02',
    date: '2026-09-18',
    timeSlot: 'Morning (05:30)',
    productId: 'P02',
    productName: 'แซนด์วิชแฮมชีสดับเบิ้ล (Ham & Cheese Sandwich)',
    category: 'Bread',
    plannedQty: 45,
    actualBaked: 45,
    actualSold: 43,
    wasteQty: 1,
    unitCost: 38,
    sellingPrice: 95,
    wasteReason: 'End of Shelf Life'
  },
  {
    id: 'BAT-20260918-03',
    date: '2026-09-18',
    timeSlot: 'Mid-day (10:30)',
    productId: 'P05',
    productName: 'บาสก์ชีสเค้กหน้าไหม้ (Burnt Cheesecake)',
    category: 'Cake',
    plannedQty: 24,
    actualBaked: 24,
    actualSold: 23,
    wasteQty: 0,
    unitCost: 52,
    sellingPrice: 145
  },
  {
    id: 'BAT-20260918-04',
    date: '2026-09-18',
    timeSlot: 'Mid-day (10:30)',
    productId: 'P06',
    productName: 'ช็อคโกแลตทาร์ตเบลเยี่ยม (Belgian Choc Tart)',
    category: 'Cake',
    plannedQty: 20,
    actualBaked: 20,
    actualSold: 19,
    wasteQty: 1,
    unitCost: 48,
    sellingPrice: 135,
    wasteReason: 'Overbaked'
  },
  {
    id: 'BAT-20260918-05',
    date: '2026-09-18',
    timeSlot: 'Afternoon (14:30)',
    productId: 'P07',
    productName: 'ขนมปังโฮลวีต 9 ธัญพืช (9-Grain Wholewheat)',
    category: 'Healthy',
    plannedQty: 30,
    actualBaked: 30,
    actualSold: 28,
    wasteQty: 1,
    unitCost: 45,
    sellingPrice: 120,
    wasteReason: 'End of Shelf Life'
  },
  {
    id: 'BAT-20260918-06',
    date: '2026-09-18',
    timeSlot: 'Afternoon (14:30)',
    productId: 'P11',
    productName: 'เดนิชผลไม้สดตามฤดูกาล (Seasonal Fruit Danish)',
    category: 'Pastry',
    plannedQty: 25,
    actualBaked: 25,
    actualSold: 22,
    wasteQty: 2,
    unitCost: 36,
    sellingPrice: 95,
    wasteReason: 'End of Shelf Life'
  }
];

export const INITIAL_MARKET_BASKET_RULES: MarketBasketRule[] = [
  {
    id: 'RUL-01',
    antecedent: ['กาแฟอเมริกาโน่ร้อน (Hot Americano)'],
    consequent: ['ครัวซองต์เนยฝรั่งเศส (Butter Croissant)'],
    support: 0.28,
    confidence: 0.82,
    lift: 2.45,
    bundleName: 'Parisian Morning Starter (อเมริกาโน่ + ครัวซองต์)',
    bundlePrice: 145,
    regularPrice: 160,
    targetPersona: 'Morning Commuter'
  },
  {
    id: 'RUL-02',
    antecedent: ['กาแฟอเมริกาโน่ร้อน (Hot Americano)'],
    consequent: ['แซนด์วิชแฮมชีสดับเบิ้ล (Ham & Cheese Sandwich)'],
    support: 0.22,
    confidence: 0.74,
    lift: 2.15,
    bundleName: 'Executive Power Breakfast (อเมริกาโน่ + แซนด์วิชแฮมชีส)',
    bundlePrice: 155,
    regularPrice: 170,
    targetPersona: 'Morning Commuter'
  },
  {
    id: 'RUL-03',
    antecedent: ['ชาเขียวมัทฉะลาเต้เย็น (Uji Matcha Latte)'],
    consequent: ['บาสก์ชีสเค้กหน้าไหม้ (Burnt Cheesecake)'],
    support: 0.19,
    confidence: 0.68,
    lift: 2.80,
    bundleName: 'Kyoto Aesthetic High-Tea (มัทฉะลาเต้ + ชีสเค้กหน้าไหม้)',
    bundlePrice: 235,
    regularPrice: 255,
    targetPersona: 'Cafe Hopper'
  },
  {
    id: 'RUL-04',
    antecedent: ['ขนมปังโฮลวีต 9 ธัญพืช (9-Grain Wholewheat)'],
    consequent: ['นมแอลมอนด์ออร์แกนิก (Organic Almond Milk)'],
    support: 0.16,
    confidence: 0.71,
    lift: 3.10,
    bundleName: 'Wellness Family Bundle (โฮลวีต 9 ธัญพืช + นมแอลมอนด์)',
    bundlePrice: 165,
    regularPrice: 185,
    targetPersona: 'Health & Family'
  }
];

export const INITIAL_MARKDOWN_RULES: DynamicMarkdownRule[] = [
  {
    timeSlot: '18:30 - 19:15',
    discountPct: 20,
    minRemainingStock: 8,
    targetItems: ['ครัวซองต์เนยฝรั่งเศส', 'เดนิชผลไม้สด', 'แซนด์วิชแฮมชีส'],
    salvageRateExpected: 65,
    status: 'Active'
  },
  {
    timeSlot: '19:15 - 20:00',
    discountPct: 35,
    minRemainingStock: 4,
    targetItems: ['เบเกอรี่สดทุกรายการที่อบในวัน'],
    salvageRateExpected: 92,
    status: 'Scheduled'
  }
];

export const INITIAL_AB_TEST: AbTestResult = {
  campaignName: 'CRISP-DM Personalized LINE OA vs General Broadcast (รอบ 30 วัน)',
  targetGroup: 'สมาชิก 2,450 คน (แบ่งกลุ่มทดลอง 50/50)',
  personalizedStrategy: {
    channel: 'LINE OA Smart Segmented',
    message: 'คุณธีรภัทร รับเช้าสดใสด้วยชุด Parisian Combo ลดพิเศษ 20 บาท กดรับแล้วแวะรับได้ทันทีไม่ต้องรอคิว (06:30 น.)',
    sendTime: 'ตรงตามเวลาประจำของแต่ละ Persona',
    sentCount: 1225,
    openRate: 64.8,
    redemptionRate: 28.4,
    incrementalRevenue: 68450
  },
  controlStrategy: {
    channel: 'LINE OA Broadcast รวม',
    message: 'โปรโมชั่นสัปดาห์นี้ ซื้อเบเกอรี่ 2 ชิ้นลด 10 บาทที่หน้าร้านทุกสาขา',
    sendTime: 'ส่งรอบเดียวเวลา 11:30 น.',
    sentCount: 1225,
    openRate: 24.2,
    redemptionRate: 9.1,
    incrementalRevenue: 22100
  },
  upliftPercent: 212.4
};
