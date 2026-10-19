import React from 'react';
import { 
  Users, 
  Coffee, 
  Camera, 
  HeartHandshake, 
  Moon, 
  ArrowRight,
  TrendingUp,
  Tag,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { PersonaMetrics } from '../utils/crispDmEngine';
import { MemberRecord } from '../types/bakery';

interface PersonaClusterViewProps {
  personas: PersonaMetrics[];
  members: MemberRecord[];
  onOpenAiAdvisor: () => void;
}

export const PersonaClusterView: React.FC<PersonaClusterViewProps> = ({
  personas,
  members,
  onOpenAiAdvisor,
}) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Morning Commuter':
        return <Coffee className="w-6 h-6 text-amber-700" />;
      case 'Cafe Hopper':
        return <Camera className="w-6 h-6 text-rose-700" />;
      case 'Health & Family':
        return <HeartHandshake className="w-6 h-6 text-emerald-700" />;
      case 'Evening Discount Hunter':
        return <Moon className="w-6 h-6 text-indigo-700" />;
      default:
        return <Users className="w-6 h-6 text-stone-700" />;
    }
  };

  const getThemeClass = (name: string) => {
    switch (name) {
      case 'Morning Commuter':
        return {
          bg: 'bg-amber-50/60',
          border: 'border-amber-200',
          badge: 'bg-amber-100 text-amber-900 border-amber-300',
          header: 'from-amber-500 to-amber-700',
        };
      case 'Cafe Hopper':
        return {
          bg: 'bg-rose-50/60',
          border: 'border-rose-200',
          badge: 'bg-rose-100 text-rose-900 border-rose-300',
          header: 'from-rose-500 to-rose-700',
        };
      case 'Health & Family':
        return {
          bg: 'bg-emerald-50/60',
          border: 'border-emerald-200',
          badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          header: 'from-emerald-500 to-emerald-700',
        };
      case 'Evening Discount Hunter':
        return {
          bg: 'bg-indigo-50/60',
          border: 'border-indigo-200',
          badge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          header: 'from-indigo-500 to-indigo-700',
        };
      default:
        return {
          bg: 'bg-stone-50',
          border: 'border-stone-200',
          badge: 'bg-stone-100 text-stone-800 border-stone-300',
          header: 'from-stone-500 to-stone-700',
        };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
            CRISP-DM Phase 4: Modeling & Customer Segmentation
          </span>
          <h2 className="text-lg font-bold text-stone-900">
            เจาะลึก 4 กลุ่มเป้าหมายหลัก (Target Customer Personas)
          </h2>
          <p className="text-xs text-stone-500 max-w-2xl mt-1">
            จำแนกด้วย K-Means Clustering และ RFM Analysis จากพฤติกรรมการซื้อจริง ช่วยส่งโปรโมชันตรงใจเพื่อเพิ่ม Ticket Size 15% และ Retention Rate 25%
          </p>
        </div>

        <button
          onClick={onOpenAiAdvisor}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition shadow-sm self-start md:self-auto shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>ขอคำแนะนำการตลาดเฉพาะ Persona</span>
        </button>
      </div>

      {/* 4 Persona Deep-Dive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {personas.map((persona) => {
          const theme = getThemeClass(persona.name);
          const matchedMembers = members.filter(m => m.assignedPersona === persona.name);

          return (
            <div 
              key={persona.name}
              className={`rounded-2xl border ${theme.border} ${theme.bg} p-6 shadow-sm flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center border border-stone-200">
                      {getIcon(persona.name)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-stone-900">{persona.name}</h3>
                      <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border ${theme.badge}`}>
                        สัดส่วน {persona.pct}% ของลูกค้า
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-stone-500 block">ยอดซื้อเฉลี่ย</span>
                    <span className="text-lg font-extrabold text-stone-900">฿{persona.avgTicket}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 bg-white/80 p-3.5 rounded-xl border border-stone-200/70 text-xs">
                  <div>
                    <span className="text-stone-500 block">ช่วงเวลาเข้าใช้บริการ</span>
                    <strong className="text-stone-800">{persona.peakHour}</strong>
                  </div>
                  <div>
                    <span className="text-stone-500 block">เมนูยอดนิยม</span>
                    <strong className="text-stone-800">{persona.topItem}</strong>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-xs text-stone-700">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    กลยุทธ์การเพิ่มมูลค่าและดึงดูดการซื้อซ้ำ (Action Plan):
                  </div>
                  <p className="leading-relaxed bg-white/60 p-3 rounded-lg border border-stone-200/50">
                    {persona.actionStrategy}
                  </p>
                </div>
              </div>

              {/* Sample Members in Cluster */}
              <div className="pt-3 border-t border-stone-200/80 text-xs">
                <div className="flex items-center justify-between text-stone-500 mb-1">
                  <span>ตัวอย่างสมาชิกในกลุ่มนี้ ({matchedMembers.length} คน):</span>
                  <span className="font-medium text-stone-700">เชื่อมต่อ LINE OA แล้ว</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {matchedMembers.slice(0, 3).map(m => (
                    <span key={m.id} className="px-2 py-0.5 rounded bg-white text-stone-800 border border-stone-200 font-medium text-[11px]">
                      {m.name} (ซื้อ {m.totalVisits} ครั้ง)
                    </span>
                  ))}
                  {matchedMembers.length === 0 && (
                    <span className="text-stone-400 italic">พร้อมแมปปิ้งเมื่อมีข้อมูลเพิ่มเติม</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
