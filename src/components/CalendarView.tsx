import React, { useMemo } from 'react';
import { TrainingEvent, Language } from '../types';
import { Clock, ChevronDown } from 'lucide-react';
import { translations } from '../utils/translations';

interface CalendarViewProps {
  currentDate: Date;
  events: TrainingEvent[];
  selectedCategories: string[];
  isAdmin: boolean;
  onSelectEvent: (event: TrainingEvent) => void;
  onAddEventOnDate: (dateStr: string) => void;
  searchQuery?: string;
  lang?: Language;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  events,
  selectedCategories,
  isAdmin,
  onSelectEvent,
  onAddEventOnDate,
  searchQuery = '',
  lang = 'th',
}) => {
  const t = translations[lang] || translations.th;

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
      isSaturday: boolean;
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
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        isSunday: d.getDay() === 0,
        isSaturday: d.getDay() === 6,
        isToday: dStr === todayStr,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i);
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        date: d,
        dateStr: dStr,
        dayNumber: i,
        isCurrentMonth: true,
        isSunday: d.getDay() === 0,
        isSaturday: d.getDay() === 6,
        isToday: dStr === todayStr,
      });
    }

    // Next month padding to fill grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        i
      ).padStart(2, '0')}`;
      days.push({
        date: d,
        dateStr: dStr,
        dayNumber: i,
        isCurrentMonth: false,
        isSunday: d.getDay() === 0,
        isSaturday: d.getDay() === 6,
        isToday: dStr === todayStr,
      });
    }

    return days;
  }, [currentDate]);

  // Filter events by selected category and search query
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Holidays always show unless explicitly filtered
      if (ev.isHoliday) {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return ev.title.toLowerCase().includes(q);
      }

      if (!selectedCategories.includes(ev.category)) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        ev.title.toLowerCase().includes(q) ||
        (ev.location && ev.location.toLowerCase().includes(q)) ||
        (ev.category && ev.category.toLowerCase().includes(q)) ||
        (ev.description && ev.description.toLowerCase().includes(q))
      );
    });
  }, [events, selectedCategories, searchQuery]);

  const weekHeaders = [
    { enShort: 'SUN', enFull: 'Sunday', thShort: 'อา.', thFull: 'อาทิตย์' },
    { enShort: 'MON', enFull: 'Monday', thShort: 'จ.', thFull: 'จันทร์' },
    { enShort: 'TUE', enFull: 'Tuesday', thShort: 'อ.', thFull: 'อังคาร' },
    { enShort: 'WED', enFull: 'Wednesday', thShort: 'พ.', thFull: 'พุธ' },
    { enShort: 'THU', enFull: 'Thursday', thShort: 'พฤ.', thFull: 'พฤหัสฯ' },
    { enShort: 'FRI', enFull: 'Friday', thShort: 'ศ.', thFull: 'ศุกร์' },
    { enShort: 'SAT', enFull: 'Saturday', thShort: 'ส.', thFull: 'เสาร์' },
  ];

  return (
    <div className="flex-1 h-full neu-card rounded-2xl p-2.5 sm:p-3 md:p-4 flex flex-col min-w-0 overflow-hidden">
      {/* Month Days Header: Sunday column reduced by 60% (0.4fr) to maximize workday space */}
      <div className="grid grid-cols-[0.4fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-1 sm:gap-1.5 md:gap-2 mb-2 sm:mb-2.5 shrink-0">
        {weekHeaders.map((day, idx) => {
          const isSun = idx === 0;
          const isSat = idx === 6;

          return (
            <div
              key={day.enShort}
              className={`text-center py-1.5 sm:py-2.5 px-0.5 sm:px-1 rounded-xl transition-all flex flex-col items-center justify-center select-none shadow-[2px_2px_6px_rgba(0,0,0,0.06),-2px_-2px_6px_rgba(255,255,255,0.9)] ${
                isSun
                  ? 'bg-gradient-to-b from-rose-50 via-rose-100/80 to-rose-50 text-rose-700 border-2 border-rose-300 ring-1 ring-rose-200/60 shadow-xs'
                  : isSat
                  ? 'bg-gradient-to-b from-purple-50 via-purple-100/70 to-purple-50 text-purple-700 border-2 border-purple-300 ring-1 ring-purple-200/50 shadow-xs'
                  : 'bg-gradient-to-b from-white via-slate-50 to-slate-100/90 text-slate-900 border-2 border-slate-300/90 shadow-xs hover:border-[#1e3a8a]/50'
              }`}
            >
              <span className={`font-black tracking-wider leading-none ${isSun ? 'text-[11px] sm:text-xs md:text-sm' : 'text-xs sm:text-sm md:text-base'}`}>
                {day.enShort}
              </span>
              <span className="text-[10px] sm:text-[11px] font-extrabold mt-1 leading-none tracking-tight opacity-90 truncate max-w-full">
                {lang === 'en' ? (
                  isSun ? day.enShort : <><span className="sm:hidden">{day.enShort}</span><span className="hidden sm:inline">{day.enFull}</span></>
                ) : (
                  isSun ? day.thShort : <><span className="sm:hidden">{day.thShort}</span><span className="hidden sm:inline">{day.thFull}</span></>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* Calendar Matrix Grid: Sunday column reduced by 60% (0.4fr), workdays get maximum space */}
      <div className="grid grid-cols-[0.4fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-1.5 sm:gap-2 flex-1 min-h-0 overflow-y-auto p-1.5 [grid-auto-rows:minmax(145px,1fr)]">
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
              <div className="flex items-center justify-between w-full pb-1.5 mb-1.5 border-b-2 border-slate-200/80 shrink-0 z-10 bg-inherit">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-black flex items-center justify-center rounded-lg transition-all shadow-xs shrink-0 ${
                      day.isSunday
                        ? 'w-5.5 h-5.5 sm:w-6 sm:h-6 text-[10px] sm:text-xs'
                        : 'w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm'
                    } ${
                      day.isToday
                        ? 'bg-gradient-to-br from-[#1e3a8a] to-[#0f172a] text-white border-2 border-[#1e3a8a] ring-2 ring-blue-300/80 font-black shadow-md'
                        : day.isSunday
                        ? day.isCurrentMonth
                          ? 'text-rose-700 font-black bg-rose-50 border-2 border-rose-300 shadow-2xs'
                          : 'text-rose-400 font-bold bg-rose-50/50 border border-rose-200/60 opacity-60'
                        : day.isSaturday
                        ? day.isCurrentMonth
                          ? 'text-purple-700 font-black bg-purple-50 border-2 border-purple-200 shadow-2xs'
                          : 'text-purple-400 font-bold bg-purple-50/50 border border-purple-200/60 opacity-60'
                        : day.isCurrentMonth
                        ? 'text-slate-900 font-black bg-slate-100 border-2 border-slate-300 shadow-2xs'
                        : 'text-slate-400 font-bold bg-slate-50 border border-slate-200 opacity-55'
                    }`}
                  >
                    {day.dayNumber}
                  </span>

                  {hasMultipleCourses && (
                    <span
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-black bg-[#1e3a8a] text-white shadow-2xs whitespace-nowrap"
                      title={lang === 'th' ? 'มีหลายหลักสูตร เลื่อนเมาส์ ขึ้น-ลง เพื่อดูคอร์สทั้งหมด' : 'Multiple courses. Scroll to view all.'}
                    >
                      <ChevronDown className="w-2.5 h-2.5 animate-bounce" />
                      <span>{dayEvents.length} {t.coursesCountBadge}</span>
                    </span>
                  )}
                </div>

                {isAdmin && (
                  <span
                    className="opacity-0 group-hover:opacity-100 text-[9px] text-[#1e3a8a] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded font-bold transition-opacity cursor-pointer shrink-0"
                    title={lang === 'th' ? 'เพิ่มหลักสูตรในวันนี้' : 'Add course on this day'}
                  >
                    {t.addCourseInDay}
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
                title={hasMultipleCourses ? (lang === 'th' ? 'ใช้เมาส์เลื่อนขึ้น-ลง เพื่อดูหลักสูตรอื่นๆ ในวันนี้' : 'Scroll to view courses') : undefined}
              >
                {dayEvents.map((ev) => {
                  if (ev.isHoliday) {
                    return (
                      <div
                        key={ev.id}
                        className="text-[9px] sm:text-[10px] font-bold text-rose-600 text-center py-1 px-1.5 rounded-md border border-rose-200 bg-rose-50/90 shadow-2xs leading-tight"
                        title={ev.title}
                      >
                        {t.holidayStar} {ev.title}
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
                            title={lang === 'th' ? 'เปิดรับลงทะเบียน' : 'Open for registration'}
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
