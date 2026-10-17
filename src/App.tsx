import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TrainingEvent, TrainingCategory, SessionRegistrationData } from './types';
import {
  getEventsFromSheet,
  saveEventToSheet,
  deleteEventFromSheet,
  submitRegistrationData,
} from './services/sheetsService';
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
import { User } from 'firebase/auth';
import { CheckCircle2, X } from 'lucide-react';

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

  // Initialize Firebase Auth & Load initial events
  useEffect(() => {
    loadEvents(null);

    const unsubscribe = initAuth(
      (authUser, token) => {
        setUser(authUser);
        setAccessToken(token);
        setIsAdmin(true);
        loadEvents(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

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
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#e0e5ec] text-[#3b4252]">
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
      />

      {/* Sync Status Banner (Only visible to Admin) */}
      {isAdmin && syncStatus && (
        <div className="mx-3 mt-1.5 px-4 py-2 text-xs font-semibold flex items-center justify-between rounded-xl neu-inset shrink-0 text-[#3b4252]">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#5e81ac] shrink-0" />
              <span>{syncStatus.text}</span>
            </div>
            <button
              onClick={() => setSyncStatus(null)}
              className="text-[#7b889b] hover:text-[#2e3440] ml-2 cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container: Full viewport height and width */}
      <main className="flex-1 w-full p-2.5 md:p-3.5 flex flex-col lg:flex-row gap-3.5 min-h-0 overflow-hidden">
        {/* Sidebar */}
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
          />
        )}
      </main>

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
        onLoginSuccess={() => {
          setIsAdmin(true);
          setViewMode('admin');
        }}
      />
    </div>
  );
}
