import React, { useMemo } from 'react';
import { TrainingEvent } from '../types';
import { Clock } from 'lucide-react';

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

  const weekHeaders = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="flex-1 h-full neu-card rounded-2xl p-3 md:p-4 flex flex-col min-w-0 overflow-hidden">
      {/* Month Days Header */}
      <div className="grid grid-cols-7 gap-1.5 md:gap-2 mb-2 shrink-0">
        {weekHeaders.map((day, idx) => (
          <div
            key={day}
            className={`text-center py-1.5 rounded-lg text-[11px] font-bold tracking-wider ${
              idx === 0
                ? 'text-rose-600 bg-rose-50/70 border border-rose-100'
                : 'text-slate-600 bg-slate-50 border border-slate-100'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar 7x6 Matrix Grid expanding to full height */}
      <div className="grid grid-cols-7 grid-rows-6 gap-1.5 md:gap-2 flex-1 min-h-0 overflow-hidden p-0.5">
        {calendarDays.map((day) => {
          // Find events on this date
          const dayEvents = filteredEvents.filter((ev) => {
            return day.dateStr >= ev.start && day.dateStr <= ev.end;
          });

          return (
            <div
              key={day.dateStr}
              onClick={() => {
                if (isAdmin) {
                  onAddEventOnDate(day.dateStr);
                }
              }}
              className={`h-full rounded-xl p-1.5 flex flex-col justify-between transition-all overflow-hidden group select-none ${
                day.isToday
                  ? 'bg-gradient-to-b from-[#f8fafc] to-[#eef2f6] border-2 border-[#1e3a8a] neu-card-sm ring-2 ring-[#1e3a8a]/20'
                  : day.isCurrentMonth
                  ? 'neu-card-sm'
                  : 'neu-inset-sm opacity-45'
              } ${isAdmin ? 'cursor-pointer hover:border-[#1e3a8a]/60' : ''}`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between mb-1 shrink-0">
                <span
                  className={`text-[11px] md:text-xs font-bold flex items-center justify-center w-5.5 h-5.5 md:w-6 md:h-6 rounded-lg transition-all ${
                    day.isToday
                      ? 'bg-gradient-to-r from-[#1e3a8a] to-[#172554] text-white font-extrabold shadow-sm'
                      : day.isSunday
                      ? 'text-rose-600 font-bold bg-rose-50/80 border border-rose-100 shadow-2xs'
                      : day.isCurrentMonth
                      ? 'text-slate-800 font-bold bg-slate-50 border border-slate-100 shadow-2xs'
                      : 'text-slate-400 font-medium'
                  }`}
                >
                  {day.dayNumber}
                </span>

                {isAdmin && (
                  <span
                    className="opacity-0 group-hover:opacity-100 text-[9px] text-[#1e3a8a] bg-blue-50 border border-blue-200 px-1 py-0.5 rounded font-bold transition-opacity"
                    title="เพิ่มหลักสูตร"
                  >
                    + เพิ่ม
                  </span>
                )}
              </div>

              {/* Day Event Chips (CSS selector 7: embossed dual shadow event chip) */}
              <div className="space-y-1 overflow-y-auto flex-1 min-h-0 pr-0.5">
                {dayEvents.map((ev) => {
                  if (ev.isHoliday) {
                    return (
                      <div
                        key={ev.id}
                        className="text-[10px] font-bold text-rose-600 text-center py-0.5 px-1.5 rounded-md border border-rose-100 bg-rose-50/80 truncate shadow-2xs"
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
                      className="w-full text-left p-1.5 rounded-lg text-[10px] md:text-[11px] font-semibold neu-chip hover:scale-[1.01] active:scale-95 transition-all cursor-pointer block truncate relative"
                    >
                      <div className="flex items-center gap-1.5">
                        {isOpen && (
                          <span
                            className="w-2 h-2 rounded-full bg-[#1e3a8a] shrink-0 animate-ping inline-block"
                            title="เปิดรับลงทะเบียน"
                          />
                        )}
                        <span className="truncate flex-1 tracking-tight">{ev.title}</span>
                      </div>
                      {ev.startTime && (
                        <div className="text-[9px] opacity-75 flex items-center gap-1 mt-0.5 font-normal">
                          <Clock className="w-2.5 h-2.5 inline" />
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
