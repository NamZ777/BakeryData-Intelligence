import React, { useState } from 'react';
import { 
  Store, 
  Clock, 
  Tag, 
  Sparkles, 
  ShoppingBag, 
  BellRing, 
  Check, 
  Flame, 
  Smartphone,
  ChevronRight,
  TrendingUp,
  Percent
} from 'lucide-react';
import { PosTransaction, MarketBasketRule, DynamicMarkdownRule } from '../types/bakery';
import { INITIAL_MARKDOWN_RULES } from '../data/mockBakeryData';
import { MODEL_OUTPUTS } from '../data/modelOutputs';
import { SyntheticBadge } from './SyntheticBadge';
import { computeHourlyTraffic } from '../utils/crispDmEngine';

interface ManagerDashboardProps {
  transactions: PosTransaction[];
  onOpenAiAdvisor: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  transactions,
  onOpenAiAdvisor,
}) => {
  const hourlyData = computeHourlyTraffic(transactions);
  const [markdownRules, setMarkdownRules] = useState<DynamicMarkdownRule[]>(INITIAL_MARKDOWN_RULES);
  const [selectedUpsellItem, setSelectedUpsellItem] = useState(MODEL_OUTPUTS.upsell[0]?.trigger ?? '');
  const upsellEntry = MODEL_OUTPUTS.upsell.find((u) => u.trigger === selectedUpsellItem);
  const [activeSimulationMsg, setActiveSimulationMsg] = useState<string | null>(null);

  const totalRevenue = transactions.reduce((acc, t) => acc + (t.totalAmount || 0), 0);
  const avgTicket = transactions.length > 0 ? Math.round(totalRevenue / transactions.length) : 0;
  const hasData = transactions.length > 0;

  const toggleMarkdownStatus = (index: number) => {
    setMarkdownRules(prev => prev.map((r, idx) => {
      if (idx === index) {
        return {
          ...r,
          status: r.status === 'Active' ? 'Standby' : 'Active'
        };
      }
      return r;
    }));
  };

  const handleSimulateLinePush = (personaName: string, message: string) => {
    setActiveSimulationMsg(`ส่งข้อความบรอดแคสต์ LINE OA ไปยังกลุ่ม "${personaName}" สำเร็จ!`);
    setTimeout(() => setActiveSimulationMsg(null), 3500);
  };

  return (
    <div className="space-y-6">
      
      {/* Simulation Feedback Alert */}
      {activeSimulationMsg && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white flex items-center justify-between shadow-lg transition-all animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-white" />
            <span className="font-semibold text-sm">{activeSimulationMsg}</span>
          </div>
          <span className="text-xs bg-emerald-700/80 px-2.5 py-1 rounded">Real-time Hook</span>
        </div>
      )}

      {/* Top Store Manager Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
            <Clock className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-semibold uppercase">สถานะช่วงเวลาปัจจุบัน</span>
            <div className="text-lg font-bold text-stone-900">
              {hasData ? 'ช่วงบ่าย (Afternoon Rush)' : 'รอข้อมูลเปิดร้าน'}
            </div>
            <p className="text-xs text-amber-700 font-medium">
              {hasData ? 'กลุ่ม Cafe Hopper กำลังเข้าใช้บริการสูงสุด' : 'อัปโหลด POS เพื่อเริ่มวิเคราะห์ช่วงพีค'}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-800 shrink-0">
            <ShoppingBag className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-semibold uppercase">เป้าหมายเพิ่ม Ticket Size</span>
            <div className="text-lg font-bold text-stone-900">
              {hasData ? `฿${avgTicket} / บิล (เป้าหมาย ฿207)` : '฿0 / บิล (รอข้อมูล)'}
            </div>
            <p className="text-xs text-emerald-600 font-medium">
              {hasData ? (avgTicket >= 207 ? 'ทำทะลุเป้าหมาย +15% เรียบร้อย' : 'กำลังดำเนินการตามกลยุทธ์') : 'อัปโหลด POS เพื่อคำนวณยอดต่อบิล'}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-800 shrink-0">
            <Tag className="w-6 h-6 text-indigo-700" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-semibold uppercase">ระบบ Dynamic Markdown</span>
            <div className="text-lg font-bold text-stone-900">
              กำหนดเวลา 18:30 น.
            </div>
            <p className="text-xs text-indigo-700 font-medium">
              พร้อมเคลียร์สต็อกสดเพื่อลดขยะ 20%
            </p>
          </div>
        </div>

      </div>

      {/* Hourly Traffic and Peak Flow Visualizer */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900">
              การกระจายตัวของจำนวนบิลและยอดขายรายชั่วโมง (Hourly Traffic & Peak Hours)
            </h3>
            <p className="text-xs text-stone-500">
              ใช้ข้อมูล Transaction POS จำแนก Peak Hours เพื่อจัดสรรพนักงานแคชเชียร์และเตรียมสินค้า
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-amber-700 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> ช่วงเร่งด่วน (Peak Hour)
            </span>
            <span className="flex items-center gap-1 text-stone-500">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-300"></span> เวลาปกติ
            </span>
          </div>
        </div>

        {/* Hourly Flow Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-13 gap-2">
          {hourlyData.map((item) => (
            <div 
              key={item.hour}
              className={`p-3 rounded-xl text-center border transition flex flex-col justify-between ${
                item.isPeak 
                  ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300/50' 
                  : 'bg-stone-50 border-stone-200'
              }`}
            >
              <div className="text-xs font-bold text-stone-700">{item.hour}</div>
              <div className="my-2">
                <div className="text-base font-extrabold text-stone-900">{item.bills}</div>
                <div className="text-[10px] text-stone-500">บิล</div>
              </div>
              <div className={`text-[10px] font-bold ${item.isPeak ? 'text-amber-800' : 'text-stone-600'}`}>
                ฿{(item.revenue / 1000).toFixed(1)}k
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Columns: Checkout Upsell Assistant & Dynamic Markdown Control */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Col 1: POS Smart Upsell Assistant (Increase Ticket Size +15%) */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-600" />
                  ระบบแนะนำการขายหน้าร้าน (Checkout Upsell Engine)
                </h3>
                <p className="text-xs text-stone-500">
                  ช่วยแคชเชียร์เสนอขาย Combo อัตโนมัติด้วยกฎ Apriori Basket Mining
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                ดันบิล +15%
              </span>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                จำลองลูกค้ากำลังสั่งซื้อ:
              </label>
              <select
                value={selectedUpsellItem}
                onChange={(e) => setSelectedUpsellItem(e.target.value)}
                className="w-full text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {MODEL_OUTPUTS.upsell.map((u) => (
                  <option key={u.trigger} value={u.trigger}>{u.trigger}</option>
                ))}
              </select>
            </div>

            {/* Smart Suggested Bundles based on Apriori */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                คำพูดแนะนำสำหรับพนักงานแคชเชียร์ (Recommended Pitch):
              </div>

              {(upsellEntry?.suggestions ?? []).map((sg, i) => {
                const trig = selectedUpsellItem.split(' (')[0];
                const sug = sg.suggest.split(' (')[0];
                const uplift = upsellEntry ? Math.round(((sg.bundlePrice - upsellEntry.triggerPrice) / upsellEntry.triggerPrice) * 100) : 0;
                const tone = i === 0
                  ? { box: 'bg-amber-50/70 border-amber-200', title: 'text-amber-900', line: 'border-amber-200/60' }
                  : { box: 'bg-rose-50/70 border-rose-200', title: 'text-rose-900', line: 'border-rose-200/60' };
                return (
                  <div key={sg.suggest} className={`p-4 rounded-xl border ${tone.box}`}>
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className={`text-sm font-bold ${tone.title}`}>
                        {`เสนอ "${sug}" คู่กับ${trig} ชุดคอมโบ ฿${sg.bundlePrice} (ปกติ ฿${sg.regularPrice})`}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded whitespace-nowrap">
                        Lift {sg.lift}x
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 italic mb-2">
                      {`"รับ${sug}ทานคู่กับ${trig}ไหมคะ ชุดนี้ลดเหลือ ฿${sg.bundlePrice} จากปกติ ฿${sg.regularPrice}"`}
                    </p>
                    <div className={`flex items-center justify-between text-xs text-stone-700 pt-2 border-t ${tone.line}`}>
                      <span>ยอดเดิม: ฿{upsellEntry?.triggerPrice} ➜ <strong className="text-emerald-700">ยอดใหม่: ฿{sg.bundlePrice} (+{uplift}%)</strong></span>
                      <span className="text-stone-500">ตรงกลุ่ม: {sg.persona}</span>
                    </div>
                    <div className="text-[11px] text-stone-500 mt-1">
                      {`ในบิลหลายรายการที่มี${trig} พบ${sug}ด้วย ${Math.round(sg.confidence * 100)}%`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-500 flex items-center justify-between">
            <span>กฎจากโมเดล Apriori: <strong>{MODEL_OUTPUTS.metrics.basket.rulesLiftAbove1} กฎ</strong> ที่ lift &gt; 1</span>
            <SyntheticBadge />
          </div>
        </div>

        {/* Col 2: Dynamic Markdown Center (Food Waste Reduction -20%) */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-600" />
                  ระบบจัดการลดราคาพลวัต (Dynamic Markdown Center)
                </h3>
                <p className="text-xs text-stone-500">
                  ระบายเบเกอรี่สดช่วง 18:30 - 20:00 น. เพื่อให้ของเหลือทิ้ง (Waste) ลดลง 20%
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                ลด Waste -20%
              </span>
            </div>

            <div className="space-y-3">
              {markdownRules.map((rule, idx) => (
                <div 
                  key={rule.timeSlot}
                  className={`p-4 rounded-xl border transition ${
                    rule.status === 'Active' 
                      ? 'bg-amber-50/80 border-amber-300' 
                      : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-300">
                        {rule.timeSlot} น.
                      </span>
                      <span className="text-sm font-extrabold text-amber-700">
                        ลดทันที {rule.discountPct}%
                      </span>
                    </div>

                    <button
                      onClick={() => toggleMarkdownStatus(idx)}
                      className={`text-xs font-bold px-3 py-1 rounded-md transition ${
                        rule.status === 'Active'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                      }`}
                    >
                      {rule.status === 'Active' ? 'เปิดใช้งานอยู่' : 'สแตนด์บาย'}
                    </button>
                  </div>

                  <p className="text-xs text-stone-600 mb-2">
                    เงื่อนไข: สต็อกหน้าร้านเหลือเกิน {rule.minRemainingStock} ชิ้น ({rule.targetItems.join(', ')})
                  </p>

                  <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-200/60">
                    <span>คาดการณ์ระบายของเสียได้: <strong className="text-emerald-700">{rule.salvageRateExpected}%</strong></span>
                    <span className="text-stone-700 font-medium">ดึงดูดกลุ่ม Evening Hunter</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-stone-100 rounded-xl text-xs text-stone-700 flex items-center justify-between">
            <span>🛡️ คำนวณกำไรสุทธิจากการ Markdown แทนการทิ้ง:</span>
            <strong className="text-emerald-700">+฿4,150 / วัน</strong>
          </div>
        </div>

      </div>

      {/* LINE OA Automated Campaign Simulator */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              การตลาดอัตโนมัติเจาะกลุ่มเฉพาะบุคคล (Automated LINE OA Marketing)
            </h3>
            <p className="text-xs text-stone-500">
              ขับเคลื่อนอัตราการซื้อซ้ำ (Retention Rate) ของสมาชิกขึ้น 25% ด้วยข้อความที่ถูกคนและถูกเวลา
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-800">กลุ่ม: Morning Commuter</span>
                <span className="text-[10px] text-stone-500">06:45 น. (จันทร์-ศุกร์)</span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed italic bg-white p-3 rounded-lg border border-amber-100 mb-3">
                "สวัสดีวันทำงานค่ะคุณธีรภัทร! อเมริกาโน่ร้อนคู่ครัวซองต์เนยฝรั่งเศสอบใหม่พร้อมแล้ว สั่งจองผ่านลิงก์นี้แวะรับได้ทันทีไม่ต้องรอคิวค่ะ ☕🥐"
              </p>
            </div>
            <button
              onClick={() => handleSimulateLinePush('Morning Commuter', 'ข้อความอาหารเช้าด่วน')}
              className="w-full text-xs font-semibold py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition"
            >
              ทดลองส่งบรอดแคสต์เฉพาะกลุ่ม
            </button>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-800">กลุ่ม: Cafe Hopper</span>
                <span className="text-[10px] text-stone-500">11:00 น. (เสาร์-อาทิตย์)</span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed italic bg-white p-3 rounded-lg border border-rose-100 mb-3">
                "วันหยุดสุดสัปดาห์นี้ ชวนคุณณัฐชนกมาดื่มด่ำกับ Uji Matcha และ Burnt Cheesecake พร้อมมุมถ่ายรูปแสงบ่ายสวย รับคูปองถ่ายรูปเช็คอินลด 15% 📸✨"
              </p>
            </div>
            <button
              onClick={() => handleSimulateLinePush('Cafe Hopper', 'ข้อความคาเฟ่สุดสัปดาห์')}
              className="w-full text-xs font-semibold py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition"
            >
              ทดลองส่งบรอดแคสต์เฉพาะกลุ่ม
            </button>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-800">กลุ่ม: Health & Family</span>
                <span className="text-[10px] text-stone-500">16:30 น. (วันศุกร์)</span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed italic bg-white p-3 rounded-lg border border-emerald-100 mb-3">
                "เติมสุขภาพดีให้ครอบครัวสุดสัปดาห์นี้ ขนมปังโฮลวีต 9 ธัญพืชสูตรน้ำตาล 0% อบเสร็จใหม่ ซื้อคู่เครื่องดื่มสุขภาพรับส่วนลดพิเศษ 15% วันนี้ค่ะ 🍞🌿"
              </p>
            </div>
            <button
              onClick={() => handleSimulateLinePush('Health & Family', 'ข้อความโฮลวีตครอบครัว')}
              className="w-full text-xs font-semibold py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
            >
              ทดลองส่งบรอดแคสต์เฉพาะกลุ่ม
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};
