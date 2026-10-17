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
    <div className="flex-1 h-full neu-card rounded-3xl p-4 md:p-5 flex flex-col min-w-0 overflow-hidden bg-[#e0e5ec]">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#7b889b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหาชื่อหลักสูตร, สถานที่, วิทยากร..."
            value={activeSearchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold neu-input rounded-2xl"
          />
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-black text-[#7b889b] whitespace-nowrap">สถานะ:</span>
          {['all', 'เปิด', 'ปิด', 'ไม่ต้องลงทะเบียน'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'neu-btn-accent text-white font-black'
                  : 'neu-btn text-[#4c566a]'
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
          <div className="text-center py-16 text-[#7b889b]">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40 text-[#5e81ac]" />
            <p className="text-sm font-bold">ไม่พบหลักสูตรที่ตรงกับเงื่อนไขการค้นหา</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredList.map((ev) => {
              const isOpen = ev.status === 'เปิด';
              const isClosed = ev.status === 'ปิด';

              return (
                <div
                  key={ev.id}
                  className="p-4 rounded-2xl neu-card-sm transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#e0e5ec] hover:scale-[1.005]"
                >
                  {/* Left: Course Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span
                        className="text-xs font-black px-2.5 py-0.5 rounded-xl shadow-xs"
                        style={{ backgroundColor: ev.color, color: ev.textColor || '#2e3440' }}
                      >
                        {ev.category}
                      </span>

                      {/* Status Badge */}
                      {isOpen ? (
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#5e81ac] neu-inset-sm px-2.5 py-0.5 rounded-xl">
                          <CheckCircle className="w-3.5 h-3.5 text-[#5e81ac]" />
                          เปิดรับลงทะเบียน ({ev.formSheet || 'Form'})
                        </span>
                      ) : isClosed ? (
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-rose-500 neu-inset-sm px-2.5 py-0.5 rounded-xl">
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          ปิดรับลงทะเบียน
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#7b889b] neu-inset-sm px-2.5 py-0.5 rounded-xl">
                          <MinusCircle className="w-3.5 h-3.5 text-[#7b889b]" />
                          ไม่ต้องลงทะเบียน
                        </span>
                      )}

                      {isAdmin && ev.formSheet && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-[#5e81ac] neu-inset-sm px-2 py-0.5 rounded-lg">
                          <FileSpreadsheet className="w-3 h-3 text-[#5e81ac]" />
                          {ev.formSheet}
                        </span>
                      )}
                    </div>

                    <h4
                      onClick={() => onSelectEvent(ev)}
                      className="text-base font-black text-[#2e3440] hover:text-[#5e81ac] cursor-pointer transition-colors leading-snug"
                    >
                      {ev.title}
                    </h4>

                    {ev.description && (
                      <p className="text-xs text-[#4c566a] mt-1 line-clamp-2 leading-relaxed">
                        {ev.description}
                      </p>
                    )}

                    {/* Metadata details */}
                    <div className="flex items-center gap-4 text-xs font-semibold text-[#7b889b] mt-2.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#5e81ac]" />
                        <span>
                          {ev.start} {ev.end && ev.end !== ev.start ? ` ถึง ${ev.end}` : ''}
                        </span>
                      </div>

                      {ev.startTime && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#5e81ac]" />
                          <span>
                            {ev.startTime} {ev.endTime ? `- ${ev.endTime}` : ''} น.
                          </span>
                        </div>
                      )}

                      {ev.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#5e81ac]" />
                          <span className="truncate max-w-[200px]">{ev.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2.5 self-end lg:self-center shrink-0">
                    {isOpen && (
                      <button
                        onClick={() => onStartRegistration(ev)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black neu-btn-accent cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4 text-white" />
                        <span>ลงทะเบียน (Register)</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSelectEvent(ev)}
                      className="px-3 py-2 rounded-xl text-xs font-black text-[#3b4252] hover:text-[#2e3440] neu-btn cursor-pointer"
                    >
                      ดูรายละเอียด
                    </button>

                    {isAdmin && (
                      <div className="flex items-center gap-1.5 pl-2 ml-1">
                        <button
                          onClick={() => onEditEvent(ev)}
                          title="แก้ไขหลักสูตร"
                          className="neu-btn p-2 text-[#5e81ac] hover:text-[#4c6d96] rounded-xl cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteEvent(ev.id)}
                          title="ลบหลักสูตร"
                          className="neu-btn p-2 text-rose-500 hover:text-rose-600 rounded-xl cursor-pointer"
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
