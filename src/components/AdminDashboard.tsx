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
    <div className="flex-1 h-full neu-card rounded-3xl p-3.5 md:p-4.5 flex flex-col min-w-0 overflow-hidden bg-[#e0e5ec]">
      {/* 1. Compact Google Sheets Status Bar (Takes minimal vertical space) */}
      <div className="mb-3 py-2 px-3.5 rounded-2xl neu-card-sm flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <div className="flex items-center gap-2 font-black text-[#2e3440] shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm"></span>
            <Database className="w-3.5 h-3.5 text-[#5e81ac]" />
            <span>Google Sheets Connected (Live Status)</span>
          </div>
          <span className="text-[10px] font-mono text-[#5e81ac] neu-inset-sm px-2.5 py-0.5 rounded-lg truncate hidden md:inline">
            Spreadsheet ID: {SPREADSHEET_ID}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRefreshEvents}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold neu-btn text-[#3b4252] rounded-xl cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-[#5e81ac]' : 'text-[#5e81ac]'}`} />
            <span className="hidden sm:inline">ซิงค์ชีต</span>
          </button>

          <a
            href={`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold neu-btn-accent text-white rounded-xl shadow-xs"
          >
            <ExternalLink className="w-3 h-3 text-white" />
            <span>เปิดชีต</span>
          </a>
        </div>
      </div>

      {/* 2. Streamlined Header: Title + Connected Course + Sheet Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 shrink-0">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-[10px] font-black px-2.5 py-1 rounded-xl neu-btn-accent text-white uppercase shrink-0">
            Admin
          </span>
          <h2 className="text-sm md:text-base font-black text-[#2e3440] tracking-tight shrink-0">
            แดชบอร์ดติดตามผู้ลงทะเบียน
          </h2>

          {linkedCourse ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#5e81ac] neu-inset-sm px-3 py-1 rounded-xl truncate max-w-[280px]">
              <span className="shrink-0 font-mono text-[11px]">[{selectedSheet}]</span>
              <span className="truncate">{linkedCourse.title}</span>
            </div>
          ) : (
            <span className="text-xs font-bold text-[#7b889b] neu-inset-sm px-2.5 py-1 rounded-xl">
              {selectedSheet}: ยังไม่มีหลักสูตร
            </span>
          )}

          <span className="text-xs font-black px-3 py-1 rounded-xl neu-card-sm text-[#5e81ac] shrink-0">
            {attendees.length} คน
          </span>
        </div>

        {/* Sheet Tabs */}
        <div className="flex items-center neu-inset p-1 rounded-2xl overflow-x-auto pb-0.5 sm:pb-1 shrink-0 gap-1">
          {FORM_SHEETS.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSheet(s)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                selectedSheet === s
                  ? 'neu-card-sm text-[#5e81ac] font-black'
                  : 'text-[#7b889b] hover:text-[#2e3440]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {statusMessage && (
        <div
          className={`mb-2.5 p-2.5 rounded-2xl text-xs font-bold shrink-0 neu-inset ${
            statusMessage.type === 'success' ? 'text-emerald-700' : 'text-rose-600'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* 3. Compact Search & Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 mb-3 shrink-0">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#7b889b] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, รหัส, แผนก..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-semibold neu-input rounded-xl"
          />
        </div>

        {/* Action Buttons: Export Excel / CSV / Clear */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <button
            onClick={() => loadSheetData(selectedSheet)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-[#3b4252] neu-btn rounded-xl cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-[#5e81ac]' : 'text-[#5e81ac]'}`} />
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-[#5e81ac] neu-btn rounded-xl disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#5e81ac]" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => exportAttendeesToCsv(attendees, selectedSheet)}
            disabled={attendees.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-[#4c566a] neu-btn rounded-xl disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#4c566a]" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleClearData}
            disabled={attendees.length === 0 || isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-rose-500 hover:text-rose-600 neu-btn rounded-xl disabled:opacity-40 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>ล้างข้อมูล</span>
          </button>
        </div>
      </div>

      {/* 4. Large Attendees Table */}
      <div className="flex-1 min-h-0 overflow-auto neu-inset rounded-2xl p-1">
        <table className="w-full text-left text-xs min-w-[1100px]">
          <thead className="sticky top-0 z-10 text-[11px] font-black text-[#4c566a] uppercase bg-[#e0e5ec] shadow-xs">
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
          <tbody className="divide-y divide-black/5">
            {filteredAttendees.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-16 text-[#7b889b]">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#5e81ac]" />
                  <p className="font-bold text-xs">ยังไม่มีข้อมูลผู้ลงทะเบียนในฟอร์มชีตนี้</p>
                </td>
              </tr>
            ) : (
              filteredAttendees.map((a, idx) => (
                <tr key={idx} className="hover:bg-black/5 transition-colors">
                  <td className="py-2 px-3 text-center font-bold text-[#7b889b]">{idx + 1}</td>
                  <td className="py-2 px-3 font-mono font-bold text-[#5e81ac]">{a.code}</td>
                  <td className="py-2 px-3 text-[#4c566a]">{a.sex}</td>
                  <td className="py-2 px-3 font-bold text-[#2e3440]">{a.fname}</td>
                  <td className="py-2 px-3 font-bold text-[#2e3440]">{a.lname}</td>
                  <td className="py-2 px-3 text-[#3b4252]">
                    <span className="neu-card-sm px-2 py-0.5 rounded-lg text-[11px] font-semibold inline-block">
                      {a.dept}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-[#4c566a]">{a.pos}</td>
                  <td className="py-2 px-3 text-[#4c566a] max-w-[200px] truncate" title={a.exp}>
                    {a.exp}
                  </td>
                  <td className="py-2 px-3 text-[#4c566a] max-w-[200px] truncate" title={a.app}>
                    {a.app}
                  </td>
                  <td className="py-2 px-3 text-[#4c566a] text-[11px]">
                    <div className="font-bold text-[#2e3440]">{a.submitterName || '-'}</div>
                    <div className="text-[10px] text-[#7b889b]">
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
        <div className="mt-2.5 pt-2.5 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
          <span className="text-[11px] font-black text-[#7b889b] uppercase tracking-wider shrink-0">
            สัดส่วนแผนก:
          </span>
          <div className="flex items-center gap-2 flex-nowrap">
            {deptStats.map(([dept, count]) => (
              <span
                key={dept}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 neu-card-sm rounded-xl text-[11px] font-semibold text-[#3b4252] shrink-0"
              >
                <span>{dept}:</span>
                <span className="font-bold text-[#5e81ac]">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
