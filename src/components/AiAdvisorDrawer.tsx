import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Lightbulb, 
  RotateCcw,
  Copy,
  Check,
  Cpu,
  Layers,
  ChevronDown,
  ShoppingBag,
  Flame,
  TrendingDown,
  Users,
  DollarSign,
  Binary
} from 'lucide-react';
import { UserRole, TargetKpis, PosTransaction, MemberRecord, ProductionBatch } from '../types/bakery';
import { PersonaMetrics } from '../utils/crispDmEngine';

interface AiAdvisorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  kpis: TargetKpis;
  personas: PersonaMetrics[];
  transactions?: PosTransaction[];
  members?: MemberRecord[];
  batches?: ProductionBatch[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  modelUsed?: string;
  suggestions?: string[];
}

interface PromptCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  prompts: string[];
}

const GEMINI_MODELS = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    badge: 'แนะนำ • ฉลาดรอบด้าน',
    description: 'ความแม่นยำสูง ตอบตรงประเด็น รวดเร็ว เหมาะกับการตัดสินใจทางธุรกิจและกลยุทธ์ประจำวัน',
    tag: 'Recommended'
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    badge: 'เร็วพิเศษ • Latency ต่ำ',
    description: 'เน้นความเร็วสูงสุด ตอบกลับฉับไวทันใจ เหมาะกับคำถามสั้นและบทสนทนาต่อเนื่อง',
    tag: 'Ultra-Fast'
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    badge: 'เวอร์ชันล่าสุด',
    description: 'โมเดล Flash สถาปัตยกรรมล่าสุด อัปเดตการประมวลผลคำสั่งภาษาไทยได้อย่างเป็นธรรมชาติ',
    tag: 'Latest'
  },
  {
    id: 'gemini-4-argon',
    name: 'Gemini 4 Argon',
    badge: 'คิดเชิงลึก • Data Reasoning',
    description: 'ให้เหตุผลหลายขั้นตอน วิเคราะห์ตัวเลข สถิติความน่าจะเป็น และความคุ้มทุนขั้นสูง',
    tag: 'Deep Reasoning'
  },
];

