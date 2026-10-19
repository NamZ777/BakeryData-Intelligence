import React from 'react';
import { FlaskConical } from 'lucide-react';
import { MODEL_OUTPUTS } from '../data/modelOutputs';

/** ป้ายแจ้งว่าตัวเลขตรงนี้มาจากโมเดลที่เทรนด้วยข้อมูลจำลอง ไม่ใช่ข้อมูลจริงของร้าน */
export const SyntheticBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span
    title={MODEL_OUTPUTS.meta.disclaimer}
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200 text-[10px] font-bold whitespace-nowrap ${className}`}
  >
    <FlaskConical className="w-3 h-3" />
    ข้อมูลจำลองเพื่อสาธิต
  </span>
);
