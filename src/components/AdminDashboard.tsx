import React, { useState, useMemo } from 'react';
import { TrainingEvent, AttendeeRow, HolidayItem } from '../types';
import {
  AttendeeWithMeta,
  saveEventToFirestore,
  deleteEventFromFirestore,
  saveHolidayToFirestore,
  deleteHolidayFromFirestore,
  addAttendeesToFirestore,
  updateAttendeeInFirestore,
  deleteAttendeesFromFirestore,
  clearCourseAttendeesFromFirestore,
} from '../services/firebaseService';
import { exportAttendeesToExcel } from '../utils/excelHelper';
import { HolidayFormModal } from './HolidayFormModal';
import {
  Users,
  Download,
  Trash2,
  RefreshCw,
  Search,
  Plus,
  Edit2,
  Calendar,
  CheckCircle2,
  XCircle,
  Sparkles,
  BookOpen,
  Filter,
  CheckSquare,
  Square,
  ShieldCheck,
  Zap,
  Phone,
  Building,
  UserCheck,
  ChevronDown,
} from 'lucide-react';

interface AdminDashboardProps {
  events: TrainingEvent[];
  holidays: HolidayItem[];
  attendees: AttendeeWithMeta[];
  onOpenNewEventModal: () => void;
  onEditEvent: (event: TrainingEvent) => void;
  onRefresh: () => void;
  initialTab?: 'registrations' | 'courses' | 'holidays';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  events,
  holidays,
  attendees,
  onOpenNewEventModal,
  onEditEvent,
  onRefresh,
  initialTab = 'registrations',
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'registrations' | 'courses' | 'holidays'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Course selection for registrations tab
  const onlyCourses = useMemo(() => events.filter((e) => e.isEvent), [events]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
    return onlyCourses[0]?.id || 'EVT-1001';
  });

  // Selected course object
  const activeCourse = useMemo(() => {
    return onlyCourses.find((c) => c.id === selectedCourseId) || onlyCourses[0] || null;
  }, [onlyCourses, selectedCourseId]);

  // Attendees filtered by selected course
  const courseAttendees = useMemo(() => {
    if (!activeCourse) return [];
    return attendees.filter(
      (a) => a.courseId === activeCourse.id || (activeCourse.formSheet && a.formSheet === activeCourse.formSheet)
    );
  }, [attendees, activeCourse]);

  // Search query in attendees
  const [attendeeSearchQuery, setAttendeeSearchQuery] = useState('');
  const filteredCourseAttendees = useMemo(() => {
    if (!attendeeSearchQuery.trim()) return courseAttendees;
    const q = attendeeSearchQuery.toLowerCase().trim();
    return courseAttendees.filter(
      (a) =>
        a.fname.toLowerCase().includes(q) ||
        a.lname.toLowerCase().includes(q) ||
        (a.code && a.code.toLowerCase().includes(q)) ||
        (a.dept && a.dept.toLowerCase().includes(q)) ||
        (a.pos && a.pos.toLowerCase().includes(q)) ||
        (a.submitterName && a.submitterName.toLowerCase().includes(q))
    );
  }, [courseAttendees, attendeeSearchQuery]);

  // Selection for batch operations
  const [selectedAttendeeIds, setSelectedAttendeeIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Status message alert
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Holiday management state
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<HolidayItem | null>(null);
  const [holidaySearchQuery, setHolidaySearchQuery] = useState('');

  // Attendee edit/add modal state
  const [isAttendeeModalOpen, setIsAttendeeModalOpen] = useState(false);
  const [editingAttendee, setEditingAttendee] = useState<AttendeeWithMeta | null>(null);
  const [attendeeForm, setAttendeeForm] = useState({
    code: '',
    sex: 'Mr.',
    fname: '',
    lname: '',
    dept: '',
    pos: '',
    exp: '',
    app: '',
    rem: '',
    submitterName: 'Admin',
    submitterDept: 'HR / Training',
    submitterPhone: '-',
  });

  // Toggle attendee selection
  const toggleSelectAttendee = (id: string) => {
    setSelectedAttendeeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllAttendees = () => {
    if (selectedAttendeeIds.size === filteredCourseAttendees.length) {
      setSelectedAttendeeIds(new Set());
    } else {
      setSelectedAttendeeIds(new Set(filteredCourseAttendees.map((a) => a.id || '')));
    }
  };

  // Quick toggle course status
  const handleToggleCourseStatus = async (course: TrainingEvent, newStatus: string) => {
    try {
      await saveEventToFirestore({
        ...course,
        status: newStatus,
      });
      setStatusMessage({
        text: `อัปเดตสถานะหลักสูตร "${course.title}" เป็น "${newStatus}" สำเร็จ`,
        type: 'success',
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'ไม่สามารถเปลี่ยนสถานะได้ กรุณาลองใหม่', type: 'error' });
    }
  };

  // Batch delete selected attendees
  const handleDeleteSelected = async () => {
    if (selectedAttendeeIds.size === 0) return;
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ลงทะเบียนที่เลือกจำนวน ${selectedAttendeeIds.size} รายการ?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteAttendeesFromFirestore(Array.from(selectedAttendeeIds));
      setSelectedAttendeeIds(new Set());
      setStatusMessage({
        text: `ลบรายชื่อผู้ลงทะเบียนสำเร็จ ${res.count} รายการ เรียลไทม์บน Firebase`,
        type: 'success',
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'เกิดข้อผิดพลาดในการลบข้อมูล', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Clear all attendees for course
  const handleClearCourseAttendees = async () => {
    if (!activeCourse) return;
    if (
      !window.confirm(
        `คำเตือน: คุณต้องการล้างข้อมูลผู้ลงทะเบียนทั้งหมดในหลักสูตร "${activeCourse.title}" หรือไม่? (ไม่สามารถย้อนกลับได้)`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await clearCourseAttendeesFromFirestore(activeCourse.id);
      setSelectedAttendeeIds(new Set());
      setStatusMessage({
        text: `ล้างข้อมูลผู้ลงทะเบียนใน "${activeCourse.title}" เรียบร้อยแล้ว (${res.count} รายการ)`,
        type: 'success',
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'เกิดข้อผิดพลาดในการล้างข้อมูล', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Export course attendees to Excel
  const handleExportExcel = () => {
    if (!activeCourse) return;
    exportAttendeesToExcel(courseAttendees, activeCourse.title, activeCourse.start);
  };

  // Save attendee (Add or Update)
  const handleSaveAttendee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourse) return;
    if (!attendeeForm.fname.trim() || !attendeeForm.lname.trim()) {
      alert('กรุณากรอกชื่อและนามสกุล');
      return;
    }

    try {
      if (editingAttendee && editingAttendee.id) {
        await updateAttendeeInFirestore(editingAttendee.id, {
          code: attendeeForm.code.trim(),
          sex: attendeeForm.sex as any,
          fname: attendeeForm.fname.trim(),
          lname: attendeeForm.lname.trim(),
          dept: attendeeForm.dept.trim(),
          pos: attendeeForm.pos.trim(),
          exp: attendeeForm.exp.trim(),
          app: attendeeForm.app.trim(),
          rem: attendeeForm.rem.trim(),
          submitterName: attendeeForm.submitterName.trim(),
          submitterDept: attendeeForm.submitterDept.trim(),
          submitterPhone: attendeeForm.submitterPhone.trim(),
        });
        setStatusMessage({ text: 'แก้ไขข้อมูลผู้ลงทะเบียนสำเร็จ', type: 'success' });
      } else {
        await addAttendeesToFirestore(
          activeCourse,
          [
            {
              code: attendeeForm.code.trim(),
              sex: attendeeForm.sex as any,
              fname: attendeeForm.fname.trim(),
              lname: attendeeForm.lname.trim(),
              dept: attendeeForm.dept.trim(),
              pos: attendeeForm.pos.trim(),
              exp: attendeeForm.exp.trim(),
              app: attendeeForm.app.trim(),
              rem: attendeeForm.rem.trim(),
            },
          ],
          {
            name: attendeeForm.submitterName.trim(),
            dept: attendeeForm.submitterDept.trim(),
            phone: attendeeForm.submitterPhone.trim(),
          }
        );
        setStatusMessage({ text: 'เพิ่มผู้ลงทะเบียนใหม่สำเร็จ', type: 'success' });
      }
      setIsAttendeeModalOpen(false);
      setEditingAttendee(null);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่');
    }
  };

  // Save Holiday (Add or Update)
  const handleSaveHoliday = async (data: Partial<HolidayItem> & { date: string; name: string }) => {
    await saveHolidayToFirestore(data);
    setStatusMessage({
      text: `บันทึกข้อมูลวันหยุด "${data.name}" เรียบร้อยแล้ว (อัปเดตบนปฏิทินทันที)`,
      type: 'success',
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Delete Holiday
  const handleDeleteHoliday = async (id: string, name: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบวันหยุด "${name}" ออกจากระบบ?`)) return;
    try {
      await deleteHolidayFromFirestore(id);
      setStatusMessage({ text: `ลบวันหยุด "${name}" เรียบร้อยแล้ว`, type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'เกิดข้อผิดพลาดในการลบวันหยุด', type: 'error' });
    }
  };

  // Delete Course
  const handleDeleteCourse = async (courseId: string, title: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบหลักสูตร "${title}" ออกจากระบบ?`)) return;
    try {
      await deleteEventFromFirestore(courseId);
      setStatusMessage({ text: `ลบหลักสูตร "${title}" เรียบร้อยแล้ว`, type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'เกิดข้อผิดพลาดในการลบหลักสูตร', type: 'error' });
    }
  };

  // Filter holidays
  const filteredHolidays = useMemo(() => {
    if (!holidaySearchQuery.trim()) return holidays;
    const q = holidaySearchQuery.toLowerCase().trim();
    return holidays.filter(
      (h) => h.name.toLowerCase().includes(q) || h.date.includes(q) || (h.category && h.category.toLowerCase().includes(q))
    );
  }, [holidays, holidaySearchQuery]);

  return (
    <div className="flex-1 h-full neu-card rounded-2xl p-3 sm:p-4 md:p-6 flex flex-col min-w-0 overflow-hidden">
      {/* Top Banner: Firebase Real-time Cloud Indicator & Global Stats */}
      <div className="bg-gradient-to-r from-slate-900 via-[#1e3a8a] to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md mb-4 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Zap className="w-5 h-5 fill-amber-400 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight">ระบบจัดการส่วนกลาง (Admin Center)</h2>
              <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Firebase Live Sync ⚡
              </span>
            </div>
            <p className="text-xs text-blue-100/80 font-medium mt-0.5">
              ฐานข้อมูลคลาวด์ Firebase Firestore อัปเดตข้อมูลตรงกันแบบเรียลไทม์ทุกอุปกรณ์
            </p>
          </div>
        </div>

        {/* Quick Stats Pill Counters */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10 text-center">
            <span className="text-[10px] uppercase font-bold text-blue-200 block">หลักสูตร</span>
            <span className="text-sm font-black text-white">{onlyCourses.length}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-200 block">เปิดรับสมัคร</span>
            <span className="text-sm font-black text-emerald-300">
              {onlyCourses.filter((c) => c.status === 'เปิด').length}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-200 block">ผู้ลงทะเบียน</span>
            <span className="text-sm font-black text-amber-300">{attendees.length} ท่าน</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10 text-center">
            <span className="text-[10px] uppercase font-bold text-rose-200 block">วันหยุดประจำปี</span>
            <span className="text-sm font-black text-rose-300">{holidays.length} วัน</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4 shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('registrations')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'registrations'
                ? 'bg-[#1e3a8a] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>จัดการการลงทะเบียนหลักสูตร ({attendees.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'courses'
                ? 'bg-[#1e3a8a] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>จัดการหลักสูตรฝึกอบรม ({onlyCourses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('holidays')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'holidays'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>จัดการวันหยุดประจำปี ({holidays.length})</span>
          </button>
        </div>

        {/* Global Tab Actions */}
        <div className="flex items-center gap-2">
          {activeTab === 'courses' && (
            <button
              onClick={onOpenNewEventModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1e3a8a] to-[#172554] hover:shadow-xs cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>สร้างหลักสูตรใหม่</span>
            </button>
          )}

          {activeTab === 'holidays' && (
            <button
              onClick={() => {
                setEditingHoliday(null);
                setIsHolidayModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:shadow-xs cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มข้อมูลวันหยุดประจำปี</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            title="รีเฟรชข้อมูล"
            className="p-2 rounded-xl text-slate-500 hover:text-[#1e3a8a] hover:bg-slate-100 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alert Status Banner */}
      {statusMessage && (
        <div
          className={`p-3 mb-3 rounded-xl text-xs font-bold flex items-center justify-between shrink-0 shadow-xs ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-700">
            ×
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: REGISTRATIONS MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === 'registrations' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Course Selector & Controls */}
          <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200/80 mb-3 shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">เลือกหลักสูตร:</label>
              <div className="relative flex-1 max-w-md">
                <select
                  value={selectedCourseId}
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value);
                    setSelectedAttendeeIds(new Set());
                  }}
                  className="w-full pl-3 pr-8 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]/20 outline-none appearance-none cursor-pointer truncate"
                >
                  {onlyCourses.map((c) => {
                    const count = attendees.filter(
                      (a) => a.courseId === c.id || (c.formSheet && a.formSheet === c.formSheet)
                    ).length;
                    return (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.start}) — ลงทะเบียนแล้ว {count} ท่าน [{c.status}]
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {activeCourse && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border ${
                      activeCourse.status === 'เปิด'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : activeCourse.status === 'ปิด'
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}
                  >
                    สถานะ: {activeCourse.status}
                  </span>
                  <button
                    onClick={() =>
                      handleToggleCourseStatus(
                        activeCourse,
                        activeCourse.status === 'เปิด' ? 'ปิด' : 'เปิด'
                      )
                    }
                    className="text-[11px] font-bold text-[#1e3a8a] hover:underline cursor-pointer px-2 py-1 bg-white rounded-lg border border-slate-200"
                  >
                    {activeCourse.status === 'เปิด' ? 'คลิกเพื่อปิดรับ' : 'คลิกเพื่อเปิดรับ'}
                  </button>
                </div>
              )}
            </div>

            {/* Course Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setEditingAttendee(null);
                  setAttendeeForm({
                    code: '',
                    sex: 'Mr.',
                    fname: '',
                    lname: '',
                    dept: '',
                    pos: '',
                    exp: '',
                    app: '',
                    rem: '',
                    submitterName: 'Admin',
                    submitterDept: 'HR / Training',
                    submitterPhone: '-',
                  });
                  setIsAttendeeModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-xs cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มผู้เข้าอบรม</span>
              </button>

              <button
                onClick={handleExportExcel}
                disabled={courseAttendees.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#1e3a8a] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl cursor-pointer transition-all disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ส่งออก Excel</span>
              </button>

              {selectedAttendeeIds.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบที่เลือก ({selectedAttendeeIds.size})</span>
                </button>
              )}

              <button
                onClick={handleClearCourseAttendees}
                disabled={courseAttendees.length === 0 || isDeleting}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer disabled:opacity-40"
                title="ล้างข้อมูลผู้ลงทะเบียนทั้งหมดของหลักสูตรนี้"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ล้างทั้งหมด</span>
              </button>
            </div>
          </div>

          {/* Search Filter for Attendees */}
          <div className="flex items-center justify-between gap-3 mb-2 shrink-0">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, รหัสพนักงาน, แผนก..."
                value={attendeeSearchQuery}
                onChange={(e) => setAttendeeSearchQuery(e.target.value)}
                className="w-full pl-8.5 pr-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg outline-none focus:border-[#1e3a8a]"
              />
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              แสดง {filteredCourseAttendees.length} จาก {courseAttendees.length} ท่าน
            </div>
          </div>

          {/* Attendees Table */}
          <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider select-none">
                <tr>
                  <th className="p-2.5 text-center w-10">
                    <button
                      type="button"
                      onClick={toggleSelectAllAttendees}
                      className="cursor-pointer text-slate-500 hover:text-[#1e3a8a]"
                    >
                      {selectedAttendeeIds.size > 0 &&
                      selectedAttendeeIds.size === filteredCourseAttendees.length ? (
                        <CheckSquare className="w-4 h-4 text-[#1e3a8a]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-2.5 text-center w-12">ลำดับ</th>
                  <th className="p-2.5 w-24">รหัสพนักงาน</th>
                  <th className="p-2.5 w-16 text-center">คำนำหน้า</th>
                  <th className="p-2.5 min-w-[140px]">ชื่อ - นามสกุล</th>
                  <th className="p-2.5 w-28">แผนก / ฝ่าย</th>
                  <th className="p-2.5 w-28">ตำแหน่ง</th>
                  <th className="p-2.5 w-20">เบอร์ต่อ/อายุงาน</th>
                  <th className="p-2.5 w-24">ผู้อนุมัติ</th>
                  <th className="p-2.5 min-w-[120px]">ผู้ส่งข้อมูล</th>
                  <th className="p-2.5 w-20 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCourseAttendees.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400 font-semibold">
                      {attendeeSearchQuery
                        ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหา'
                        : 'ยังไม่มีผู้ลงทะเบียนในหลักสูตรนี้'}
                    </td>
                  </tr>
                ) : (
                  filteredCourseAttendees.map((att, idx) => {
                    const isSelected = att.id ? selectedAttendeeIds.has(att.id) : false;
                    return (
                      <tr
                        key={att.id || `idx-${idx}`}
                        className={`hover:bg-blue-50/40 transition-colors ${
                          isSelected ? 'bg-blue-50/70 font-semibold' : ''
                        }`}
                      >
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => att.id && toggleSelectAttendee(att.id)}
                            className="cursor-pointer text-slate-400 hover:text-[#1e3a8a]"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#1e3a8a]" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="p-2.5 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-2.5 font-mono font-bold text-[#1e3a8a]">{att.code || '-'}</td>
                        <td className="p-2.5 text-center font-medium text-slate-600">{att.sex || '-'}</td>
                        <td className="p-2.5 font-bold text-slate-900">
                          {att.fname} {att.lname}
                        </td>
                        <td className="p-2.5 font-medium text-slate-700">{att.dept || '-'}</td>
                        <td className="p-2.5 font-medium text-slate-600">{att.pos || '-'}</td>
                        <td className="p-2.5 text-slate-500">{att.exp || '-'}</td>
                        <td className="p-2.5 text-slate-500">{att.app || '-'}</td>
                        <td className="p-2.5 text-slate-600 text-[11px]">
                          <div>{att.submitterName || '-'}</div>
                          {att.submitterPhone && att.submitterPhone !== '-' && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" />
                              {att.submitterPhone}
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingAttendee(att);
                                setAttendeeForm({
                                  code: att.code || '',
                                  sex: att.sex || 'Mr.',
                                  fname: att.fname || '',
                                  lname: att.lname || '',
                                  dept: att.dept || '',
                                  pos: att.pos || '',
                                  exp: att.exp || '',
                                  app: att.app || '',
                                  rem: att.rem || '',
                                  submitterName: att.submitterName || 'Admin',
                                  submitterDept: att.submitterDept || 'HR / Training',
                                  submitterPhone: att.submitterPhone || '-',
                                });
                                setIsAttendeeModalOpen(true);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-[#1e3a8a] hover:bg-blue-50 cursor-pointer"
                              title="แก้ไขข้อมูล"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={async () => {
                                if (
                                  att.id &&
                                  window.confirm(`ลบรายชื่อคุณ "${att.fname} ${att.lname}" หรือไม่?`)
                                ) {
                                  await deleteAttendeesFromFirestore([att.id]);
                                  setStatusMessage({ text: 'ลบรายชื่อสำเร็จ', type: 'success' });
                                  setTimeout(() => setStatusMessage(null), 3000);
                                }
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="ลบรายชื่อ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: COURSES MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === 'courses' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider select-none">
                <tr>
                  <th className="p-2.5 w-12 text-center">ลำดับ</th>
                  <th className="p-2.5 w-36">หมวดหมู่</th>
                  <th className="p-2.5 min-w-[200px]">ชื่อหลักสูตร</th>
                  <th className="p-2.5 w-32">วันที่จัดอบรม</th>
                  <th className="p-2.5 w-28">เวลา</th>
                  <th className="p-2.5 w-32">สถานที่</th>
                  <th className="p-2.5 w-24 text-center">ผู้ลงทะเบียน</th>
                  <th className="p-2.5 w-28 text-center">สถานะ</th>
                  <th className="p-2.5 w-24 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {onlyCourses.map((c, idx) => {
                  const regCount = attendees.filter(
                    (a) => a.courseId === c.id || (c.formSheet && a.formSheet === c.formSheet)
                  ).length;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-2.5 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-2.5">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold border border-black/5 inline-block"
                          style={{ backgroundColor: c.color, color: c.textColor || '#0f172a' }}
                        >
                          {c.category}
                        </span>
                      </td>
                      <td className="p-2.5 font-bold text-slate-900">
                        <div>{c.title}</div>
                        {c.description && (
                          <div className="text-[11px] text-slate-500 line-clamp-1 font-normal">
                            {c.description}
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 font-semibold text-slate-700 whitespace-nowrap">
                        {c.start} {c.end && c.end !== c.start ? ` ถึง ${c.end}` : ''}
                      </td>
                      <td className="p-2.5 text-slate-600 whitespace-nowrap">
                        {c.startTime} - {c.endTime}
                      </td>
                      <td className="p-2.5 text-slate-600 truncate max-w-[130px]">{c.location || '-'}</td>
                      <td className="p-2.5 text-center">
                        <span className="font-bold text-[#1e3a8a] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          {regCount} ท่าน
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => {
                            const nextStatus =
                              c.status === 'เปิด' ? 'ปิด' : c.status === 'ปิด' ? 'ไม่ต้องลงทะเบียน' : 'เปิด';
                            handleToggleCourseStatus(c, nextStatus);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer border transition-all ${
                            c.status === 'เปิด'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              : c.status === 'ปิด'
                              ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                              : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                          }`}
                          title="คลิกเพื่อเปลี่ยนสถานะ"
                        >
                          {c.status}
                        </button>
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditEvent(c)}
                            className="p-1 rounded text-slate-400 hover:text-[#1e3a8a] hover:bg-blue-50 cursor-pointer"
                            title="แก้ไขหลักสูตร"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(c.id, c.title)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="ลบหลักสูตร"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ANNUAL HOLIDAYS MANAGEMENT (NEW) */}
      {/* ========================================================= */}
      {activeTab === 'holidays' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Header Action Bar for Holidays */}
          <div className="bg-rose-50/70 p-3 sm:p-4 rounded-2xl border border-rose-200/80 mb-3 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  ฐานข้อมูลวันหยุดประจำปี (Annual Holidays)
                </h3>
                <p className="text-[11px] text-slate-600 font-medium">
                  วันหยุดจะถูกไฮไลท์บนปฏิทินแบบเรียลไทม์ และซิงค์ไปยังผู้ใช้งานทุกคน
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อวันหยุด หรือวันที่..."
                  value={holidaySearchQuery}
                  onChange={(e) => setHolidaySearchQuery(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-1.5 text-xs font-medium bg-white border border-rose-200 rounded-lg outline-none focus:border-rose-500"
                />
              </div>

              <button
                onClick={() => {
                  setEditingHoliday(null);
                  setIsHolidayModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 rounded-xl shadow-xs cursor-pointer transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มวันหยุด</span>
              </button>
            </div>
          </div>

          {/* Holidays Table */}
          <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider select-none">
                <tr>
                  <th className="p-2.5 w-12 text-center">ลำดับ</th>
                  <th className="p-2.5 w-32">วันที่วันหยุด</th>
                  <th className="p-2.5 min-w-[200px]">ชื่อวันหยุด</th>
                  <th className="p-2.5 w-40">ประเภทวันหยุด</th>
                  <th className="p-2.5 min-w-[150px]">คำอธิบาย</th>
                  <th className="p-2.5 w-24 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHolidays.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                      {holidaySearchQuery ? 'ไม่พบวันหยุดที่ค้นหา' : 'ยังไม่มีข้อมูลวันหยุด'}
                    </td>
                  </tr>
                ) : (
                  filteredHolidays.map((h, idx) => (
                    <tr key={h.id || h.date} className="hover:bg-rose-50/30 transition-colors">
                      <td className="p-2.5 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-2.5 font-bold font-mono text-rose-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-rose-500" />
                          <span>{h.date}</span>
                        </div>
                      </td>
                      <td className="p-2.5 font-bold text-slate-900">
                        <span className="text-rose-800">★</span> {h.name}
                      </td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-block">
                          {h.category || 'วันหยุดนักขัตฤกษ์'}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600">{h.description || '-'}</td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingHoliday(h);
                              setIsHolidayModalOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="แก้ไขวันหยุด"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => h.id && handleDeleteHoliday(h.id, h.name)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="ลบวันหยุด"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Holiday Form Modal */}
      <HolidayFormModal
        isOpen={isHolidayModalOpen}
        holiday={editingHoliday}
        onClose={() => {
          setIsHolidayModalOpen(false);
          setEditingHoliday(null);
        }}
        onSave={handleSaveHoliday}
      />

      {/* Mini Attendee Edit/Add Modal */}
      {isAttendeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="rounded-2xl w-full max-w-md bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingAttendee ? 'แก้ไขข้อมูลผู้เข้าอบรม' : 'เพิ่มผู้เข้าอบรมในหลักสูตร'}
              </h3>
              <button
                onClick={() => setIsAttendeeModalOpen(false)}
                className="text-slate-400 hover:text-rose-500"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveAttendee} className="p-4 space-y-3 max-h-[75vh] overflow-y-auto text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">รหัสพนักงาน</label>
                <input
                  type="text"
                  placeholder="เช่น 9579"
                  value={attendeeForm.code}
                  onChange={(e) => setAttendeeForm({ ...attendeeForm, code: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-[#1e3a8a]"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">คำนำหน้า</label>
                  <select
                    value={attendeeForm.sex}
                    onChange={(e) => setAttendeeForm({ ...attendeeForm, sex: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg outline-none"
                  >
                    <option value="Mr.">Mr. (นาย)</option>
                    <option value="Ms.">Ms. (น.ส.)</option>
                    <option value="Mrs.">Mrs. (นาง)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">ชื่อ *</label>
                  <input
                    type="text"
                    required
                    value={attendeeForm.fname}
                    onChange={(e) => setAttendeeForm({ ...attendeeForm, fname: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-[#1e3a8a]"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">นามสกุล *</label>
                <input
                  type="text"
                  required
                  value={attendeeForm.lname}
                  onChange={(e) => setAttendeeForm({ ...attendeeForm, lname: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-[#1e3a8a]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">แผนก</label>
                  <input
                    type="text"
                    placeholder="เช่น ENG / PTE"
                    value={attendeeForm.dept}
                    onChange={(e) => setAttendeeForm({ ...attendeeForm, dept: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-[#1e3a8a]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ตำแหน่ง</label>
                  <input
                    type="text"
                    placeholder="เช่น Sr.Technician"
                    value={attendeeForm.pos}
                    onChange={(e) => setAttendeeForm({ ...attendeeForm, pos: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-[#1e3a8a]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">เบอร์ต่อ / อายุงาน</label>
                  <input
                    type="text"
                    value={attendeeForm.exp}
                    onChange={(e) => setAttendeeForm({ ...attendeeForm, exp: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-[#1e3a8a]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ผู้อนุมัติ</label>
                  <input
                    type="text"
                    value={attendeeForm.app}
                    onChange={(e) => setAttendeeForm({ ...attendeeForm, app: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-[#1e3a8a]"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAttendeeModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#1e3a8a] text-white font-bold"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