const PROMPT_CATEGORIES: PromptCategory[] = [
  {
    id: 'sales',
    name: 'หน้าร้าน & เพิ่มยอดขาย',
    icon: ShoppingBag,
    prompts: [
      'ขอสคริปต์คำพูดแคชเชียร์เชียร์ขายคอมโบเช้า ดันยอดบิลแตะ ฿215',
      'วิเคราะห์คู่สินค้าขายดีตาม Market Basket Analysis เพื่อจัดโปรโมชั่น',
      'วิธีแก้ปัญหาคิวยาวหน้าร้านช่วงชั่วโมงเร่งด่วน 07:30 - 08:30 น.',
      'เทคนิคจัดวางดิสเพลย์ขนมสดบริเวณเคาน์เตอร์เพื่อกระตุ้น Impulse Buy',
    ],
  },
  {
    id: 'kitchen',
    name: 'ครัว & แผนการอบ',
    icon: Flame,
    prompts: [
      'วางตารางเวลาอบขนม 3 รอบ (เช้า-สาย-บ่าย) ป้องกันขนมขาดช่วง',
      'วิธีคำนวณปริมาณแป้งและเนยสำหรับวันหยุดเสาร์-อาทิตย์เพื่อลด Waste',
      'ควรใช้เทคนิค Par-baked อบกึ่งสำเร็จรูปกับเมนูใดบ้างและคุมต้นทุนอย่างไร?',
      'เกณฑ์การตรวจสอบคุณภาพความสด (Freshness Audit) ประจำวันของเชฟ',
    ],
  },
  {
    id: 'waste',
    name: 'ลดขยะ & Markdown',
    icon: TrendingDown,
    prompts: [
      'กำหนดไทม์ไลน์ Dynamic Markdown ช่วงเย็น (18:30-20:00) ให้สต็อกเหลือ 0',
      'ครัวซองต์และขนมปังสดที่เหลือขายสามารถแปรรูปเป็นเมนูใหม่อะไรได้บ้าง?',
      'คำนวณเงินที่ประหยัดได้ต่อเดือนหากลดของเสียลง 20% ตามเป้าหมาย',
      'วิธีจัด Happy Hour Bundle เคลียร์ขนมโดยไม่เสียภาพลักษณ์แบรนด์พรีเมียม',
    ],
  },
  {
    id: 'crm',
    name: 'ลูกค้า & LINE OA',
    icon: Users,
    prompts: [
      'เขียนข้อความบรอดแคสต์ LINE OA ยิงหา Morning Commuter เวลา 06:45 น.',
      'แคมเปญวันหยุดกระตุ้นกลุ่ม Cafe Hopper & Creator ให้กลับมาร้านซ้ำ',
      'กลยุทธ์บันไดสะสมแต้ม เพิ่มอัตราซื้อซ้ำ (Retention) แตะ 25%',
      'วิธีออกแบบคูปอง Personalized Voucher ผ่าน LINE OA ให้ได้ผลตอบรับสูง',
    ],
  },
  {
    id: 'executive',
    name: 'กำไร & การเงิน',
    icon: DollarSign,
    prompts: [
      'วิเคราะห์ Gross Profit Margin แต่ละหมวดสินค้าและจุดที่ควรปรับราคา',
      'ประเมินผลกำไรสุทธิรายปีที่จะเพิ่มขึ้นหลังทำตามโมเดล CRISP-DM',
      'โครงสร้างต้นทุนและเกณฑ์ตัดสินใจขยายตู้แช่หรือเครื่องอบใหม่',
      'วิธีจัดสรรงบการตลาดระหว่างกลุ่มลูกค้าขาประจำกับลูกค้าใหม่',
    ],
  },
  {
    id: 'datascience',
    name: 'Data Science & CRISP-DM',
    icon: Binary,
    prompts: [
      'อธิบายค่า Support, Confidence, Lift ในการจับคู่ขนมกับเครื่องดื่ม',
      'ผลการแบ่งกลุ่ม K-Means Persona 4 กลุ่มนี้วัดจากตัวแปร RFM ใดบ้าง?',
      'ขั้นตอน Business Understanding และ Data Understanding สรุปอย่างไร?',
      'แนวทางการเก็บข้อมูลเพิ่มเพื่อพัฒนา Time-Series Demand Forecast',
    ],
  },
];

