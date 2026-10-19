import React, { useState, useEffect, useRef } from 'react';
import { TrainingEvent, AttendeeRow, SessionRegistrationData, Language } from '../types';
import { generateAndDownloadTemplate, parseExcelUpload } from '../utils/excelHelper';
import { generateReceiptNo, downloadRegistrationReceiptPdf, ReceiptInfo } from '../utils/receiptHelper';
import { TohokuLogo } from './TohokuLogo';
import { addAttendeesToFirestore } from '../services/firebaseService';
import { translations } from '../utils/translations';
import confetti from 'canvas-confetti';
import {
  X,
  PlusCircle,
  Download,
  Upload,
  User,
  CheckCircle,
  AlertTriangle,
  FileDown,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  event: TrainingEvent | null;
  initialData?: SessionRegistrationData | null;
  isAdmin?: boolean;
  lang?: Language;
  onClose: () => void;
  onRegistrationSuccess: (sessionData: SessionRegistrationData) => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  event,
  initialData,
  isAdmin = false,
  lang = 'th',
  onClose,
  onRegistrationSuccess,
}) => {
  const t = translations[lang] || translations.th;

  const [rows, setRows] = useState<AttendeeRow[]>([
    {
      code: '',
      sex: 'Mr.',
      fname: '',
      lname: '',
      dept: '',
      pos: '',
      expectation: '',
      application: '',
      remark: '',
    },
  ]);

  const [subName, setSubName] = useState(() => localStorage.getItem('last_sub_name') || '');
  const [subDept, setSubDept] = useState(() => localStorage.getItem('last_sub_dept') || '');
  const [subPhone, setSubPhone] = useState(() => localStorage.getItem('last_sub_phone') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success Receipt State
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptInfo, setReceiptInfo] = useState<ReceiptInfo | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      if (initialData && initialData.isEditMode) {
        setRows(
          initialData.rowData.length > 0
            ? initialData.rowData.map((r) => ({
                code: r.code || '',
                sex: r.sex || 'Mr.',
                fname: r.fname || '',
                lname: r.lname || '',
                dept: r.dept || '',
                pos: r.pos || '',
                expectation: r.expectation || r.exp || '',
                application: r.application || r.app || '',
                remark: r.remark || r.rem || '',
              }))
            : [
                {
                  code: '',
                  sex: 'Mr.',
                  fname: '',
                  lname: '',
                  dept: '',
                  pos: '',
                  expectation: '',
                  application: '',
                  remark: '',
                },
              ]
        );
        setSubName(initialData.subName || localStorage.getItem('last_sub_name') || '');
        setSubDept(initialData.subDept || localStorage.getItem('last_sub_dept') || '');
        setSubPhone(initialData.subPhone || localStorage.getItem('last_sub_phone') || '');
      } else {
        setRows([
          {
            code: '',
            sex: 'Mr.',
            fname: '',
            lname: '',
            dept: '',
            pos: '',
            expectation: '',
            application: '',
            remark: '',
          },
        ]);
        setSubName(localStorage.getItem('last_sub_name') || '');
        setSubDept(localStorage.getItem('last_sub_dept') || '');
        setSubPhone(localStorage.getItem('last_sub_phone') || '');
      }
      setErrorMsg(null);
      setShowReceipt(false);
      setReceiptInfo(null);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialData]);

  if (!isOpen || !event) return null;

  const addRow = () => {
    setRows([
      ...rows,
      {
        code: '',
        sex: 'Mr.',
        fname: '',
        lname: '',
        dept: subDept || '',
        pos: '',
        expectation: '',
        application: '',
        remark: '',
      },
    ]);
  };

  const removeRow = (index: number) => {
    if (rows.length === 1) {
      alert(lang === 'th' ? 'ต้องมีรายชื่อผู้เข้าอบรมอย่างน้อย 1 รายการ' : 'At least 1 attendee row is required');
      return;
    }
    setRows(rows.filter((_, idx) => idx !== index));
  };

  const updateRow = (index: number, field: keyof AttendeeRow, value: string) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    // sync aliases
    if (field === 'expectation') updated[index].exp = value;
    if (field === 'application') updated[index].app = value;
    if (field === 'remark') updated[index].rem = value;
    setRows(updated);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedRows = await parseExcelUpload(file);
      if (parsedRows.length > 0) {
        const mappedRows: AttendeeRow[] = parsedRows.map((r) => ({
          code: r.code || '',
          sex: (r.sex as any) || 'Mr.',
          fname: r.fname || '',
          lname: r.lname || '',
          dept: r.dept || subDept || '',
          pos: r.pos || '',
          expectation: r.expectation || r.exp || '',
          application: r.application || r.app || '',
          remark: r.remark || r.rem || '',
          exp: r.expectation || r.exp || '',
          app: r.application || r.app || '',
          rem: r.remark || r.rem || '',
        }));
        setRows(mappedRows);
        setErrorMsg(null);
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(lang === 'th' ? 'ไม่สามารถอ่านไฟล์ Excel ได้ กรุณาใช้ไฟล์แบบฟอร์มที่ดาวน์โหลดจากระบบ' : 'Failed to parse Excel file. Please use the system template.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate submitter info
    if (!subName.trim() || !subDept.trim() || !subPhone.trim()) {
      setErrorMsg(
        lang === 'th'
          ? 'กรุณากรอกข้อมูลผู้ส่งข้อมูล (ชื่อ-นามสกุล, แผนก, เบอร์โทรติดต่อ) ให้ครบถ้วน'
          : 'Please fill in all submitter information (Name, Department, Contact Phone).'
      );
      return;
    }

    // Validate attendees (Name & Last Name are required)
    const validRows = rows.filter((r) => r.fname.trim() !== '' && r.lname.trim() !== '');
    if (validRows.length === 0) {
      setErrorMsg(
        lang === 'th'
          ? 'กรุณาระบุชื่อและนามสกุลของผู้เข้าอบรมอย่างน้อย 1 ท่าน'
          : 'Please enter at least one attendee with First Name and Last Name.'
      );
      return;
    }

    // Check duplicate codes in same submission
    const codes = validRows.map((r) => r.code.trim()).filter((c) => c !== '');
    const uniqueCodes = new Set(codes);
    if (codes.length !== uniqueCodes.size) {
      setErrorMsg(
        lang === 'th'
          ? 'พบรหัสพนักงานซ้ำกันในรายการที่กรอก กรุณาตรวจสอบข้อมูล'
          : 'Duplicate Employee Code found in this submission. Please verify.'
      );
      return;
    }

    // Cache submitter info in localStorage for future convenience
    localStorage.setItem('last_sub_name', subName.trim());
    localStorage.setItem('last_sub_dept', subDept.trim());
    localStorage.setItem('last_sub_phone', subPhone.trim());

    setIsSubmitting(true);
    try {
      const receiptNo = generateReceiptNo();

      // Save directly to Firebase Firestore
      const res = await addAttendeesToFirestore(
        event,
        validRows,
        {
          name: subName.trim(),
          dept: subDept.trim(),
          phone: subPhone.trim(),
        },
        receiptNo
      );

      if (res.success) {
        // Trigger celebratory confetti!
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // ignore
        }

        const now = new Date();
        const submissionDateStr = now.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const receipt: ReceiptInfo = {
          receiptNo,
          courseTitle: event.title,
          courseCategory: event.category,
          courseDate: `${event.start}${event.end && event.end !== event.start ? ' ถึง ' + event.end : ''}`,
          courseTime: `${event.startTime} - ${event.endTime} น.`,
          courseLocation: event.location,
          submitterName: subName.trim(),
          submitterDept: subDept.trim(),
          submitterPhone: subPhone.trim(),
          submissionDate: submissionDateStr,
          attendees: validRows,
        };

        setReceiptInfo(receipt);
        setShowReceipt(true);

        const sessionData: SessionRegistrationData = {
          isEditMode: true,
          courseId: event.id,
          courseTitle: event.title,
          formSheet: event.formSheet || '',
          rowIndices: [],
          rowData: validRows,
          openDate: event.openDate,
          closeDate: event.closeDate,
          subName: subName.trim(),
          subDept: subDept.trim(),
          subPhone: subPhone.trim(),
          submissionDate: submissionDateStr,
        };

        localStorage.setItem('training_session_reg', JSON.stringify(sessionData));
        onRegistrationSuccess(sessionData);
      } else {
        setErrorMsg(res.error || (lang === 'th' ? 'เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง' : 'Registration error occurred.'));
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(lang === 'th' ? 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง' : 'Failed to save registration data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!receiptInfo) return;
    setIsDownloadingPdf(true);
    try {
      await downloadRegistrationReceiptPdf(receiptInfo);
    } catch (err) {
      console.error('PDF error', err);
      alert(lang === 'th' ? 'ไม่สามารถดาวน์โหลดเอกสาร PDF ได้' : 'Failed to generate PDF document');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="rounded-2xl w-full max-w-6xl bg-white border border-slate-200 shadow-2xl flex flex-col my-auto overflow-hidden">
        {/* =================================================== */}
        {/* VIEW 1: REGISTRATION SUCCESS RECEIPT */}
        {/* =================================================== */}
        {showReceipt && receiptInfo ? (
          <div className="flex flex-col max-h-[85vh] overflow-y-auto p-4 sm:p-6 md:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <TohokuLogo size="md" />
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  {t.receiptConfirmation}
                </span>
                <span className="text-xs font-mono font-bold text-[#1e3a8a] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {receiptInfo.receiptNo}
                </span>
              </div>
            </div>

            <div className="my-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {t.regSuccessTitle}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {t.regSuccessDesc}
              </p>
            </div>

            {/* Course & Submitter Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {t.coursesView}
                </span>
                <h4 className="text-sm font-bold text-slate-900">{receiptInfo.courseTitle}</h4>
                <div className="text-xs text-slate-600 mt-2 space-y-1">
                  <div>📅 {t.dateLabel} {receiptInfo.courseDate}</div>
                  {receiptInfo.courseTime && <div>⏰ {t.timeLabel} {receiptInfo.courseTime}</div>}
                  {receiptInfo.courseLocation && <div>📍 {t.locationLabel} {receiptInfo.courseLocation}</div>}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {t.submitterSection}
                </span>
                <h4 className="text-sm font-bold text-slate-900">{receiptInfo.submitterName}</h4>
                <div className="text-xs text-slate-600 mt-2 space-y-1">
                  <div>🏢 {t.submitterDept}: {receiptInfo.submitterDept}</div>
                  <div>📞 {t.submitterPhone}: {receiptInfo.submitterPhone}</div>
                  <div>🕒 วันที่ทำรายการ: {receiptInfo.submissionDate}</div>
                </div>
              </div>
            </div>

            {/* Attendees Summary Table */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {t.traineesSection} ({receiptInfo.attendees.length} {t.personsCountSuffix})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2 w-10 text-center">{t.colIndex}</th>
                      <th className="p-2 w-24">{t.colCode}</th>
                      <th className="p-2">{t.colName}</th>
                      <th className="p-2">{t.colDept}</th>
                      <th className="p-2">{t.colPosition}</th>
                      <th className="p-2">{t.colExpectation}</th>
                      <th className="p-2">{t.colApplication}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receiptInfo.attendees.map((a, idx) => (
                      <tr key={idx}>
                        <td className="p-2 text-center text-slate-500 font-bold">{idx + 1}</td>
                        <td className="p-2 font-mono font-bold text-[#1e3a8a]">{a.code || '-'}</td>
                        <td className="p-2 font-semibold text-slate-900">
                          {a.sex} {a.fname} {a.lname}
                        </td>
                        <td className="p-2 text-slate-600">{a.dept || '-'}</td>
                        <td className="p-2 text-slate-600">{a.pos || '-'}</td>
                        <td className="p-2 text-slate-600">{a.expectation || a.exp || '-'}</td>
                        <td className="p-2 text-slate-600">{a.application || a.app || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-[#1e3a8a] bg-blue-50 hover:bg-blue-100 border border-blue-200 cursor-pointer transition-all"
              >
                <FileDown className="w-4 h-4" />
                <span>{isDownloadingPdf ? 'Generating PDF...' : t.downloadPdfBtn}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1e3a8a] to-[#172554] hover:shadow-md cursor-pointer transition-all"
              >
                {t.finishBtn}
              </button>
            </div>
          </div>
        ) : (
          /* =================================================== */
          /* VIEW 2: REGISTRATION FORM EXACTLY AS IN IMAGE.PNG */
          /* =================================================== */
          <form onSubmit={handleSubmit} className="flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-200 flex items-start justify-between gap-3 shrink-0">
              <div className="flex items-start gap-3">
                <TohokuLogo size="sm" className="hidden sm:flex mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-black/5"
                      style={{ backgroundColor: event.color, color: event.textColor || '#0f172a' }}
                    >
                      {event.category}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {t.statusOpen}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#1e3a8a]" />
                      {event.start} {event.end && event.end !== event.start ? ` ถึง ${event.end}` : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#1e3a8a]" />
                      {event.startTime} - {event.endTime} น.
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#1e3a8a]" />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-white cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-3 sm:p-5 overflow-y-auto space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submitter Details */}
              <div className="bg-slate-50/80 p-3.5 sm:p-4 rounded-xl border border-slate-200/80">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#1e3a8a]" />
                  <span>{t.submitterSection}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      {t.submitterName} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t.submitterNamePlaceholder}
                      value={subName}
                      onChange={(e) => setSubName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg outline-none focus:border-[#1e3a8a]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      {t.submitterDept} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t.submitterDeptPlaceholder}
                      value={subDept}
                      onChange={(e) => setSubDept(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg outline-none focus:border-[#1e3a8a]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      {t.submitterPhone} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t.submitterPhonePlaceholder}
                      value={subPhone}
                      onChange={(e) => setSubPhone(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg outline-none focus:border-[#1e3a8a]"
                    />
                  </div>
                </div>
              </div>

              {/* Trainees List Table Header Controls */}
              <div>
                <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#1e3a8a]" />
                    <span>{t.traineesSection} ({rows.length} {t.personsCountSuffix})</span>
                  </h4>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => generateAndDownloadTemplate()}
                      className="text-[11px] font-bold text-slate-600 hover:text-[#1e3a8a] flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>{t.excelTemplateBtn}</span>
                    </button>

                    <label className="text-[11px] font-bold text-[#1e3a8a] hover:bg-blue-50 flex items-center gap-1 px-2.5 py-1 border border-blue-200 rounded-lg transition-colors cursor-pointer">
                      <Upload className="w-3 h-3" />
                      <span>{t.importExcelBtn}</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* EXACT TABLE FROM IMAGE.PNG */}
                <div className="border border-slate-300 rounded-lg overflow-x-auto shadow-xs bg-white">
                  <table className="w-full text-left text-xs border-collapse min-w-[1050px]">
                    <thead className="bg-[#f8fafc] text-slate-800 font-bold text-[11px] border-b border-slate-300 select-none">
                      <tr className="divide-x divide-slate-200">
                        <th className="py-2 px-2 text-center w-10 font-bold">#</th>
                        <th className="py-2 px-2.5 w-24 text-center font-bold">
                          Code<br />
                          <span className="text-[10px] text-slate-500 font-normal">* (รหัส)</span>
                        </th>
                        <th className="py-2 px-2 w-20 text-center font-bold">
                          Sex<br />
                          <span className="text-[10px] text-slate-500 font-normal">* (เพศ)</span>
                        </th>
                        <th className="py-2 px-2.5 min-w-[120px] text-center font-bold">
                          Name<br />
                          <span className="text-[10px] text-slate-500 font-normal">* (ชื่อ)</span>
                        </th>
                        <th className="py-2 px-2.5 min-w-[120px] text-center font-bold">
                          Last Name<br />
                          <span className="text-[10px] text-slate-500 font-normal">* (นามสกุล)</span>
                        </th>
                        <th className="py-2 px-2.5 min-w-[125px] text-center font-bold">
                          Dept./In-charge<br />
                          <span className="text-[10px] text-slate-500 font-normal">* (แผนก)</span>
                        </th>
                        <th className="py-2 px-2.5 min-w-[125px] text-center font-bold">
                          Position<br />
                          <span className="text-[10px] text-slate-500 font-normal">* (ตำแหน่ง)</span>
                        </th>
                        <th className="py-2 px-2.5 min-w-[140px] text-center font-bold">
                          Expectation<br />
                          <span className="text-[10px] text-slate-500 font-normal">* (ความคาดหวัง)</span>
                        </th>
                        <th className="py-2 px-2.5 min-w-[140px] text-center font-bold">
                          Application<br />
                          <span className="text-[10px] text-slate-500 font-normal">* (การปรับใช้)</span>
                        </th>
                        <th className="py-2 px-2.5 min-w-[120px] text-center font-bold">
                          Remark<br />
                          <span className="text-[10px] text-slate-500 font-normal">(เพิ่มเติม)</span>
                        </th>
                        <th className="py-2 px-2 w-12 text-center font-bold">ลบ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 divide-x divide-slate-100">
                          {/* # */}
                          <td className="p-2 text-center font-bold text-slate-600 bg-slate-50/50">
                            {idx + 1}
                          </td>

                          {/* Code */}
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={row.code}
                              onChange={(e) => updateRow(idx, 'code', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]/20 outline-none"
                            />
                          </td>

                          {/* Sex */}
                          <td className="p-1.5">
                            <select
                              value={row.sex}
                              onChange={(e) => updateRow(idx, 'sex', e.target.value as any)}
                              className="w-full px-1.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:border-[#1e3a8a] outline-none"
                            >
                              <option value="Mr.">Mr.</option>
                              <option value="Ms.">Ms.</option>
                              <option value="Mrs.">Mrs.</option>
                            </select>
                          </td>

                          {/* Name */}
                          <td className="p-1.5">
                            <input
                              type="text"
                              required
                              value={row.fname}
                              onChange={(e) => updateRow(idx, 'fname', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded focus:border-[#1e3a8a] outline-none"
                            />
                          </td>

                          {/* Last Name */}
                          <td className="p-1.5">
                            <input
                              type="text"
                              required
                              value={row.lname}
                              onChange={(e) => updateRow(idx, 'lname', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded focus:border-[#1e3a8a] outline-none"
                            />
                          </td>

                          {/* Dept./In-charge */}
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={row.dept}
                              onChange={(e) => updateRow(idx, 'dept', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded focus:border-[#1e3a8a] outline-none"
                            />
                          </td>

                          {/* Position */}
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={row.pos}
                              onChange={(e) => updateRow(idx, 'pos', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded focus:border-[#1e3a8a] outline-none"
                            />
                          </td>

                          {/* Expectation */}
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={row.expectation || row.exp || ''}
                              onChange={(e) => updateRow(idx, 'expectation', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded focus:border-[#1e3a8a] outline-none"
                            />
                          </td>

                          {/* Application */}
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={row.application || row.app || ''}
                              onChange={(e) => updateRow(idx, 'application', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded focus:border-[#1e3a8a] outline-none"
                            />
                          </td>

                          {/* Remark */}
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={row.remark || row.rem || ''}
                              onChange={(e) => updateRow(idx, 'remark', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded focus:border-[#1e3a8a] outline-none"
                            />
                          </td>

                          {/* ลบ (Red square button with X matching image.png) */}
                          <td className="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => removeRow(idx)}
                              className="w-7 h-7 rounded bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center mx-auto cursor-pointer shadow-xs transition-colors"
                              title="ลบแถวนี้"
                            >
                              <X className="w-4 h-4 stroke-[3]" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* EXACT "+ เพิ่มรายชื่อ (Add Row)" BUTTON FROM IMAGE.PNG */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={addRow}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-600 text-emerald-700 bg-white hover:bg-emerald-50 text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    <span>{t.addRowBtn}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-all cursor-pointer"
              >
                {t.cancelBtn}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#1e3a8a] to-[#172554] hover:from-[#172554] hover:to-[#0f172a] rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? t.savingToFirebase
                    : `${t.submitRegistrationBtn} (${rows.length} ${t.personsCountSuffix})`}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
