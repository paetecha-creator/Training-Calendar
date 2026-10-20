import React, { useState, useRef } from 'react';
import { HolidayItem, Language } from '../types';
import { generateAndDownloadHolidayTemplate, parseHolidayExcelUpload } from '../utils/excelHelper';
import { saveBatchHolidaysToFirestore } from '../services/firebaseService';
import { translations } from '../utils/translations';
import confetti from 'canvas-confetti';
import {
  X,
  Download,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Calendar,
  Save,
} from 'lucide-react';

interface BatchHolidayUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  onSuccess: (count: number) => void;
  currentHolidays?: HolidayItem[];
}

export const BatchHolidayUploadModal: React.FC<BatchHolidayUploadModalProps> = ({
  isOpen,
  onClose,
  lang = 'th',
  onSuccess,
  currentHolidays = [],
}) => {
  const t = translations[lang] || translations.th;
  const [parsedHolidays, setParsedHolidays] = useState<HolidayItem[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setErrorMsg(null);
    try {
      const holidays = await parseHolidayExcelUpload(file);
      if (holidays.length === 0) {
        setErrorMsg(
          lang === 'th'
            ? 'ไม่พบข้อมูลวันหยุดในไฟล์ หรือข้อมูลไม่ถูกต้อง (ต้องระบุวันที่ YYYY-MM-DD และชื่อวันหยุด)'
            : 'No valid holiday rows found in the uploaded file (Date and Name are required).'
        );
      } else {
        setParsedHolidays(holidays);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(
        lang === 'th'
          ? 'ไม่สามารถอ่านไฟล์ Excel ได้ กรุณาใช้ไฟล์เทมเพลตที่ดาวน์โหลดจากระบบ'
          : 'Failed to parse Excel file. Please use the system template.'
      );
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveAll = async () => {
    if (parsedHolidays.length === 0) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const res = await saveBatchHolidaysToFirestore(parsedHolidays);
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch (e) {
        // ignore
      }
      onSuccess(res.count);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(
        lang === 'th'
          ? 'เกิดข้อผิดพลาดในการบันทึกข้อมูลวันหยุดลง Firebase'
          : 'Failed to save holidays into Firebase.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="rounded-2xl w-full max-w-4xl bg-white border border-slate-200 shadow-2xl flex flex-col my-auto overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-rose-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-rose-200">
              <FileSpreadsheet className="w-5 h-5 text-rose-300" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">{t.batchHolidayModalTitle}</h3>
              <p className="text-xs text-rose-100/80 font-medium mt-0.5">{t.batchHolidayModalDesc}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Step 1: Template & Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-rose-50/40 p-4 rounded-xl border border-rose-200/70">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {lang === 'th' ? 'ขั้นตอนที่ 1: เตรียมไฟล์ข้อมูล' : 'Step 1: Download Current Data'}
              </span>
              <p className="text-xs text-slate-600 font-medium">
                {lang === 'th'
                  ? 'ดาวน์โหลดข้อมูลวันหยุดประจำปีทั้งหมดปัจจุบันจากระบบ เพื่อนำไปแก้ไขหรือเพิ่มข้อมูลใหม่'
                  : 'Download all existing holidays from the system into Excel to edit or add new ones.'}
              </p>
              <button
                type="button"
                onClick={() => generateAndDownloadHolidayTemplate(currentHolidays)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-white hover:bg-rose-50 border border-rose-300 cursor-pointer shadow-xs transition-all mt-2"
              >
                <Download className="w-4 h-4 text-rose-600" />
                <span>
                  {t.downloadHolidayTemplateBtn}
                  {currentHolidays && currentHolidays.length > 0 ? ` (${currentHolidays.length})` : ''}
                </span>
              </button>
            </div>

            <div className="space-y-1.5 sm:border-l sm:border-rose-200 sm:pl-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {lang === 'th' ? 'ขั้นตอนที่ 2: อัปโหลดแทนที่ข้อมูลเดิม' : 'Step 2: Upload & Replace Data'}
              </span>
              <p className="text-xs text-slate-600 font-medium">
                {lang === 'th'
                  ? 'เลือกไฟล์ Excel วันหยุด (.xlsx) ที่อัปเดตแล้ว ข้อมูลใหม่จะแทนที่ข้อมูลวันหยุดเดิมทั้งหมดเพื่อป้องกันข้อมูลซ้ำซ้อน'
                  : 'Select your populated Excel file (.xlsx). The uploaded data will replace current holiday records to prevent duplicates.'}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="holiday-excel-upload-input"
                />
                <label
                  htmlFor="holiday-excel-upload-input"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 cursor-pointer shadow-xs transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isParsing ? (lang === 'th' ? 'กำลังอ่านไฟล์...' : 'Reading file...') : t.selectHolidayFileBtn}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Step 3: Preview Data */}
          {parsedHolidays.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    ✓
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {t.previewHolidaysCount}: <strong className="text-rose-700 font-extrabold text-sm">{parsedHolidays.length}</strong> {lang === 'th' ? 'วัน' : 'days'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setParsedHolidays([])}
                  className="text-xs text-slate-400 hover:text-rose-600 font-medium cursor-pointer"
                >
                  {lang === 'th' ? 'ล้างตัวอย่างการอัปโหลด' : 'Clear preview'}
                </button>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5 w-12 text-center">#</th>
                      <th className="p-2.5 w-32">{t.holidayDateLabel}</th>
                      <th className="p-2.5 min-w-[200px]">{t.holidayNameLabel}</th>
                      <th className="p-2.5 w-40">{t.holidayCategoryLabel}</th>
                      <th className="p-2.5 min-w-[200px]">{t.holidayDescLabel}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedHolidays.map((h, idx) => (
                      <tr key={idx} className="hover:bg-rose-50/20 transition-colors">
                        <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-mono font-bold text-rose-700 whitespace-nowrap">
                          {h.date}
                        </td>
                        <td className="p-2 font-semibold text-slate-900">{h.name}</td>
                        <td className="p-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-block">
                            {h.category || 'วันหยุด'}
                          </span>
                        </td>
                        <td className="p-2 text-slate-500">{h.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            {t.cancelBtn}
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={parsedHolidays.length === 0 || isSaving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 disabled:opacity-40 shadow-xs cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" />
            <span>
              {isSaving
                ? (lang === 'th' ? 'กำลังบันทึกลง Firebase...' : 'Saving to Firebase...')
                : `${t.saveBatchHolidaysBtn} (${parsedHolidays.length})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
