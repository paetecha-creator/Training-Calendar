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
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  events,
  selectedCategories,
  isAdmin,
  onSelectEvent,
  onAddEventOnDate,
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

  // Filter events by selected category
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (ev.isHoliday) return true;
      return selectedCategories.includes(ev.category);
    });
  }, [events, selectedCategories]);

  const weekHeaders = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="flex-1 h-full bg-white border border-slate-200/80 rounded-2xl p-2.5 md:p-3.5 shadow-xs flex flex-col min-w-0 overflow-hidden">
      {/* Month Days Header */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5 shrink-0">
        {weekHeaders.map((day, idx) => (
          <div
            key={day}
            className={`text-center py-1.5 rounded-xl text-xs font-black tracking-wider ${
              idx === 0
                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                : 'bg-slate-900 text-white'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar 7x6 Matrix Grid expanding to full height */}
      <div className="grid grid-cols-7 grid-rows-6 gap-1.5 flex-1 min-h-0 overflow-hidden">
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
              className={`h-full rounded-xl p-1.5 border flex flex-col justify-between transition-all overflow-hidden group ${
                day.isCurrentMonth
                  ? day.isSunday
                    ? 'bg-rose-50/30 border-rose-100/70'
                    : 'bg-white border-slate-200/90 hover:border-slate-300'
                  : 'bg-slate-50/50 border-slate-100/80 text-slate-400'
              } ${isAdmin ? 'cursor-pointer hover:bg-blue-50/30' : ''}`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between mb-0.5 shrink-0">
                <span
                  className={`text-[11px] md:text-xs font-bold flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-md ${
                    day.isToday
                      ? 'bg-blue-600 text-white shadow-xs font-black'
                      : day.isSunday
                      ? 'text-rose-600'
                      : day.isCurrentMonth
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {day.dayNumber}
                </span>

                {isAdmin && (
                  <span
                    className="opacity-0 group-hover:opacity-100 text-[9px] text-blue-600 bg-blue-100 px-1 py-0.2 rounded font-semibold transition-opacity"
                    title="เพิ่มหลักสูตร"
                  >
                    + เพิ่ม
                  </span>
                )}
              </div>

              {/* Day Event Chips */}
              <div className="space-y-1 overflow-y-auto flex-1 min-h-0 pr-0.5">
                {dayEvents.map((ev) => {
                  if (ev.isHoliday) {
                    return (
                      <div
                        key={ev.id}
                        className="text-[10px] font-black text-rose-600 text-center py-0.5 px-1 rounded bg-rose-100/60 truncate"
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
                        color: ev.textColor || '#1e293b',
                      }}
                      className="w-full text-left p-1 rounded-md text-[10px] md:text-[11px] font-bold border border-black/5 hover:brightness-95 transition-all shadow-2xs cursor-pointer block truncate relative"
                    >
                      <div className="flex items-center gap-1">
                        {isOpen && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-ping inline-block"
                            title="เปิดรับลงทะเบียน"
                          />
                        )}
                        <span className="truncate flex-1">{ev.title}</span>
                      </div>
                      {ev.startTime && (
                        <div className="text-[9px] opacity-80 flex items-center gap-0.5 mt-0.2 font-normal">
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
