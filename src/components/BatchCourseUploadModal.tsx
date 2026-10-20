import React, { useState, useRef } from 'react';
import { TrainingEvent, Language } from '../types';
import { generateAndDownloadCourseTemplate, parseCourseExcelUpload } from '../utils/excelHelper';
import { saveBatchCoursesToFirestore } from '../services/firebaseService';
import { translations } from '../utils/translations';
import confetti from 'canvas-confetti';
import {
  X,
  Download,
  Upload,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Calendar,
  Clock,
  MapPin,
  Save,
} from 'lucide-react';

interface BatchCourseUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  onSuccess: (count: number) => void;
  currentCourses?: TrainingEvent[];
}

export const BatchCourseUploadModal: React.FC<BatchCourseUploadModalProps> = ({
  isOpen,
  onClose,
  lang = 'th',
  onSuccess,
  currentCourses = [],
}) => {
  const t = translations[lang] || translations.th;
  const [parsedCourses, setParsedCourses] = useState<TrainingEvent[]>([]);
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
      const courses = await parseCourseExcelUpload(file);
      if (courses.length === 0) {
        setErrorMsg(
          lang === 'th'
            ? 'ไม่พบข้อมูลหลักสูตรในไฟล์ หรือไฟล์ไม่มีข้อมูลที่ถูกต้อง'
            : 'No valid course rows found in the uploaded file.'
        );
      } else {
        setParsedCourses(courses);
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
    if (parsedCourses.length === 0) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const res = await saveBatchCoursesToFirestore(parsedCourses);
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
          ? 'เกิดข้อผิดพลาดในการบันทึกข้อมูลหลักสูตรลง Firebase'
          : 'Failed to save courses into Firebase.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="rounded-2xl w-full max-w-4xl bg-white border border-slate-200 shadow-2xl flex flex-col my-auto overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#1e3a8a] to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-blue-200">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">{t.batchCourseModalTitle}</h3>
              <p className="text-xs text-blue-100/80 font-medium mt-0.5">{t.batchCourseModalDesc}</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {lang === 'th' ? 'ขั้นตอนที่ 1: เตรียมไฟล์ข้อมูล' : 'Step 1: Download Current Data'}
              </span>
              <p className="text-xs text-slate-600 font-medium">
                {lang === 'th'
                  ? 'ดาวน์โหลดข้อมูลหลักสูตรทั้งหมดปัจจุบันจากระบบ เพื่อนำไปแก้ไขหรือเพิ่มข้อมูลใหม่'
                  : 'Download all existing courses from the system into Excel to edit or add new ones.'}
              </p>
              <button
                type="button"
                onClick={() => generateAndDownloadCourseTemplate(currentCourses)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-[#1e3a8a] bg-white hover:bg-blue-50 border border-blue-200 cursor-pointer shadow-xs transition-all mt-2"
              >
                <Download className="w-4 h-4 text-[#1e3a8a]" />
                <span>
                  {t.downloadCourseTemplateBtn}
                  {currentCourses && currentCourses.length > 0 ? ` (${currentCourses.length})` : ''}
                </span>
              </button>
            </div>

            <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {lang === 'th' ? 'ขั้นตอนที่ 2: อัปโหลดแทนที่ข้อมูลเดิม' : 'Step 2: Upload & Replace Data'}
              </span>
              <p className="text-xs text-slate-600 font-medium">
                {lang === 'th'
                  ? 'เลือกไฟล์ Excel (.xlsx) ที่อัปเดตแล้ว ข้อมูลใหม่จะแทนที่ข้อมูลเดิมทั้งหมดเพื่อป้องกันข้อมูลซ้ำซ้อน'
                  : 'Select your updated Excel (.xlsx). The uploaded data will replace current records to prevent duplicates.'}
              </p>
              <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 cursor-pointer shadow-xs transition-all mt-2 w-fit">
                <Upload className="w-4 h-4" />
                <span>{isParsing ? 'กำลังอ่านไฟล์...' : t.selectCourseFileBtn}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Preview Parsed Courses */}
          {parsedCourses.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {t.previewCoursesCount}: {parsedCourses.length} {t.coursesCountSuffix}
                  </span>
                </h4>
                <span className="text-[11px] text-slate-500 font-medium">
                  พร้อมบันทึกลง Firebase Firestore เรียลไทม์
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs max-h-[320px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] sticky top-0 z-10">
                    <tr>
                      <th className="p-2 w-10 text-center">#</th>
                      <th className="p-2 w-24">ID</th>
                      <th className="p-2 w-32">หมวดหมู่</th>
                      <th className="p-2 min-w-[200px]">ชื่อหลักสูตร</th>
                      <th className="p-2 w-28">วันที่</th>
                      <th className="p-2 w-24">เวลา</th>
                      <th className="p-2 w-28">สถานที่</th>
                      <th className="p-2 w-20 text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedCourses.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 text-center text-slate-400 font-bold">{idx + 1}</td>
                        <td className="p-2 font-mono font-bold text-[#1e3a8a]">{c.id}</td>
                        <td className="p-2">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold border border-black/5 inline-block"
                            style={{ backgroundColor: c.color, color: c.textColor || '#0f172a' }}
                          >
                            {c.category}
                          </span>
                        </td>
                        <td className="p-2 font-bold text-slate-900">{c.title}</td>
                        <td className="p-2 font-semibold text-slate-600 whitespace-nowrap">
                          {c.start}
                        </td>
                        <td className="p-2 text-slate-500 whitespace-nowrap">
                          {c.startTime} - {c.endTime}
                        </td>
                        <td className="p-2 text-slate-600 truncate max-w-[120px]">
                          {c.location || '-'}
                        </td>
                        <td className="p-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                              c.status === 'เปิด'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : c.status === 'ปิด'
                                ? 'bg-rose-50 text-rose-700 border-rose-300'
                                : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-all cursor-pointer"
          >
            {t.cancelBtn}
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={parsedCourses.length === 0 || isSaving}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#1e3a8a] to-[#172554] hover:from-[#172554] hover:to-[#0f172a] rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>
              {isSaving
                ? 'กำลังบันทึกลง Firebase...'
                : `${t.saveBatchCoursesBtn} (${parsedCourses.length})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
