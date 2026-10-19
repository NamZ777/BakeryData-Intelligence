import React from 'react';
import { 
  ShoppingBag, 
  ArrowRight, 
  Layers, 
  TrendingUp, 
  Sparkles, 
  Plus,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { MarketBasketRule } from '../types/bakery';
import { MODEL_OUTPUTS } from '../data/modelOutputs';
import { SyntheticBadge } from './SyntheticBadge';

interface MarketBasketViewProps {
  onOpenAiAdvisor: () => void;
}

export const MarketBasketView: React.FC<MarketBasketViewProps> = ({ onOpenAiAdvisor }) => {
  const rules: MarketBasketRule[] = MODEL_OUTPUTS.basketRules;

  return (
    <div className="space-y-6">
      
      {/* Overview Card */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
            CRISP-DM Phase 4: Market Basket Analysis (Apriori Algorithm)
          </span>
            <SyntheticBadge />
          </div>
          <h2 className="text-lg font-bold text-stone-900">
            วิเคราะห์ความสัมพันธ์การซื้อคู่กันเพื่อเพิ่ม Ticket Size (+15%)
          </h2>
          <p className="text-xs text-stone-500 max-w-2xl mt-1">
            ค้นหาแพทเทิร์นสินค้าที่ลูกค้ามักหยิบพร้อมกัน ด้วยค่าความเชื่อมั่น (Confidence) และค่าความสัมพันธ์ (Lift) เพื่อออกแบบเมนู Combo Set และเพิ่มยอดขายต่อบิล
          </p>
        </div>

        <button
          onClick={onOpenAiAdvisor}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition shadow-sm self-start md:self-auto shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>ขอ AI ออกแบบเซ็ตคอมโบใหม่</span>
        </button>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rules.map((rule) => {
          const discountAmount = rule.regularPrice - rule.bundlePrice;
          const discountPct = Math.round((discountAmount / rule.regularPrice) * 100);

          return (
            <div 
              key={rule.id}
              className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm hover:border-amber-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                    {rule.bundleName}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Lift {rule.lift}x
                  </span>
                </div>

                {/* Association Antecedent -> Consequent Flow */}
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 mb-4 flex items-center justify-between text-xs">
                  <div className="flex-1">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">สินค้าต้นทาง (Antecedent)</span>
                    <strong className="text-stone-900 block">{rule.antecedent.join(', ')}</strong>
                  </div>
                  <div className="px-3 text-amber-600 font-bold">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-right">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">สินค้าที่ซื้อร่วม (Consequent)</span>
                    <strong className="text-stone-900 block">{rule.consequent.join(', ')}</strong>
                  </div>
                </div>

                {/* Metrics Stats */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                  <div className="p-2 rounded-lg bg-stone-50 border border-stone-100">
                    <span className="text-[10px] text-stone-500 block">Support (โอกาสเกิด)</span>
                    <strong className="text-stone-800 font-bold">{(rule.support * 100).toFixed(0)}%</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-stone-50 border border-stone-100">
                    <span className="text-[10px] text-stone-500 block">Confidence (ความมั่นใจ)</span>
                    <strong className="text-stone-800 font-bold">{(rule.confidence * 100).toFixed(0)}%</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                    <span className="text-[10px] text-emerald-700 block">Lift (แรงส่งเสริม)</span>
                    <strong className="text-emerald-800 font-bold">{rule.lift}x</strong>
                  </div>
                </div>

                {/* Pricing & Ticket Size Upsell impact */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
                  <div>
                    <span className="text-stone-500 line-through mr-1.5">฿{rule.regularPrice}</span>
                    <span className="text-base font-extrabold text-amber-900">฿{rule.bundlePrice}</span>
                    <span className="ml-2 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      ประหยัด ฿{discountAmount} (-{discountPct}%)
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-stone-600">
                    กลุ่ม: {rule.targetPersona}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span>อัตราสั่งซื้อสำเร็จเมื่อแนะนำ: <strong>72.4%</strong></span>
                <span className="text-emerald-700 font-bold">+฿55 ต่อยอดบิล</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
