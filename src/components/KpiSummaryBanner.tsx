import React from 'react';
import { TargetKpis } from '../types/bakery';
import { Trash2, ShoppingBag, Users, CheckCircle2, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface KpiSummaryBannerProps {
  kpis: TargetKpis;
}

export const KpiSummaryBanner: React.FC<KpiSummaryBannerProps> = ({ kpis }) => {
  const hasData = kpis.ticketSize.current > 0 || kpis.wasteRate.current > 0 || kpis.retentionRate.current > 0;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-stone-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-stone-100">
        <div>
          <span className="text-xs font-semibold text-amber-700 tracking-wide uppercase">
            3 เป้าหมายหลักเชิงปริมาณ (CRISP-DM Target Metrics)
          </span>
          <h2 className="text-base sm:text-lg font-bold text-stone-900">
            สถานะความก้าวหน้าสู่เป้าหมายทางธุรกิจ (Business KPIs Achievement)
          </h2>
        </div>
        {hasData ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold self-start sm:self-auto">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>บรรลุเป้าหมายครบทั้ง 3 มิติ</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200 text-xs font-semibold self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>รอข้อมูลจากการอัปโหลดของคุณ</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        
        {/* KPI 1: ลดอัตราของเสีย 20% */}
        <div className="relative p-4 rounded-xl bg-gradient-to-br from-amber-50/70 to-stone-50 border border-amber-200/80">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-800">
              <Trash2 className="w-5 h-5 text-amber-700" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
              เป้าหมาย: ลด 20%
            </span>
          </div>

          <h3 className="text-sm font-bold text-stone-800">อัตราเบเกอรี่เหลือทิ้ง (Food Waste)</h3>
          <p className="text-xs text-stone-500 mb-3">ควบคุมปริมาณการอบด้วย Demand Forecasting</p>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold text-stone-900 tracking-tight">
              {kpis.wasteRate.current}%
            </span>
            {kpis.wasteRate.current > 0 ? (
              <span className="inline-flex items-center text-xs font-bold text-emerald-600">
                <ArrowDownRight className="w-4 h-4" />
                ลดลง {kpis.wasteRate.achievedPct}%
              </span>
            ) : (
              <span className="text-xs text-stone-400 font-medium">
                (รอข้อมูลแบทช์ผลิต)
              </span>
            )}
          </div>

          <div className="w-full bg-stone-200 rounded-full h-2 mb-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (kpis.wasteRate.achievedPct / 20) * 100)}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>ก่อนทำ: {kpis.wasteRate.baseline}%</span>
            <span className="text-emerald-700 font-bold">
              {kpis.wasteRate.costSavedBath > 0 ? `ประหยัดต้นทุน ฿${kpis.wasteRate.costSavedBath.toLocaleString()}` : 'รอคำนวณต้นทุน'}
            </span>
          </div>
        </div>

        {/* KPI 2: เพิ่ม Ticket Size 15% */}
        <div className="relative p-4 rounded-xl bg-gradient-to-br from-blue-50/70 to-stone-50 border border-blue-200/80">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-800">
              <ShoppingBag className="w-5 h-5 text-blue-700" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-300">
              เป้าหมาย: เพิ่ม 15%
            </span>
          </div>

          <h3 className="text-sm font-bold text-stone-800">ค่าใช้จ่ายเฉลี่ยต่อบิล (Ticket Size)</h3>
          <p className="text-xs text-stone-500 mb-3">ขับเคลื่อนด้วย Apriori Basket & Upsell Combo</p>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold text-stone-900 tracking-tight">
              ฿{kpis.ticketSize.current}
            </span>
            {kpis.ticketSize.current > 0 ? (
              <span className="inline-flex items-center text-xs font-bold text-emerald-600">
                <ArrowUpRight className="w-4 h-4" />
                โตขึ้น +{kpis.ticketSize.achievedPct}%
              </span>
            ) : (
              <span className="text-xs text-stone-400 font-medium">
                (รอข้อมูลบิลขาย POS)
              </span>
            )}
          </div>

          <div className="w-full bg-stone-200 rounded-full h-2 mb-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (kpis.ticketSize.achievedPct / 15) * 100)}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>ก่อนทำ: ฿{kpis.ticketSize.baseline}</span>
            <span className="text-blue-700 font-bold">
              {kpis.ticketSize.extraRevenueBath > 0 ? `ยอดขายส่วนเพิ่ม +฿${kpis.ticketSize.extraRevenueBath.toLocaleString()}` : 'รอคำนวณส่วนเพิ่ม'}
            </span>
          </div>
        </div>

        {/* KPI 3: เพิ่ม Retention Rate 25% */}
        <div className="relative p-4 rounded-xl bg-gradient-to-br from-emerald-50/70 to-stone-50 border border-emerald-200/80">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-800">
              <Users className="w-5 h-5 text-emerald-700" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
              เป้าหมาย: เพิ่ม 25%
            </span>
          </div>

          <h3 className="text-sm font-bold text-stone-800">อัตราการซื้อซ้ำ (Retention Rate)</h3>
          <p className="text-xs text-stone-500 mb-3">เจาะจงผ่าน LINE OA Personalized CRM</p>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold text-stone-900 tracking-tight">
              {kpis.retentionRate.current}%
            </span>
            {kpis.retentionRate.current > 0 ? (
              <span className="inline-flex items-center text-xs font-bold text-emerald-600">
                <ArrowUpRight className="w-4 h-4" />
                โตขึ้น +{kpis.retentionRate.achievedPct}%
              </span>
            ) : (
              <span className="text-xs text-stone-400 font-medium">
                (รอข้อมูลสมาชิก CRM)
              </span>
            )}
          </div>

          <div className="w-full bg-stone-200 rounded-full h-2 mb-2 overflow-hidden">
            <div 
              className="bg-emerald-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (kpis.retentionRate.achievedPct / 25) * 100)}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>ก่อนทำ: {kpis.retentionRate.baseline}%</span>
            <span className="text-emerald-800 font-bold">
              {kpis.retentionRate.activeMembers > 0 ? `สมาชิกประจำ ${kpis.retentionRate.activeMembers} ราย` : 'รอคำนวณสมาชิก'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
