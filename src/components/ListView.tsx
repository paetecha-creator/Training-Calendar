import React, { useState, useMemo } from 'react';
import { TrainingEvent } from '../types';
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
  FileSpreadsheet,
} from 'lucide-react';

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
}) => {
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

  return (
    <div className="flex-1 h-full neu-card rounded-2xl p-4 md:p-5 flex flex-col min-w-0 overflow-hidden">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหาชื่อหลักสูตร, สถานที่, วิทยากร..."
            value={activeSearchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs font-medium neu-input rounded-xl focus:border-[#1e3a8a] outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 self-stretch sm:self-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">สถานะ:</span>
          {['all', 'เปิด', 'ปิด', 'ไม่ต้องลงทะเบียน'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-gradient-to-r from-[#1e3a8a] to-[#172554] text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:text-[#1e3a8a] hover:bg-slate-200/80'
              }`}
            >
              {st === 'all' ? 'ทั้งหมด' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Table / Cards */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredList.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40 text-indigo-500" />
            <p className="text-sm font-semibold text-slate-600">ไม่พบหลักสูตรที่ตรงกับเงื่อนไขการค้นหา</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredList.map((ev) => {
              const isOpen = ev.status === 'เปิด';
              const isClosed = ev.status === 'ปิด';

              return (
                <div
                  key={ev.id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left: Course Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span
                        className="text-xs font-bold px-2.5 py-0.5 rounded-md border border-black/5"
                        style={{ backgroundColor: ev.color, color: ev.textColor || '#0f172a' }}
                      >
                        {ev.category}
                      </span>

                      {/* Status Badge */}
                      {isOpen ? (
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          เปิดรับลงทะเบียน ({ev.formSheet || 'Form'})
                        </span>
                      ) : isClosed ? (
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-md">
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          ปิดรับลงทะเบียน
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
                          <MinusCircle className="w-3.5 h-3.5 text-slate-400" />
                          ไม่ต้องลงทะเบียน
                        </span>
                      )}

                      {isAdmin && ev.formSheet && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-[#1e3a8a] bg-blue-50 border border-blue-200/70 px-2 py-0.5 rounded-md">
                          <FileSpreadsheet className="w-3 h-3 text-[#1e3a8a]" />
                          {ev.formSheet}
                        </span>
                      )}
                    </div>

                    <h4
                      onClick={() => onSelectEvent(ev)}
                      className="text-base font-bold text-slate-900 hover:text-[#1e3a8a] cursor-pointer transition-colors leading-snug"
                    >
                      {ev.title}
                    </h4>

                    {ev.description && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed font-normal">
                        {ev.description}
                      </p>
                    )}

                    {/* Metadata details */}
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mt-2.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#1e3a8a]" />
                        <span>
                          {ev.start} {ev.end && ev.end !== ev.start ? ` ถึง ${ev.end}` : ''}
                        </span>
                      </div>

                      {ev.startTime && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#1e3a8a]" />
                          <span>
                            {ev.startTime} {ev.endTime ? `- ${ev.endTime}` : ''} น.
                          </span>
                        </div>
                      )}

                      {ev.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#1e3a8a]" />
                          <span className="truncate max-w-[200px]">{ev.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                    {isOpen && (
                      <button
                        onClick={() => onStartRegistration(ev)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#1e3a8a] to-[#172554] hover:from-[#172554] hover:to-[#0f172a] shadow-xs cursor-pointer transition-all"
                      >
                        <UserCheck className="w-4 h-4 text-white" />
                        <span>ลงทะเบียน (Register)</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSelectEvent(ev)}
                      className="px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:text-[#1e3a8a] bg-slate-50 hover:bg-slate-100 border border-slate-200/80 cursor-pointer transition-all"
                    >
                      ดูรายละเอียด
                    </button>

                    {isAdmin && (
                      <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-slate-200">
                        <button
                          onClick={() => onEditEvent(ev)}
                          title="แก้ไขหลักสูตร"
                          className="p-2 text-[#1e3a8a] hover:text-[#172554] hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteEvent(ev.id)}
                          title="ลบหลักสูตร"
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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