export const AiAdvisorDrawer: React.FC<AiAdvisorDrawerProps> = ({
  isOpen,
  onClose,
  currentRole,
  kpis,
  personas,
  transactions = [],
  members = [],
  batches = [],
}) => {
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [selectedRole, setSelectedRole] = useState<string>('auto');
  const [activeCategory, setActiveCategory] = useState<string>('sales');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Compute store context snapshot to ground AI in actual store facts
  const storeContext = useMemo(() => {
    // Top products
    const productCounts: Record<string, number> = {};
    for (const tx of transactions) {
      for (const item of tx.items) {
        productCounts[item.productName] = (productCounts[item.productName] || 0) + item.qty;
      }
    }
    const topProducts = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => `${name} (${count} ชิ้น)`);

    // Top wasted items
    const wasteCounts: Record<string, number> = {};
    for (const b of batches) {
      if (b.wasteQty > 0) {
        wasteCounts[b.productName] = (wasteCounts[b.productName] || 0) + b.wasteQty;
      }
    }
    const topWasted = Object.entries(wasteCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, count]) => `${name} (${count} ชิ้น)`);

    return {
      totalTransactions: transactions.length,
      totalMembers: members.length,
      totalBatches: batches.length,
      topProducts,
      topWasted,
      commonPairs: [
        'ครัวซองต์เนยสด + อเมริกาโน่เย็น (Lift 1.82)',
        'ชีสเค้กหน้าไหม้ + ชาเขียวมัทฉะ (Lift 1.64)',
        'ขนมปังโฮลวีต + แยมสตรอว์เบอร์รี (Lift 1.45)',
      ],
    };
  }, [transactions, members, batches]);

  const initialRoleLabel = currentRole === 'kitchen' 
    ? 'ห้องครัวและเชฟ' 
    : currentRole === 'manager' 
      ? 'ผู้จัดการหน้าร้าน' 
      : 'ฝ่ายบริหารและการเงิน';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: `สวัสดีครับ! ผมคือ **CRISP-DM Bakery AI Consultant** ที่ปรึกษาธุรกิจเบเกอรี่และการตัดสินใจเชิงข้อมูล

ระบบเชื่อมต่อกับข้อมูลร้านของคุณเรียบร้อยแล้ว:
• **ของเสียเบเกอรี่**: ${kpis.wasteRate.current}% (เป้าหมายลด 20% สู่ ≤14.8%)
• **ยอดเฉลี่ยต่อบิล**: ฿${kpis.ticketSize.current} (เป้าหมายเพิ่ม 15% สู่ ≥฿215)
• **อัตราซื้อซ้ำสมาชิก**: ${kpis.retentionRate.current}% (เป้าหมายเพิ่ม 25% สู่ ≥75%)

คุณสามารถสอบถามได้ทุกหัวข้อ ทั้งสคริปต์พูดหน้าร้าน, ตารางเวลาอบขนม, เวลาจัด Dynamic Markdown, หรือกลยุทธ์การเงิน โดยระบุคำถามด้านล่าง หรือเลือกจากหมวดหมู่คำถามแนะนำได้ทันทีครับ!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.8-flash',
      suggestions: [
        'ขอสคริปต์แคชเชียร์เชียร์ขายคอมโบเช้า ดันยอดบิลแตะ ฿215',
        'กำหนดไทม์ไลน์ Dynamic Markdown ช่วงเย็น (18:30-20:00) ให้สต็อกเหลือ 0',
        'วางตารางเวลาอบขนม 3 รอบ (เช้า-สาย-บ่าย) ป้องกันขนมขาดช่วง',
      ],
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const resolvedRole = selectedRole === 'auto'
    ? (currentRole === 'kitchen' ? 'เชฟห้องครัว' : currentRole === 'manager' ? 'ผู้จัดการร้าน' : 'ฝ่ายบริหาร')
    : selectedRole;

  const handleSendMessage = async (promptToSend?: string) => {
    const text = (promptToSend || inputValue).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!promptToSend) setInputValue('');
    setLoading(true);

    try {
      // Build conversation history for multi-turn continuity
      const chatHistory = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const response = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: resolvedRole,
          model: selectedModel,
          currentMetrics: {
            wasteRate: kpis.wasteRate.current,
            avgTicketSize: kpis.ticketSize.current,
            retentionRate: kpis.retentionRate.current,
            costSaved: kpis.wasteRate.costSavedBath,
            extraRevenue: kpis.ticketSize.extraRevenueBath,
            totalRevenue: transactions.reduce((acc, t) => acc + t.totalAmount, 0),
          },
          personaData: personas.map(p => ({ name: p.name, pct: p.pct })),
          storeContext,
          queryPrompt: text,
          history: chatHistory,
          focusTopic: PROMPT_CATEGORIES.find(c => c.id === activeCategory)?.name,
        }),
      });

      const data = await response.json();
      const aiResponseText = data.analysis || data.fallback || 'ขออภัย ไม่สามารถประมวลผลคำตอบได้ในขณะนี้';

      // Dynamic smart follow-up suggestions based on query context
      let suggestions: string[] = [];
      const lower = text.toLowerCase();
      if (lower.includes('สคริปต์') || lower.includes('แคชเชียร์') || lower.includes('upsell')) {
        suggestions = [
          'ขอเวอร์ชันสำหรับลูกค้าที่ดูรีบร้อนช่วงเช้า',
          'ถ้าลูกค้าปฏิเสธ ควรมีสคริปต์แก้ข้อโต้แย้งอย่างไร?',
          'แนะนำของแถมมินิทดลองชิมที่กระตุ้นการตัดสินใจ',
        ];
      } else if (lower.includes('markdown') || lower.includes('ลดราคา') || lower.includes('ขยะ')) {
        suggestions = [
          'ขอสคริปต์พูดแจ้งลูกค้าหน้าร้านเมื่อเริ่มลดราคา 18:30 น.',
          'วิธีคำนวณราคาขายต่อชิ้นของเมนูแปรรูป Almond Croissant',
          'ของเสียที่เกิดจากตำหนิรูปลักษณ์ แก้ไขที่ขั้นตอนใดได้บ้าง?',
        ];
      } else if (lower.includes('อบ') || lower.includes('ครัว') || lower.includes('ตาราง')) {
        suggestions = [
          'ขั้นตอนการเตรียม Par-baked ครัวซองต์และวิธีเก็บรักษา',
          'รายการวัตถุดิบที่ต้องสั่งสต็อกเพิ่มสำหรับวันหยุด',
          'วิธีปรับอุณหภูมิเตาอบเมื่อเปลี่ยนชนิดแป้ง',
        ];
      } else if (lower.includes('line') || lower.includes('สมาชิก') || lower.includes('retention')) {
        suggestions = [
          'ขอข้อความบรอดแคสต์สำหรับกลุ่ม Cafe Hopper บ่ายวันเสาร์',
          'ข้อเสนอพิเศษสำหรับลูกค้าที่ไม่ได้มาเกิน 30 วัน (At-Risk)',
          'วิธีกำหนดวันหมดอายุคูปองเพื่อเร่งการกลับมาซื้อซ้ำ',
        ];
      } else {
        suggestions = [
          'ขอสรุปเป็น 3 ข้อสั้นๆ สำหรับนำไปประชุมทีม',
          'มีตัวเลขผลตอบแทนทางการเงิน (ROI) ประกอบหรือไม่?',
          'มีขั้นตอนใดที่เริ่มลงมือทำได้ทันทีในวันนี้บ้าง?',
        ];
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || selectedModel,
        suggestions,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Advisor request error:', err);
      const fallbackMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `### 🎯 คำแนะนำโดยตรงสำหรับ: "${text}"

