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
      setShowReceipt(false);
      setReceiptInfo(null);
      setErrorMsg(null);
    } else if (!isOpen) {
      setShowReceipt(false);
      setReceiptInfo(null);
      setErrorMsg(null);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

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
        // Confetti celebration effect!
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
        });

        const nowFormatted = new Date().toLocaleString('th-TH');
        const receiptNo = generateReceiptNo();

        // Save session data
        const sessionPayload: SessionRegistrationData = {
          isEditMode: true,
          courseId: event.id,
          courseTitle: event.title,
          formSheet: targetSheet,
          rowIndices: res.insertedIndices,
          rowData: rows,
          openDate: event.openDate,
          closeDate: event.closeDate,
          subName: subName.trim(),
          subDept: subDept.trim(),
          subPhone: subPhone.trim(),
          submissionDate: nowFormatted,
        };

        onRegistrationSuccess(sessionPayload);

        // Prepare receipt info containing ONLY the attendees that were just registered in this submission
        const info: ReceiptInfo = {
          receiptNo,
          courseTitle: event.title,
          courseCategory: event.category,
          courseDate: `${event.start}${event.end && event.end !== event.start ? ` ถึง ${event.end}` : ''}`,
          courseTime: event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : event.startTime,
          courseLocation: event.location,
          submissionDate: nowFormatted,
          submitterName: subName.trim(),
          submitterDept: subDept.trim(),
          submitterPhone: subPhone.trim(),
          attendees: JSON.parse(JSON.stringify(rows)), // strictly the newly registered attendees only
        };

        setReceiptInfo(info);
        setShowReceipt(true);
      } else {
        setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการลงทะเบียน');
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
      downloadRegistrationReceiptPdf(receiptInfo, cardEl);
    } catch (err) {
      console.error(err);
      window.print();
    } finally {
      setTimeout(() => setIsDownloadingPdf(false), 1200);
    }
  };

  const handleDownloadExcel = () => {
    if (!receiptInfo) return;
    exportAttendeesToExcel(
      receiptInfo.attendees,
      receiptInfo.courseTitle,
      `Reg_${receiptInfo.receiptNo}`
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[96vh] overflow-hidden flex flex-col">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-[#0A3D78] via-[#0D4B92] to-[#1457A8] text-white p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-blue-100">
                {event.category}
              </span>
              {isAdmin && event.formSheet && (
                <span className="text-xs font-mono font-semibold text-blue-200">
                  Sheet: {event.formSheet}
                </span>
              )}
            </div>
            <h2 className="text-lg md:text-xl font-black mt-1 tracking-tight">
              {initialData?.isEditMode ? 'แก้ไขข้อมูลการลงทะเบียน: ' : 'แบบฟอร์มลงทะเบียน: '}
              {event.title}
            </h2>
            <div className="text-xs text-blue-100/80 flex items-center gap-2 mt-1 flex-wrap">
              <span>วันที่จัดอบรม: {event.start}</span>
              {event.openDate && <span>| เปิดรับ: {event.openDate}</span>}
              {event.closeDate && <span>| ปิดรับ: {event.closeDate}</span>}
            </div>
          </div>

          {/* Excel Template & Upload Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={generateAndDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white text-slate-800 hover:bg-slate-100 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>โหลดเทมเพลต (Excel)</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl shadow-xs transition-colors cursor-pointer mb-0">
              <Upload className="w-4 h-4 text-slate-900" />
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
              className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        {showReceipt && receiptInfo ? (
          /* Registration Confirmation Screen with PDF and Excel downloads */
          <div className="p-6 md:p-8 flex flex-col items-center max-w-4xl mx-auto w-full overflow-y-auto">
            {/* Success Icon & Banner */}
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 shadow-inner">
              <CheckCircle className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-1">ลงทะเบียนสำเร็จเรียบร้อย!</h3>
            <p className="text-xs text-slate-500 mb-5 text-center">
              ระบบได้รับข้อมูลเรียบร้อยแล้ว ท่านสามารถดาวน์โหลดหลักฐานการลงทะเบียนเป็น PDF หรือ Excel เก็บไว้ได้ทันที
            </p>

            {/* Action Buttons: PDF + Excel (.xlsx) + Print */}
            <div className="w-full flex items-center justify-center gap-3 mb-6 flex-wrap">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="flex items-center gap-2 py-3 px-5 rounded-xl text-xs md:text-sm font-black bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98"
              >
                <FileDown className="w-4 h-4 md:w-5 md:h-5" />
                <span>
                  {isDownloadingPdf ? 'กำลังสร้างไฟล์ PDF...' : 'ดาวน์โหลดหลักฐานการลงทะเบียน (PDF)'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadExcel}
                className="flex items-center gap-2 py-3 px-5 rounded-xl text-xs md:text-sm font-black bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98"
              >
                <Download className="w-4 h-4 md:w-5 md:h-5" />
                <span>ดาวน์โหลดรายชื่อที่ลงทะเบียน (Excel .xlsx)</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 py-3 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>พิมพ์เอกสาร (Print)</span>
              </button>
            </div>

            {/* Official Registration Receipt Card */}
            <div id="receipt-print-card" className="w-full bg-white border border-slate-200 rounded-2xl p-5 md:p-6 text-left text-xs shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-2">
                <div>
                  <TohokuLogo size="sm" />
                  <div className="text-[11px] text-slate-500 font-semibold mt-1">
                    Corporate Training & Development Center
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-3 py-1 rounded-full text-xs">
                    ✓ ยืนยันการลงทะเบียนแล้ว (CONFIRMED)
                  </span>
                  <div className="font-mono text-slate-500 font-bold text-[11px] mt-1">
                    เลขที่เอกสาร: {receiptInfo.receiptNo}
                  </div>
                </div>
              </div>

              {/* Course Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-400 font-bold block">หลักสูตร (Course):</span>
                  <span className="text-sm font-black text-blue-800">{receiptInfo.courseTitle}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-bold block">วันที่และเวลาอบรม:</span>
                  <span className="font-bold text-slate-800">
                    {receiptInfo.courseDate} {receiptInfo.courseTime ? `(${receiptInfo.courseTime} น.)` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-bold block">ผู้ประสานงาน (Submitter):</span>
                  <span className="font-bold text-slate-800">
                    {receiptInfo.submitterName} ({receiptInfo.submitterDept})
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-bold block">เบอร์ติดต่อ & เวลาทำรายการ:</span>
                  <span className="font-semibold text-slate-700">
                    {receiptInfo.submitterPhone} | {receiptInfo.submissionDate}
                  </span>
                </div>
              </div>

              {/* Summary Table: Shows STRICTLY the newly registered attendees only */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-black text-slate-800 text-xs">
                    รายชื่อผู้ลงทะเบียนในรอบนี้ (จำนวน {receiptInfo.attendees.length} ท่าน):
                  </h5>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    เฉพาะรายชื่อที่ส่งในรอบนี้
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-[11px] font-bold text-slate-600">
                      <tr>
                        <th className="py-2 px-2.5 text-center w-10">#</th>
                        <th className="py-2 px-2.5 w-24">รหัส</th>
                        <th className="py-2 px-2.5 w-16">เพศ</th>
                        <th className="py-2 px-2.5">ชื่อ-นามสกุล</th>
                        <th className="py-2 px-2.5">แผนก/ฝ่าย</th>
                        <th className="py-2 px-2.5">ตำแหน่ง</th>
                        <th className="py-2 px-2.5">ความคาดหวัง</th>
                        <th className="py-2 px-2.5">การปรับใช้</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {receiptInfo.attendees.map((a, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-2 px-2.5 font-mono font-bold text-blue-600">{a.code}</td>
                          <td className="py-2 px-2.5 text-slate-600">{a.sex}</td>
                          <td className="py-2 px-2.5 font-bold text-slate-800">{a.fname} {a.lname}</td>
                          <td className="py-2 px-2.5 text-slate-700">{a.dept}</td>
                          <td className="py-2 px-2.5 text-slate-600">{a.pos}</td>
                          <td className="py-2 px-2.5 text-slate-600 text-[11px] truncate max-w-[160px]" title={a.exp}>
                            {a.exp}
                          </td>
                          <td className="py-2 px-2.5 text-slate-600 text-[11px] truncate max-w-[160px]" title={a.app}>
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
                className="py-2.5 px-6 rounded-xl text-xs font-black text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
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
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <p className="font-bold">
                    ผู้รับผิดชอบพิจารณาและบันทึกข้อมูลเกี่ยวกับความคาดหวังในการฝึกอบรมและการนำไปปรับใช้กับงาน
                  </p>
                  <p className="text-[11px] text-amber-800/80 mt-0.5">
                    เนื่องจากกลุ่มงาน Training จะนำข้อมูลนี้ไปปรับปรุงและพัฒนาระบบการฝึกอบรมให้มีประสิทธิภาพสูงสุด
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                  {errorMsg}
                </div>
              )}

              {/* Attendees Dynamic Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    รายชื่อผู้เข้าร่วมอบรม ({rows.length} ท่าน) <span className="text-rose-500">*</span>
                  </h4>
                  <button
                    type="button"
                    onClick={addRow}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มรายชื่อ (Add Row)</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
                  <table className="w-full text-left text-xs min-w-[1100px] divide-y divide-slate-200">
                    <thead className="bg-slate-100/80 text-[11px] font-black text-slate-600 uppercase">
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
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2 px-2 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="text"
                              required
                              placeholder="EMP-..."
                              value={row.code}
                              onChange={(e) => updateRow(idx, 'code', e.target.value)}
                              className="w-full text-xs font-semibold p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <select
                              value={row.sex}
                              onChange={(e) =>
                                updateRow(idx, 'sex', e.target.value as 'Mr.' | 'Ms.' | 'Mrs.')
                              }
                              className="w-full text-xs font-semibold p-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                            >
                              <option value="Mr.">Mr.</option>
                              <option value="Ms.">Ms.</option>
                              <option value="Mrs.">Mrs.</option>
                            </select>
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="text"
                              required
                              placeholder="ชื่อ"
                              value={row.fname}
                              onChange={(e) => updateRow(idx, 'fname', e.target.value)}
                              className="w-full text-xs font-semibold p-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="text"
                              required
                              placeholder="นามสกุล"
                              value={row.lname}
                              onChange={(e) => updateRow(idx, 'lname', e.target.value)}
                              className="w-full text-xs font-semibold p-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="text"
                              required
                              placeholder="ฝ่าย / แผนก"
                              value={row.dept}
                              onChange={(e) => updateRow(idx, 'dept', e.target.value)}
                              className="w-full text-xs font-semibold p-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="text"
                              required
                              placeholder="ตำแหน่ง"
                              value={row.pos}
                              onChange={(e) => updateRow(idx, 'pos', e.target.value)}
                              className="w-full text-xs font-semibold p-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="text"
                              required
                              placeholder="ความคาดหวังต่อหลักสูตร"
                              value={row.exp}
                              onChange={(e) => updateRow(idx, 'exp', e.target.value)}
                              className="w-full text-xs font-medium p-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="text"
                              required
                              placeholder="การนำไปปรับใช้ในงาน"
                              value={row.app}
                              onChange={(e) => updateRow(idx, 'app', e.target.value)}
                              className="w-full text-xs font-medium p-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <input
                              type="text"
                              placeholder="-"
                              value={row.rem || ''}
                              onChange={(e) => updateRow(idx, 'rem', e.target.value)}
                              className="w-full text-xs font-medium p-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                            />
                          </td>
                          <td className="py-1 px-1 text-center">
                            <button
                              type="button"
                              onClick={() => removeRow(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
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
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    ข้อมูลผู้ประสานงาน (Submitter Information) <span className="text-rose-500">*</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      ชื่อ-นามสกุล ผู้ส่งข้อมูล <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น นายประสานงาน ใจมั่น"
                      value={subName}
                      onChange={(e) => setSubName(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      แผนก / ฝ่าย <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น ฝ่ายทรัพยากรบุคคล"
                      value={subDept}
                      onChange={(e) => setSubDept(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      เบอร์โทรศัพท์ติดต่อ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="เช่น 081-234-5678"
                      value={subPhone}
                      onChange={(e) => setSubPhone(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Submit Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                รวมผู้ลงทะเบียน: <strong className="text-slate-900">{rows.length} ท่าน</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  ยกเลิก (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white shadow-md transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>กำลังส่งข้อมูล...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
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
