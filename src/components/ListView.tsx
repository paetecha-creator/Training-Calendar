import React, { useState, useMemo } from 'react';
import { TrainingEvent, Language } from '../types';
import {
  Search,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  MinusCircle,
} from 'lucide-react';
import { translations } from '../utils/translations';

interface ListViewProps {
  events: TrainingEvent[];
  selectedCategories: string[];
  isAdmin: boolean;
  onSelectEvent: (event: TrainingEvent) => void;
  onStartRegistration: (event: TrainingEvent) => void;
  onEditEvent: (event: TrainingEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  lang?: Language;
}

export const ListView: React.FC<ListViewProps> = ({
  events,
  selectedCategories,
  isAdmin,
  onSelectEvent,
  onStartRegistration,
  onEditEvent,
  onDeleteEvent,
  searchQuery,
  onSearchChange,
  lang = 'th',
}) => {
  const t = translations[lang] || translations.th;
  const [internalQuery, setInternalQuery] = useState('');
  const activeSearchQuery = searchQuery !== undefined ? searchQuery : internalQuery;
  const handleSearchChange = onSearchChange || setInternalQuery;
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredList = useMemo(() => {
    return events
      .filter((ev) => !ev.isHoliday)
      .filter((ev) => selectedCategories.includes(ev.category))
      .filter((ev) => {
        if (statusFilter === 'all') return true;
        return ev.status === statusFilter;
      })
      .filter((ev) => {
        if (!activeSearchQuery.trim()) return true;
        const q = activeSearchQuery.toLowerCase();
        return (
          ev.title.toLowerCase().includes(q) ||
          ev.description.toLowerCase().includes(q) ||
          ev.location.toLowerCase().includes(q) ||
          ev.category.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [events, selectedCategories, statusFilter, activeSearchQuery]);

  const statusOptions = [
    { key: 'all', label: t.statusAll },
    { key: 'เปิด', label: t.statusOpen },
    { key: 'ปิด', label: t.statusClosed },
    { key: 'ไม่ต้องลงทะเบียน', label: t.statusNone },
  ];

  return (
    <div className="flex-1 h-full neu-card rounded-2xl p-4 md:p-5 flex flex-col min-w-0 overflow-hidden">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={t.searchCoursesPlaceholder}
            value={activeSearchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs font-medium neu-input rounded-xl focus:border-[#1e3a8a] outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 self-stretch sm:self-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">{t.statusLabel}</span>
          {statusOptions.map((st) => (
            <button
              key={st.key}
              onClick={() => setStatusFilter(st.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st.key
                  ? 'bg-gradient-to-r from-[#1e3a8a] to-[#172554] text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:text-[#1e3a8a] hover:bg-slate-200/80'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Table / Cards */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredList.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 neu-inset rounded-2xl">
            <Calendar className="w-12 h-12 mb-3 opacity-40 text-[#1e3a8a]" />
            <p className="text-sm font-bold text-slate-600">{t.noCoursesFound}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredList.map((ev) => {
              const isOpen = ev.status === 'เปิด';
              const isClosed = ev.status === 'ปิด';

              return (
                <div
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  className="neu-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:scale-[1.01] transition-all cursor-pointer relative group border border-slate-200/70"
                >
                  <div>
                    {/* Top Meta: Category & Status */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-black/5"
                        style={{
                          backgroundColor: ev.color,
                          color: ev.textColor || '#0f172a',
                        }}
                      >
                        {ev.category}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                            isOpen
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isClosed
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {isOpen ? (
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                          ) : isClosed ? (
                            <XCircle className="w-3 h-3 text-rose-600" />
                          ) : (
                            <MinusCircle className="w-3 h-3 text-slate-400" />
                          )}
                          <span>
                            {isOpen ? t.statusOpen : isClosed ? t.statusClosed : t.statusNone}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-black text-slate-900 group-hover:text-[#1e3a8a] transition-colors leading-snug line-clamp-2 mb-2">
                      {ev.title}
                    </h3>

                    {/* Description preview */}
                    {ev.description && (
                      <p className="text-xs text-slate-500 font-normal line-clamp-2 mb-3 leading-relaxed">
                        {ev.description}
                      </p>
                    )}

                    {/* Course Date & Venue */}
                    <div className="space-y-1.5 text-xs text-slate-600 font-semibold mb-4 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#1e3a8a] shrink-0" />
                        <span>
                          {ev.start} {ev.end && ev.end !== ev.start ? ` ถึง ${ev.end}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#1e3a8a] shrink-0" />
                        <span>
                          {ev.startTime} - {ev.endTime} น.
                        </span>
                      </div>
                      {ev.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#1e3a8a] shrink-0" />
                          <span className="truncate">{ev.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    {isOpen ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartRegistration(ev);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-gradient-to-r from-[#1e3a8a] to-[#172554] rounded-xl shadow-xs hover:shadow-md cursor-pointer transition-all"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{t.registerNowBtn}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-bold italic py-1">
                        {isClosed ? t.statusClosed : t.statusNone}
                      </span>
                    )}

                    {isAdmin && (
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditEvent(ev);
                          }}
                          className="p-1.5 text-slate-400 hover:text-[#1e3a8a] hover:bg-blue-50 rounded-lg cursor-pointer"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteEvent(ev.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="ลบ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
