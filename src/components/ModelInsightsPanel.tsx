import React, { useState } from 'react';
import { Brain, Info } from 'lucide-react';
import { MODEL_OUTPUTS, WasteSlotKey } from '../data/modelOutputs';
import { SyntheticBadge } from './SyntheticBadge';

const SLOTS: { key: WasteSlotKey; label: string; hours: string }[] = [
  { key: 'Morning', label: 'เช้า', hours: '07–10 น.' },
  { key: 'Midday', label: 'สาย–บ่าย', hours: '11–14 น.' },
  { key: 'Afternoon', label: 'บ่ายแก่–เย็น', hours: '15–17 น.' },
  { key: 'Evening', label: 'ก่อนปิดร้าน', hours: '18–19 น.' },
];

const LEVEL_STYLE = {
  high: 'bg-rose-100 text-rose-800 border-rose-200',
  mid: 'bg-amber-50 text-amber-800 border-amber-200',
  low: 'bg-emerald-50 text-emerald-800 border-emerald-200',
} as const;

const LEVEL_LABEL = { high: 'เสี่ยงสูง', mid: 'ปานกลาง', low: 'ต่ำ' } as const;

export const ModelInsightsPanel: React.FC = () => {
  const [dayType, setDayType] = useState<'weekday' | 'weekend'>('weekday');
  const { meta, metrics, bakingPlan, bakingPlanCheck, wasteRisk } = MODEL_OUTPUTS;
  const plan = bakingPlan[dayType];
  const maxTotal = Math.max(...plan.map((p) => p.total), 1);
  const planned = dayType === 'weekday' ? bakingPlanCheck.plannedPerDayWeekday : bakingPlanCheck.plannedPerDayWeekend;
  const actual = dayType === 'weekday' ? bakingPlanCheck.actualAvgPerDayWeekday : bakingPlanCheck.actualAvgPerDayWeekend;

  return (
    <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-600" />
              ผลโมเดล ML: แผนอบแนะนำ และความเสี่ยงของเสีย
            </h3>
            <SyntheticBadge />
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Random Forest 2 ตัว: พยากรณ์ปริมาณขายรายชั่วโมง (Baking Demand) และทำนายโอกาสเกิดของเสีย (Waste Risk)
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 font-semibold">
            Waste ROC-AUC {metrics.waste.rocAuc}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 font-semibold">
            Demand R² {metrics.demand.r2}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 font-semibold">
            MAPE รายวัน {metrics.demand.dailyMapePct}%
          </span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-violet-50 border border-violet-200 text-xs text-violet-900">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          {meta.disclaimer} ({meta.rows.toLocaleString()} แถว / {meta.transactions.toLocaleString()} บิล, {meta.dateFrom} ถึง {meta.dateTo})
          ผลลัพธ์ด้านล่างแสดงวิธีการทำงานของระบบ ยังไม่ควรนำไปตัดสินใจกับร้านจริงจนกว่าจะเทรนซ้ำด้วยข้อมูลการขายจริง
        </span>
      </div>

      {/* Baking plan */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <div className="text-sm font-bold text-stone-900">แผนอบแนะนำต่อรอบ (ชิ้น)</div>
            <div className="text-xs text-stone-500">เฉพาะสินค้าที่อบ ไม่รวมเครื่องดื่ม • เผื่อกันชน 15% • ปัดขึ้นเป็นจำนวนเต็ม</div>
          </div>
          <div className="inline-flex rounded-lg border border-stone-200 overflow-hidden text-xs font-semibold">
            {(['weekday', 'weekend'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setDayType(t)}
                className={`px-3 py-1.5 transition ${dayType === t ? 'bg-amber-600 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
              >
                {t === 'weekday' ? 'วันธรรมดา' : 'เสาร์–อาทิตย์'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-stone-500 border-b border-stone-200">
                <th className="py-2 pr-3 text-left font-semibold">สินค้า</th>
                <th className="py-2 px-2 text-center font-semibold">รอบ 05:30<br /><span className="font-normal">ขาย 07–10 น.</span></th>
                <th className="py-2 px-2 text-center font-semibold">รอบ 10:30<br /><span className="font-normal">ขาย 11–14 น.</span></th>
                <th className="py-2 px-2 text-center font-semibold">รอบ 14:30<br /><span className="font-normal">ขาย 15–19 น.</span></th>
                <th className="py-2 pl-2 text-left font-semibold">รวม/วัน</th>
              </tr>
            </thead>
            <tbody>
              {plan.map((row) => (
                <tr key={row.product} className="border-b border-stone-100">
                  <td className="py-2 pr-3 text-stone-800 font-medium">{row.product}</td>
                  <td className="py-2 px-2 text-center text-stone-700">{row.morning}</td>
                  <td className="py-2 px-2 text-center text-stone-700">{row.midday}</td>
                  <td className="py-2 px-2 text-center text-stone-700">{row.afternoon}</td>
                  <td className="py-2 pl-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 rounded-full bg-amber-500" style={{ width: `${(row.total / maxTotal) * 64}px` }} />
                      <span className="font-bold text-stone-900">{row.total}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-stone-500 mt-2">
          แผนรวม {planned} ชิ้น/วัน เทียบกับยอดขายจริงเฉลี่ยในข้อมูล {actual} ชิ้น/วัน (ส่วนต่างคือกันชนกันของขาดสต็อก)
          คำนวณด้วยสภาพอากาศ "มีเมฆ" และเดือนล่าสุดในข้อมูล
        </p>
      </div>

      {/* Waste risk */}
      <div>
        <div className="mb-3">
          <div className="text-sm font-bold text-stone-900">ความเสี่ยงของเสียตามสินค้าและช่วงเวลา</div>
          <div className="text-xs text-stone-500">
            สีเทียบความเสี่ยงที่โมเดลทายระหว่างช่องด้วยกัน • ตัวเลข = อัตราของเสียจริงในชุดทดสอบ • ไม่รวมเครื่องดื่ม
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-stone-500 border-b border-stone-200">
                <th className="py-2 pr-3 text-left font-semibold">สินค้า</th>
                {SLOTS.map((s) => (
                  <th key={s.key} className="py-2 px-2 text-center font-semibold">
                    {s.label}<br /><span className="font-normal">{s.hours}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wasteRisk.map((row) => (
                <tr key={row.product} className="border-b border-stone-100">
                  <td className="py-2 pr-3 text-stone-800 font-medium">{row.product}</td>
                  {SLOTS.map((s) => {
                    const c = row.slots[s.key];
                    return (
                      <td key={s.key} className="py-1.5 px-2 text-center">
                        {c ? (
                          <span
                            title={`${LEVEL_LABEL[c.level]} • จากตัวอย่าง ${c.n} รายการ`}
                            className={`inline-block min-w-[52px] px-2 py-1 rounded-md border font-semibold ${LEVEL_STYLE[c.level]}`}
                          >
                            {c.actualWastePct.toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-stone-300">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-stone-600">
          {(['high', 'mid', 'low'] as const).map((l) => (
            <span key={l} className="inline-flex items-center gap-1">
              <span className={`w-3 h-3 rounded border ${LEVEL_STYLE[l]}`} />
              {LEVEL_LABEL[l]}
            </span>
          ))}
          <span className="text-stone-500">
            • โมเดลจับของเสียได้ {Math.round(metrics.waste.recall * 100)}% แต่เตือนผิดบ่อย (precision {Math.round(metrics.waste.precision * 100)}%)
            เหมาะใช้จัดลำดับความเสี่ยง มากกว่าใช้ตัดสินรายชิ้น
          </span>
        </div>
      </div>
    </div>
  );
};
