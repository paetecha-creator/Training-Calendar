import React, { useState, useEffect, useMemo } from 'react';
import { TrainingEvent, AttendeeRow, FormSheetName } from '../types';
import {
  getRegistrationAttendees,
  clearRegistrationSheet,
  SPREADSHEET_ID,
  APPS_SCRIPT_URL,
} from '../services/sheetsService';
import { exportAttendeesToExcel, exportAttendeesToCsv } from '../utils/excelHelper';
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
} from 'lucide-react';

interface AdminDashboardProps {
  events: TrainingEvent[];
  accessToken: string | null;
  onRefreshEvents: () => void;
  isSyncing?: boolean;
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
  isSyncing = false,
}) => {
  const [selectedSheet, setSelectedSheet] = useState<FormSheetName>('Register-1');
  const [attendees, setAttendees] = useState<AttendeeRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  // Find corresponding course
  const linkedCourse = useMemo(() => {
    return events.find((e) => e.formSheet === selectedSheet);
  }, [events, selectedSheet]);

  const loadSheetData = async (sheet: FormSheetName) => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await getRegistrationAttendees(sheet, accessToken);
      setAttendees(res.attendees);
    } catch (err: unknown) {
      console.error(err);
      setStatusMessage({ text: 'ไม่สามารถโหลดข้อมูลจากชีตได้', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSheetData(selectedSheet);
  }, [selectedSheet, accessToken]);

  const handleClearData = async () => {
    const confirmMsg = `ยืนยันการล้างข้อมูลในแบบฟอร์ม (${selectedSheet}) หรือไม่?\n\nคำเตือน: ข้อมูลรายชื่อผู้ลงทะเบียนทั้งหมดในชีตนี้จะถูกลบ! กรุณาดาวน์โหลดไฟล์สำรองไว้ก่อนดำเนินการ`;
    if (!confirm(confirmMsg)) return;

    setIsLoading(true);
    try {
      const res = await clearRegistrationSheet(selectedSheet, accessToken);
      if (res.success) {
        setAttendees([]);
        setStatusMessage({ text: `ล้างข้อมูลในชีต ${selectedSheet} เรียบร้อยแล้ว`, type: 'success' });
        onRefreshEvents();
      } else {
        setStatusMessage({ text: res.error || 'เกิดข้อผิดพลาดในการล้างข้อมูล', type: 'error' });
      }
    } catch (e: unknown) {
      console.error(e);
      setStatusMessage({ text: 'เกิดข้อผิดพลาดในการล้างข้อมูล', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter attendees by search
  const filteredAttendees = useMemo(() => {
    if (!searchQuery.trim()) return attendees;
    const q = searchQuery.toLowerCase();
    return attendees.filter(
      (a) =>
        a.code.toLowerCase().includes(q) ||
        a.fname.toLowerCase().includes(q) ||
        a.lname.toLowerCase().includes(q) ||
        a.dept.toLowerCase().includes(q) ||
        a.pos.toLowerCase().includes(q) ||
        (a.submitterName && a.submitterName.toLowerCase().includes(q))
    );
  }, [attendees, searchQuery]);

  // Dept stats breakdown
  const deptStats = useMemo(() => {
    const counts: Record<string, number> = {};
    attendees.forEach((a) => {
      const d = a.dept || 'ไม่ระบุ';
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [attendees]);

  return (
    <div className="flex-1 h-full bg-white border border-slate-200/80 rounded-2xl p-3 md:p-4 shadow-xs flex flex-col min-w-0 overflow-hidden">
      {/* 1. Compact Google Sheets Status Bar (Takes minimal vertical space) */}
      <div className="mb-2 py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="flex items-center gap-1.5 font-bold text-emerald-800 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google Sheets Live Connected via Apps Script Web App API</span>
          </div>
          <span
            className="text-[10px] font-mono text-slate-600 bg-white/90 px-2 py-0.5 rounded border border-slate-200 truncate hidden md:inline max-w-[280px]"
            title={APPS_SCRIPT_URL}
          >
            API: {APPS_SCRIPT_URL.replace('https://script.google.com/macros/s/', '').substring(0, 32)}...
          </span>
          <span className="text-[10px] font-mono text-slate-500 bg-white/70 px-1.5 py-0.5 rounded border border-slate-200 truncate hidden lg:inline">
            Sheet ID: {SPREADSHEET_ID.substring(0, 16)}...
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onRefreshEvents}
            disabled={isSyncing}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-white text-emerald-800 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-emerald-600' : 'text-emerald-600'}`} />
            <span className="hidden sm:inline">ซิงค์ชีต</span>
          </button>

          <a
            href={`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span>เปิดชีต</span>
          </a>
        </div>
      </div>

      {/* 2. Streamlined Header: Title + Connected Course + Sheet Tabs (Merged in 1 row) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900 text-white uppercase shrink-0">
            Admin
          </span>
          <h2 className="text-sm md:text-base font-black text-slate-900 tracking-tight shrink-0">
            แดชบอร์ดติดตามผู้ลงทะเบียน
          </h2>

          {linkedCourse ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 truncate max-w-[280px]">
              <span className="shrink-0 font-mono text-[11px]">[{selectedSheet}]</span>
              <span className="truncate">{linkedCourse.title}</span>
            </div>
          ) : (
            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
              {selectedSheet}: ยังไม่มีหลักสูตร
            </span>
          )}

          <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
            {attendees.length} คน
          </span>
        </div>

        {/* Sheet Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 sm:pb-0 shrink-0">
          {FORM_SHEETS.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSheet(s)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                selectedSheet === s
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {statusMessage && (
        <div
          className={`mt-2 p-2 rounded-lg text-xs font-bold shrink-0 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* 3. Compact Search & Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 my-2.5 shrink-0">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, รหัส, แผนก..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Action Buttons: Export Excel / CSV / Clear */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
          <button
            onClick={() => loadSheetData(selectedSheet)}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
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
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3 h-3 text-emerald-600" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => exportAttendeesToCsv(attendees, selectedSheet)}
            disabled={attendees.length === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3 h-3 text-blue-600" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleClearData}
            disabled={attendees.length === 0 || isLoading}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>ล้างข้อมูล</span>
          </button>
        </div>
      </div>

      {/* 4. Large Attendees Table (Fills All Remaining Vertical Viewport Space) */}
      <div className="flex-1 min-h-0 overflow-auto border border-slate-200 rounded-xl shadow-2xs">
        <table className="w-full text-left text-xs min-w-[1100px] divide-y divide-slate-200">
          <thead className="bg-slate-100 sticky top-0 z-10 text-[11px] font-black text-slate-600 uppercase shadow-2xs">
            <tr>
              <th className="py-2 px-3 text-center w-12">#</th>
              <th className="py-2 px-3 w-28">Code</th>
              <th className="py-2 px-3 w-20">Sex</th>
              <th className="py-2 px-3 w-36">ชื่อ (Name)</th>
              <th className="py-2 px-3 w-36">นามสกุล (Last Name)</th>
              <th className="py-2 px-3 w-40">แผนก (Department)</th>
              <th className="py-2 px-3 w-32">ตำแหน่ง</th>
              <th className="py-2 px-3">ความคาดหวัง (Expectation)</th>
              <th className="py-2 px-3">การปรับใช้ (Application)</th>
              <th className="py-2 px-3 w-36">ผู้ประสานงาน (Submitter)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredAttendees.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-slate-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="font-semibold text-xs">ยังไม่มีข้อมูลผู้ลงทะเบียนในฟอร์มชีตนี้</p>
                </td>
              </tr>
            ) : (
              filteredAttendees.map((a, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-2 px-3 font-mono font-bold text-blue-700">{a.code}</td>
                  <td className="py-2 px-3 text-slate-600">{a.sex}</td>
                  <td className="py-2 px-3 font-bold text-slate-800">{a.fname}</td>
                  <td className="py-2 px-3 font-bold text-slate-800">{a.lname}</td>
                  <td className="py-2 px-3 text-slate-700">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold">
                      {a.dept}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-600">{a.pos}</td>
                  <td className="py-2 px-3 text-slate-700 max-w-[200px] truncate" title={a.exp}>
                    {a.exp}
                  </td>
                  <td className="py-2 px-3 text-slate-700 max-w-[200px] truncate" title={a.app}>
                    {a.app}
                  </td>
                  <td className="py-2 px-3 text-slate-600 text-[11px]">
                    <div className="font-semibold text-slate-800">{a.submitterName || '-'}</div>
                    <div className="text-[10px] text-slate-400">
                      {a.submitterDept ? `${a.submitterDept} ` : ''}
                      {a.submitterPhone ? `(${a.submitterPhone})` : ''}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Compact Department Breakdown Mini-Bar (Minimal height) */}
      {deptStats.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider shrink-0">
            สัดส่วนแผนก:
          </span>
          <div className="flex items-center gap-1.5 flex-nowrap">
            {deptStats.map(([dept, count]) => (
              <span
                key={dept}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-semibold text-slate-700 shrink-0"
              >
                <span>{dept}:</span>
                <span className="font-bold text-blue-600">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