**การนำไปปฏิบัติทันที**:
1. **ลดของเสีย (-20%)**: ลดปริมาณการอบรอบบ่ายลง 15% พร้อมเปิดใช้ Dynamic Markdown 18:30 น. (ลด 20%) และ 19:15 น. (ลด 35%)
2. **เพิ่ม Ticket Size (+15%)**: เชียร์ขายคอมโบกาแฟ + มินิครัวซองต์เช้า ราคาพิเศษประหยัด ฿25
3. **เพิ่ม Retention (+25%)**: บรอดแคสต์ LINE OA เวลา 06:45 น. มอบคูปองส่วนลดวันเกิดและสิทธิพิเศษสมาชิก`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'CRISP-DM Local Heuristics',
        suggestions: [
          'ขอสคริปต์แคชเชียร์เชียร์ขายแบบละเอียด',
          'วิธีจัดการ Dynamic Markdown ช่วงค่ำ',
          'ตารางการผลิตรอบเช้า 05:30 น.',
        ],
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'ai',
        text: `เริ่มบทสนทนาใหม่เรียบร้อยครับ! ผมพร้อมช่วยคุณตอบคำถามเชิงลึก วางแผนการผลิต การขาย และกลยุทธ์ธุรกิจเบเกอรี่

ข้อมูลร้านปัจจุบัน: บิล ${storeContext.totalTransactions} รายการ | ขยะ ${kpis.wasteRate.current}% | สมาชิก ${storeContext.totalMembers} คน
ต้องการให้ผมช่วยวิเคราะห์หรือตอบคำถามในหัวข้อใดเป็นพิเศษครับ?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
        suggestions: [
          'ขอสคริปต์แคชเชียร์เชียร์ขายคอมโบเช้า ดันยอดบิลแตะ ฿215',
          'กำหนดไทม์ไลน์ Dynamic Markdown ช่วงเย็น (18:30-20:00) ให้สต็อกเหลือ 0',
          'วางตารางเวลาอบขนม 3 รอบ (เช้า-สาย-บ่าย) ป้องกันขนมขาดช่วง',
        ],
      },
    ]);
  };

  const currentCategoryData = PROMPT_CATEGORIES.find(c => c.id === activeCategory) || PROMPT_CATEGORIES[0];
  const activeModelObj = GEMINI_MODELS.find(m => m.id === selectedModel) || GEMINI_MODELS[0];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-950/70 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl border-l border-stone-200">
        
        {/* Top Header */}
        <div className="p-4 border-b border-stone-800 bg-stone-900 text-stone-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-stone-950 shadow-md">
                <Sparkles className="w-5 h-5 fill-stone-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">ที่ปรึกษาธุรกิจเบเกอรี่ AI</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                    <Cpu className="w-2.5 h-2.5" />
                    <span>{activeModelObj.name}</span>
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  ตอบตรงประเด็น • เชื่อมต่อข้อมูลจริง CRISP-DM • หลากหลายมิติ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleNewChat}
                title="เริ่มบทสนทนาใหม่ (New Chat)"
                className="p-2 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition text-xs flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">เริ่มใหม่</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Controls Bar: Model Switcher & Role Perspective */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800 text-xs">
            {/* Model Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-stone-400">โมเดล AI:</span>
              <div className="relative inline-block">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-stone-800 text-amber-300 text-xs font-medium rounded-lg px-2.5 py-1.5 pr-7 border border-stone-700 hover:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer appearance-none"
                >
                  {GEMINI_MODELS.map((m) => (
                    <option key={m.id} value={m.id} className="bg-stone-900 text-stone-200">
                      {m.name} ({m.badge})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2 top-2 pointer-events-none" />
              </div>
            </div>

            {/* Role Perspective Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-stone-400">มุมมอง:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-stone-800 text-stone-200 text-xs rounded-lg px-2.5 py-1.5 border border-stone-700 hover:border-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="auto">อัตโนมัติ ({initialRoleLabel})</option>
                <option value="ผู้จัดการร้าน">ผู้จัดการหน้าร้าน (Front of House)</option>
                <option value="เชฟห้องครัว">หัวหน้าเชฟห้องครัว (Baking & Kitchen)</option>
                <option value="ฝ่ายบริหาร">ฝ่ายบริหาร & การเงิน (Executive Board)</option>
                <option value="นักวิทยาศาสตร์ข้อมูล">นักวิทยาศาสตร์ข้อมูล (Data Science)</option>
              </select>
            </div>
          </div>

          {/* Store Data Attachment Indicator */}
          <div className="flex items-center justify-between bg-stone-950/60 rounded-lg px-3 py-1.5 text-[11px] text-stone-400 border border-stone-800/80">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                ข้อมูลร้าน: บิล {storeContext.totalTransactions} รายการ • ของเสีย {kpis.wasteRate.current}% • สมาชิก {storeContext.totalMembers} คน
              </span>
            </div>
            <span className="text-amber-400 font-medium">พร้อมตอบคำถามเฉพาะเจาะจง</span>
          </div>
        </div>

        {/* Chat Message Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-stone-50/80 text-xs sm:text-sm">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col gap-1.5 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`flex gap-2.5 max-w-[90%] sm:max-w-[85%] ${
                  msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                    msg.sender === 'ai'
                      ? 'bg-amber-600 text-white'
                      : 'bg-stone-800 text-white'
                  }`}
                >
                  {msg.sender === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl p-4 leading-relaxed shadow-sm transition relative group ${
                    msg.sender === 'user'
                      ? 'bg-amber-600 text-white font-medium rounded-tr-none'
                      : 'bg-white text-stone-800 border border-stone-200 rounded-tl-none'
                  }`}
                >
                  {/* Model tag if AI */}
                  {msg.sender === 'ai' && msg.modelUsed && (
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-stone-100 text-[10px] text-stone-400 font-semibold">
                      <span className="flex items-center gap-1 text-amber-700">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>{msg.modelUsed}</span>
                      </span>
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="text-stone-400 hover:text-stone-700 transition flex items-center gap-1 p-0.5"
                        title="คัดลอกคำตอบ"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">คัดลอกแล้ว</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>คัดลอก</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Text Content with Pre-line */}
                  <div className="whitespace-pre-line text-xs sm:text-[13px] leading-relaxed">
                    {msg.text}
                  </div>

                  <span
                    className={`block text-[10px] mt-2 ${
                      msg.sender === 'user' ? 'text-amber-100' : 'text-stone-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>

              {/* Dynamic Follow-up Suggestions under AI messages */}
              {msg.sender === 'ai' && msg.suggestions && msg.suggestions.length > 0 && (
                <div className="pl-9 sm:pl-10 space-y-1.5 max-w-[90%]">
                  <div className="text-[10px] font-semibold text-stone-500 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-amber-600" />
                    <span>คำถามเจาะลึกต่อเนื่อง (Follow-up Questions):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.suggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(sug)}
                        disabled={loading}
                        className="text-left px-2.5 py-1 text-[11px] rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/70 hover:border-amber-300 transition active:scale-98 cursor-pointer disabled:opacity-50"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-stone-600 p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl w-fit">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-stone-800">
                  {activeModelObj.name} กำลังวิเคราะห์และตอบคำถามของคุณ...
                </span>
                <span className="text-[10px] text-stone-500">
                  เจาะจงข้อมูลร้าน • ประมวลผลกฎ CRISP-DM • ร่างแนวทางปฏิบัติ
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Categorized Question Library (คลังคำถาม 6 หมวดหมู่) */}
        <div className="border-t border-stone-200 bg-stone-100/80 p-3 flex flex-col gap-2">
          {/* Category Tabs */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3 text-amber-600" />
              <span>เลือกหมวดหมู่คำถามแนะนำ (Question Topics):</span>
            </span>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {PROMPT_CATEGORIES.map((cat) => {
              const IconComp = cat.icon;
              const isActive = cat.id === activeCategory;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-stone-700 hover:bg-stone-200/80 border border-stone-200'
                  }`}
                >
                  <IconComp className={`w-3 h-3 ${isActive ? 'text-white' : 'text-stone-500'}`} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Clickable Prompts from Active Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {currentCategoryData.prompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(p)}
                disabled={loading}
                className="text-left px-2.5 py-1.5 text-[11px] rounded-lg bg-white hover:bg-amber-50 hover:text-amber-950 text-stone-700 border border-stone-200/80 hover:border-amber-300 transition truncate shadow-2xs active:scale-98 cursor-pointer disabled:opacity-50"
                title={p}
              >
                👉 {p}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Input Form */}
        <div className="p-3 sm:p-4 border-t border-stone-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`พิมพ์คำถามของคุณถึง ${activeModelObj.name} (เช่น "สคริปต์แคชเชียร์", "วิธีลดราคาช่วงค่ำ")...`}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                inputValue.trim() && !loading
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 active:scale-95'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <span>ส่งคำถาม</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="flex items-center justify-between mt-2 text-[10px] text-stone-400">
            <span>💡 ถามได้ทั้งภาษาไทยและอังกฤษ • เจาะจงตัวเลขจริงของร้าน • ปรับเปลี่ยนโมเดลได้อิสระ</span>
            <span className="font-medium text-amber-700">AI Studio Build • Gemini 3 & 4</span>
          </div>
        </div>

      </div>
    </div>
  );
};
