import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TrainingEvent, TrainingCategory, SessionRegistrationData, HolidayItem } from './types';
import {
  subscribeEvents,
  subscribeHolidays,
  subscribeAttendees,
  saveEventToFirestore,
  deleteEventFromFirestore,
  saveHolidayToFirestore,
  AttendeeWithMeta,
} from './services/firebaseService';
import { initAuth, googleSignIn, logoutGoogle } from './services/firebase';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CalendarView } from './components/CalendarView';
import { ListView } from './components/ListView';
import { EventModal } from './components/EventModal';
import { EventFormModal } from './components/EventFormModal';
import { RegisterModal } from './components/RegisterModal';
import { SelectCourseModal } from './components/SelectCourseModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginModal } from './components/AdminLoginModal';
import { HolidayFormModal } from './components/HolidayFormModal';
import { User } from 'firebase/auth';
import { CheckCircle2, X, Filter } from 'lucide-react';

const ALL_CATEGORIES: TrainingCategory[] = [
  'Soft Skill Training',
  'Technical Skills Training',
  'HSE and ISO Training',
  'Orientation',
  'Other',
];

export default function App() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 1));
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'admin'>('calendar');
  const [courses, setCourses] = useState<TrainingEvent[]>([]);
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [attendees, setAttendees] = useState<AttendeeWithMeta[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(ALL_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Authentication & Admin State
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{
    text: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  // Modals
  const [selectedEvent, setSelectedEvent] = useState<TrainingEvent | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<TrainingEvent | null>(null);
  const [initialDateForNewEvent, setInitialDateForNewEvent] = useState<string>('');

  const [registeringEvent, setRegisteringEvent] = useState<TrainingEvent | null>(null);
  const [isSelectCourseModalOpen, setIsSelectCourseModalOpen] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<HolidayItem | null>(null);

  // Session registration tracking for "ดู/แก้ไขข้อมูลที่ลงทะเบียนล่าสุด"
  const [sessionRegData, setSessionRegData] = useState<SessionRegistrationData | null>(() => {
    try {
      const saved = localStorage.getItem('training_session_reg');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  // Real-time Firestore Live Subscriptions for Courses, Holidays, and Attendees
  useEffect(() => {
    setIsSyncing(true);

    // 1. Subscribe to training events
    const unsubEvents = subscribeEvents((loadedCourses) => {
      setCourses(loadedCourses);
      setIsSyncing(false);
    });

    // 2. Subscribe to annual holidays
    const unsubHolidays = subscribeHolidays((loadedHolidays) => {
      setHolidays(loadedHolidays);
    });

    // 3. Subscribe to all attendees
    const unsubAttendees = subscribeAttendees((loadedAttendees) => {
      setAttendees(loadedAttendees);
    });

    // 4. Initialize Firebase Auth state listener
    const unsubAuth = initAuth(
      (authUser) => {
        setUser(authUser);
        setIsAdmin(true);
      },
      () => {
        setUser(null);
      }
    );

    return () => {
      unsubEvents();
      unsubHolidays();
      unsubAttendees();
      unsubAuth();
    };
  }, []);

  // Merge courses with holidays into allCalendarEvents for CalendarView and ListView
  const allCalendarEvents = useMemo<TrainingEvent[]>(() => {
    const holidayEvents: TrainingEvent[] = holidays.map((h) => ({
      id: h.id || `HOL-${h.date}`,
      category: h.category || 'วันหยุดนักขัตฤกษ์',
      title: h.name,
      start: h.date,
      end: h.date,
      startTime: '',
      endTime: '',
      location: '',
      description: h.description || '',
      color: '#FFE4E6',
      textColor: '#E11D48',
      status: 'ไม่ต้องลงทะเบียน',
      isEvent: false,
      isHoliday: true,
    }));

    return [...courses, ...holidayEvents];
  }, [courses, holidays]);

  // Category Toggle
  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // Toggle All Categories when clicking 5/5
  const handleToggleAllCategories = () => {
    if (selectedCategories.length === ALL_CATEGORIES.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(ALL_CATEGORIES);
    }
  };

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Google Sign-In for Admin
  const handleGoogleSignIn = async () => {
    setIsSyncing(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setIsAdmin(true);
        setViewMode('admin');
        setSyncStatus({
          text: 'เข้าสู่ระบบผู้ดูแลระบบด้วย Google สำเร็จ (Firebase Cloud Sync)',
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Google sign-in error', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await logoutGoogle();
    setUser(null);
    setIsAdmin(false);
    setViewMode('calendar');
  };

  // Event Handlers (Add, Edit, Delete courses)
  const handleOpenAddEvent = (dateStr?: string) => {
    setEventToEdit(null);
    setInitialDateForNewEvent(dateStr || '');
    setIsFormModalOpen(true);
  };

  const handleOpenEditEvent = (ev: TrainingEvent) => {
    setEventToEdit(ev);
    setIsFormModalOpen(true);
  };

  const handleSaveEvent = async (
    payload: Partial<TrainingEvent> & { title: string; start: string }
  ) => {
    setIsSyncing(true);
    try {
      await saveEventToFirestore(payload);
      setSyncStatus({
        text: `บันทึกหลักสูตร "${payload.title}" เรียบร้อยแล้ว (ซิงค์สดลง Firebase ทันที)`,
        type: 'success',
      });
      setIsFormModalOpen(false);
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกหลักสูตร');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบหลักสูตรนี้?')) return;
    setIsSyncing(true);
    try {
      await deleteEventFromFirestore(eventId);
      setSyncStatus({ text: 'ลบหลักสูตรเรียบร้อยแล้ว', type: 'success' });
      setSelectedEvent(null);
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการลบหลักสูตร');
    } finally {
      setIsSyncing(false);
    }
  };

  // Holiday Handlers
  const handleSaveHoliday = async (
    data: Partial<HolidayItem> & { date: string; name: string }
  ) => {
    await saveHolidayToFirestore(data);
    setSyncStatus({
      text: `บันทึกวันหยุด "${data.name}" เรียบร้อยแล้ว (อัปเดตบนปฏิทินทันที)`,
      type: 'success',
    });
    setTimeout(() => setSyncStatus(null), 3000);
  };

  // Registration Handlers
  const handleStartRegistration = (course: TrainingEvent) => {
    setRegisteringEvent(course);
  };

  const handleRegistrationSuccess = (data: SessionRegistrationData) => {
    setSessionRegData(data);
    try {
      localStorage.setItem('training_session_reg', JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditLatestSubmission = () => {
    if (!sessionRegData) return;
    const foundCourse = courses.find((e) => e.id === sessionRegData.courseId);
    if (foundCourse) {
      setRegisteringEvent(foundCourse);
    } else {
      setRegisteringEvent({
        id: sessionRegData.courseId,
        category: 'Other',
        title: sessionRegData.courseTitle,
        start: '',
        end: '',
        startTime: '',
        endTime: '',
        location: '',
        description: '',
        color: '#DDEBF7',
        status: 'เปิด',
        formSheet: sessionRegData.formSheet,
        isEvent: true,
      });
    }
  };

  // Open courses for registration
  const openCourses = useMemo(() => {
    return courses.filter((ev) => ev.isEvent && ev.status === 'เปิด');
  }, [courses]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    courses.forEach((ev) => {
      if (ev.isEvent && ev.category) {
        counts[ev.category] = (counts[ev.category] || 0) + 1;
      }
    });
    return counts;
  }, [courses]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#eef2f6] text-slate-800 relative">
      {/* Top Navbar */}
      <Header
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        viewMode={viewMode}
        setViewMode={setViewMode}
        user={user}
        isAdmin={isAdmin}
        isSyncing={isSyncing}
        onSync={() => {
          setIsSyncing(true);
          setTimeout(() => setIsSyncing(false), 500);
        }}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        onExitAdmin={() => {
          setIsAdmin(false);
          setViewMode('calendar');
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
      />

      {/* Sync Status Banner (Only visible to Admin) */}
      {isAdmin && syncStatus && (
        <div className="mx-3 mt-1.5 px-4 py-2 text-xs font-semibold flex items-center justify-between rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 shrink-0 shadow-2xs">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncStatus.text}</span>
            </div>
            <button
              onClick={() => setSyncStatus(null)}
              className="text-emerald-600 hover:text-emerald-900 ml-2 cursor-pointer p-0.5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 w-full p-2 sm:p-2.5 md:p-3 flex flex-col lg:flex-row gap-2 sm:gap-3 min-h-0 overflow-hidden">
        {/* Desktop Sidebar: Width reduced by 10% (lg:w-64 xl:w-72) */}
        <div className="hidden lg:block h-full shrink-0">
          <Sidebar
            selectedCategories={selectedCategories}
            onToggleCategory={toggleCategory}
            onToggleAllCategories={handleToggleAllCategories}
            categoryCounts={categoryCounts}
            openCoursesCount={openCourses.length}
            onOpenRegisterModal={() => setIsSelectCourseModalOpen(true)}
            hasLatestSubmission={Boolean(sessionRegData)}
            onEditLatestSubmission={handleEditLatestSubmission}
            isAdmin={isAdmin}
            onOpenAdminManage={() => setViewMode('admin')}
            onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
            onExitAdmin={() => {
              setIsAdmin(false);
              setViewMode('calendar');
            }}
            onOpenAddHoliday={() => {
              setEditingHoliday(null);
              setIsHolidayModalOpen(true);
            }}
          />
        </div>

        {/* Mobile Sidebar Slide-Over Drawer */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative w-72 max-w-[85vw] h-full bg-[#eef2f6] p-3 flex flex-col z-10 shadow-2xl overflow-y-auto">
              <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-200/80">
                <span className="font-extrabold text-xs text-[#1e3a8a] uppercase tracking-wider">
                  เมนู & หมวดหมู่หลักสูตร
                </span>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-500 cursor-pointer shadow-xs"
                  title="ปิดเมนู"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <Sidebar
                  selectedCategories={selectedCategories}
                  onToggleCategory={toggleCategory}
                  onToggleAllCategories={handleToggleAllCategories}
                  categoryCounts={categoryCounts}
                  openCoursesCount={openCourses.length}
                  onOpenRegisterModal={() => {
                    setIsMobileSidebarOpen(false);
                    setIsSelectCourseModalOpen(true);
                  }}
                  hasLatestSubmission={Boolean(sessionRegData)}
                  onEditLatestSubmission={() => {
                    setIsMobileSidebarOpen(false);
                    handleEditLatestSubmission();
                  }}
                  isAdmin={isAdmin}
                  onOpenAdminManage={() => {
                    setIsMobileSidebarOpen(false);
                    setViewMode('admin');
                  }}
                  onOpenAdminLogin={() => {
                    setIsMobileSidebarOpen(false);
                    setIsAdminLoginModalOpen(true);
                  }}
                  onExitAdmin={() => {
                    setIsMobileSidebarOpen(false);
                    setIsAdmin(false);
                    setViewMode('calendar');
                  }}
                  onOpenAddHoliday={() => {
                    setIsMobileSidebarOpen(false);
                    setEditingHoliday(null);
                    setIsHolidayModalOpen(true);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Main View */}
        {viewMode === 'calendar' ? (
          <CalendarView
            currentDate={currentDate}
            events={allCalendarEvents}
            selectedCategories={selectedCategories}
            isAdmin={isAdmin}
            onSelectEvent={(ev) => setSelectedEvent(ev)}
            onAddEventOnDate={(dateStr) => handleOpenAddEvent(dateStr)}
            searchQuery={searchQuery}
          />
        ) : viewMode === 'list' ? (
          <ListView
            events={allCalendarEvents}
            selectedCategories={selectedCategories}
            isAdmin={isAdmin}
            onSelectEvent={(ev) => setSelectedEvent(ev)}
            onStartRegistration={(ev) => handleStartRegistration(ev)}
            onEditEvent={(ev) => handleOpenEditEvent(ev)}
            onDeleteEvent={(id) => handleDeleteEvent(id)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        ) : (
          <AdminDashboard
            events={courses}
            holidays={holidays}
            attendees={attendees}
            onOpenNewEventModal={() => handleOpenAddEvent()}
            onEditEvent={(ev) => handleOpenEditEvent(ev)}
            onRefresh={() => {
              setIsSyncing(true);
              setTimeout(() => setIsSyncing(false), 400);
            }}
          />
        )}
      </main>

      {/* Floating Action Button on Mobile */}
      {viewMode !== 'admin' && (
        <div className="fixed bottom-4 right-4 z-40 lg:hidden flex items-center gap-2">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="neu-btn flex items-center gap-2 px-3.5 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#1e3a8a] to-[#172554] shadow-lg cursor-pointer active:scale-95 transition-all"
            title="เปิดตัวกรองหมวดหมู่และลงทะเบียน"
          >
            <Filter className="w-4 h-4 text-white" />
            <span>ตัวกรอง ({selectedCategories.length}/{ALL_CATEGORIES.length})</span>
          </button>
        </div>
      )}

      {/* Course Detail Modal */}
      <EventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        isAdmin={isAdmin}
        onStartRegistration={(ev) => handleStartRegistration(ev)}
        onEdit={(ev) => handleOpenEditEvent(ev)}
        onDelete={(id) => handleDeleteEvent(id)}
      />

      {/* Course Create/Edit Modal */}
      <EventFormModal
        isOpen={isFormModalOpen}
        event={eventToEdit}
        initialDate={initialDateForNewEvent}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveEvent}
      />

      {/* Modern Course Registration Modal (Direct to Firebase Firestore) */}
      <RegisterModal
        isOpen={Boolean(registeringEvent)}
        event={registeringEvent}
        initialData={sessionRegData}
        isAdmin={isAdmin}
        onClose={() => setRegisteringEvent(null)}
        onRegistrationSuccess={handleRegistrationSuccess}
      />

      {/* Course Selection Modal */}
      <SelectCourseModal
        isOpen={isSelectCourseModalOpen}
        openCourses={openCourses}
        onClose={() => setIsSelectCourseModalOpen(false)}
        onSelectCourse={(course) => handleStartRegistration(course)}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onGoogleSignIn={handleGoogleSignIn}
        onLoginSuccess={() => {
          setIsAdmin(true);
          setViewMode('admin');
        }}
      />

      {/* Annual Holiday Add/Edit Modal (For Admin) */}
      <HolidayFormModal
        isOpen={isHolidayModalOpen}
        holiday={editingHoliday}
        onClose={() => {
          setIsHolidayModalOpen(false);
          setEditingHoliday(null);
        }}
        onSave={handleSaveHoliday}
      />
    </div>
  );
}
