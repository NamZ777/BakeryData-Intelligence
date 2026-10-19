import React, { useState, useMemo, useEffect } from 'react';
import { UserRole, PosTransaction, MemberRecord, ProductionBatch } from './types/bakery';
import { 
  INITIAL_TRANSACTIONS, 
  INITIAL_MEMBERS, 
  INITIAL_BATCHES 
} from './data/mockBakeryData';
import { 
  computeTargetKpis, 
  computePersonaMetrics 
} from './utils/crispDmEngine';
import { 
  saveDataset, 
  loadDataset, 
  clearCustomDatasets, 
  safeSetItem 
} from './utils/storageHelper';
import { downloadFile, SAMPLE_POS_CSV } from './utils/csvHelper';

import { Header } from './components/Header';
import { KpiSummaryBanner } from './components/KpiSummaryBanner';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { ManagerDashboard } from './components/ManagerDashboard';
import { KitchenDashboard } from './components/KitchenDashboard';
import { PersonaClusterView } from './components/PersonaClusterView';
import { MarketBasketView } from './components/MarketBasketView';
import { CrispDmPhasesView } from './components/CrispDmPhasesView';
import { DataUploadModal } from './components/DataUploadModal';
import { AiAdvisorDrawer } from './components/AiAdvisorDrawer';
import { Upload, Download, Sparkles, Database, FileSpreadsheet, PlusCircle } from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('executive');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'personas' | 'market-basket' | 'crisp-phases'>('dashboard');
  
  // Custom or Demo Data Storage - defaults to EMPTY array (no sample data) unless user uploaded or explicitly enabled demo
  const [transactions, setTransactions] = useState<PosTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('bakery_custom_tx');
      if (saved) return JSON.parse(saved);
      const isDemo = localStorage.getItem('bakery_use_demo') === 'true';
      if (isDemo) return INITIAL_TRANSACTIONS;
      return [];
    } catch {
      return [];
    }
  });

  const [members, setMembers] = useState<MemberRecord[]>(() => {
    try {
      const saved = localStorage.getItem('bakery_custom_members');
      if (saved) return JSON.parse(saved);
      const isDemo = localStorage.getItem('bakery_use_demo') === 'true';
      if (isDemo) return INITIAL_MEMBERS;
      return [];
    } catch {
      return [];
    }
  });

  const [batches, setBatches] = useState<ProductionBatch[]>(() => {
    try {
      const saved = localStorage.getItem('bakery_custom_batches');
      if (saved) return JSON.parse(saved);
      const isDemo = localStorage.getItem('bakery_use_demo') === 'true';
      if (isDemo) return INITIAL_BATCHES;
      return [];
    } catch {
      return [];
    }
  });

  const [isCustomData, setIsCustomData] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('bakery_is_custom'));
  });

  const hasData = transactions.length > 0 || members.length > 0 || batches.length > 0;

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAiAdvisorOpen, setIsAiAdvisorOpen] = useState(false);

  // Load from IndexedDB on initial mount if available
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const isCustom = Boolean(localStorage.getItem('bakery_is_custom'));
        if (isCustom) {
          const [savedTx, savedMem, savedBat] = await Promise.all([
            loadDataset<PosTransaction[]>('bakery_custom_tx', []),
            loadDataset<MemberRecord[]>('bakery_custom_members', []),
            loadDataset<ProductionBatch[]>('bakery_custom_batches', []),
          ]);
          if (active) {
            if (savedTx && savedTx.length > 0) setTransactions(savedTx);
            if (savedMem && savedMem.length > 0) setMembers(savedMem);
            if (savedBat && savedBat.length > 0) setBatches(savedBat);
            setIsCustomData(true);
          }
        }
      } catch (err) {
        console.warn('Initial storage load warning:', err);
      }
    })();
    return () => { active = false; };
  }, []);

  // Dynamic calculations via CRISP-DM Engine
  const kpis = useMemo(() => {
    return computeTargetKpis(transactions, members, batches);
  }, [transactions, members, batches]);

  const personaMetrics = useMemo(() => {
    return computePersonaMetrics(transactions, members);
  }, [transactions, members]);

  // Handle custom data application safely
  const handleApplyCustomData = async (data: {
    transactions?: PosTransaction[];
    members?: MemberRecord[];
    batches?: ProductionBatch[];
  }) => {
    try {
      if (data.transactions && data.transactions.length > 0) {
        setTransactions(data.transactions);
        await saveDataset('bakery_custom_tx', data.transactions);
      }
      if (data.members && data.members.length > 0) {
        setMembers(data.members);
        await saveDataset('bakery_custom_members', data.members);
      }
      if (data.batches && data.batches.length > 0) {
        setBatches(data.batches);
        await saveDataset('bakery_custom_batches', data.batches);
      }
      setIsCustomData(true);
      safeSetItem('bakery_is_custom', 'true');
      localStorage.removeItem('bakery_use_demo');
    } catch (err) {
      console.warn('Dataset save note: data kept in active memory session:', err);
      setIsCustomData(true);
      safeSetItem('bakery_is_custom', 'true');
    }
  };

  // Clear all data to empty state
  const handleClearAllData = async () => {
    setTransactions([]);
    setMembers([]);
    setBatches([]);
    setIsCustomData(false);
    localStorage.removeItem('bakery_use_demo');
    localStorage.removeItem('bakery_is_custom');
    localStorage.removeItem('bakery_custom_tx');
    localStorage.removeItem('bakery_custom_members');
    localStorage.removeItem('bakery_custom_batches');
    localStorage.removeItem('bakery_custom_tx_preview');
    await clearCustomDatasets();
  };

  // Optional: load demo data for testing
  const handleLoadDemoData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setMembers(INITIAL_MEMBERS);
    setBatches(INITIAL_BATCHES);
    setIsCustomData(false);
    safeSetItem('bakery_use_demo', 'true');
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 text-stone-900 selection:bg-amber-500 selection:text-white">
      
      {/* Top Header with Brand & Role Navigator */}
      <Header
        currentRole={currentRole}
        onSelectRole={(role) => {
          setCurrentRole(role);
          setActiveTab('dashboard');
        }}
        isCustomData={isCustomData}
        hasData={hasData}
        onOpenUpload={() => setIsUploadOpen(true)}
        onResetData={handleClearAllData}
        onLoadDemo={handleLoadDemoData}
        onOpenAiAdvisor={() => setIsAiAdvisorOpen(true)}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Empty State Onboarding Hero if No Data */}
        {!hasData && (
          <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-stone-800 text-white rounded-2xl p-6 sm:p-8 border border-stone-800 shadow-xl relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                  <Database className="w-3.5 h-3.5" />
                  <span>ระบบพร้อมรับข้อมูลของคุณ • ข้อมูลร้านว่างเปล่า (Clean Slate) • ผลโมเดล ML ที่แสดงมาจากข้อมูลจำลองเพื่อสาธิต</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  พร้อมสำหรับการอัปโหลดข้อมูลของร้านคุณ
                </h2>
                <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
                  ระบบวิเคราะห์พฤติกรรมลูกค้าและการเพิ่มกำไรถูกเตรียมไว้แบบว่างเปล่า เพื่อให้ทุกตัวชี้วัด กราฟพยากรณ์ และกลุ่ม Persona สะท้อนความเป็นจริงของร้านคุณ 100% คุณสามารถอัปโหลดไฟล์บิลขาย (POS), ข้อมูลสมาชิก (CRM) หรือบันทึกห้องครัว (Kitchen) ได้ทันที
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold text-stone-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 rounded-xl transition shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-stone-900" />
                  <span>อัปโหลดข้อมูลร้านของคุณ</span>
                </button>

                <button
                  onClick={() => {
                    downloadFile('bakery_pos_transactions_template.csv', SAMPLE_POS_CSV);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold text-stone-200 bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded-xl transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                  <span>ดาวน์โหลดเทมเพลต CSV</span>
                </button>

                <button
                  onClick={handleLoadDemoData}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-3 text-xs text-stone-400 hover:text-stone-200 transition cursor-pointer underline underline-offset-4"
                  title="โหลดข้อมูลตัวอย่างเพื่อทดสอบดูการแสดงผล"
                >
                  <span>หรือโหลดข้อมูลตัวอย่าง</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 KPIs Achievement Progress Banner */}
        <KpiSummaryBanner kpis={kpis} />

        {/* View Routing */}
        {activeTab === 'dashboard' && (
          <>
            {currentRole === 'executive' && (
              <ExecutiveDashboard
                transactions={transactions}
                members={members}
                batches={batches}
                personas={personaMetrics}
                kpis={kpis}
                onOpenAiAdvisor={() => setIsAiAdvisorOpen(true)}
              />
            )}

            {currentRole === 'manager' && (
              <ManagerDashboard
                transactions={transactions}
                onOpenAiAdvisor={() => setIsAiAdvisorOpen(true)}
              />
            )}

            {currentRole === 'kitchen' && (
              <KitchenDashboard
                batches={batches}
                onOpenAiAdvisor={() => setIsAiAdvisorOpen(true)}
              />
            )}
          </>
        )}

        {activeTab === 'personas' && (
          <PersonaClusterView
            personas={personaMetrics}
            members={members}
            onOpenAiAdvisor={() => setIsAiAdvisorOpen(true)}
          />
        )}

        {activeTab === 'market-basket' && (
          <MarketBasketView
            onOpenAiAdvisor={() => setIsAiAdvisorOpen(true)}
          />
        )}

        {activeTab === 'crisp-phases' && (
          <CrispDmPhasesView />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-6 mt-12 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-bold text-stone-800">BakeryData Intelligence & Profit Optimizer</span>
            <span className="mx-2">•</span>
            <span>ขับเคลื่อนด้วยกระบวนการวิทยาศาสตร์ข้อมูล CRISP-DM</span>
          </div>
          <div className="flex items-center gap-3">
            {hasData ? (
              <button
                onClick={handleClearAllData}
                className="text-stone-400 hover:text-rose-600 transition"
                title="ล้างข้อมูลทั้งหมดเพื่อให้ระบบว่างเปล่า"
              >
                ล้างข้อมูลทั้งหมดในระบบ (Clear All)
              </button>
            ) : (
              <button
                onClick={handleLoadDemoData}
                className="text-stone-400 hover:text-amber-700 transition"
              >
                โหลดข้อมูลตัวอย่างสำหรับทดลอง
              </button>
            )}
            <span>•</span>
            <span className="text-stone-400">ลดของเสีย 20% • เพิ่ม Ticket Size 15% • เพิ่ม Retention 25%</span>
          </div>
        </div>
      </footer>

      {/* Custom Data Upload Modal */}
      <DataUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onApplyCustomData={handleApplyCustomData}
        onResetToDemo={handleClearAllData}
        onLoadDemo={handleLoadDemoData}
      />

      {/* Gemini AI Advisor Drawer */}
      <AiAdvisorDrawer
        isOpen={isAiAdvisorOpen}
        onClose={() => setIsAiAdvisorOpen(false)}
        currentRole={currentRole}
        kpis={kpis}
        personas={personaMetrics}
        transactions={transactions}
        members={members}
        batches={batches}
      />

    </div>
  );
}
