import React from 'react';
import { 
  ChefHat, 
  Store, 
  TrendingUp, 
  Upload, 
  Sparkles, 
  Database,
  RotateCcw,
  Layers
} from 'lucide-react';
import { UserRole } from '../types/bakery';

interface HeaderProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  isCustomData: boolean;
  hasData?: boolean;
  onOpenUpload: () => void;
  onResetData: () => void;
  onLoadDemo?: () => void;
  onOpenAiAdvisor: () => void;
  activeTab: 'dashboard' | 'personas' | 'market-basket' | 'crisp-phases';
  onChangeTab: (tab: 'dashboard' | 'personas' | 'market-basket' | 'crisp-phases') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onSelectRole,
  isCustomData,
  hasData = true,
  onOpenUpload,
  onResetData,
  onLoadDemo,
  onOpenAiAdvisor,
  activeTab,
  onChangeTab,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 text-stone-100 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo & System Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
              <ChefHat className="w-7 h-7 text-stone-950" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white truncate">
                  BakeryData Intelligence
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  CRISP-DM
                </span>
                {isCustomData ? (
                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    ข้อมูลของคุณ (Custom Data)
                  </span>
                ) : hasData ? (
                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-stone-700 text-stone-300">
                    ข้อมูลตัวอย่าง (Demo Data)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    ยังไม่มีข้อมูล (รออัปโหลด)
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400 truncate hidden sm:block">
                ระบบวิเคราะห์พฤติกรรมลูกค้าและเพิ่มผลกำไร • ลดของเสีย 20% | เพิ่ม Ticket Size 15% | เพิ่ม Retention 25%
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Custom Data Upload Button */}
            <button
              id="upload-data-btn"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 transition shadow-sm"
              title="อัปโหลดข้อมูล POS / CRM / Kitchen ของคุณเอง"
            >
              <Upload className="w-4 h-4 text-stone-950" />
              <span className="hidden md:inline">อัปโหลดข้อมูลของคุณ</span>
              <span className="md:hidden">อัปโหลด</span>
            </button>

            {hasData && (
              <button
                id="reset-data-btn"
                onClick={onResetData}
                className="inline-flex items-center gap-1 px-2.5 py-2 text-xs rounded-lg bg-stone-800 hover:bg-rose-950/40 text-stone-300 hover:text-rose-300 border border-stone-700 hover:border-rose-800 transition"
                title="ล้างข้อมูลทั้งหมดเพื่อให้ระบบว่างเปล่า (Clear All Data)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px]">ล้างข้อมูล (Clear)</span>
              </button>
            )}

            {/* AI Advisor Gemini Button */}
            <button
              id="ai-advisor-btn"
              onClick={onOpenAiAdvisor}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 transition shadow-md shadow-amber-500/25"
            >
              <Sparkles className="w-4 h-4 text-stone-950 fill-stone-950" />
              <span>ที่ปรึกษา AI</span>
            </button>
          </div>
        </div>

        {/* Secondary Navigation & Role Selector Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between py-2 border-t border-stone-800/80 gap-2">
          
          {/* Main Views Navigation */}
          <nav className="flex items-center space-x-1 overflow-x-auto text-xs font-medium">
            <button
              id="nav-tab-dashboard"
              onClick={() => onChangeTab('dashboard')}
              className={`px-3 py-1.5 rounded-md transition whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500 text-stone-950 font-semibold'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              แดชบอร์ดหลัก
            </button>
            <button
              id="nav-tab-personas"
              onClick={() => onChangeTab('personas')}
              className={`px-3 py-1.5 rounded-md transition whitespace-nowrap ${
                activeTab === 'personas'
                  ? 'bg-amber-500 text-stone-950 font-semibold'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              4 กลุ่มลูกค้า (Personas)
            </button>
            <button
              id="nav-tab-market-basket"
              onClick={() => onChangeTab('market-basket')}
              className={`px-3 py-1.5 rounded-md transition whitespace-nowrap ${
                activeTab === 'market-basket'
                  ? 'bg-amber-500 text-stone-950 font-semibold'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              วิเคราะห์ตะกร้าสินค้า (Market Basket)
            </button>
            <button
              id="nav-tab-crisp-phases"
              onClick={() => onChangeTab('crisp-phases')}
              className={`px-3 py-1.5 rounded-md transition whitespace-nowrap ${
                activeTab === 'crisp-phases'
                  ? 'bg-amber-500 text-stone-950 font-semibold'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              กระบวนการ CRISP-DM 6 ขั้นตอน
            </button>
          </nav>

          {/* User Role Switcher for Precision Decisions */}
          <div className="flex items-center self-end sm:self-auto gap-1 bg-stone-950 p-1 rounded-lg border border-stone-800">
            <span className="text-[11px] text-stone-400 px-2 font-medium hidden md:inline">
              มุมมอง:
            </span>
            <button
              id="role-btn-manager"
              onClick={() => onSelectRole('manager')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition ${
                currentRole === 'manager'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>ผู้จัดการร้าน</span>
            </button>
            <button
              id="role-btn-kitchen"
              onClick={() => onSelectRole('kitchen')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition ${
                currentRole === 'kitchen'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>ห้องครัว & เชฟ</span>
            </button>
            <button
              id="role-btn-executive"
              onClick={() => onSelectRole('executive')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition ${
                currentRole === 'executive'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>ฝ่ายบริหาร</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
