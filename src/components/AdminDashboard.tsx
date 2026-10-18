import React, { useState, useEffect, useMemo } from 'react';
import { TrainingEvent, AttendeeRow, FormSheetName } from '../types';
import {
  getRegistrationAttendees,
  clearRegistrationSheet,
  deleteRegistrationAttendees,
  SPREADSHEET_ID,
  getSheetsWebAppUrl,
  setSheetsWebAppUrl,
  getPendingSyncQueue,
  flushPendingSyncQueue,
} from '../services/sheetsService';
import { exportAttendeesToExcel } from '../utils/excelHelper';
import {
  FileSpreadsheet,
  Users,
  Download,
  Trash2,
  RefreshCw,
  Search,
  ExternalLink,
  Database,
  CheckCircle2,
  Settings,
  UploadCloud,
  Code,
  KeyRound,
  Check,
  Copy,
} from 'lucide-react';

interface AdminDashboardProps {
  events: TrainingEvent[];
  accessToken: string | null;
  onRefreshEvents: () => void;
  isSyncing: boolean;
  onGoogleSignIn?: () => Promise<void>;
}

const FORM_SHEETS: FormSheetName[] = [
  'Register-1',
  'Register-2',
  'Register-3',
  'Register-4',
  'Register-5',
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  events,
  accessToken,
  onRefreshEvents,
  isSyncing,
  onGoogleSignIn,
}) => {
  const [selectedSheet, setSelectedSheet] = useState<FormSheetName>('Register-1');
  const [attendees, setAttendees] = useState<AttendeeRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Selection & Deletion state
  const [selectedAttendeeKeys, setSelectedAttendeeKeys] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Sync Settings & WebApp Webhook
  const [showSyncSettings, setShowSyncSettings] = useState(false);
  const [webAppUrlInput, setWebAppUrlInput] = useState(getSheetsWebAppUrl());
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [pendingCount, setPendingCount] = useState(getPendingSyncQueue().length);
  const [isFlushing, setIsFlushing] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Unique key for each attendee
  const getAttendeeKey = (a: AttendeeRow, idx: number) => {
    return `${a.code || 'no-code'}_${a.fname}_${a.lname}_${a.rowIndex ?? idx}`;
  };

  // Reset selection when changing sheet
  useEffect(() => {
    setSelectedAttendeeKeys(new Set());
  }, [selectedSheet]);

  // Find linked event for currently selected sheet
  const linkedCourse = useMemo(() => {
    return events.find((ev) => ev.isEvent && ev.formSheet === selectedSheet);
  }, [events, selectedSheet]);

  // Load attendees for selected sheet
  const loadSheetData = async (sheetName: FormSheetName) => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const data = await getRegistrationAttendees(sheetName, accessToken);
      setAttendees(data.attendees || []);
      setSelectedAttendeeKeys(new Set());
    } catch (err: unknown) {
      console.error(err);
      setStatusMessage({
        text: 'ไม่สามารถโหลดข้อมูลจากชีตได้ กรุณาลองใหม่อีกครั้ง',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSheetData(selectedSheet);
  }, [selectedSheet, accessToken]);

  // Handle Clear all data
  const handleClearData = async () => {
    if (
      !window.confirm(
        `คำเตือน: คุณต้องการล้างข้อมูลผู้ลงทะเบียนทั้งหมดใน "${selectedSheet}" ใช่หรือไม่? (การกระทำนี้ไม่สามารถย้อนกลับได้)`
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const success = await clearRegistrationSheet(selectedSheet, accessToken);
      if (success) {
        setAttendees([]);
        setSelectedAttendeeKeys(new Set());
        setStatusMessage({
          text: `ล้างข้อมูลใน "${selectedSheet}" เรียบร้อยแล้ว`,
          type: 'success',
        });
      } else {
        setStatusMessage({ text: 'ล้างข้อมูลไม่สำเร็จ', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'เกิดข้อผิดพลาดในการล้างข้อมูล', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Delete Selected Attendees
  const handleDeleteSelected = async () => {
    const toDelete = attendees.filter((a, idx) =>
      selectedAttendeeKeys.has(getAttendeeKey(a, idx))
    );
    if (toDelete.length === 0) return;

    if (
      !window.confirm(
        `ยืนยันการลบรายชื่อผู้ลงทะเบียนที่เลือก (${toDelete.length} คน) ออกจาก "${selectedSheet}" ใช่หรือไม่?`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteRegistrationAttendees(selectedSheet, toDelete, accessToken);
      if (res.success) {
        const deleteKeySet = new Set(toDelete.map((a, idx) => getAttendeeKey(a, idx)));
        setAttendees((prev) => prev.filter((a, idx) => !deleteKeySet.has(getAttendeeKey(a, idx))));
        setSelectedAttendeeKeys(new Set());
        setStatusMessage({
          text: `ลบรายชื่อผู้ลงทะเบียนที่เลือกเรียบร้อยแล้ว (${toDelete.length} คน)`,
          type: 'success',
        });
      } else {
        setStatusMessage({ text: res.error || 'ลบข้อมูลไม่สำเร็จ', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'เกิดข้อผิดพลาดในการลบข้อมูล', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Delete Single Attendee
  const handleDeleteSingle = async (a: AttendeeRow, idx: number) => {
    const fullName = `${a.fname} ${a.lname}`.trim() || a.code || 'รายการนี้';
    if (
      !window.confirm(
        `ยืนยันการลบผู้ลงทะเบียน "${fullName}" ออกจาก "${selectedSheet}" ใช่หรือไม่?`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteRegistrationAttendees(selectedSheet, [a], accessToken);
      if (res.success) {
        const key = getAttendeeKey(a, idx);
        setSelectedAttendeeKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        setAttendees((prev) => prev.filter((item, i) => getAttendeeKey(item, i) !== key));
        setStatusMessage({
          text: `ลบผู้ลงทะเบียน "${fullName}" เรียบร้อยแล้ว`,
          type: 'success',
        });
      } else {
        setStatusMessage({ text: res.error || 'ลบข้อมูลไม่สำเร็จ', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'เกิดข้อผิดพลาดในการลบข้อมูล', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter attendees by search
  const filteredAttendees = useMemo(() => {
    if (!searchQuery.trim()) return attendees;
    const q = searchQuery.toLowerCase();
    return attendees.filter(
      (a) =>
        a.fname.toLowerCase().includes(q) ||
        a.lname.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        a.dept.toLowerCase().includes(q) ||
        a.pos.toLowerCase().includes(q) ||
        (a.submitterName && a.submitterName.toLowerCase().includes(q))
    );
  }, [attendees, searchQuery]);

  // Department breakdown stats
  const deptStats = useMemo(() => {
    const counts: Record<string, number> = {};
    attendees.forEach((a) => {
      const d = a.dept || 'ไม่ระบุ';
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [attendees]);

  const handleSaveWebAppUrl = () => {
    setIsSavingUrl(true);
    try {
      setSheetsWebAppUrl(webAppUrlInput);
      setStatusMessage({
        text: 'บันทึก Google Apps Script Web App URL เรียบร้อยแล้ว ระบบจะส่งข้อมูลลงชีตผ่าน Webhook อัตโนมัติ',
        type: 'success',
      });
    } catch {
      setStatusMessage({ text: 'บันทึก URL ไม่สำเร็จ', type: 'error' });
    } finally {
      setIsSavingUrl(false);
    }
  };

  const handleFlushPending = async () => {
    setIsFlushing(true);
    try {
      const res = await flushPendingSyncQueue(accessToken);
      setPendingCount(getPendingSyncQueue().length);
      setStatusMessage({
        text: `ซิงค์ข้อมูลค้างส่งสำเร็จเรียบร้อย (${res.flushedCount} รายการ)`,
        type: 'success',
      });
    } catch (e) {
      console.error(e);
      setStatusMessage({ text: 'เกิดข้อผิดพลาดในการซิงค์ข้อมูล', type: 'error' });
    } finally {
      setIsFlushing(false);
    }
  };

  const appsScriptCode = `// Google Apps Script สำหรับ Tohoku Solutions Spreadsheet
function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = contents.action;

    if (action === 'registration') {
      var sheet = ss.getSheetByName(contents.formSheet) || ss.insertSheet(contents.formSheet);
      var rows = contents.data.map(function(d) {
        return [
          d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8] || '',
          contents.submitterName, contents.submitterDept, contents.submitterPhone
        ];
      });
      rows.forEach(function(r) {
        sheet.appendRow(r);
      });
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'save_event') {
      var master = ss.getSheetByName('Master');
      var ev = contents.event;
      var row = [ev.id, ev.category, ev.title, ev.start, ev.end, ev.startTime, ev.endTime, ev.location, ev.description, ev.color, ev.status, ev.openDate, ev.closeDate, ev.formSheet];
      var data = master.getDataRange().getValues();
      var foundRow = -1;
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === ev.id) { foundRow = i + 1; break; }
      }
      if (foundRow > 0) {
        master.getRange(foundRow, 1, 1, row.length).setValues([row]);
      } else {
        master.appendRow(row);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  return (
    <div className="flex-1 h-full neu-card rounded-2xl p-4 md:p-5 flex flex-col min-w-0 overflow-hidden">
      {/* 1. Google Sheets Live Status & Integration Bar */}
      <div className="mb-3 py-2 px-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between text-xs shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <div className="flex items-center gap-2 font-bold text-slate-800 shrink-0">
            <span className={`w-2.5 h-2.5 rounded-full ${accessToken ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'} shadow-xs`}></span>
            <Database className="w-3.5 h-3.5 text-[#1e3a8a]" />
            <span>
              {accessToken ? 'Google Sheets Sync: เชื่อมต่อสด (พร้อมเขียนอัตโนมัติ)' : 'Google Sheets: อ่านข้อมูลสด (GViz)'}
            </span>
          </div>

          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              ค้างส่ง: {pendingCount} รายการ
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Real-time Automated Background Sync Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-lg shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>ซิงค์ข้อมูลอัตโนมัติตลอดเวลา</span>
          </div>

          {pendingCount > 0 && (
            <button
              onClick={handleFlushPending}
              disabled={isFlushing}
              className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg cursor-pointer transition-colors"
            >
              <UploadCloud className={`w-3 h-3 ${isFlushing ? 'animate-bounce' : ''}`} />
              <span>{isFlushing ? 'กำลังส่ง...' : `ส่งคิว (${pendingCount})`}</span>
            </button>
          )}

          <button
            onClick={() => setShowSyncSettings(!showSyncSettings)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer transition-colors"
            title="ตั้งค่า Webhook และดูโค้ด Apps Script"
          >
            <Settings className="w-3 h-3 text-[#1e3a8a]" />
            <span className="hidden sm:inline">ตั้งค่าซิงค์</span>
          </button>

          <button
            onClick={onRefreshEvents}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-[#1e3a8a]' : 'text-[#1e3a8a]'}`} />
            <span className="hidden sm:inline">รีเฟรช</span>
          </button>

          <a
            href={`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-all"
          >
            <ExternalLink className="w-3 h-3 text-[#1e3a8a]" />
            <span className="hidden sm:inline">เปิดชีต</span>
          </a>
        </div>
      </div>

      {/* Collapsible Sync Settings Panel */}
      {showSyncSettings && (
        <div className="mb-3 p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 text-xs shrink-0 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-[#1e3a8a]" />
              ช่องทางการซิงค์ข้อมูลลง Google Sheets อัตโนมัติ (Automated 2-Way Sync)
            </span>
            <button
              onClick={() => setShowScriptModal(true)}
              className="text-[#1e3a8a] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Code className="w-3.5 h-3.5" />
              <span>ดูโค้ด Apps Script สำหรับชีต</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="url"
              placeholder="Google Apps Script Web App URL (https://script.google.com/macros/s/.../exec)"
              value={webAppUrlInput}
              onChange={(e) => setWebAppUrlInput(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#1e3a8a]"
            />
            <button
              onClick={handleSaveWebAppUrl}
              disabled={isSavingUrl}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#1e3a8a] hover:bg-[#172554] rounded-lg cursor-pointer shrink-0 transition-colors"
            >
              {isSavingUrl ? 'กำลังบันทึก...' : 'บันทึก Webhook URL'}
            </button>
          </div>
          <p className="text-[11px] text-slate-600">
            * ระบบทำงานแบบ Real-time Auto-Sync ตลอดเวลา ข้อมูลหลักสูตรและการลงทะเบียนจะส่งและซิงค์ข้อมูลอัตโนมัติทันที ผู้ใช้งานเว็บทั่วไปและแอดมินไม่ต้องกดล็อกอิน Google หรือดำเนินการใดๆ เพิ่มเติม
          </p>
        </div>
      )}

      {/* 2. Streamlined Header: Title + Connected Course + Sheet Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 shrink-0">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#1e3a8a] text-white uppercase shrink-0">
            Admin
          </span>
          <h2 className="text-sm md:text-base font-bold text-slate-900 tracking-tight shrink-0">
            แดชบอร์ดติดตามผู้ลงทะเบียน
          </h2>

          {linkedCourse ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1e3a8a] bg-blue-50 border border-blue-200/70 px-2.5 py-1 rounded-lg truncate max-w-[280px]">
              <span className="shrink-0 font-mono text-[11px]">[{selectedSheet}]</span>
              <span className="truncate">{linkedCourse.title}</span>
            </div>
          ) : (
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {selectedSheet}: ยังไม่มีหลักสูตร
            </span>
          )}

          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-[#1e3a8a] font-mono tabular-nums shrink-0">
            {attendees.length} คน
          </span>
        </div>

        {/* Sheet Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl overflow-x-auto pb-0.5 sm:pb-1 shrink-0 gap-1 border border-slate-200/70">
          {FORM_SHEETS.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSheet(s)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                selectedSheet === s
                  ? 'bg-white text-[#1e3a8a] shadow-2xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-[#1e3a8a]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {statusMessage && (
        <div
          className={`mb-2.5 p-2.5 rounded-xl text-xs font-semibold shrink-0 border ${
            statusMessage.type === 'success'
              ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
              : 'text-rose-700 bg-rose-50 border-rose-200'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* 3. Compact Search & Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 mb-3 shrink-0">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, รหัส, แผนก..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs font-medium neu-input rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]"
          />
        </div>

        {/* Action Buttons: Export Excel / Delete Selected / Clear */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <button
            onClick={() => loadSheetData(selectedSheet)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-[#1e3a8a]' : 'text-[#1e3a8a]'}`} />
            <span>รีเฟรช</span>
          </button>

          <button
            onClick={() =>
              exportAttendeesToExcel(
                attendees,
                linkedCourse ? linkedCourse.title : selectedSheet,
                selectedSheet
              )
            }
            disabled={attendees.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#1e3a8a] bg-blue-50/70 hover:bg-blue-100 border border-blue-200/70 rounded-lg disabled:opacity-40 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#1e3a8a]" />
            <span>Excel (.xlsx)</span>
          </button>

          {/* Delete Selected Attendees Button */}
          {selectedAttendeeKeys.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting || isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 border border-rose-700 rounded-lg shadow-xs cursor-pointer transition-all animate-in fade-in duration-150"
              title={`ลบผู้ลงทะเบียนที่เลือก (${selectedAttendeeKeys.size} คน)`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'กำลังลบ...' : `ลบที่เลือก (${selectedAttendeeKeys.size})`}</span>
            </button>
          )}

          <button
            onClick={handleClearData}
            disabled={attendees.length === 0 || isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50/70 hover:bg-rose-100 border border-rose-200 rounded-lg disabled:opacity-40 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>ล้างทั้งหมด</span>
          </button>
        </div>
      </div>

      {/* 4. Large Attendees Table */}
      <div className="flex-1 min-h-0 overflow-auto border border-slate-200/80 rounded-xl bg-white shadow-2xs">
        <table className="w-full text-left text-xs min-w-[1240px]">
          <thead className="sticky top-0 z-10 text-[11px] font-bold text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-2.5 text-center w-10">
                <input
                  type="checkbox"
                  checked={
                    filteredAttendees.length > 0 &&
                    filteredAttendees.every((a, idx) =>
                      selectedAttendeeKeys.has(getAttendeeKey(a, idx))
                    )
                  }
                  onChange={() => {
                    const isAll =
                      filteredAttendees.length > 0 &&
                      filteredAttendees.every((a, idx) =>
                        selectedAttendeeKeys.has(getAttendeeKey(a, idx))
                      );
                    if (isAll) {
                      setSelectedAttendeeKeys(new Set());
                    } else {
                      const next = new Set<string>();
                      filteredAttendees.forEach((a, idx) =>
                        next.add(getAttendeeKey(a, idx))
                      );
                      setSelectedAttendeeKeys(next);
                    }
                  }}
                  className="w-4 h-4 rounded text-[#1e3a8a] accent-[#1e3a8a] cursor-pointer"
                  title="เลือกทั้งหมด"
                />
              </th>
              <th className="py-2.5 px-3 text-center w-12">#</th>
              <th className="py-2.5 px-3 w-28">Code</th>
              <th className="py-2.5 px-3 w-20">Sex</th>
              <th className="py-2.5 px-3 w-36">ชื่อ (Name)</th>
              <th className="py-2.5 px-3 w-36">นามสกุล (Last Name)</th>
              <th className="py-2.5 px-3 w-40">แผนก (Department)</th>
              <th className="py-2.5 px-3 w-32">ตำแหน่ง</th>
              <th className="py-2.5 px-3">ความคาดหวัง (Expectation)</th>
              <th className="py-2.5 px-3">การปรับใช้ (Application)</th>
              <th className="py-2.5 px-3 w-28">หมายเหตุ (Remark)</th>
              <th className="py-2.5 px-3 w-44">ผู้ประสานงาน (Submitter)</th>
              <th className="py-2.5 px-2.5 text-center w-16">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAttendees.length === 0 ? (
              <tr>
                <td colSpan={13} className="text-center py-16 text-slate-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#1e3a8a]" />
                  <p className="font-semibold text-xs text-slate-600">ยังไม่มีข้อมูลผู้ลงทะเบียนในฟอร์มชีตนี้</p>
                </td>
              </tr>
            ) : (
              filteredAttendees.map((a, idx) => {
                const key = getAttendeeKey(a, idx);
                const isSelected = selectedAttendeeKeys.has(key);

                return (
                  <tr
                    key={key}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 hover:bg-blue-100/70 border-l-3 border-[#1e3a8a]'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-2 px-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedAttendeeKeys((prev) => {
                            const next = new Set(prev);
                            if (next.has(key)) {
                              next.delete(key);
                            } else {
                              next.add(key);
                            }
                            return next;
                          });
                        }}
                        className="w-4 h-4 rounded text-[#1e3a8a] accent-[#1e3a8a] cursor-pointer"
                      />
                    </td>
                    <td className="py-2 px-3 text-center font-medium text-slate-400 tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-mono font-semibold text-[#1e3a8a] tabular-nums">
                      {a.code}
                    </td>
                    <td className="py-2 px-3 text-slate-600">{a.sex}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{a.fname}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{a.lname}</td>
                    <td className="py-2 px-3 text-slate-700">
                      <span className="bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md text-[11px] font-medium inline-block">
                        {a.dept}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600">{a.pos}</td>
                    <td className="py-2 px-3 text-slate-600 max-w-[180px] truncate" title={a.exp}>
                      {a.exp}
                    </td>
                    <td className="py-2 px-3 text-slate-600 max-w-[180px] truncate" title={a.app}>
                      {a.app}
                    </td>
                    <td className="py-2 px-3 text-slate-500 max-w-[120px] truncate" title={a.rem}>
                      {a.rem || '-'}
                    </td>
                    <td className="py-2 px-3 text-slate-600 text-[11px]">
                      <div className="font-semibold text-slate-900">{a.submitterName || '-'}</div>
                      <div className="text-[10px] text-slate-500">
                        {a.submitterDept ? `${a.submitterDept} ` : ''}
                        {a.submitterPhone ? `(${a.submitterPhone})` : ''}
                      </div>
                    </td>
                    <td className="py-2 px-2.5 text-center">
                      <button
                        onClick={() => handleDeleteSingle(a, idx)}
                        disabled={isDeleting}
                        title="ลบรายชื่อผู้ลงทะเบียนนี้"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Department Breakdown Mini-Bar */}
      {deptStats.length > 0 && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
            สัดส่วนแผนก:
          </span>
          <div className="flex items-center gap-1.5 flex-nowrap">
            {deptStats.map(([dept, count]) => (
              <span
                key={dept}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 border border-slate-200/70 text-slate-700 shrink-0"
              >
                <span>{dept}:</span>
                <span className="font-bold text-[#1e3a8a] font-mono tabular-nums">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Apps Script Guide Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="rounded-2xl w-full max-w-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-[#1e3a8a]" />
                <h3 className="font-bold text-slate-900 text-sm">
                  โค้ด Google Apps Script สำหรับใส่ในชีต (Webhook อัตโนมัติ)
                </h3>
              </div>
              <button
                onClick={() => setShowScriptModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 text-xs text-slate-700">
              <ol className="list-decimal list-inside space-y-1 font-medium text-slate-800">
                <li>เปิด Google Sheet ของท่าน: <a href={`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`} target="_blank" rel="noreferrer" className="text-[#1e3a8a] underline font-bold">คลิกที่นี่</a></li>
                <li>ไปที่เมนู <b>ส่วนขยาย (Extensions)</b> &gt; <b>Apps Script</b></li>
                <li>วางโค้ดด้านล่างนี้ลงไปแทนที่ของเดิม</li>
                <li>กด <b>ทำให้ใช้งานได้ (Deploy)</b> &gt; <b>การทำให้ใช้งานได้รายการใหม่ (New deployment)</b></li>
                <li>เลือกประเภท <b>เว็บแอป (Web app)</b>, ตั้งค่า <i>เข้าถึงได้โดย (Who has access)</i>: <b>ทุกคน (Anyone)</b></li>
                <li>คัดลอก URL เว็บแอปที่ได้ มาใส่ในช่อง "ตั้งค่าซิงค์" ของแดชบอร์ดนี้</li>
              </ol>

              <div className="relative mt-2">
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto max-h-60">
                  {appsScriptCode}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(appsScriptCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="absolute right-3 top-3 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-[#1e3a8a] hover:bg-[#172554] shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด'}</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowScriptModal(false)}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
