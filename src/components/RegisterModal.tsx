import React, { useState, useEffect, useRef } from 'react';
import { TrainingEvent, AttendeeRow, SessionRegistrationData } from '../types';
import { generateAndDownloadTemplate, parseExcelUpload, exportAttendeesToExcel } from '../utils/excelHelper';
import { generateReceiptNo, downloadRegistrationReceiptPdf, ReceiptInfo } from '../utils/receiptHelper';
import { TohokuLogo } from './TohokuLogo';
import confetti from 'canvas-confetti';
import {
  X,
  Plus,
  Trash2,
  Download,
  Upload,
  User,
  CheckCircle,
  AlertTriangle,
  Printer,
  FileDown,
} from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  event: TrainingEvent | null;
  initialData?: SessionRegistrationData | null;
  isAdmin?: boolean;
  onClose: () => void;
  onSubmit: (
    payload: {
      isEditMode: boolean;
      courseId: string;
      courseTitle: string;
      formSheet: string;
      rowIndices?: number[];
      data: Array<[string, string, string, string, string, string, string, string, string]>;
      submitterName: string;
      submitterDept: string;
      submitterPhone: string;
    }
  ) => Promise<{ success: boolean; insertedIndices: number[]; error?: string }>;
  onRegistrationSuccess: (sessionData: SessionRegistrationData) => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  event,
  initialData,
  isAdmin = false,
  onClose,
  onSubmit,
  onRegistrationSuccess,
}) => {
  const [rows, setRows] = useState<AttendeeRow[]>([
    {
      code: '',
      sex: 'Mr.',
      fname: '',
      lname: '',
      dept: '',
      pos: '',
      exp: '',
      app: '',
      rem: '',
    },
  ]);

  const [subName, setSubName] = useState('');
  const [subDept, setSubDept] = useState('');
  const [subPhone, setSubPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success Receipt State
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptInfo, setReceiptInfo] = useState<ReceiptInfo | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    // Only reset form state when modal transitions from closed to open
    if (isOpen && !prevIsOpenRef.current) {
      if (initialData && initialData.isEditMode) {
        setRows(
          initialData.rowData.length > 0
            ? JSON.parse(JSON.stringify(initialData.rowData))
            : [
                {
                  code: '',
                  sex: 'Mr.',
                  fname: '',
                  lname: '',
                  dept: '',
                  pos: '',
                  exp: '',
                  app: '',
                  rem: '',
                },
              ]
        );
        setSubName(initialData.subName || '');
        setSubDept(initialData.subDept || '');
        setSubPhone(initialData.subPhone || '');
      } else {
        setRows([
          {
            code: '',
            sex: 'Mr.',
            fname: '',
            lname: '',
            dept: '',
            pos: '',
            exp: '',
            app: '',
            rem: '',
          },
        ]);
        setSubName('');
        setSubDept('');
        setSubPhone('');
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
        dept: '',
        pos: '',
        exp: '',
        app: '',
        rem: '',
      },
    ]);
  };

  const removeRow = (index: number) => {
    if (rows.length === 1) {
      alert('ต้องมีรายชื่อผู้เข้าอบรมอย่างน้อย 1 รายการ');
      return;
    }
    setRows(rows.filter((_, idx) => idx !== index));
  };

  const updateRow = (index: number, field: keyof AttendeeRow, value: string) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedAttendees = await parseExcelUpload(file);
      if (parsedAttendees.length === 0) {
        alert('ไม่พบข้อมูลรายชื่อในไฟล์ Excel หรือไฟล์ว่างเปล่า');
        return;
      }

      const formatted: AttendeeRow[] = parsedAttendees.map((p) => ({
        code: p.code || '',
        sex: p.sex || 'Mr.',
        fname: p.fname || '',
        lname: p.lname || '',
        dept: p.dept || '',
        pos: p.pos || '',
        exp: p.exp || '',
        app: p.app || '',
        rem: p.rem || '',
      }));

      setRows(formatted);
      alert(`อัปโหลดข้อมูลจาก Excel สำเร็จ: นำเข้า ${formatted.length} รายชื่อเรียบร้อย`);
    } catch (err) {
      console.error('Upload error', err);
      alert('เกิดข้อผิดพลาดในการอ่านไฟล์ Excel กรุณาตรวจสอบรูปแบบไฟล์ตามเทมเพลต');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate Submitter
    if (!subName.trim() || !subDept.trim() || !subPhone.trim()) {
      setErrorMsg('กรุณากรอกข้อมูลผู้ประสานงาน (Submitter) ให้ครบถ้วน');
      return;
    }

    // Validate rows
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (
        !r.code.trim() ||
        !r.fname.trim() ||
        !r.lname.trim() ||
        !r.dept.trim() ||
        !r.pos.trim() ||
        !r.exp.trim() ||
        !r.app.trim()
      ) {
        setErrorMsg(`กรุณากรอกข้อมูลในตารางให้ครบทุกช่อง (ยกเว้นหมายเหตุ) ในแถวที่ ${i + 1}`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const dataPayload: Array<[string, string, string, string, string, string, string, string, string]> = rows.map(
        (r) => [
          r.code.trim(),
          r.sex,
          r.fname.trim(),
          r.lname.trim(),
          r.dept.trim(),
          r.pos.trim(),
          r.exp.trim(),
          r.app.trim(),
          r.rem ? r.rem.trim() : '',
        ]
      );

      const isEdit = Boolean(initialData && initialData.isEditMode);
      const targetSheet = event.formSheet || 'Register-1';

      const res = await onSubmit({
        isEditMode: isEdit,
        courseId: event.id,
        courseTitle: event.title,
        formSheet: targetSheet,
        rowIndices: isEdit ? initialData?.rowIndices : undefined,
        data: dataPayload,
        submitterName: subName.trim(),
        submitterDept: subDept.trim(),
        submitterPhone: subPhone.trim(),
      });

      if (res.success) {
        // Save session state for "Edit Latest"
        const savedSession: SessionRegistrationData = {
          courseId: event.id,
          courseTitle: event.title,
          formSheet: targetSheet,
          rowIndices: res.insertedIndices,
          rowData: rows,
          subName: subName.trim(),
          subDept: subDept.trim(),
          subPhone: subPhone.trim(),
          submissionDate: new Date().toISOString(),
          isEditMode: true,
        };

        onRegistrationSuccess(savedSession);

        // Build Receipt Data
        const receiptNo = generateReceiptNo();
        const receiptData: ReceiptInfo = {
          receiptNo,
          courseTitle: event.title,
          courseDate: event.start,
          courseTime: event.startTime ? `${event.startTime} - ${event.endTime || ''}` : '',
          submitterName: subName.trim(),
          submitterDept: subDept.trim(),
          submitterPhone: subPhone.trim(),
          submissionDate: new Date().toLocaleString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          attendees: JSON.parse(JSON.stringify(rows)),
        };

        setReceiptInfo(receiptData);
        setShowReceipt(true);

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
      } else {
        setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg((err as Error).message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!receiptInfo) return;
    setIsDownloadingPdf(true);
    try {
      const cardEl = document.getElementById('receipt-print-card');
      await downloadRegistrationReceiptPdf(receiptInfo, cardEl);
    } catch (e) {
      console.error('PDF Download Error:', e);
      // Fallback try without card element
      try {
        await downloadRegistrationReceiptPdf(receiptInfo);
      } catch (err) {
        console.error('Fallback PDF Download Error:', err);
        alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF ท่านสามารถกดปุ่มพิมพ์เอกสาร (Print) เพื่อบันทึกเป็น PDF แทนได้');
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadExcel = () => {
    if (!receiptInfo) return;
    exportAttendeesToExcel(
      receiptInfo.attendees,
      `${receiptInfo.courseTitle} (ลงทะเบียนสำเร็จ)`,
      receiptInfo.receiptNo
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/40 backdrop-blur-xs">
      <div className="rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden bg-white border border-slate-200 shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-slate-50/80 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-md bg-indigo-600 text-white">
                {event.category}
              </span>
              {isAdmin && event.formSheet && (
                <span className="text-xs font-mono font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                  Sheet: {event.formSheet}
                </span>
              )}
            </div>
            <h2 className="text-base md:text-lg font-bold text-slate-900 mt-1.5 tracking-tight">
              {initialData?.isEditMode ? 'แก้ไขข้อมูลการลงทะเบียน: ' : 'แบบฟอร์มลงทะเบียน: '}
              {event.title}
            </h2>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-1 flex-wrap font-medium">
              <span>วันที่จัดอบรม: {event.start}</span>
              {event.openDate && <span>· เปิดรับ: {event.openDate}</span>}
              {event.closeDate && <span>· ปิดรับ: {event.closeDate}</span>}
            </div>
          </div>

          {/* Excel Template & Upload Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={generateAndDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              <span>โหลดเทมเพลต (Excel)</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer transition-colors mb-0">
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>อัปโหลดรายชื่อ (Excel)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 cursor-pointer ml-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        {showReceipt && receiptInfo ? (
          /* Registration Confirmation Screen with PDF and Excel downloads */
          <div className="p-5 md:p-7 flex flex-col items-center max-w-4xl mx-auto w-full overflow-y-auto">
            {/* Success Icon & Banner */}
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle className="w-9 h-9 text-emerald-600" />
            </div>

            <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">ลงทะเบียนสำเร็จเรียบร้อย!</h3>
            <p className="text-xs text-slate-500 mb-5 text-center font-medium">
              ระบบได้รับข้อมูลเรียบร้อยแล้ว ท่านสามารถดาวน์โหลดหลักฐานการลงทะเบียนเป็น PDF หรือ Excel เก็บไว้ได้ทันที
            </p>

            {/* Action Buttons: PDF + Excel (.xlsx) + Print */}
            <div className="w-full flex items-center justify-center gap-3 mb-6 flex-wrap">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold text-white bg-gradient-to-r from-[#1e3a8a] to-[#172554] hover:from-[#172554] hover:to-[#0f172a] shadow-xs cursor-pointer transition-all"
              >
                <FileDown className="w-4 h-4 md:w-5 md:h-5 text-white" />
                <span>
                  {isDownloadingPdf ? 'กำลังสร้างไฟล์ PDF...' : 'ดาวน์โหลดหลักฐานการลงทะเบียน (PDF)'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadExcel}
                className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold text-[#1e3a8a] bg-blue-50/70 hover:bg-blue-100 border border-blue-200/70 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4 md:w-5 md:h-5 text-[#1e3a8a]" />
                <span>ดาวน์โหลดรายชื่อที่ลงทะเบียน (Excel .xlsx)</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 cursor-pointer transition-colors"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>พิมพ์เอกสาร (Print)</span>
              </button>
            </div>

            {/* Official Registration Receipt Card */}
            <div id="receipt-print-card" className="w-full rounded-2xl p-5 md:p-6 text-left text-xs space-y-4 bg-white border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-2 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2.5">
                    <svg className="w-8 h-8 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="50" cy="50" r="44" stroke="#DC2626" strokeWidth="5.5" fill="none" />
                      <line x1="6" y1="50" x2="94" y2="50" stroke="#DC2626" strokeWidth="4.5" />
                      <ellipse cx="50" cy="50" rx="43" ry="24" stroke="#DC2626" strokeWidth="4.5" fill="none" />
                      <line x1="16" y1="28" x2="84" y2="28" stroke="#DC2626" strokeWidth="4" />
                      <line x1="16" y1="72" x2="84" y2="72" stroke="#DC2626" strokeWidth="4" />
                      <ellipse cx="50" cy="50" rx="24" ry="44" stroke="#DC2626" strokeWidth="4.5" fill="none" />
                      <line x1="50" y1="6" x2="50" y2="94" stroke="#DC2626" strokeWidth="4.5" />
                    </svg>
                    <span className="font-black text-lg text-[#02478b] tracking-wider">
                      TOHOKU SOLUTIONS
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-semibold mt-1 ml-10.5">
                    Corporate Training & Development Center | TSTraining Center
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-3 py-1 rounded-lg text-xs">
                    ✓ ยืนยันการลงทะเบียนแล้ว (CONFIRMED)
                  </span>
                  <div className="font-mono text-slate-500 font-semibold text-[11px] mt-1 tabular-nums">
                    เลขที่เอกสาร: {receiptInfo.receiptNo}
                  </div>
                </div>
              </div>

              {/* Course Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-50/80 p-4 rounded-xl border border-slate-200/60">
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block">หลักสูตร (Course):</span>
                  <span className="text-sm font-bold text-indigo-600">{receiptInfo.courseTitle}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block">วันที่และเวลาอบรม:</span>
                  <span className="font-semibold text-slate-900">
                    {receiptInfo.courseDate} {receiptInfo.courseTime ? `(${receiptInfo.courseTime} น.)` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block">ผู้ประสานงาน (Submitter):</span>
                  <span className="font-semibold text-slate-900">
                    {receiptInfo.submitterName} ({receiptInfo.submitterDept})
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block">เบอร์ติดต่อ & เวลาทำรายการ:</span>
                  <span className="font-medium text-slate-700">
                    {receiptInfo.submitterPhone} | {receiptInfo.submissionDate}
                  </span>
                </div>
              </div>

              {/* Summary Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-bold text-slate-900 text-xs">
                    รายชื่อผู้ลงทะเบียนในรอบนี้ (จำนวน {receiptInfo.attendees.length} ท่าน):
                  </h5>
                  <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-md">
                    เฉพาะรายชื่อที่ส่งในรอบนี้
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[11px] font-bold text-slate-700 bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-10">#</th>
                        <th className="py-2.5 px-3 w-24">รหัส</th>
                        <th className="py-2.5 px-3 w-16">เพศ</th>
                        <th className="py-2.5 px-3">ชื่อ-นามสกุล</th>
                        <th className="py-2.5 px-3">แผนก/ฝ่าย</th>
                        <th className="py-2.5 px-3">ตำแหน่ง</th>
                        <th className="py-2.5 px-3">ความคาดหวัง</th>
                        <th className="py-2.5 px-3">การปรับใช้</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {receiptInfo.attendees.map((a, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2 px-3 text-center font-medium text-slate-400 tabular-nums">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-semibold text-indigo-600 tabular-nums">{a.code}</td>
                          <td className="py-2 px-3 text-slate-600">{a.sex}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{a.fname} {a.lname}</td>
                          <td className="py-2 px-3 text-slate-700">{a.dept}</td>
                          <td className="py-2 px-3 text-slate-600">{a.pos}</td>
                          <td className="py-2 px-3 text-slate-600 text-[11px] truncate max-w-[160px]" title={a.exp}>
                            {a.exp}
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[11px] truncate max-w-[160px]" title={a.app}>
                            {a.app}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-5 w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-6 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 cursor-pointer transition-colors"
              >
                ปิดหน้าต่าง (Done)
              </button>
            </div>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-4 md:p-6 overflow-y-auto space-y-5 flex-1">
              {/* Important Instruction Notice */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#1e3a8a] shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <p className="font-bold text-slate-900">
                    ผู้รับผิดชอบพิจารณาและบันทึกข้อมูลเกี่ยวกับความคาดหวังในการฝึกอบรมและการนำไปปรับใช้กับงาน
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    เนื่องจากกลุ่มงาน Training จะนำข้อมูลนี้ไปปรับปรุงและพัฒนาระบบการฝึกอบรมให้มีประสิทธิภาพสูงสุด
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 neu-inset rounded-2xl text-xs font-bold text-rose-500">
                  {errorMsg}
                </div>
              )}

              {/* Attendees Dynamic Table */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    รายชื่อผู้เข้าร่วมอบรม ({rows.length} ท่าน) <span className="text-rose-500">*</span>
                  </h4>
                  <button
                    type="button"
                    onClick={addRow}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#1e3a8a] bg-blue-50/80 hover:bg-blue-100 border border-blue-200/70 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#1e3a8a]" />
                    <span>เพิ่มรายชื่อ (Add Row)</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                  <table className="w-full text-left text-xs min-w-[1100px]">
                    <thead className="text-[11px] font-bold text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-2 text-center w-12">#</th>
                        <th className="py-2.5 px-2 w-28">
                          Code <span className="text-rose-500">*</span>
                        </th>
                        <th className="py-2.5 px-2 w-24">Sex</th>
                        <th className="py-2.5 px-2 w-36">
                          ชื่อ (First Name) <span className="text-rose-500">*</span>
                        </th>
                        <th className="py-2.5 px-2 w-36">
                          นามสกุล (Last Name) <span className="text-rose-500">*</span>
                        </th>
                        <th className="py-2.5 px-2 w-40">
                          แผนก (Dept) <span className="text-rose-500">*</span>
                        </th>
                        <th className="py-2.5 px-2 w-36">
                          ตำแหน่ง (Position) <span className="text-rose-500">*</span>
                        </th>
                        <th className="py-2.5 px-2">
                          ความคาดหวัง (Expectation) <span className="text-rose-500">*</span>
                        </th>
                        <th className="py-2.5 px-2">
                          การนำไปปรับใช้ (Application) <span className="text-rose-500">*</span>
                        </th>
                        <th className="py-2.5 px-2 w-28">หมายเหตุ</th>
                        <th className="py-2.5 px-2 text-center w-12">ลบ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2 px-2 text-center font-medium text-slate-400 tabular-nums">
                            {idx + 1}
                          </td>
                          <td className="py-1.5 px-1.5">
                            <input
                              type="text"
                              required
                              placeholder="EMP-..."
                              value={row.code}
                              onChange={(e) => updateRow(idx, 'code', e.target.value)}
                              className="w-full text-xs font-medium p-1.5 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                            />
                          </td>
                          <td className="py-1.5 px-1.5">
                            <select
                              value={row.sex}
                              onChange={(e) =>
                                updateRow(idx, 'sex', e.target.value as 'Mr.' | 'Ms.' | 'Mrs.')
                              }
                              className="w-full text-xs font-medium p-1.5 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                            >
                              <option value="Mr.">Mr.</option>
                              <option value="Ms.">Ms.</option>
                              <option value="Mrs.">Mrs.</option>
                            </select>
                          </td>
                          <td className="py-1.5 px-1.5">
                            <input
                              type="text"
                              required
                              placeholder="ชื่อ"
                              value={row.fname}
                              onChange={(e) => updateRow(idx, 'fname', e.target.value)}
                              className="w-full text-xs font-medium p-1.5 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                            />
                          </td>
                          <td className="py-1.5 px-1.5">
                            <input
                              type="text"
                              required
                              placeholder="นามสกุล"
                              value={row.lname}
                              onChange={(e) => updateRow(idx, 'lname', e.target.value)}
                              className="w-full text-xs font-medium p-1.5 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                            />
                          </td>
                          <td className="py-1.5 px-1.5">
                            <input
                              type="text"
                              required
                              placeholder="ฝ่าย / แผนก"
                              value={row.dept}
                              onChange={(e) => updateRow(idx, 'dept', e.target.value)}
                              className="w-full text-xs font-medium p-1.5 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                            />
                          </td>
                          <td className="py-1.5 px-1.5">
                            <input
                              type="text"
                              required
                              placeholder="ตำแหน่ง"
                              value={row.pos}
                              onChange={(e) => updateRow(idx, 'pos', e.target.value)}
                              className="w-full text-xs font-medium p-1.5 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                            />
                          </td>
                          <td className="py-1.5 px-1.5">
                            <input
                              type="text"
                              required
                              placeholder="ความคาดหวังต่อหลักสูตร"
                              value={row.exp}
                              onChange={(e) => updateRow(idx, 'exp', e.target.value)}
                              className="w-full text-xs font-normal p-1.5 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                            />
                          </td>
                          <td className="py-1.5 px-1.5">
                            <input
                              type="text"
                              required
                              placeholder="การนำไปปรับใช้ในงาน"
                              value={row.app}
                              onChange={(e) => updateRow(idx, 'app', e.target.value)}
                              className="w-full text-xs font-normal p-1.5 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                            />
                          </td>
                          <td className="py-1.5 px-1.5">
                            <input
                              type="text"
                              placeholder="-"
                              value={row.rem || ''}
                              onChange={(e) => updateRow(idx, 'rem', e.target.value)}
                              className="w-full text-xs font-normal p-1.5 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                            />
                          </td>
                          <td className="py-1.5 px-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => removeRow(idx)}
                              className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Submitter Info Card */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    ข้อมูลผู้ประสานงาน (Submitter Information) <span className="text-rose-500">*</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      ชื่อ-นามสกุล ผู้ส่งข้อมูล <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น นายประสานงาน ใจมั่น"
                      value={subName}
                      onChange={(e) => setSubName(e.target.value)}
                      className="w-full text-xs font-medium p-2 bg-white border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      แผนก / ฝ่าย <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น ฝ่ายทรัพยากรบุคคล"
                      value={subDept}
                      onChange={(e) => setSubDept(e.target.value)}
                      className="w-full text-xs font-medium p-2 bg-white border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      เบอร์โทรศัพท์ติดต่อ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="เช่น 081-234-5678"
                      value={subPhone}
                      onChange={(e) => setSubPhone(e.target.value)}
                      className="w-full text-xs font-medium p-2 bg-white border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Submit Buttons */}
            <div className="p-4 flex items-center justify-between shrink-0 bg-slate-50/80 border-t border-slate-200">
              <span className="text-xs font-medium text-slate-500">
                รวมผู้ลงทะเบียน: <strong className="text-slate-900 font-bold">{rows.length} ท่าน</strong>
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
                >
                  ยกเลิก (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#1e3a8a] to-[#172554] hover:from-[#172554] hover:to-[#0f172a] shadow-xs cursor-pointer transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>กำลังส่งข้อมูล...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-white" />
                      <span>ลงทะเบียน (Submit Registration)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
