import React, { useState, useMemo } from 'react';
import { TrainingEvent, AttendeeRow, HolidayItem, Language } from '../types';
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
import { BatchCourseUploadModal } from './BatchCourseUploadModal';
import { translations } from '../utils/translations';
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
  FileSpreadsheet,
  X,
} from 'lucide-react';

interface AdminDashboardProps {
  events: TrainingEvent[];
  holidays: HolidayItem[];
  attendees: AttendeeWithMeta[];
  onOpenNewEventModal: () => void;
  onEditEvent: (event: TrainingEvent) => void;
  onRefresh: () => void;
  lang?: Language;
  onOpenBatchCourseModal?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  events,
  holidays,
  attendees,
  onOpenNewEventModal,
  onEditEvent,
  onRefresh,
  lang = 'th',
  onOpenBatchCourseModal,
}) => {
  const t = translations[lang] || translations.th;

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'registrations' | 'courses' | 'holidays'>('registrations');

  // Course selection for registrations tab
  const onlyCourses = useMemo(() => events.filter((e) => e.isEvent), [events]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
    return onlyCourses[0]?.id || 'EVT-1001';
  });

  // Course search query in registrations tab
  const [courseSearchQuery, setCourseSearchQuery] = useState('');

  const filteredCoursesForRegistration = useMemo(() => {
    if (!courseSearchQuery.trim()) return onlyCourses;
    const q = courseSearchQuery.toLowerCase().trim();
    return onlyCourses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.start && c.start.toLowerCase().includes(q)) ||
        (c.status && c.status.toLowerCase().includes(q)) ||
        (c.location && c.location.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.id && c.id.toLowerCase().includes(q))
    );
  }, [onlyCourses, courseSearchQuery]);

  // Course search query and filters in courses management tab
  const [courseTabSearchQuery, setCourseTabSearchQuery] = useState('');
  const [courseTabCategoryFilter, setCourseTabCategoryFilter] = useState('all');
  const [courseTabStatusFilter, setCourseTabStatusFilter] = useState('all');

  const filteredCoursesTab = useMemo(() => {
    let result = onlyCourses;

    // Filter by Category
    if (courseTabCategoryFilter !== 'all') {
      result = result.filter((c) => c.category === courseTabCategoryFilter);
    }

    // Filter by Status
    if (courseTabStatusFilter !== 'all') {
      result = result.filter((c) => c.status === courseTabStatusFilter);
    }

    // Filter by Search Query
    if (courseTabSearchQuery.trim()) {
      const q = courseTabSearchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          (c.start && c.start.toLowerCase().includes(q)) ||
          (c.status && c.status.toLowerCase().includes(q)) ||
          (c.location && c.location.toLowerCase().includes(q)) ||
          (c.description && c.description.toLowerCase().includes(q)) ||
          (c.id && c.id.toLowerCase().includes(q))
      );
    }

    return result;
  }, [onlyCourses, courseTabSearchQuery, courseTabCategoryFilter, courseTabStatusFilter]);

  // Selected course object
  const activeCourse = useMemo(() => {
    return onlyCourses.find((c) => c.id === selectedCourseId) || onlyCourses[0] || null;
  }, [onlyCourses, selectedCourseId]);

  // Auto-select first matching course when search filters the list
  React.useEffect(() => {
    if (courseSearchQuery.trim() && filteredCoursesForRegistration.length > 0) {
      const match = filteredCoursesForRegistration.some((c) => c.id === selectedCourseId);
      if (!match) {
        setSelectedCourseId(filteredCoursesForRegistration[0].id);
        setSelectedAttendeeIds(new Set());
      }
    }
  }, [filteredCoursesForRegistration, courseSearchQuery, selectedCourseId]);

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
        (a.expectation && a.expectation.toLowerCase().includes(q)) ||
        (a.application && a.application.toLowerCase().includes(q)) ||
        (a.remark && a.remark.toLowerCase().includes(q)) ||
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

  // Batch course upload modal state
  const [isBatchUploadModalOpen, setIsBatchUploadModalOpen] = useState(false);

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
    expectation: '',
    application: '',
    remark: '',
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
          expectation: attendeeForm.expectation.trim(),
          application: attendeeForm.application.trim(),
          remark: attendeeForm.remark.trim(),
          exp: attendeeForm.expectation.trim(),
          app: attendeeForm.application.trim(),
          rem: attendeeForm.remark.trim(),
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
              expectation: attendeeForm.expectation.trim(),
              application: attendeeForm.application.trim(),
              remark: attendeeForm.remark.trim(),
              exp: attendeeForm.expectation.trim(),
              app: attendeeForm.application.trim(),
              rem: attendeeForm.remark.trim(),
            },
          ],
          {
            name: attendeeForm.submitterName.trim(),
            dept: attendeeForm.submitterDept.trim(),
            phone: attendeeForm.submitterPhone.trim(),
          }
        );
        setStatusMessage({ text: 'เพิ่มผู้เข้าอบรมในหลักสูตรสำเร็จ', type: 'success' });
      }
      setIsAttendeeModalOpen(false);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', type: 'error' });
    }
  };

  // Holiday handlers
  const handleSaveHoliday = async (data: Partial<HolidayItem> & { date: string; name: string }) => {
    await saveHolidayToFirestore(data);
    setStatusMessage({
      text: `บันทึกวันหยุด "${data.name}" เรียบร้อยแล้ว (อัปเดตลงปฏิทินทันที)`,
      type: 'success',
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDeleteHoliday = async (id: string, name: string) => {
    if (!window.confirm(`ลบวันหยุด "${name}" หรือไม่?`)) return;
    await deleteHolidayFromFirestore(id);
    setStatusMessage({ text: `ลบวันหยุด "${name}" เรียบร้อยแล้ว`, type: 'success' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDeleteCourse = async (courseId: string, title: string) => {
    if (
      !window.confirm(
        `คุณแน่ใจหรือไม่ว่าต้องการลบหลักสูตร "${title}"? ข้อมูลจะถูกลบออกจาก Firebase ทันที`
      )
    ) {
      return;
    }
    try {
      await deleteEventFromFirestore(courseId);
      setStatusMessage({ text: `ลบหลักสูตร "${title}" สำเร็จ`, type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'เกิดข้อผิดพลาดในการลบหลักสูตร', type: 'error' });
    }
  };

  // Filtered holidays
  const filteredHolidays = useMemo(() => {
    if (!holidaySearchQuery.trim()) return holidays;
    const q = holidaySearchQuery.toLowerCase();
    return holidays.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.date.includes(q) ||
        (h.category && h.category.toLowerCase().includes(q))
    );
  }, [holidays, holidaySearchQuery]);

  return (
    <div className="flex-1 h-full neu-card rounded-2xl p-3 sm:p-4 md:p-5 flex flex-col min-w-0 overflow-hidden bg-white/70">
      {/* Top Header & Sync Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-slate-200/80 gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1e3a8a] to-[#0f172a] text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-5 h-5 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {t.adminCenterTitle}
              </h2>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Firebase Live</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {t.adminCenterDesc}
            </p>
          </div>
        </div>

        {/* Real-time stats badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
          <div className="neu-inset-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5 bg-blue-50/50">
            <BookOpen className="w-3.5 h-3.5 text-[#1e3a8a]" />
            <span className="text-slate-600">{t.tabCourses}:</span>
            <span className="text-[#1e3a8a] font-extrabold">{onlyCourses.length}</span>
          </div>

          <div className="neu-inset-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5 bg-emerald-50/50">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-600">{t.tabRegistrations}:</span>
            <span className="text-emerald-700 font-extrabold">{attendees.length}</span>
          </div>

          <div className="neu-inset-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5 bg-rose-50/50">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            <span className="text-slate-600">{t.tabHolidays}:</span>
            <span className="text-rose-700 font-extrabold">{holidays.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center justify-between py-2 sm:py-3 shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('registrations')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'registrations'
                ? 'bg-[#1e3a8a] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t.tabRegistrations} ({attendees.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'courses'
                ? 'bg-[#1e3a8a] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{t.tabCourses} ({onlyCourses.length})</span>
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
            <span>{t.tabHolidays} ({holidays.length})</span>
          </button>
        </div>

        {/* Global Tab Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'courses' && (
            <>
              <button
                onClick={onOpenNewEventModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1e3a8a] to-[#172554] hover:shadow-xs cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{t.createNewCourseBtn}</span>
              </button>

              <button
                onClick={() => {
                  if (onOpenBatchCourseModal) onOpenBatchCourseModal();
                  else setIsBatchUploadModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 hover:shadow-xs cursor-pointer transition-all"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>{t.batchUploadCourseBtn}</span>
              </button>
            </>
          )}

          <button
            onClick={onRefresh}
            title={lang === 'th' ? 'รีเฟรชข้อมูล' : 'Refresh'}
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
            <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
              {/* Course Search Box */}
              <div className="relative w-full sm:w-56 md:w-64 shrink-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={lang === 'th' ? 'ค้นหาหลักสูตร...' : 'Search course...'}
                  value={courseSearchQuery}
                  onChange={(e) => setCourseSearchQuery(e.target.value)}
                  className="w-full pl-8.5 pr-8 py-2 text-xs font-medium bg-white border border-slate-300 rounded-xl focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]/20 outline-none"
                />
                {courseSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCourseSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    title={lang === 'th' ? 'ล้างการค้นหา' : 'Clear search'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Course Selector Dropdown */}
              <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-lg">
                <label className="text-xs font-bold text-slate-700 whitespace-nowrap">{t.selectCourseLabel}</label>
                <div className="relative flex-1">
                  <select
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value);
                      setSelectedAttendeeIds(new Set());
                    }}
                    className="w-full pl-3 pr-8 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]/20 outline-none appearance-none cursor-pointer truncate"
                  >
                    {filteredCoursesForRegistration.length === 0 ? (
                      <option value="" disabled>
                        {lang === 'th' ? 'ไม่พบหลักสูตรที่ตรงกับคำค้น' : 'No matching course'}
                      </option>
                    ) : (
                      filteredCoursesForRegistration.map((c) => {
                        const count = attendees.filter(
                          (a) => a.courseId === c.id || (c.formSheet && a.formSheet === c.formSheet)
                        ).length;
                        return (
                          <option key={c.id} value={c.id}>
                            {c.title} ({c.start}) — {count} {t.personsCountSuffix} [{c.status}]
                          </option>
                        );
                      })
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
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
                    {t.courseStatusBadge} {activeCourse.status}
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
                    {activeCourse.status === 'เปิด' ? t.toggleStatusToClose : t.toggleStatusToOpen}
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
                    expectation: '',
                    application: '',
                    remark: '',
                    submitterName: 'Admin',
                    submitterDept: 'HR / Training',
                    submitterPhone: '-',
                  });
                  setIsAttendeeModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-xs cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addAttendeeManualBtn}</span>
              </button>

              <button
                onClick={handleExportExcel}
                disabled={courseAttendees.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#1e3a8a] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl cursor-pointer transition-all disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.exportExcelBtn}</span>
              </button>

              {selectedAttendeeIds.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.deleteSelectedBtn} ({selectedAttendeeIds.size})</span>
                </button>
              )}

              <button
                onClick={handleClearCourseAttendees}
                disabled={courseAttendees.length === 0 || isDeleting}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer disabled:opacity-40"
                title="ล้างข้อมูลผู้ลงทะเบียนทั้งหมดของหลักสูตรนี้"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.clearAllCourseAttendeesBtn}</span>
              </button>
            </div>
          </div>

          {/* Search Filter for Attendees */}
          <div className="flex items-center justify-between gap-3 mb-2 shrink-0">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={t.searchAttendeePlaceholder}
                value={attendeeSearchQuery}
                onChange={(e) => setAttendeeSearchQuery(e.target.value)}
                className="w-full pl-8.5 pr-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg outline-none focus:border-[#1e3a8a]"
              />
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              {t.showingAttendeesCount} {filteredCourseAttendees.length} {t.fromTotal} {courseAttendees.length} {t.personsCountSuffix}
            </div>
          </div>

          {/* Attendees Table: Full columns matching image.png exactly */}
          <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
            <table className="w-full text-left border-collapse text-xs min-w-[1100px]">
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
                  <th className="p-2.5 text-center w-10">{t.colIndex}</th>
                  <th className="p-2.5 w-24">{t.colCode}</th>
                  <th className="p-2.5 w-16 text-center">{t.colSex}</th>
                  <th className="p-2.5 min-w-[140px]">{t.colName}</th>
                  <th className="p-2.5 w-28">{t.colDept}</th>
                  <th className="p-2.5 w-28">{t.colPosition}</th>
                  <th className="p-2.5 min-w-[150px]">{t.colExpectation}</th>
                  <th className="p-2.5 min-w-[150px]">{t.colApplication}</th>
                  <th className="p-2.5 min-w-[110px]">{t.colRemark}</th>
                  <th className="p-2.5 min-w-[130px]">{t.submitterSection}</th>
                  <th className="p-2.5 w-20 text-center">{t.courseTableActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCourseAttendees.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-slate-400 font-semibold">
                      {attendeeSearchQuery
                        ? 'ไม่พบข้อมูลที่ตรงกับคำค้นหา'
                        : 'ยังไม่มีผู้ลงทะเบียนในหลักสูตรนี้'}
                    </td>
                  </tr>
                ) : (
                  filteredCourseAttendees.map((att, idx) => {
                    const isSelected = att.id ? selectedAttendeeIds.has(att.id) : false;
                    const expectationVal = att.expectation || att.exp || '-';
                    const applicationVal = att.application || att.app || '-';
                    const remarkVal = att.remark || att.rem || '-';

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
                        <td className="p-2.5 text-slate-600 max-w-[180px] truncate" title={expectationVal}>
                          {expectationVal}
                        </td>
                        <td className="p-2.5 text-slate-600 max-w-[180px] truncate" title={applicationVal}>
                          {applicationVal}
                        </td>
                        <td className="p-2.5 text-slate-500 max-w-[130px] truncate" title={remarkVal}>
                          {remarkVal}
                        </td>
                        <td className="p-2.5 text-slate-600 text-[11px]">
                          <div className="font-semibold text-slate-800">{att.submitterName || '-'}</div>
                          {att.submitterDept && <div className="text-[10px] text-slate-400">{att.submitterDept}</div>}
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
                                  expectation: att.expectation || att.exp || '',
                                  application: att.application || att.app || '',
                                  remark: att.remark || att.rem || '',
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
          {/* Course Search & Filter Bar in Tab 2 */}
          <div className="bg-slate-50 p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 mb-3 shrink-0 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[280px] max-w-xl flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={lang === 'th' ? 'ค้นหาหลักสูตร (ชื่อ, หมวดหมู่, วันที่, สถานที่, วิทยากร)...' : 'Search courses (Title, Category, Date, Location)...'}
                  value={courseTabSearchQuery}
                  onChange={(e) => setCourseTabSearchQuery(e.target.value)}
                  className="w-full pl-8.5 pr-8 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-xl focus:border-[#1e3a8a] outline-none"
                />
                {courseTabSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCourseTabSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    title={lang === 'th' ? 'ล้างการค้นหา' : 'Clear search'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter by Category */}
              <div className="flex items-center gap-1.5 shrink-0">
                <label className="text-xs font-bold text-slate-600 whitespace-nowrap">
                  {lang === 'th' ? 'หมวดหมู่:' : 'Category:'}
                </label>
                <select
                  value={courseTabCategoryFilter}
                  onChange={(e) => setCourseTabCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:border-[#1e3a8a] outline-none text-slate-700 cursor-pointer shadow-2xs"
                >
                  <option value="all">{lang === 'th' ? 'ทั้งหมด' : 'All Categories'}</option>
                  <option value="Soft Skill Training">Soft Skill Training</option>
                  <option value="Technical Skills Training">Technical Skills</option>
                  <option value="HSE and ISO Training">HSE and ISO Training</option>
                  <option value="Orientation">Orientation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Filter by Status */}
              <div className="flex items-center gap-1.5 shrink-0">
                <label className="text-xs font-bold text-slate-600 whitespace-nowrap">
                  {lang === 'th' ? 'สถานะ:' : 'Status:'}
                </label>
                <select
                  value={courseTabStatusFilter}
                  onChange={(e) => setCourseTabStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:border-[#1e3a8a] outline-none text-slate-700 cursor-pointer shadow-2xs"
                >
                  <option value="all">{lang === 'th' ? 'ทั้งหมด' : 'All Status'}</option>
                  <option value="เปิด">{lang === 'th' ? 'เปิด' : 'Open'}</option>
                  <option value="ปิด">{lang === 'th' ? 'ปิด' : 'Closed'}</option>
                  <option value="ไม่ต้องลงทะเบียน">{lang === 'th' ? 'ไม่ต้องลงทะเบียน' : 'No Reg'}</option>
                </select>
              </div>

              {(courseTabCategoryFilter !== 'all' || courseTabStatusFilter !== 'all' || courseTabSearchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setCourseTabCategoryFilter('all');
                    setCourseTabStatusFilter('all');
                    setCourseTabSearchQuery('');
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer whitespace-nowrap px-1"
                >
                  {lang === 'th' ? 'ล้างตัวกรอง' : 'Reset'}
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 font-semibold shrink-0">
              {lang === 'th' ? `แสดง ${filteredCoursesTab.length} จาก ${onlyCourses.length} หลักสูตร` : `Showing ${filteredCoursesTab.length} of ${onlyCourses.length} courses`}
            </div>
          </div>

          <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
            <table className="w-full text-left border-collapse text-xs min-w-[850px]">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider select-none">
                <tr>
                  <th className="p-2.5 w-12 text-center">{t.colIndex}</th>
                  <th className="p-2.5 w-36">หมวดหมู่</th>
                  <th className="p-2.5 min-w-[200px]">ชื่อหลักสูตร</th>
                  <th className="p-2.5 w-32">วันที่จัดอบรม</th>
                  <th className="p-2.5 w-28">เวลา</th>
                  <th className="p-2.5 w-32">สถานที่</th>
                  <th className="p-2.5 w-28 text-center">{t.courseStatusBadge}</th>
                  <th className="p-2.5 w-24 text-center">{t.courseTableActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCoursesTab.map((c, idx) => {
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
      {/* TAB 3: ANNUAL HOLIDAYS MANAGEMENT */}
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
                <p className="text-[11px] text-slate-500">
                  บันทึกตรงสู่ Firebase Firestore และแสดงผลบนปฏิทินแบบเรียลไทม์
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="ค้นหาวันหยุด..."
                  value={holidaySearchQuery}
                  onChange={(e) => setHolidaySearchQuery(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg outline-none focus:border-rose-500"
                />
              </div>

              <button
                onClick={() => {
                  setEditingHoliday(null);
                  setIsHolidayModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer whitespace-nowrap transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'th' ? 'เพิ่มวันหยุด' : 'Add Holiday'}</span>
              </button>
            </div>
          </div>

          {/* Holidays Table */}
          <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider select-none">
                <tr>
                  <th className="p-2.5 w-12 text-center">{t.colIndex}</th>
                  <th className="p-2.5 w-32">{t.holidayDateLabel}</th>
                  <th className="p-2.5 min-w-[200px]">{t.holidayNameLabel}</th>
                  <th className="p-2.5 w-40">{t.holidayCategoryLabel}</th>
                  <th className="p-2.5 min-w-[200px]">{t.holidayDescLabel}</th>
                  <th className="p-2.5 w-24 text-center">{t.courseTableActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHolidays.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                      {holidaySearchQuery
                        ? 'ไม่พบวันหยุดที่ตรงกับคำค้นหา'
                        : 'ยังไม่มีข้อมูลวันหยุดประจำปีในระบบ'}
                    </td>
                  </tr>
                ) : (
                  filteredHolidays.map((h, idx) => (
                    <tr key={h.id || h.date} className="hover:bg-rose-50/30 transition-colors">
                      <td className="p-2.5 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-2.5 font-mono font-bold text-rose-700 whitespace-nowrap">
                        {h.date}
                      </td>
                      <td className="p-2.5 font-bold text-slate-900">{h.name}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-block">
                          {h.category || 'วันหยุด'}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-500">{h.description || '-'}</td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingHoliday(h);
                              setIsHolidayModalOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-[#1e3a8a] hover:bg-blue-50 cursor-pointer"
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

      {/* Batch Course Upload Modal */}
      <BatchCourseUploadModal
        isOpen={isBatchUploadModalOpen}
        lang={lang}
        onClose={() => setIsBatchUploadModalOpen(false)}
        onSuccess={() => {
          onRefresh();
          setStatusMessage({
            text: 'นำเข้าและอัปเดตหลักสูตรทั้งหมดสำเร็จเรียบร้อยแล้ว (Firebase Live)',
            type: 'success',
          });
          setTimeout(() => setStatusMessage(null), 3000);
        }}
      />

      {/* Attendee Edit/Add Modal: All fields from image.png */}
      {isAttendeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="rounded-2xl w-full max-w-lg bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingAttendee ? 'แก้ไขข้อมูลผู้เข้าอบรม' : 'เพิ่มผู้เข้าอบรมในหลักสูตร'}
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">
                  {activeCourse?.title}
                </p>
              </div>
              <button
                onClick={() => setIsAttendeeModalOpen(false)}
                className="text-slate-400 hover:text-rose-500 cursor-pointer p-1"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveAttendee} className="p-4 space-y-3 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 9579"
                    value={attendeeForm.code}
                    onChange={(e) => setAttendeeForm({ ...attendeeForm, code: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-[#1e3a8a]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Sex <span className="text-rose-500">*</span>
                  </label>
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
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    แผนก <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ENG / PTE"
                    value={attendeeForm.dept}
                    onChange={(e) => setAttendeeForm({ ...attendeeForm, dept: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-[#1e3a8a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Name (ชื่อ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={attendeeForm.fname}
                    onChange={(e) => setAttendeeForm({ ...attendeeForm, fname: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-[#1e3a8a]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Last Name (นามสกุล) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={attendeeForm.lname}
                    onChange={(e) => setAttendeeForm({ ...attendeeForm, lname: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-[#1e3a8a]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Position (ตำแหน่ง)
                </label>
                <input
                  type="text"
                  placeholder="เช่น Chief Technician"
                  value={attendeeForm.pos}
                  onChange={(e) => setAttendeeForm({ ...attendeeForm, pos: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-[#1e3a8a]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Expectation (ความคาดหวัง)
                </label>
                <textarea
                  rows={2}
                  placeholder="ความคาดหวังในการเข้ารับการอบรม..."
                  value={attendeeForm.expectation}
                  onChange={(e) => setAttendeeForm({ ...attendeeForm, expectation: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-[#1e3a8a]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Application (การปรับใช้)
                </label>
                <textarea
                  rows={2}
                  placeholder="แนวทางการนำความรู้ไปปรับใช้กับงานจริง..."
                  value={attendeeForm.application}
                  onChange={(e) => setAttendeeForm({ ...attendeeForm, application: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-[#1e3a8a]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Remark (เพิ่มเติม)
                </label>
                <input
                  type="text"
                  placeholder="หมายเหตุเพิ่มเติม หรือข้อจำกัด..."
                  value={attendeeForm.remark}
                  onChange={(e) => setAttendeeForm({ ...attendeeForm, remark: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-[#1e3a8a]"
                />
              </div>

              {/* Submitter info */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  ข้อมูลผู้ส่ง / ประสานงาน
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-bold text-slate-600 block mb-0.5 text-[10px]">ชื่อผู้ส่ง</label>
                    <input
                      type="text"
                      value={attendeeForm.submitterName}
                      onChange={(e) => setAttendeeForm({ ...attendeeForm, submitterName: e.target.value })}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-0.5 text-[10px]">แผนกผู้ส่ง</label>
                    <input
                      type="text"
                      value={attendeeForm.submitterDept}
                      onChange={(e) => setAttendeeForm({ ...attendeeForm, submitterDept: e.target.value })}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-0.5 text-[10px]">เบอร์ติดต่อ</label>
                    <input
                      type="text"
                      value={attendeeForm.submitterPhone}
                      onChange={(e) => setAttendeeForm({ ...attendeeForm, submitterPhone: e.target.value })}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAttendeeModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 rounded-lg bg-[#1e3a8a] text-white font-bold hover:bg-[#172554] transition-colors"
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
