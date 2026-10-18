import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TrainingEvent, TrainingCategory, SessionRegistrationData } from './types';
import {
  getEventsFromSheet,
  saveEventToSheet,
  deleteEventFromSheet,
  submitRegistrationData,
  flushPendingSyncQueue,
  initSheetsConfig,
} from './services/sheetsService';
import { initAuth, googleSignIn, logoutGoogle, db } from './services/firebase';
import { onSnapshot, collection } from 'firebase/firestore';
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
  const [events, setEvents] = useState<TrainingEvent[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(ALL_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Authentication & Google Sheets
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
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

  // Session registration tracking for "แก้ไขข้อมูลล่าสุด"
  const [sessionRegData, setSessionRegData] = useState<SessionRegistrationData | null>(() => {
    try {
      const saved = localStorage.getItem('training_session_reg');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  // Load events
  const loadEvents = useCallback(
    async (token?: string | null) => {
      setIsSyncing(true);
      try {
        const res = await getEventsFromSheet(token ?? accessToken);
        setEvents(res.events);

        if (res.source === 'google-sheets') {
          setSyncStatus({
            text: 'เชื่อมต่อและซิงค์ข้อมูลกับ Google Sheets สำเร็จ',
            type: 'success',
          });
        }
      } catch (err: unknown) {
        console.error('Load events error', err);
      } finally {
        setIsSyncing(false);
      }
    },
    [accessToken]
  );

  // Continuous sync: Fetch on mount, poll every 25 seconds, sync on window focus, and real-time Firestore listener
  useEffect(() => {
    initSheetsConfig();
    loadEvents(accessToken);

    const intervalId = setInterval(() => {
      loadEvents(accessToken);
    }, 25000);

    const handleFocus = () => {
      loadEvents(accessToken);
    };
    window.addEventListener('focus', handleFocus);

    let unsubscribeFirestore = () => {};
    try {
      unsubscribeFirestore = onSnapshot(collection(db, 'events'), () => {
        loadEvents(accessToken);
      });
    } catch (e) {
      console.warn('Firestore snapshot error:', e);
    }

    const unsubscribe = initAuth(
      async (authUser, token) => {
        setUser(authUser);
        setAccessToken(token);
        setIsAdmin(true);
        loadEvents(token);
        if (token) {
          try {
            await flushPendingSyncQueue(token);
          } catch (e) {
            console.error('Auto-flush error:', e);
          }
        }
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      unsubscribe();
      unsubscribeFirestore();
    };
  }, [loadEvents, accessToken]);

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
        setAccessToken(result.accessToken);
        setIsAdmin(true);
        await loadEvents(result.accessToken);
        try {
          const flushRes = await flushPendingSyncQueue(result.accessToken);
          if (flushRes.flushedCount > 0) {
            setSyncStatus({
              text: `เชื่อมต่อ Google Sheets สำเร็จ และซิงค์ข้อมูลค้างส่งลงชีตแล้ว ${flushRes.flushedCount} รายการ`,
              type: 'success',
            });
          }
        } catch (e) {
          console.error(e);
        }
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
    setAccessToken(null);
    setIsAdmin(false);
    loadEvents(null);
  };

  // Event Handlers
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
      const res = await saveEventToSheet(payload, accessToken);
      if (res.success) {
        await loadEvents(accessToken);
        setSyncStatus({
          text: `บันทึกหลักสูตร "${payload.title}" เรียบร้อยแล้ว`,
          type: 'success',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    setIsSyncing(true);
    try {
      const res = await deleteEventFromSheet(eventId, accessToken);
      if (res.success) {
        await loadEvents(accessToken);
        setSyncStatus({ text: 'ลบหลักสูตรเรียบร้อยแล้ว', type: 'success' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Registration Handlers
  const handleStartRegistration = (course: TrainingEvent) => {
    setRegisteringEvent(course);
  };

  const handleSubmitRegistration = async (payload: {
    isEditMode: boolean;
    courseId: string;
    courseTitle: string;
    formSheet: string;
    rowIndices?: number[];
    data: Array<[string, string, string, string, string, string, string, string, string]>;
    submitterName: string;
    submitterDept: string;
    submitterPhone: string;
  }) => {
    const res = await submitRegistrationData(payload, accessToken);
    return res;
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
    const foundCourse = events.find((e) => e.id === sessionRegData.courseId);
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
    return events.filter(
      (ev) => ev.isEvent && ev.status === 'เปิด' && Boolean(ev.formSheet)
    );
  }, [events]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((ev) => {
      if (ev.isEvent && ev.category) {
        counts[ev.category] = (counts[ev.category] || 0) + 1;
      }
    });
    return counts;
  }, [events]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#eef2f6] text-slate-800 relative">
      {/* Top Navbar: Full-width */}
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
        onSync={() => loadEvents(accessToken)}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        onExitAdmin={() => setIsAdmin(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
      />

      {/* Sync Status Banner (Only visible to Admin) */}
      {isAdmin && syncStatus && (
        <div className="mx-3 mt-1.5 px-4 py-2 text-xs font-semibold flex items-center justify-between rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 shrink-0">
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

      {/* Main Container: Full viewport height and width */}
      <main className="flex-1 w-full p-2 sm:p-2.5 md:p-3.5 flex flex-col lg:flex-row gap-2.5 sm:gap-3.5 min-h-0 overflow-hidden">
        {/* Desktop Sidebar: Permanent left column */}
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
            onExitAdmin={() => setIsAdmin(false)}
          />
        </div>

        {/* Mobile Sidebar Slide-Over Drawer */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative w-80 max-w-[85vw] h-full bg-[#eef2f6] p-3 flex flex-col z-10 shadow-2xl overflow-y-auto">
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
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Main View: Full-height and full-width */}
        {viewMode === 'calendar' ? (
          <CalendarView
            currentDate={currentDate}
            events={events}
            selectedCategories={selectedCategories}
            isAdmin={isAdmin}
            onSelectEvent={(ev) => setSelectedEvent(ev)}
            onAddEventOnDate={(dateStr) => handleOpenAddEvent(dateStr)}
            searchQuery={searchQuery}
          />
        ) : viewMode === 'list' ? (
          <ListView
            events={events}
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
            events={events}
            accessToken={accessToken}
            onRefreshEvents={() => loadEvents(accessToken)}
            isSyncing={isSyncing}
            onGoogleSignIn={handleGoogleSignIn}
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

      {/* Modals */}
      <EventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        isAdmin={isAdmin}
        onStartRegistration={(ev) => handleStartRegistration(ev)}
        onEdit={(ev) => handleOpenEditEvent(ev)}
        onDelete={(id) => handleDeleteEvent(id)}
      />

      <EventFormModal
        isOpen={isFormModalOpen}
        event={eventToEdit}
        initialDate={initialDateForNewEvent}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveEvent}
      />

      <RegisterModal
        isOpen={Boolean(registeringEvent)}
        event={registeringEvent}
        initialData={sessionRegData}
        isAdmin={isAdmin}
        onClose={() => setRegisteringEvent(null)}
        onSubmit={handleSubmitRegistration}
        onRegistrationSuccess={handleRegistrationSuccess}
      />

      <SelectCourseModal
        isOpen={isSelectCourseModalOpen}
        openCourses={openCourses}
        onClose={() => setIsSelectCourseModalOpen(false)}
        onSelectCourse={(course) => handleStartRegistration(course)}
      />

      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onGoogleSignIn={handleGoogleSignIn}
        onLoginSuccess={() => {
          setIsAdmin(true);
          setViewMode('admin');
        }}
      />
    </div>
  );
}
