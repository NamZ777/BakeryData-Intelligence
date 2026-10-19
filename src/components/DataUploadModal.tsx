import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Download, 
  Check, 
  AlertCircle, 
  Database,
  ArrowRight,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { 
  SAMPLE_POS_CSV, 
  SAMPLE_CRM_CSV, 
  SAMPLE_KITCHEN_CSV, 
  downloadFile,
  parsePosCsv,
  parseCrmCsv,
  parseKitchenCsv,
  detectCsvType
} from '../utils/csvHelper';
import { PosTransaction, MemberRecord, ProductionBatch } from '../types/bakery';

interface DataUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCustomData: (data: {
    transactions?: PosTransaction[];
    members?: MemberRecord[];
    batches?: ProductionBatch[];
  }) => Promise<void> | void;
  onResetToDemo: () => void;
  onLoadDemo?: () => void;
}

export const DataUploadModal: React.FC<DataUploadModalProps> = ({
  isOpen,
  onClose,
  onApplyCustomData,
  onResetToDemo,
  onLoadDemo,
}) => {
  const [activeTab, setActiveTab] = useState<'pos' | 'crm' | 'kitchen' | 'json'>('pos');
  const [dragActive, setDragActive] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<{
    type: 'pos' | 'crm' | 'kitchen' | 'json';
    count: number;
    sampleRows: any[];
    rawParsedData: any;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    if (activeTab === 'pos') {
      downloadFile('bakery_pos_transactions_template.csv', SAMPLE_POS_CSV);
    } else if (activeTab === 'crm') {
      downloadFile('bakery_crm_members_template.csv', SAMPLE_CRM_CSV);
    } else if (activeTab === 'kitchen') {
      downloadFile('bakery_kitchen_production_template.csv', SAMPLE_KITCHEN_CSV);
    }
  };

  const processFile = (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text || text.trim().length === 0) {
          throw new Error('ไม่พบข้อมูลในไฟล์ที่เลือก หรือไฟล์ว่างเปล่า');
        }

        // Auto-detect CSV type if user uploaded to wrong tab
        let targetType = activeTab;
        if (activeTab !== 'json') {
          const detected = detectCsvType(text);
          if (detected !== 'unknown' && detected !== activeTab) {
            targetType = detected;
            setActiveTab(detected);
          }
        }

        if (targetType === 'pos') {
          const parsed = parsePosCsv(text);
          if (parsed.length === 0) throw new Error('ไม่พบข้อมูลรายการขายที่ถูกต้องในไฟล์ CSV');
          setParsedPreview({
            type: 'pos',
            count: parsed.length,
            sampleRows: parsed.slice(0, 5),
            rawParsedData: parsed,
          });
        } else if (targetType === 'crm') {
          const parsed = parseCrmCsv(text);
          if (parsed.length === 0) throw new Error('ไม่พบข้อมูลสมาชิกที่ถูกต้องในไฟล์ CSV');
          setParsedPreview({
            type: 'crm',
            count: parsed.length,
            sampleRows: parsed.slice(0, 5),
            rawParsedData: parsed,
          });
        } else if (targetType === 'kitchen') {
          const parsed = parseKitchenCsv(text);
          if (parsed.length === 0) throw new Error('ไม่พบข้อมูลการผลิต/ของเสียที่ถูกต้องในไฟล์ CSV');
          setParsedPreview({
            type: 'kitchen',
            count: parsed.length,
            sampleRows: parsed.slice(0, 5),
            rawParsedData: parsed,
          });
        } else if (targetType === 'json') {
          const json = JSON.parse(text);
          const txCount = json.transactions?.length || 0;
          const memCount = json.members?.length || 0;
          const batCount = json.batches?.length || 0;
          const totalCount = txCount + memCount + batCount;
          if (totalCount === 0) {
            throw new Error('ไฟล์ JSON ไม่มีคีย์ transactions, members หรือ batches ที่ถูกต้อง');
          }
          setParsedPreview({
            type: 'json',
            count: totalCount,
            sampleRows: json.transactions?.slice(0, 4) || json.members?.slice(0, 4) || json.batches?.slice(0, 4) || [],
            rawParsedData: json,
          });
        }
      } catch (err: any) {
        console.error('File parsing error:', err);
        setErrorMessage(err.message || 'รูปแบบไฟล์ไม่ถูกต้อง โปรดตรวจสอบหัวตารางและข้อมูล');
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleApply = async () => {
    if (!parsedPreview || isApplying) return;

    setIsApplying(true);
    setErrorMessage(null);

    try {
      if (parsedPreview.type === 'pos') {
        await onApplyCustomData({ transactions: parsedPreview.rawParsedData });
      } else if (parsedPreview.type === 'crm') {
        await onApplyCustomData({ members: parsedPreview.rawParsedData });
      } else if (parsedPreview.type === 'kitchen') {
        await onApplyCustomData({ batches: parsedPreview.rawParsedData });
      } else if (parsedPreview.type === 'json') {
        await onApplyCustomData({
          transactions: parsedPreview.rawParsedData.transactions,
          members: parsedPreview.rawParsedData.members,
          batches: parsedPreview.rawParsedData.batches,
        });
      }

      setSuccessMessage(`อัปโหลดและประมวลผลข้อมูลสำเร็จ (${parsedPreview.count.toLocaleString()} รายการ) ระบบได้คำนวณตัวชี้วัดทั้งหมดใหม่เรียบร้อยแล้ว!`);
      setTimeout(() => {
        setIsApplying(false);
        onClose();
      }, 900);
    } catch (err: any) {
      console.error('Error applying custom data:', err);
      setIsApplying(false);
      setErrorMessage(`เกิดข้อผิดพลาดในการประมวลผลข้อมูล: ${err?.message || 'โปรดตรวจสอบข้อมูลอีกครั้ง'}`);
    }
  };

  return (
    <div id="modal-data-upload" className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-100 bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                อัปโหลดข้อมูลของร้านคุณ (Custom Data Upload)
              </h3>
              <p className="text-xs text-stone-500">
                ใส่ข้อมูลบิลขาย, สมาชิก, หรือบันทึกการอบของร้านคุณ เพื่อวิเคราะห์ด้วย CRISP-DM ทันที
              </p>
            </div>
          </div>

          <button
            id="btn-close-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-stone-200 bg-stone-100/60 p-1.5 text-xs font-semibold">
          <button
            id="tab-upload-pos"
            onClick={() => { setActiveTab('pos'); setParsedPreview(null); setErrorMessage(null); }}
            className={`flex-1 py-2 rounded-lg transition text-center ${
              activeTab === 'pos' ? 'bg-white text-amber-800 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            บิลขาย POS (Transactions)
          </button>
          <button
            id="tab-upload-crm"
            onClick={() => { setActiveTab('crm'); setParsedPreview(null); setErrorMessage(null); }}
            className={`flex-1 py-2 rounded-lg transition text-center ${
              activeTab === 'crm' ? 'bg-white text-amber-800 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            ข้อมูลสมาชิก CRM (Loyalty)
          </button>
          <button
            id="tab-upload-kitchen"
            onClick={() => { setActiveTab('kitchen'); setParsedPreview(null); setErrorMessage(null); }}
            className={`flex-1 py-2 rounded-lg transition text-center ${
              activeTab === 'kitchen' ? 'bg-white text-amber-800 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            บันทึกการอบ & ของเสีย (Kitchen)
          </button>
          <button
            id="tab-upload-json"
            onClick={() => { setActiveTab('json'); setParsedPreview(null); setErrorMessage(null); }}
            className={`flex-1 py-2 rounded-lg transition text-center ${
              activeTab === 'json' ? 'bg-white text-amber-800 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            ไฟล์รวม JSON
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          
          {/* Download Template helper */}
          {activeTab !== 'json' && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-stone-700">
                <FileText className="w-4 h-4 text-amber-700" />
                <span>ยังไม่มีไฟล์? ดาวน์โหลดโครงสร้างและตัวอย่าง CSV ไปกรอกได้ทันที</span>
              </div>
              <button
                id="btn-download-template"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>โหลด Template .CSV</span>
              </button>
            </div>
          )}

          {/* Drag & Drop Upload Zone */}
          <div
            id="dropzone-file-upload"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition ${
              dragActive 
                ? 'border-amber-500 bg-amber-50/50' 
                : 'border-stone-300 hover:border-amber-400 bg-stone-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={activeTab === 'json' ? '.json' : '.csv,text/csv,application/vnd.ms-excel'}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-stone-100 flex items-center justify-center text-amber-600 shadow-inner">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-stone-800">
              คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
            </p>
            <p className="text-xs text-stone-500 mt-1">
              รองรับไฟล์ {activeTab === 'json' ? '.JSON' : '.CSV (Comma Separated Values)'} ได้ไม่จำกัดจำนวนแถว (ระบบจัดการหน่วยความจำประสิทธิภาพสูง)
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div id="alert-upload-error" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div id="alert-upload-success" className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedPreview && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-900 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-amber-600" />
                  <span>พบข้อมูลทั้งหมด <strong className="text-amber-700 font-extrabold text-sm">{parsedPreview.count.toLocaleString()}</strong> แถว (ตัวอย่าง 5 แถวแรก):</span>
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Check className="w-3 h-3" />
                  <span>ตรวจสอบรูปแบบผ่าน</span>
                </span>
              </div>

              <div className="max-h-44 overflow-y-auto rounded-xl border border-stone-200 bg-stone-50 text-[11px] shadow-inner">
                <table className="w-full text-left">
                  <thead className="bg-stone-100/90 sticky top-0 border-b border-stone-200 text-stone-600 font-semibold">
                    <tr>
                      <th className="p-2">ID</th>
                      <th className="p-2">รายละเอียด / ชื่อ</th>
                      <th className="p-2 text-right">ยอด / จำนวน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {parsedPreview.sampleRows.map((row, i) => (
                      <tr key={i} className="hover:bg-amber-50/40 transition">
                        <td className="p-2 font-mono text-stone-500">{row.id || row.batchId || `R-${i+1}`}</td>
                        <td className="p-2 font-medium text-stone-800">{row.name || row.productName || row.items?.[0]?.productName || 'รายการสินค้า'}</td>
                        <td className="p-2 text-right font-bold text-stone-900">
                          {row.totalAmount !== undefined ? `฿${Number(row.totalAmount).toLocaleString()}` : row.actualBaked !== undefined ? `${Number(row.actualBaked).toLocaleString()} ชิ้น` : row.totalSpent !== undefined ? `฿${Number(row.totalSpent).toLocaleString()}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-stone-100 bg-stone-50">
          <div className="flex items-center gap-2">
            <button
              id="btn-reset-demo"
              onClick={() => {
                onResetToDemo();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
              title="ล้างข้อมูลทั้งหมดเพื่อให้ระบบว่างเปล่า"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ล้างข้อมูลทั้งหมด (Clear)</span>
            </button>
            {onLoadDemo && (
              <button
                type="button"
                id="btn-load-demo-modal"
                onClick={() => {
                  onLoadDemo();
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 rounded-lg transition"
              >
                <span>โหลดข้อมูลตัวอย่าง</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-cancel-modal"
              onClick={onClose}
              disabled={isApplying}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200 rounded-lg transition"
            >
              ยกเลิก
            </button>
            <button
              id="btn-apply-custom-data"
              onClick={handleApply}
              disabled={!parsedPreview || isApplying}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg transition shadow-sm ${
                parsedPreview && !isApplying
                  ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer active:scale-95'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              {isApplying ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                  <span>กำลังนำข้อมูลไปใช้วิเคราะห์...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>นำข้อมูลนี้ไปใช้วิเคราะห์ทันที</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
