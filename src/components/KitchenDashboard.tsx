import React, { useState } from 'react';
import { 
  ChefHat, 
  Flame, 
  Calendar, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  PackageCheck,
  Plus
} from 'lucide-react';
import { ProductionBatch } from '../types/bakery';
import { ModelInsightsPanel } from './ModelInsightsPanel';

interface KitchenDashboardProps {
  batches: ProductionBatch[];
  onOpenAiAdvisor: () => void;
  onAddBatch?: (batch: ProductionBatch) => void;
}

export const KitchenDashboard: React.FC<KitchenDashboardProps> = ({
  batches,
  onOpenAiAdvisor,
  onAddBatch,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'Morning' | 'Mid-day' | 'Afternoon'>('all');
  const [showLogModal, setShowLogModal] = useState(false);
  const [newWasteItem, setNewWasteItem] = useState({
    productName: 'ครัวซองต์เนยฝรั่งเศส (Butter Croissant)',
    qty: 2,
    reason: 'End of Shelf Life' as const,
  });

  const filteredBatches = batches.filter(b => {
    if (selectedFilter === 'all') return true;
    return b.timeSlot.includes(selectedFilter);
  });

  const totalBaked = batches.reduce((sum, b) => sum + b.actualBaked, 0);
  const totalWaste = batches.reduce((sum, b) => sum + b.wasteQty, 0);
  const totalSold = batches.reduce((sum, b) => sum + b.actualSold, 0);
  const wasteRate = totalBaked > 0 ? ((totalWaste / totalBaked) * 100).toFixed(1) : '0';

  const inventoryStock = [
    { item: 'เนยสดแท้ฝรั่งเศส (AOP French Butter)', stock: '42 kg', par: '35 kg', status: 'Optimal', badge: 'bg-emerald-100 text-emerald-800' },
    { item: 'แป้งสาลีไม่ขัดสีนำเข้า (T55 Flour)', stock: '120 kg', par: '100 kg', status: 'Optimal', badge: 'bg-emerald-100 text-emerald-800' },
    { item: 'วิปปิ้งครีมแดรี่สด 35%', stock: '18 L', par: '25 L', status: 'Reorder Soon', badge: 'bg-amber-100 text-amber-800' },
    { item: 'ธัญพืช 9 ชนิด (Mixed Grains & Chia)', stock: '35 kg', par: '30 kg', status: 'Optimal', badge: 'bg-emerald-100 text-emerald-800' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Production Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">จำนวนอบสดวันนี้</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <ChefHat className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900">{totalBaked} ชิ้น</div>
          <p className="text-xs text-stone-500 mt-1">แบ่งเป็น 3 รอบการอบตาม Demand Forecast</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">จำหน่ายออกได้</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900">{totalSold} ชิ้น</div>
          <p className="text-xs text-emerald-600 font-semibold mt-1">
            อัตราการขายออก {totalBaked > 0 ? ((totalSold / totalBaked) * 100).toFixed(1) : 0}%
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">ของเหลือทิ้ง (Waste)</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-700">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900">{totalWaste} ชิ้น</div>
          <p className="text-xs text-emerald-600 font-semibold mt-1">
            อัตราสูญเสีย {wasteRate}% (ต่ำกว่าเกณฑ์ 5%)
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">เป้าหมายลดขยะ -20%</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {totalBaked > 0 ? (
              <span className="text-emerald-700">สำเร็จแล้ว</span>
            ) : (
              <span className="text-stone-400">รอข้อมูล</span>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {totalBaked > 0 ? `ลดจากเดิม 18.5% สู่ระดับ ${wasteRate}%` : 'บันทึกการผลิตเพื่อคำนวณอัตราขยะ'}
          </p>
        </div>

      </div>

      {/* Production & Baking Schedule Table */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-600" />
              ตารางการอบขนมปังสดล่วงหน้า (Baking & Production Schedule)
            </h3>
            <p className="text-xs text-stone-500">
              คำนวณปริมาณการอบแยกระหว่างรอบเช้าและบ่ายเพื่อป้องกันการผลิตเกิน (Over-production)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Tabs */}
            <div className="inline-flex rounded-lg bg-stone-100 p-1 border border-stone-200 text-xs">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1 rounded-md transition ${selectedFilter === 'all' ? 'bg-white font-bold text-stone-900 shadow-sm' : 'text-stone-600'}`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setSelectedFilter('Morning')}
                className={`px-3 py-1 rounded-md transition ${selectedFilter === 'Morning' ? 'bg-white font-bold text-stone-900 shadow-sm' : 'text-stone-600'}`}
              >
                เช้า (05:30)
              </button>
              <button
                onClick={() => setSelectedFilter('Mid-day')}
                className={`px-3 py-1 rounded-md transition ${selectedFilter === 'Mid-day' ? 'bg-white font-bold text-stone-900 shadow-sm' : 'text-stone-600'}`}
              >
                กลางวัน (10:30)
              </button>
              <button
                onClick={() => setSelectedFilter('Afternoon')}
                className={`px-3 py-1 rounded-md transition ${selectedFilter === 'Afternoon' ? 'bg-white font-bold text-stone-900 shadow-sm' : 'text-stone-600'}`}
              >
                บ่าย (14:30)
              </button>
            </div>

            <button
              onClick={onOpenAiAdvisor}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 rounded-lg transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>AI วางแผนอบ</span>
            </button>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-50 border-y border-stone-200 text-stone-600 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-3">รอบเวลาอบ</th>
                <th className="py-3 px-3">รายการเบเกอรี่</th>
                <th className="py-3 px-3 text-center">แผนการผลิต (Demand)</th>
                <th className="py-3 px-3 text-center">อบจริง</th>
                <th className="py-3 px-3 text-center">จำหน่ายแล้ว</th>
                <th className="py-3 px-3 text-center">ของเสีย (Waste)</th>
                <th className="py-3 px-3">สาเหตุสูญเสีย</th>
                <th className="py-3 px-3 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredBatches.length > 0 ? (
                filteredBatches.map((batch) => {
                  const isWasteHigh = batch.wasteQty > 2;
                  return (
                    <tr key={batch.id} className="hover:bg-stone-50/80 transition">
                      <td className="py-3 px-3 font-medium text-stone-900 whitespace-nowrap flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {batch.timeSlot}
                      </td>
                      <td className="py-3 px-3 font-semibold text-stone-900">
                        {batch.productName}
                        <span className="block text-[11px] text-stone-400 font-normal">ต้นทุน: ฿{batch.unitCost} | ขาย: ฿{batch.sellingPrice}</span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-stone-700">{batch.plannedQty}</td>
                      <td className="py-3 px-3 text-center font-bold text-stone-900">{batch.actualBaked}</td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-700">{batch.actualSold}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          batch.wasteQty === 0 ? 'bg-emerald-100 text-emerald-800' :
                          isWasteHigh ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {batch.wasteQty}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-stone-500">
                        {batch.wasteReason || '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ควบคุมได้
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-stone-400 text-xs">
                    ยังไม่มีข้อมูลบันทึกรอบการอบ — กรุณาคลิก "อัปโหลดข้อมูลของคุณ" หรือกด "+ บันทึกของเสีย / รอบอบ"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Columns: Raw Material Stocks & Waste Root Cause Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Raw Material Inventory Tracker */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <h3 className="text-base font-bold text-stone-900 mb-1 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-amber-600" />
            สถานะวัตถุดิบหลักและจุดสั่งซื้อ (Raw Material Inventory & Par-Level)
          </h3>
          <p className="text-xs text-stone-500 mb-4">
            เชื่อมโยงกับ Demand Forecast ป้องกันวัตถุดิบเสื่อมสภาพก่อนเวลา
          </p>

          <div className="space-y-3">
            {inventoryStock.map((inv) => (
              <div key={inv.item} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-stone-900">{inv.item}</div>
                  <div className="text-xs text-stone-500">
                    คงเหลือในสต็อก: <strong className="text-stone-800">{inv.stock}</strong> (ระดับปลอดภัย: {inv.par})
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${inv.badge}`}>
                  {inv.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Waste Root Cause & Mitigation Guidance */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              การวิเคราะห์สาเหตุของเสียและมาตรการแก้ไข (Waste Mitigation)
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              CRISP-DM Evaluation Phase: จัดกลุ่มสาเหตุการสูญเสียเพื่อปรับปรุงกระบวนการครัว
            </p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1">
                  <span>1. หมดอายุการวางขาย (End of Shelf Life) — 60%</span>
                  <span className="text-emerald-700">แก้ไขแล้วด้วย Dynamic Markdown</span>
                </div>
                <p className="text-xs text-stone-600">
                  ส่งต่อเบเกอรี่ที่เหลือเข้าสู่ช่วง Dynamic Markdown 18:30 น. ช่วยลดของเสียลงได้กว่า 90%
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                <div className="flex items-center justify-between text-xs font-bold text-blue-900 mb-1">
                  <span>2. รูปลักษณ์ไม่ได้มาตรฐาน (Aesthetic Defect) — 25%</span>
                  <span>แปรรูปเป็น Croutons/Pudding</span>
                </div>
                <p className="text-xs text-stone-600">
                  นำครัวซองต์หรือขนมปังที่ไม่ขึ้นรูปสวยมาหั่นอบเนยกระเทียม หรือขนมปังพุดดิ้งจำหน่ายเสริม
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                <div className="flex items-center justify-between text-xs font-bold text-rose-900 mb-1">
                  <span>3. อบไหม้เกินกำหนด (Overbaked) — 15%</span>
                  <span>ปรับอุณหภูมิเตา Convection</span>
                </div>
                <p className="text-xs text-stone-600">
                  ตั้งเวลาแจ้งเตือนดิจิทัลก่อนครบเวลาอบ 3 นาทีเพื่อตรวจสอบระดับสีผิวของขนม
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-stone-100 rounded-xl text-xs text-stone-700 flex items-center justify-between">
            <span>👨‍🍳 สรุปคำแนะนำเชฟ:</span>
            <span className="font-semibold text-stone-900">อบรอบ 14:30 น. เฉพาะกลุ่มโฮลวีตและซาวเวอร์โดว์</span>
          </div>
        </div>

      </div>

      {/* ML model outputs: baking plan + waste risk (synthetic demo data) */}
      <ModelInsightsPanel />

    </div>
  );
};
