import React, { useMemo } from 'react';
import { TrainingEvent } from '../types';
import { Clock, ChevronDown } from 'lucide-react';

interface CalendarViewProps {
  currentDate: Date;
  events: TrainingEvent[];
  selectedCategories: string[];
  isAdmin: boolean;
  onSelectEvent: (event: TrainingEvent) => void;
  onAddEventOnDate: (dateStr: string) => void;
  searchQuery?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  events,
  selectedCategories,
  isAdmin,
  onSelectEvent,
  onAddEventOnDate,
  searchQuery = '',
}) => {
  // Generate days for the current month calendar view (6 rows x 7 days = 42 cells)
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
    const totalDaysInMonth = lastDayOfMonth.getDate();

    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: Array<{
      date: Date;
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isSunday: boolean;
      isToday: boolean;
    }> = [];

    // Today string
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`;

    // Previous month padding
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      days.push({
        date: d,
        dateStr: dStr,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isSunday: d.getDay() === 0,
        isToday: dStr === todayStr,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      days.push({
        date: d,
        dateStr: dStr,
        dayNumber: i,
        isCurrentMonth: true,
        isSunday: d.getDay() === 0,
        isToday: dStr === todayStr,
      });
    }

    // Next month padding (complete grid to 42 days)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      days.push({
        date: d,
        dateStr: dStr,
        dayNumber: i,
        isCurrentMonth: false,
        isSunday: d.getDay() === 0,
        isToday: dStr === todayStr,
      });
    }

    return days;
  }, [currentDate]);

  // Filter events by selected category and search query
  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return events.filter((ev) => {
      if (ev.isHoliday) {
        if (!q) return true;
        return ev.title.toLowerCase().includes(q);
      }
      const matchCat = selectedCategories.includes(ev.category);
      if (!matchCat) return false;
      if (!q) return true;
      return (
        ev.title.toLowerCase().includes(q) ||
        (ev.location && ev.location.toLowerCase().includes(q)) ||
        (ev.category && ev.category.toLowerCase().includes(q)) ||
        (ev.description && ev.description.toLowerCase().includes(q))
      );
    });
  }, [events, selectedCategories, searchQuery]);

  const weekHeaders = [
    { en: 'SUN', th: 'อา.' },
    { en: 'MON', th: 'จ.' },
    { en: 'TUE', th: 'อ.' },
    { en: 'WED', th: 'พ.' },
    { en: 'THU', th: 'พฤ.' },
    { en: 'FRI', th: 'ศ.' },
    { en: 'SAT', th: 'ส.' },
  ];

  return (
    <div className="flex-1 h-full neu-card rounded-2xl p-2.5 sm:p-3 md:p-4 flex flex-col min-w-0 overflow-hidden">
      {/* Month Days Header */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2 mb-1.5 sm:mb-2 shrink-0">
        {weekHeaders.map((day, idx) => (
          <div
            key={day.en}
            className={`text-center py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold tracking-wider ${
              idx === 0
                ? 'text-rose-600 bg-rose-50/80 border border-rose-200/80 shadow-2xs'
                : 'text-slate-700 bg-slate-50/90 border border-slate-200/80 shadow-2xs'
            }`}
          >
            <span className="sm:hidden">{day.th}</span>
            <span className="hidden sm:inline">{day.en}</span>
          </div>
        ))}
      </div>

      {/* Calendar Matrix Grid: Uniform row height with scrollable course items per day */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 flex-1 min-h-0 overflow-y-auto p-1.5 [grid-auto-rows:minmax(145px,1fr)]">
        {calendarDays.map((day) => {
          // Find events on this date
          const dayEvents = filteredEvents.filter((ev) => {
            return day.dateStr >= ev.start && day.dateStr <= ev.end;
          });

          const hasMultipleCourses = dayEvents.filter(e => !e.isHoliday).length > 1;

          return (
            <div
              key={day.dateStr}
              onClick={() => {
                if (isAdmin) {
                  onAddEventOnDate(day.dateStr);
                }
              }}
              className={`h-[145px] sm:h-[165px] md:h-[185px] rounded-xl p-1.5 sm:p-2 flex flex-col justify-start relative overflow-hidden transition-all group select-none shadow-[2px_2px_6px_rgba(0,0,0,0.07),-2px_-2px_6px_rgba(255,255,255,0.95)] ${
                day.isToday
                  ? 'bg-gradient-to-b from-[#f8fafc] to-[#eef2f6] border-2 border-[#1e3a8a] ring-2 ring-[#1e3a8a]/20 shadow-[3px_3px_8px_rgba(30,58,138,0.18),-2px_-2px_6px_rgba(255,255,255,1)]'
                  : hasMultipleCourses
                  ? 'neu-card-sm border-2 border-indigo-200/90 bg-gradient-to-b from-white to-indigo-50/20 shadow-[3px_3px_8px_rgba(0,0,0,0.08),-2px_-2px_6px_rgba(255,255,255,1)]'
                  : day.isCurrentMonth
                  ? 'neu-card-sm border border-slate-200/70 hover:shadow-[3px_3px_8px_rgba(0,0,0,0.1),-3px_-3px_8px_rgba(255,255,255,1)]'
                  : 'neu-inset-sm opacity-45'
              } ${isAdmin ? 'cursor-pointer hover:border-[#1e3a8a]/60' : ''}`}
            >
              {/* Day Number Header: Always prominent, crisp, and clearly separated from event chips */}
              <div className="flex items-center justify-between w-full pb-1 mb-1 border-b border-slate-200/60 shrink-0 z-10 bg-inherit">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs md:text-sm font-black flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-lg transition-all shadow-xs shrink-0 ${
                      day.isToday
                        ? 'bg-gradient-to-r from-[#1e3a8a] to-[#172554] text-white font-black ring-2 ring-[#1e3a8a]/30 shadow-sm'
                        : day.isSunday
                        ? 'text-rose-600 font-extrabold bg-rose-50 border border-rose-200'
                        : day.isCurrentMonth
                        ? 'text-slate-900 font-black bg-slate-100 border border-slate-300'
                        : 'text-slate-400 font-bold opacity-50'
                    }`}
                  >
                    {day.dayNumber}
                  </span>

                  {hasMultipleCourses && (
                    <span
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-black bg-[#1e3a8a] text-white shadow-2xs whitespace-nowrap"
                      title="มีหลายหลักสูตร เลื่อนเมาส์ ขึ้น-ลง เพื่อดูคอร์สทั้งหมด"
                    >
                      <ChevronDown className="w-2.5 h-2.5 animate-bounce" />
                      <span>{dayEvents.length} คอร์ส</span>
                    </span>
                  )}
                </div>

                {isAdmin && (
                  <span
                    className="opacity-0 group-hover:opacity-100 text-[9px] text-[#1e3a8a] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded font-bold transition-opacity cursor-pointer shrink-0"
                    title="เพิ่มหลักสูตรในวันนี้"
                  >
                    + เพิ่ม
                  </span>
                )}
              </div>

              {/* Day Event Chips: Scrollable with mouse wheel up/down when multiple courses occur */}
              <div
                className="space-y-1.5 w-full flex-1 min-h-0 overflow-y-auto overscroll-contain pr-0.5 day-courses-scroll focus:outline-none"
                tabIndex={0}
                onWheel={(e) => {
                  e.stopPropagation();
                }}
                title={hasMultipleCourses ? 'ใช้เมาส์เลื่อนขึ้น-ลง เพื่อดูหลักสูตรอื่นๆ ในวันนี้' : undefined}
              >
                {dayEvents.map((ev) => {
                  if (ev.isHoliday) {
                    return (
                      <div
                        key={ev.id}
                        className="text-[9px] sm:text-[10px] font-bold text-rose-600 text-center py-1 px-1.5 rounded-md border border-rose-200 bg-rose-50/90 shadow-2xs leading-tight"
                        title={ev.title}
                      >
                        ★ {ev.title}
                      </div>
                    );
                  }

                  const isOpen = ev.status === 'เปิด';

                  return (
                    <button
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(ev);
                      }}
                      style={{
                        backgroundColor: ev.color,
                        color: ev.textColor || '#0f172a',
                      }}
                      className="w-full text-left p-1.5 rounded-lg text-[9px] sm:text-[10px] md:text-[11px] font-semibold neu-chip hover:scale-[1.01] active:scale-95 transition-all cursor-pointer block relative shadow-xs"
                    >
                      <div className="flex items-start gap-1">
                        {isOpen && (
                          <span
                            className="w-2 h-2 rounded-full bg-[#1e3a8a] shrink-0 mt-0.5 animate-ping inline-block"
                            title="เปิดรับลงทะเบียน"
                          />
                        )}
                        <span className="flex-1 tracking-tight leading-snug break-words">
                          {ev.title}
                        </span>
                      </div>
                      {ev.startTime && (
                        <div className="text-[8px] sm:text-[9px] opacity-85 flex items-center gap-1 mt-1 font-medium">
                          <Clock className="w-2.5 h-2.5 inline shrink-0" />
                          <span>{ev.startTime}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
