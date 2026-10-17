import React, { useState, useEffect, useMemo } from 'react';
import { TrainingEvent, AttendeeRow, FormSheetName } from '../types';
import {
  getRegistrationAttendees,
  clearRegistrationSheet,
  SPREADSHEET_ID,
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
  isSyncing: boolean;
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
}) => {
  const [selectedSheet, setSelectedSheet] = useState<FormSheetName>('Register-1');
  const [attendees, setAttendees] = useState<AttendeeRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

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

  // Handle Clear data
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

  return (
    <div className="flex-1 h-full neu-card rounded-2xl p-4 md:p-5 flex flex-col min-w-0 overflow-hidden">
      {/* 1. Compact Google Sheets Status Bar (Takes minimal vertical space) */}
      <div className="mb-3 py-2 px-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <div className="flex items-center gap-2 font-bold text-slate-800 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs"></span>
            <Database className="w-3.5 h-3.5 text-[#1e3a8a]" />
            <span>Google Sheets Connected (Live Status)</span>
          </div>
          <span className="text-[10px] font-mono text-[#1e3a8a] bg-blue-50/70 border border-blue-200/70 px-2 py-0.5 rounded-md truncate hidden md:inline">
            Spreadsheet ID: {SPREADSHEET_ID}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRefreshEvents}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-[#1e3a8a]' : 'text-[#1e3a8a]'}`} />
            <span className="hidden sm:inline">ซิงค์ชีต</span>
          </button>

          <a
            href={`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-white bg-gradient-to-r from-[#1e3a8a] to-[#172554] hover:from-[#172554] hover:to-[#0f172a] rounded-lg shadow-xs transition-all"
          >
            <ExternalLink className="w-3 h-3 text-white" />
            <span>เปิดชีต</span>
          </a>
        </div>
      </div>

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

        {/* Action Buttons: Export Excel / CSV / Clear */}
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

          <button
            onClick={() => exportAttendeesToCsv(attendees, selectedSheet)}
            disabled={attendees.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleClearData}
            disabled={attendees.length === 0 || isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50/70 hover:bg-rose-100 border border-rose-200 rounded-lg disabled:opacity-40 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>ล้างข้อมูล</span>
          </button>
        </div>
      </div>

      {/* 4. Large Attendees Table */}
      <div className="flex-1 min-h-0 overflow-auto border border-slate-200/80 rounded-xl bg-white shadow-2xs">
        <table className="w-full text-left text-xs min-w-[1100px]">
          <thead className="sticky top-0 z-10 text-[11px] font-bold text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 text-center w-12">#</th>
              <th className="py-2.5 px-3 w-28">Code</th>
              <th className="py-2.5 px-3 w-20">Sex</th>
              <th className="py-2.5 px-3 w-36">ชื่อ (Name)</th>
              <th className="py-2.5 px-3 w-36">นามสกุล (Last Name)</th>
              <th className="py-2.5 px-3 w-40">แผนก (Department)</th>
              <th className="py-2.5 px-3 w-32">ตำแหน่ง</th>
              <th className="py-2.5 px-3">ความคาดหวัง (Expectation)</th>
              <th className="py-2.5 px-3">การปรับใช้ (Application)</th>
              <th className="py-2.5 px-3 w-36">ผู้ประสานงาน (Submitter)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAttendees.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-16 text-slate-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#1e3a8a]" />
                  <p className="font-semibold text-xs text-slate-600">ยังไม่มีข้อมูลผู้ลงทะเบียนในฟอร์มชีตนี้</p>
                </td>
              </tr>
            ) : (
              filteredAttendees.map((a, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3 text-center font-medium text-slate-400 tabular-nums">{idx + 1}</td>
                  <td className="py-2 px-3 font-mono font-semibold text-[#1e3a8a] tabular-nums">{a.code}</td>
                  <td className="py-2 px-3 text-slate-600">{a.sex}</td>
                  <td className="py-2 px-3 font-semibold text-slate-900">{a.fname}</td>
                  <td className="py-2 px-3 font-semibold text-slate-900">{a.lname}</td>
                  <td className="py-2 px-3 text-slate-700">
                    <span className="bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md text-[11px] font-medium inline-block">
                      {a.dept}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-600">{a.pos}</td>
                  <td className="py-2 px-3 text-slate-600 max-w-[200px] truncate" title={a.exp}>
                    {a.exp}
                  </td>
                  <td className="py-2 px-3 text-slate-600 max-w-[200px] truncate" title={a.app}>
                    {a.app}
                  </td>
                  <td className="py-2 px-3 text-slate-600 text-[11px]">
                    <div className="font-semibold text-slate-900">{a.submitterName || '-'}</div>
                    <div className="text-[10px] text-slate-500">
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
    </div>
  );
};
