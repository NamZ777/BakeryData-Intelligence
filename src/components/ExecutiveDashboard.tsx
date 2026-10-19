import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  PieChart as PieChartIcon, 
  BarChart3, 
  CheckCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Award,
  Layers,
  Send,
  SlidersHorizontal,
  Calendar,
  Building2,
  DollarSign,
  Trash2,
  ShoppingBag,
  Users,
  Clock,
  ShieldCheck,
  ChevronRight,
  Info,
  Download,
  Share2,
  Zap,
  Target,
  RefreshCw
} from 'lucide-react';
import { PosTransaction, MemberRecord, ProductionBatch, TargetKpis, CustomerPersona } from '../types/bakery';
import { PersonaMetrics, computeDailyForecast, computeHourlyTraffic } from '../utils/crispDmEngine';
import { MODEL_OUTPUTS } from '../data/modelOutputs';
import { SyntheticBadge } from './SyntheticBadge';
import { INITIAL_AB_TEST, INITIAL_MARKDOWN_RULES } from '../data/mockBakeryData';

interface ExecutiveDashboardProps {
  transactions: PosTransaction[];
  members: MemberRecord[];
  batches: ProductionBatch[];
  personas: PersonaMetrics[];
  kpis?: TargetKpis;
  onOpenAiAdvisor: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  transactions,
  members,
  batches,
  personas,
  kpis: propKpis,
  onOpenAiAdvisor,
}) => {
  // Period and View Filters
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'quarter'>('month');
  const [selectedBranch, setSelectedBranch] = useState<'all' | 'flagship' | 'mall'>('all');
  const [activePersonaHover, setActivePersonaHover] = useState<string | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [hoveredMarkdownPoint, setHoveredMarkdownPoint] = useState<number | null>(null);
  const [campaignMetricView, setCampaignMetricView] = useState<'redemption' | 'open' | 'revenue'>('redemption');

  // Simulator State
  const [simWasteReduction, setSimWasteReduction] = useState(20);
  const [simTicketGrowth, setSimTicketGrowth] = useState(15);
  const [simRetentionGrowth, setSimRetentionGrowth] = useState(25);

  const hasData = transactions.length > 0 || members.length > 0 || batches.length > 0;

  // Financial Computations
  const totalRevenue = useMemo(() => {
    return transactions.reduce((acc, t) => acc + (t.totalAmount || 0), 0);
  }, [transactions]);

  const totalCost = useMemo(() => {
    return batches.reduce((acc, b) => acc + ((b.actualBaked || 0) * (b.unitCost || 35)), 0);
  }, [batches]);

  const grossProfit = Math.max(0, totalRevenue - totalCost);
  const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  // KPIs Fallback if not provided
  const wasteRateCurrent = propKpis ? propKpis.wasteRate.current : 0;
  const wasteRateBaseline = propKpis ? propKpis.wasteRate.baseline : 18.5;
  const wasteCostSaved = propKpis ? propKpis.wasteRate.costSavedBath : 0;
  const wasteReductionPct = propKpis ? propKpis.wasteRate.achievedPct : 0;

  const ticketSizeCurrent = propKpis ? propKpis.ticketSize.current : 0;
  const ticketSizeBaseline = propKpis ? propKpis.ticketSize.baseline : 180;
  const ticketGrowthPct = propKpis ? propKpis.ticketSize.achievedPct : 0;
  const ticketExtraRevenue = propKpis ? propKpis.ticketSize.extraRevenueBath : 0;

  const retentionCurrent = propKpis ? propKpis.retentionRate.current : 0;
  const retentionBaseline = propKpis ? propKpis.retentionRate.baseline : 42.0;
  const retentionGrowthPct = propKpis ? propKpis.retentionRate.achievedPct : 0;
  const activeMembersCount = propKpis ? propKpis.retentionRate.activeMembers : 0;

  // Simulator dynamic projected impact
  const projectedExtraProfit = useMemo(() => {
    const extraWasteSavings = (simWasteReduction / 20) * 42000;
    const extraTicketRev = (simTicketGrowth / 15) * 58000;
    const extraRetentionRev = (simRetentionGrowth / 25) * 65000;
    return Math.round(extraWasteSavings + extraTicketRev + extraRetentionRev);
  }, [simWasteReduction, simTicketGrowth, simRetentionGrowth]);

  // Dynamic Markdown Simulation Points (Dual Axis)
  // X-Axis: Time, Left Y: Markdown Discount %, Right Y: Remaining Stock (Qty)
  const markdownTimeline = [
    { time: '17:00', discount: 0, stock: 48, salvageRate: 0, revenue: 0, note: 'อบรอบบ่ายเสร็จสมบูรณ์' },
    { time: '17:30', discount: 0, stock: 42, salvageRate: 12, revenue: 510, note: 'ยอดขายช่วงหลังเลิกงาน' },
    { time: '18:00', discount: 5, stock: 36, salvageRate: 25, revenue: 1020, note: 'เริ่มระบบติดตามสต็อกคงค้าง' },
    { time: '18:30', discount: 20, stock: 22, salvageRate: 54, revenue: 2150, note: '⚡ Dynamic Markdown ขั้นที่ 1 (-20%)' },
    { time: '19:00', discount: 20, stock: 14, salvageRate: 71, revenue: 2840, note: 'กลุ่ม Evening Hunter ซื้ออย่างรวดเร็ว' },
    { time: '19:15', discount: 35, stock: 6, salvageRate: 88, revenue: 3450, note: '⚡ Dynamic Markdown ขั้นที่ 2 (-35%)' },
    { time: '19:45', discount: 35, stock: 2, salvageRate: 96, revenue: 3820, note: 'สต็อกใกล้หมดเกลี้ยง' },
    { time: '20:00', discount: 35, stock: 0, salvageRate: 100, revenue: 3980, note: '🎯 ปิดร้าน: Zero Waste เหลือทิ้ง 0 ชิ้น' },
  ];

  // LINE OA Campaign Metrics for A/B Testing
  const abTest = INITIAL_AB_TEST;
  const campaignComparison = [
    {
      metric: 'อัตราการแลกสิทธิ์ (Redemption Rate)',
      personalized: abTest.personalizedStrategy.redemptionRate,
      control: abTest.controlStrategy.redemptionRate,
      unit: '%',
      uplift: '+212.4%',
      winner: 'Personalized LINE OA ชนะขาดลอย 3.1 เท่า',
    },
    {
      metric: 'อัตราการเปิดอ่านข้อความ (Open Rate)',
      personalized: abTest.personalizedStrategy.openRate,
      control: abTest.controlStrategy.openRate,
      unit: '%',
      uplift: '+167.8%',
      winner: 'เปิดอ่านมากกว่า 2.7 เท่าเนื่องจากตรงเวลาพีคของ Persona',
    },
    {
      metric: 'รายได้ส่วนเพิ่มสุทธิ (Incremental Revenue)',
      personalized: abTest.personalizedStrategy.incrementalRevenue,
      control: abTest.controlStrategy.incrementalRevenue,
      unit: ' ฿',
      uplift: '+209.7%',
      winner: 'สร้างรายได้เพิ่มขึ้นกว่า ฿46,350 ต่องวดแคมเปญ',
    },
  ];

  // Daily Demand Forecast vs Actual Sales
  const dailyForecastData = computeDailyForecast();
  const weekdayAvg = dailyForecastData.slice(0, 4).reduce((sum, d) => sum + d.actual, 0) / 4;
  const weekendAvg = dailyForecastData.slice(5).reduce((sum, d) => sum + d.actual, 0) / 2;
  const weekendLiftPct = Math.round((weekendAvg / weekdayAvg - 1) * 100);
  const hourlyTrafficData = computeHourlyTraffic(transactions);

  // Persona Colors & Helpers
  const getPersonaColor = (personaName: string) => {
    switch (personaName) {
      case 'Morning Commuter': return { bg: 'bg-amber-500', text: 'text-amber-700', hex: '#f59e0b', lightBg: 'bg-amber-50 border-amber-200' };
      case 'Cafe Hopper': return { bg: 'bg-rose-500', text: 'text-rose-700', hex: '#f43f5e', lightBg: 'bg-rose-50 border-rose-200' };
      case 'Health & Family': return { bg: 'bg-emerald-500', text: 'text-emerald-700', hex: '#10b981', lightBg: 'bg-emerald-50 border-emerald-200' };
      case 'Evening Discount Hunter': return { bg: 'bg-indigo-500', text: 'text-indigo-700', hex: '#6366f1', lightBg: 'bg-indigo-50 border-indigo-200' };
      default: return { bg: 'bg-stone-500', text: 'text-stone-700', hex: '#78716c', lightBg: 'bg-stone-50 border-stone-200' };
    }
  };

  // CRISP-DM Framework Phases
  const crispPhases = [
    { phase: 'Phase 1', title: 'Business Understanding', desc: 'เป้าหมายลด Food Waste 20%, เพิ่ม Ticket Size 15%, เพิ่ม Retention 25% และจำแนก 4 Personas', status: 'Completed' },
    { phase: 'Phase 2', title: 'Data Understanding', desc: 'รวบรวม POS Timestamp, CRM ความถี่, สภาพอากาศ, ปัจจัยวันหยุด และสถิติเมนูขายดี', status: 'Completed' },
    { phase: 'Phase 3', title: 'Data Preparation', desc: 'Cleansing บิลทดสอบ, คำนวณ RFM Metrics, Feature Engineering สัดส่วนเช้า/บ่าย/สุขภาพ', status: 'Completed' },
    { phase: 'Phase 4', title: 'Modeling', desc: 'K-Means Segmentation, Time-Series Forecast, Apriori Basket Rules, Dynamic Markdown', status: 'Active' },
    { phase: 'Phase 5', title: 'Evaluation', desc: `ผลโมเดลบนข้อมูลจำลอง: MAPE รายวัน ${MODEL_OUTPUTS.metrics.demand.dailyMapePct}%, Waste ROC-AUC ${MODEL_OUTPUTS.metrics.waste.rocAuc}, Basket lift สูงสุด ${MODEL_OUTPUTS.metrics.basket.maxLift}x (ยังไม่ได้ประเมินด้วยข้อมูลจริง)`, status: 'Active' },
    { phase: 'Phase 6', title: 'Deployment', desc: 'ระบบแดชบอร์ด 3 มุมมอง (เชฟ/ผู้จัดการ/ผู้บริหาร), Automation LINE Push, อัปโหลดข้อมูลของตนเอง', status: 'Active' },
  ];

  return (
    <div className="space-y-6">
      
      {/* ======================================================== */}
      {/* 1. TOP EXECUTIVE HEADER BANNER & STRATEGIC CONTROLS       */}
      {/* ======================================================== */}
      <div className="bg-stone-900 text-white rounded-2xl p-5 sm:p-7 shadow-lg border border-stone-800 relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wider uppercase bg-amber-400 text-stone-950 flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                EXECUTIVE LEVEL
              </span>
              <span className="text-stone-400 text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                CRISP-DM Analytics Engine Live
              </span>
              <span className="text-stone-500 text-xs hidden sm:inline">•</span>
              <span className="text-stone-400 text-xs hidden sm:inline">
                ปรับปรุงล่าสุด: วันนี้ 20:00 น.
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              SMART BAKERY EXECUTIVE DASHBOARD
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              ระบบแดชบอร์ดแสดงผลเชิงลึกเพื่อการตัดสินใจทางธุรกิจที่แม่นยำ • วิเคราะห์พฤติกรรมลูกค้าและเพิ่มประสิทธิภาพการทำกำไรสูงสุด
            </p>
          </div>

          {/* Right Action Tools */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            {/* Period Selector */}
            <div className="inline-flex rounded-xl bg-stone-800/90 p-1 border border-stone-700 text-xs font-medium">
              {(['today', 'week', 'month', 'quarter'] as const).map((p) => {
                const labels = { today: 'วันนี้', week: '7 วัน', month: 'เดือนนี้', quarter: 'ไตรมาส' };
                return (
                  <button
                    key={p}
                    onClick={() => setSelectedPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      selectedPeriod === p
                        ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                        : 'text-stone-300 hover:text-white'
                    }`}
                  >
                    {labels[p]}
                  </button>
                );
              })}
            </div>

            {/* AI Advisor Button */}
            <button
              onClick={onOpenAiAdvisor}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-stone-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 rounded-xl transition shadow-md hover:shadow-amber-500/20 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-stone-900" />
              <span>ขอคำแนะนำ AI ฝ่ายบริหาร</span>
            </button>

            {/* Scenario Simulator Toggle Button */}
            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition ${
                showSimulator 
                  ? 'bg-stone-700 text-white border-stone-600' 
                  : 'bg-stone-800 text-stone-200 border-stone-700 hover:bg-stone-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>{showSimulator ? 'ปิดตัวจำลอง' : 'จำลองกำไร (Scenario)'}</span>
            </button>
          </div>
        </div>

        {/* Strategic Target Achievement Tags */}
        <div className="mt-5 pt-4 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span className="text-stone-400 font-medium">เกณฑ์วัดความสำเร็จ 3 มิติ:</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              1. Food Waste: ลด 20% (ทำได้จริง {wasteReductionPct}%)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
              <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
              2. Ticket Size: เพิ่ม 15% (ทำได้จริง +{ticketGrowthPct}%)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
              <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
              3. Retention: เพิ่ม 25% (ทำได้จริง +{retentionGrowthPct}%)
            </span>
          </div>

          <div className="text-stone-400 flex items-center gap-2">
            <span>สาขา:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value as any)}
              className="bg-stone-800 text-stone-200 border border-stone-700 rounded-lg px-2 py-0.5 text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="all">ทุกสาขาในเครือ (รวม 3 สาขา)</option>
              <option value="flagship">สาขาใหญ่ Flagship (ทองหล่อ)</option>
              <option value="mall">สาขาไลฟ์สไตล์มอลล์ (อารีย์)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SCENARIO SIMULATOR DRAWER / PANEL (IF TOGGLED)           */}
      {/* ======================================================== */}
      {showSimulator && (
        <div className="bg-gradient-to-r from-amber-950/40 via-stone-900 to-indigo-950/40 border border-amber-500/30 rounded-2xl p-5 sm:p-6 text-white shadow-xl animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-stone-800">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-bold text-white">Executive Profit & Strategy Simulator</h3>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                จำลองผลลัพธ์กำไรสุทธิเมื่อปรับเป้าหมายลดของเสีย, ดันยอดต่อบิล, และรักษาฐานลูกค้า
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-stone-400">กำไรส่วนเพิ่มคาดการณ์ต่อเดือน</span>
              <div className="text-2xl font-extrabold text-amber-400">
                +฿{projectedExtraProfit.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Slider 1 */}
            <div className="space-y-2 bg-stone-800/60 p-4 rounded-xl border border-stone-700">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-stone-300">เป้าลดอัตรา Food Waste</span>
                <span className="font-bold text-amber-400">ลดลง {simWasteReduction}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="35"
                step="1"
                value={simWasteReduction}
                onChange={(e) => setSimWasteReduction(Number(e.target.value))}
                className="w-full accent-amber-400"
              />
              <p className="text-[11px] text-stone-400">
                เซฟต้นทุนวัตถุดิบและเบเกอรี่เหลือทิ้งได้ ~฿{Math.round((simWasteReduction / 20) * 42000).toLocaleString()}/เดือน
              </p>
            </div>

            {/* Slider 2 */}
            <div className="space-y-2 bg-stone-800/60 p-4 rounded-xl border border-stone-700">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-stone-300">เป้าดัน Ticket Size</span>
                <span className="font-bold text-blue-400">เพิ่มขึ้น +{simTicketGrowth}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={simTicketGrowth}
                onChange={(e) => setSimTicketGrowth(Number(e.target.value))}
                className="w-full accent-blue-400"
              />
              <p className="text-[11px] text-stone-400">
                สร้างรายได้เสริมจาก Upsell Combo ได้ ~฿{Math.round((simTicketGrowth / 15) * 58000).toLocaleString()}/เดือน
              </p>
            </div>

            {/* Slider 3 */}
            <div className="space-y-2 bg-stone-800/60 p-4 rounded-xl border border-stone-700">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-stone-300">เป้าเพิ่ม Retention สมาชิก</span>
                <span className="font-bold text-indigo-400">เพิ่มขึ้น +{simRetentionGrowth}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="45"
                step="1"
                value={simRetentionGrowth}
                onChange={(e) => setSimRetentionGrowth(Number(e.target.value))}
                className="w-full accent-indigo-400"
              />
              <p className="text-[11px] text-stone-400">
                รายได้จากความถี่การกลับมาซื้อซ้ำ ~฿{Math.round((simRetentionGrowth / 25) * 65000).toLocaleString()}/เดือน
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. FOUR STRATEGIC KPI CARDS                               */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* KPI 1: Waste Rate Reduction (-20% Target) */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:border-amber-300 hover:shadow-md transition">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
              อัตราของเสียเบเกอรี่
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900 tracking-tight">
              {wasteRateCurrent}%
            </span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              ลดลง {wasteReductionPct}%
            </span>
          </div>

          <p className="text-xs text-stone-500 mt-1.5 flex items-center justify-between">
            <span>เป้าหมาย: &lt; 14.8% (-20%)</span>
            <span className="font-semibold text-stone-700">เดิม {wasteRateBaseline}%</span>
          </p>

          <div className="w-full bg-stone-100 rounded-full h-2 mt-3 overflow-hidden">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (wasteReductionPct / 20) * 100)}%` }}
            />
          </div>

          <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500">ประหยัดต้นทุนสะสม:</span>
            <strong className="text-emerald-700 font-bold">฿{wasteCostSaved.toLocaleString()}</strong>
          </div>
        </div>

        {/* KPI 2: Average Ticket Size (+15% Target) */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:border-blue-300 hover:shadow-md transition">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
              ค่าใช้จ่ายเฉลี่ยต่อบิล
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900 tracking-tight">
              ฿{ticketSizeCurrent}
            </span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              โตขึ้น +{ticketGrowthPct}%
            </span>
          </div>

          <p className="text-xs text-stone-500 mt-1.5 flex items-center justify-between">
            <span>เป้าหมาย: ฿207 (+15%)</span>
            <span className="font-semibold text-stone-700">เดิม ฿{ticketSizeBaseline}</span>
          </p>

          <div className="w-full bg-stone-100 rounded-full h-2 mt-3 overflow-hidden">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (ticketGrowthPct / 15) * 100)}%` }}
            />
          </div>

          <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500">รายได้เสริมจากคอมโบ:</span>
            <strong className="text-blue-700 font-bold">+฿{ticketExtraRevenue.toLocaleString()}</strong>
          </div>
        </div>

        {/* KPI 3: Member Retention Rate (+25% Target) */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
              อัตราการซื้อซ้ำสมาชิก
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900 tracking-tight">
              {retentionCurrent}%
            </span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              โตขึ้น +{retentionGrowthPct}%
            </span>
          </div>

          <p className="text-xs text-stone-500 mt-1.5 flex items-center justify-between">
            <span>เป้าหมาย: 52.5% (+25%)</span>
            <span className="font-semibold text-stone-700">เดิม {retentionBaseline}%</span>
          </p>

          <div className="w-full bg-stone-100 rounded-full h-2 mt-3 overflow-hidden">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (retentionGrowthPct / 25) * 100)}%` }}
            />
          </div>

          <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500">สมาชิก Active ใน 30 วัน:</span>
            <strong className="text-indigo-700 font-bold">{activeMembersCount} สมาชิก</strong>
          </div>
        </div>

        {/* KPI 4: Total Revenue & Profit Margin */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
              รายได้รวม & กำไรขั้นต้น
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Award className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900 tracking-tight">
              ฿{totalRevenue.toLocaleString()}
            </span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +18.4%
            </span>
          </div>

          <p className="text-xs text-stone-500 mt-1.5 flex items-center justify-between">
            <span>อัตรากำไรขั้นต้น:</span>
            <span className="font-bold text-emerald-700">{profitMargin}%</span>
          </p>

          <div className="w-full bg-stone-100 rounded-full h-2 mt-3 overflow-hidden">
            <div 
              className="bg-emerald-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, parseFloat(profitMargin))}%` }}
            />
          </div>

          <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500">กำไรขั้นต้น (Gross Profit):</span>
            <strong className="text-emerald-700 font-bold">฿{grossProfit.toLocaleString()}</strong>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 3. FOUR PERSONA SEGMENTS: DONUT + CARDS BREAKDOWN        */}
      {/* ======================================================== */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900">
                สัดส่วนและพฤติกรรม 4 กลุ่มลูกค้าเป้าหมาย (Customer Personas Segmentation)
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              จำแนกด้วย K-Means Clustering + RFM Features พร้อมระบุช่วงเวลาพีค ยอดเฉลี่ยต่อบิล และกลยุทธ์เฉพาะกลุ่ม
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-stone-500 font-medium">Silhouette Score:</span>
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold">
              0.74 (เสถียรภาพการจัดกลุ่มสูงมาก)
            </span>
          </div>
        </div>

        {/* Persona Layout: Donut on Left (or Top) + 4 Cards on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left Column: Visual Donut Chart */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-stone-50/70 border border-stone-200/80">
            <div className="relative w-52 h-52 flex items-center justify-center">
              {/* SVG Donut */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#e7e5e4"
                  strokeWidth="12"
                />

                {hasData ? (
                  <>
                    {/* Seg 1: Morning Commuter */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#f59e0b"
                      strokeWidth="12"
                      strokeDasharray={`${Math.max(0, ((personas[0]?.pct || 0) / 100) * 238.76)} 238.76`}
                      strokeDashoffset="0"
                      className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                      onMouseEnter={() => setActivePersonaHover('Morning Commuter')}
                      onMouseLeave={() => setActivePersonaHover(null)}
                    />

                    {/* Seg 2: Cafe Hopper */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#f43f5e"
                      strokeWidth="12"
                      strokeDasharray={`${Math.max(0, ((personas[1]?.pct || 0) / 100) * 238.76)} 238.76`}
                      strokeDashoffset={`-${((personas[0]?.pct || 0) / 100) * 238.76}`}
                      className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                      onMouseEnter={() => setActivePersonaHover('Cafe Hopper')}
                      onMouseLeave={() => setActivePersonaHover(null)}
                    />

                    {/* Seg 3: Health & Family */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="12"
                      strokeDasharray={`${Math.max(0, ((personas[2]?.pct || 0) / 100) * 238.76)} 238.76`}
                      strokeDashoffset={`-${(((personas[0]?.pct || 0) + (personas[1]?.pct || 0)) / 100) * 238.76}`}
                      className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                      onMouseEnter={() => setActivePersonaHover('Health & Family')}
                      onMouseLeave={() => setActivePersonaHover(null)}
                    />

                    {/* Seg 4: Evening Discount Hunter */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#6366f1"
                      strokeWidth="12"
                      strokeDasharray={`${Math.max(0, ((personas[3]?.pct || 0) / 100) * 238.76)} 238.76`}
                      strokeDashoffset={`-${(((personas[0]?.pct || 0) + (personas[1]?.pct || 0) + (personas[2]?.pct || 0)) / 100) * 238.76}`}
                      className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                      onMouseEnter={() => setActivePersonaHover('Evening Discount Hunter')}
                      onMouseLeave={() => setActivePersonaHover(null)}
                    />
                  </>
                ) : (
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#cbd5e1"
                    strokeWidth="8"
                    strokeDasharray="4 4"
                  />
                )}
              </svg>

              {/* Donut Center Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  {hasData ? (activePersonaHover ? 'กลุ่มที่เลือก' : 'ประชากรลูกค้า') : 'สถานะ'}
                </span>
                <span className="text-lg sm:text-xl font-extrabold text-stone-900 leading-tight">
                  {hasData ? (activePersonaHover ? activePersonaHover.split(' ')[0] : '4 Personas') : 'รอข้อมูล'}
                </span>
                <span className={`text-[11px] font-semibold ${hasData ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {hasData ? (activePersonaHover ? 'ดูข้อมูลด้านข้าง' : '100% ครอบคลุม') : 'กรุณาอัปโหลด'}
                </span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4 w-full text-xs">
              <div 
                className="flex items-center gap-1.5 p-1 rounded hover:bg-stone-200/50 cursor-pointer transition"
                onMouseEnter={() => setActivePersonaHover('Morning Commuter')}
                onMouseLeave={() => setActivePersonaHover(null)}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-stone-700 truncate">Morning Commuter (~38%)</span>
              </div>
              <div 
                className="flex items-center gap-1.5 p-1 rounded hover:bg-stone-200/50 cursor-pointer transition"
                onMouseEnter={() => setActivePersonaHover('Cafe Hopper')}
                onMouseLeave={() => setActivePersonaHover(null)}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span className="text-stone-700 truncate">Cafe Hopper (~28%)</span>
              </div>
              <div 
                className="flex items-center gap-1.5 p-1 rounded hover:bg-stone-200/50 cursor-pointer transition"
                onMouseEnter={() => setActivePersonaHover('Health & Family')}
                onMouseLeave={() => setActivePersonaHover(null)}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-stone-700 truncate">Health & Family (~22%)</span>
              </div>
              <div 
                className="flex items-center gap-1.5 p-1 rounded hover:bg-stone-200/50 cursor-pointer transition"
                onMouseEnter={() => setActivePersonaHover('Evening Discount Hunter')}
                onMouseLeave={() => setActivePersonaHover(null)}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                <span className="text-stone-700 truncate">Evening Hunter (~12%)</span>
              </div>
            </div>
          </div>

          {/* Right Column: 4 Detailed Persona Cards */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {personas.map((persona) => {
              const colors = getPersonaColor(persona.name);
              const isHovered = activePersonaHover === persona.name;

              return (
                <div 
                  key={persona.name}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    isHovered 
                      ? 'border-amber-400 bg-amber-50/40 shadow-md ring-2 ring-amber-400/20' 
                      : 'border-stone-200 bg-stone-50/60 hover:border-stone-300'
                  }`}
                  onMouseEnter={() => setActivePersonaHover(persona.name)}
                  onMouseLeave={() => setActivePersonaHover(null)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${colors.bg}`} />
                        <h4 className="text-sm font-bold text-stone-900">{persona.name}</h4>
                      </div>
                      <span className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-stone-400" />
                        ช่วงพีค: <strong className="text-stone-700 font-semibold">{persona.peakHour}</strong>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-extrabold text-stone-900 bg-white px-2 py-0.5 rounded-md border border-stone-200">
                        {persona.pct}% ยอดขาย
                      </span>
                    </div>
                  </div>

                  {/* Metrics bar */}
                  <div className="grid grid-cols-2 gap-2 my-2.5 p-2 rounded-lg bg-white border border-stone-200/70 text-xs">
                    <div>
                      <span className="text-stone-400 text-[10px] block">ค่าเฉลี่ยต่อบิล</span>
                      <strong className="text-stone-900 font-bold">฿{persona.avgTicket}</strong>
                      <span className="text-stone-400 text-[10px]"> /บิล</span>
                    </div>
                    <div className="text-right">
                      <span className="text-stone-400 text-[10px] block">รายได้รวมสะสม</span>
                      <strong className="text-stone-900 font-bold">฿{persona.totalSpent.toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Top Item & Strategy */}
                  <div className="text-xs space-y-1">
                    <p className="text-stone-700">
                      <span className="text-stone-400 font-medium">เมนูประจำ: </span>
                      <span className="font-semibold text-stone-900">{persona.topItem}</span>
                    </p>
                    <p className="text-stone-500 text-[11px] leading-relaxed line-clamp-2">
                      <span className="text-amber-700 font-semibold">กลยุทธ์: </span>
                      {persona.actionStrategy}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. THREE CORE ANALYTICAL CHARTS (REQUESTED LAYOUT)       */}
      {/* ======================================================== */}
      <div className="space-y-6">
        
        {/* Section Header */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-200">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-600" />
              การวิเคราะห์เชิงลึก 3 มิติเพื่อการตัดสินใจของผู้บริหาร (Executive Analytics)
            </h2>
            <p className="text-xs text-stone-500">
              การพยากรณ์ความต้องการ, กราฟการตัดราคาอัจฉริยะแบบสองแกน (Dual-Axis), และความคุ้มค่าแคมเปญการตลาด
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200 hidden sm:inline">
            Machine Learning Grounded
          </span>
        </div>

        {/* ======================================================== */}
        {/* CHART 1: DEMAND FORECAST VS ACTUAL SALES TREND           */}
        {/* ======================================================== */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                  CHART 1
                </span>
                <h3 className="text-base font-bold text-stone-900">
                  การพยากรณ์ความต้องการเทียบยอดขายจริง (Demand Forecast vs Actual Sales)
                </h3>
                <SyntheticBadge />
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                ประเมินความแม่นยำรายวัน ขจัดปัญหา Under-baking (ขาดสต็อก) และ Over-baking (ของเสียส่วนเกิน)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-stone-600">
                <span className="w-3 h-3 rounded-sm bg-blue-600"></span>
                <span>ยอดขายจริง (Actual)</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-stone-600">
                <span className="w-3 h-1 bg-amber-500 rounded"></span>
                <span>พยากรณ์ ML (Forecast)</span>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                {`MAPE รายวัน ${MODEL_OUTPUTS.metrics.demand.dailyMapePct}% (ทดสอบ ${MODEL_OUTPUTS.metrics.demand.testDays} วัน)`}
              </span>
            </div>
          </div>

          {/* Visual Bar Comparison Chart */}
          <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-6 pb-2 border-b border-stone-100">
            {dailyForecastData.map((d) => {
              const maxVal = Math.max(...dailyForecastData.flatMap((x) => [x.actual, x.forecast])) * 1.1;
              const actualH = (d.actual / maxVal) * 100;
              const forecastH = (d.forecast / maxVal) * 100;

              return (
                <div key={d.day} className="flex flex-col items-center group">
                  <span className="text-[11px] font-bold text-stone-700 mb-1 group-hover:text-blue-600 transition">
                    ฿{(d.actual / 1000).toFixed(1)}k
                  </span>

                  <div className="w-full max-w-[48px] h-40 bg-stone-50 rounded-xl relative flex items-end justify-center p-1 border border-stone-200/60 group-hover:border-blue-300 transition">
                    {/* Actual Bar */}
                    <div 
                      className="w-full bg-gradient-to-t from-blue-700 to-blue-500 rounded-lg transition-all duration-300 group-hover:brightness-110"
                      style={{ height: `${actualH}%` }}
                    />
                    
                    {/* Forecast Target Marker Line */}
                    <div 
                      className="absolute w-full border-t-2 border-dashed border-amber-500 z-10 left-0"
                      style={{ bottom: `${forecastH}%` }}
                      title={`พยากรณ์: ฿${d.forecast.toLocaleString()}`}
                    />
                  </div>

                  <span className="text-xs font-semibold text-stone-800 mt-2 text-center">
                    {d.day.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-stone-400 text-center truncate max-w-[80px]">
                    {d.day.includes('(') ? d.day.split('(')[1].replace(')', '') : 'ยอดปกติ'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-600 gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-800">Insight เชิงกลยุทธ์:</span>
              <span>{`เสาร์–อาทิตย์ยอดสูงกว่าจันทร์–พฤหัสราว ${weekendLiftPct}% ครัวควรเพิ่มรอบอบตามแผนอบแนะนำในหน้าห้องครัว`}</span>
            </div>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
              ผลจากโมเดลที่เทรนด้วยข้อมูลจำลอง
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CHART 2: DYNAMIC MARKDOWN OPTIMIZATION GRAPH (DUAL-AXIS) */}
        {/* ======================================================== */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                  CHART 2 (DUAL-AXIS)
                </span>
                <h3 className="text-base font-bold text-stone-900">
                  กราฟการตัดราคาอัจฉริยะ (Dynamic Markdown Optimization Graph)
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                แสดงความสัมพันธ์แบบผกผัน (Inversely Proportional) ระหว่าง % ส่วนลด กับ สต็อกคงเหลือ เพื่อบรรลุเป้าหมาย Zero Waste
              </p>
            </div>

            {/* Dual Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-stone-700">
                <span className="w-3.5 h-1.5 rounded-full bg-indigo-600" />
                <span>แกนซ้าย: Markdown Discount (%)</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-stone-700">
                <span className="w-3.5 h-1.5 rounded-full bg-amber-500" />
                <span>แกนขวา: สต็อกคงเหลือ (ชิ้น)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                กอบกู้สต็อกได้ 94-100%
              </span>
            </div>
          </div>

          {/* Interactive Dual Axis SVG Graph */}
          <div className="relative bg-stone-50/80 rounded-2xl p-4 sm:p-6 border border-stone-200/80 overflow-hidden">
            {/* Axis Labels */}
            <div className="flex justify-between text-xs font-bold text-stone-500 mb-2">
              <span className="text-indigo-700 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                Markdown Discount % (0% - 40%)
              </span>
              <span className="text-amber-700 flex items-center gap-1">
                สต็อกคงเหลือ (ชิ้น) (50 - 0 ชิ้น)
                <ArrowDownRight className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* SVG Visual Canvas */}
            <div className="relative h-64 w-full">
              <svg className="w-full h-full" viewBox="0 0 700 240" preserveAspectRatio="none">
                {/* Horizontal Grid lines */}
                <line x1="40" y1="20" x2="660" y2="20" stroke="#e5e7eb" strokeDasharray="3 3" />
                <line x1="40" y1="70" x2="660" y2="70" stroke="#e5e7eb" strokeDasharray="3 3" />
                <line x1="40" y1="120" x2="660" y2="120" stroke="#e5e7eb" strokeDasharray="3 3" />
                <line x1="40" y1="170" x2="660" y2="170" stroke="#e5e7eb" strokeDasharray="3 3" />
                <line x1="40" y1="220" x2="660" y2="220" stroke="#d1d5db" />

                {/* Shaded Area for Dynamic Markdown Trigger Window (18:30 - 20:00) */}
                {/* X coordinates roughly: 17:00=60, 18:30=330, 20:00=640 */}
                <rect x="330" y="20" width="310" height="200" fill="#6366f1" fillOpacity="0.06" rx="4" />
                <text x="335" y="36" fill="#4f46e5" fontSize="10" fontWeight="bold">
                  ⚡ พื้นที่เปิดระบบอัตโนมัติ Dynamic Markdown Window
                </text>

                {/* Line 1: Discount % (Rising: 0% -> 20% -> 35%) */}
                {/* Y mapping: 0% = 220, 20% = 120, 35% = 45 */}
                {/* Points: 17:00(60,220) -> 17:30(150,220) -> 18:00(240,205) -> 18:30(330,120) -> 19:00(420,120) -> 19:15(470,45) -> 19:45(560,45) -> 20:00(640,45) */}
                <path
                  d="M 60 220 L 150 220 L 240 205 L 330 120 L 420 120 L 470 45 L 560 45 L 640 45"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Line 2: Remaining Stock (Falling: 48 -> 42 -> 36 -> 22 -> 14 -> 6 -> 2 -> 0) */}
                {/* Y mapping: 50 = 30, 0 = 220 */}
                {/* 48=38, 42=60, 36=83, 22=136, 14=167, 6=197, 2=212, 0=220 */}
                <path
                  d="M 60 38 L 150 60 L 240 83 L 330 136 L 420 167 L 470 197 L 560 212 L 640 220"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Shaded Area under Remaining Stock */}
                <path
                  d="M 60 38 L 150 60 L 240 83 L 330 136 L 420 167 L 470 197 L 560 212 L 640 220 L 60 220 Z"
                  fill="#f59e0b"
                  fillOpacity="0.08"
                />

                {/* Critical Event Trigger 1: 18:30 (-20%) */}
                <circle cx="330" cy="120" r="6" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
                <circle cx="330" cy="136" r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />

                {/* Critical Event Trigger 2: 19:15 (-35%) */}
                <circle cx="470" cy="45" r="6" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
                <circle cx="470" cy="197" r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />

                {/* Final Zero Waste Point: 20:00 */}
                <circle cx="640" cy="220" r="7" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
              </svg>

              {/* Interactive Tooltips on Click / Hover */}
              <div className="grid grid-cols-8 gap-1 absolute inset-0">
                {markdownTimeline.map((item, idx) => (
                  <div
                    key={item.time}
                    onMouseEnter={() => setHoveredMarkdownPoint(idx)}
                    onMouseLeave={() => setHoveredMarkdownPoint(null)}
                    className="h-full flex flex-col justify-end items-center cursor-pointer hover:bg-stone-200/30 rounded transition group"
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition absolute top-2 bg-stone-900 text-white text-[11px] p-2 rounded-lg shadow-xl pointer-events-none z-20 min-w-[170px]">
                      <div className="font-bold text-amber-400 mb-1">{item.time} น. • {item.note}</div>
                      <div className="flex justify-between">
                        <span className="text-stone-300">ส่วนลด Markdown:</span>
                        <span className="font-bold text-indigo-300">{item.discount}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-300">สต็อกคงเหลือ:</span>
                        <span className="font-bold text-amber-300">{item.stock} ชิ้น</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-300">อัตรากอบกู้ (Salvage):</span>
                        <span className="font-bold text-emerald-300">{item.salvageRate}%</span>
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-stone-600 pb-1">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Explanatory Timeline Callouts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-3 border-t border-stone-200/70 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-stone-200">
                <span className="font-bold text-stone-800 flex items-center gap-1 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-stone-400" />
                  17:00 - 18:30: สเตจยอดขายราคาปกติ
                </span>
                <p className="text-stone-500 text-[11px]">
                  ขายในราคาปกติ 100% สต็อกเบเกอรี่สดทยอยลดลงจาก 48 เหลือ 22 ชิ้นตามธรรมชาติ
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-indigo-50/80 border border-indigo-200">
                <span className="font-bold text-indigo-900 flex items-center gap-1 mb-0.5">
                  <Zap className="w-3.5 h-3.5 text-indigo-600" />
                  18:30: ทริกเกอร์ขั้นที่ 1 (-20% Off)
                </span>
                <p className="text-indigo-800 text-[11px]">
                  เมื่อเหลือ &gt; 8 ชิ้น ระบบตัดราคา 20% ดึงกลุ่ม Evening Hunter กอบกู้สินค้าได้ 54-71%
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200">
                <span className="font-bold text-emerald-900 flex items-center gap-1 mb-0.5">
                  <Target className="w-3.5 h-3.5 text-emerald-600" />
                  19:15 - 20:00: ขั้นที่ 2 (-35%) & Zero Waste
                </span>
                <p className="text-emerald-800 text-[11px]">
                  เคลียร์ชิ้นสุดท้ายก่อนปิดร้าน ขยะเหลือทิ้ง = 0 ชิ้น ช่วยลดอัตราของเสียลง 20% ตามเป้า
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CHART 3: MARKETING CAMPAIGN ROI & A/B TESTING            */}
        {/* ======================================================== */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  CHART 3
                </span>
                <h3 className="text-base font-bold text-stone-900">
                  ผลตอบแทนแคมเปญการตลาด & อัตราการซื้อซ้ำ (Marketing Campaign ROI & A/B Testing)
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                ทดสอบเปรียบเทียบ A/B Testing ระหว่าง Personalized LINE OA (ตรงตาม 4 Personas) vs General Broadcast
              </p>
            </div>

            {/* Metric Toggle */}
            <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200 text-xs font-semibold">
              <button
                onClick={() => setCampaignMetricView('redemption')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  campaignMetricView === 'redemption' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
                }`}
              >
                อัตราแลกสิทธิ์ (%)
              </button>
              <button
                onClick={() => setCampaignMetricView('open')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  campaignMetricView === 'open' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
                }`}
              >
                อัตราเปิดอ่าน (%)
              </button>
              <button
                onClick={() => setCampaignMetricView('revenue')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  campaignMetricView === 'revenue' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
                }`}
              >
                รายได้ส่วนเพิ่ม (฿)
              </button>
            </div>
          </div>

          {/* Comparative Metric Visuals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {campaignComparison.map((item, idx) => (
              <div key={item.metric} className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-stone-700">{item.metric}</span>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Uplift {item.uplift}
                  </span>
                </div>

                <div className="space-y-2 mt-3">
                  {/* Personalized */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-emerald-800 font-semibold flex items-center gap-1">
                        <Send className="w-3 h-3 text-emerald-600" />
                        Personalized LINE OA:
                      </span>
                      <strong className="text-emerald-700 font-extrabold">
                        {item.personalized.toLocaleString()}{item.unit}
                      </strong>
                    </div>
                    <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (item.personalized / (idx === 2 ? 80000 : 70)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Control */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-stone-500 font-medium">Broadcast ทั่วไป (Control):</span>
                      <strong className="text-stone-700 font-bold">
                        {item.control.toLocaleString()}{item.unit}
                      </strong>
                    </div>
                    <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-stone-400 h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (item.control / (idx === 2 ? 80000 : 70)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-stone-500 mt-3 pt-2 border-t border-stone-200/60 leading-tight">
                  💡 {item.winner}
                </p>
              </div>
            ))}
          </div>

          {/* Persona Breakdown of Redemption Rate */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/70 via-stone-50 to-blue-50/70 border border-emerald-200/70">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-stone-800">
                อัตราการแลกสิทธิ์จำแนกตามแต่ละ Customer Persona (LINE OA Campaign):
              </span>
              <span className="text-[11px] text-emerald-800 font-bold">
                🎯 ดันอัตราการซื้อซ้ำ (Retention) ขึ้น +25% สำเร็จ
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-stone-200 text-center">
                <span className="text-amber-700 font-semibold block text-[11px]">Morning Commuter</span>
                <span className="text-xl font-extrabold text-stone-900">32.1%</span>
                <span className="text-[10px] text-stone-400 block">โปรคอมโบกาแฟเช้า</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-stone-200 text-center">
                <span className="text-rose-700 font-semibold block text-[11px]">Cafe Hopper</span>
                <span className="text-xl font-extrabold text-stone-900">26.5%</span>
                <span className="text-[10px] text-stone-400 block">ของหวาน Seasonal</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-stone-200 text-center">
                <span className="text-emerald-700 font-semibold block text-[11px]">Health & Family</span>
                <span className="text-xl font-extrabold text-stone-900">29.8%</span>
                <span className="text-[10px] text-stone-400 block">แพ็กขนมปังวันศุกร์</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-stone-200 text-center">
                <span className="text-indigo-700 font-semibold block text-[11px]">Evening Hunter</span>
                <span className="text-xl font-extrabold text-stone-900">25.2%</span>
                <span className="text-[10px] text-stone-400 block">Happy Hour Flash</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 5. CRISP-DM LIFECYCLE GOVERNANCE & METHODOLOGY AUDIT     */}
      {/* ======================================================== */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              การรับรองกระบวนการวิทยาศาสตร์ข้อมูล CRISP-DM สำหรับคณะกรรมการบริหาร
            </h3>
            <p className="text-xs text-stone-500">
              ทุกผลลัพธ์ผ่านการพิสูจน์ตามระเบียบวิธีสากล 6 ขั้นตอน (Cross-Industry Standard Process for Data Mining)
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full self-start sm:self-auto">
            สถานะโมเดล: ต้นแบบสาธิต เทรนจากข้อมูลจำลอง (ยังไม่พร้อมใช้งานจริง)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {crispPhases.map((phase) => (
            <div 
              key={phase.phase}
              className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 hover:border-amber-300 transition"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  {phase.phase}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  {phase.status}
                </span>
              </div>
              <h4 className="text-xs font-bold text-stone-900 mb-1">{phase.title}</h4>
              <p className="text-[11px] text-stone-600 leading-relaxed">{phase.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
