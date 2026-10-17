import React from 'react';
import {
  Calendar as CalendarIcon,
  List,
  ShieldCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  viewMode: 'calendar' | 'list' | 'admin';
  setViewMode: (mode: 'calendar' | 'list' | 'admin') => void;
  user: User | null;
  isAdmin: boolean;
  isSyncing: boolean;
  onSync: () => void;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  onExitAdmin: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  viewMode,
  setViewMode,
  user,
  isAdmin,
  isSyncing,
  onSync,
  onExitAdmin,
  searchQuery = '',
  onSearchChange = () => {},
}) => {
  // English uppercase month & year e.g. "OCTOBER 2026"
  const monthName = currentDate
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    .toUpperCase();

  return (
    <header className="neu-card px-4 py-2.5 sticky top-0 z-30 shrink-0 w-full bg-[#e0e5ec]">
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Website Title & Month Navigation */}
        <div className="flex items-center gap-3 md:gap-5 flex-wrap">
          {/* Website Title: MONTHLY TRAINING CALENDAR */}
          <div className="flex flex-col pr-4 shrink-0">
            <span className="text-base md:text-lg font-black text-[#2e3440] tracking-wider uppercase leading-tight">
              MONTHLY TRAINING CALENDAR
            </span>
            <span className="text-[10px] font-bold text-[#7b889b] uppercase tracking-widest">
              Corporate Training Plan & Registration
            </span>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center neu-inset rounded-2xl p-1 shrink-0 gap-1">
              <button
                onClick={onPrevMonth}
                title="Previous Month"
                className="neu-btn p-1.5 rounded-xl cursor-pointer flex items-center justify-center text-[#3b4252] hover:text-[#2e3440]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={onToday}
                className="neu-btn px-3 py-1 text-xs font-black text-[#3b4252] hover:text-[#5e81ac] rounded-xl cursor-pointer"
              >
                TODAY
              </button>
              <button
                onClick={onNextMonth}
                title="Next Month"
                className="neu-btn p-1.5 rounded-xl cursor-pointer flex items-center justify-center text-[#3b4252] hover:text-[#2e3440]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h1 className="text-base md:text-xl font-black text-[#2e3440] tracking-tight uppercase whitespace-nowrap drop-shadow-xs">
              {monthName}
            </h1>
          </div>
        </div>

        {/* Center-Left: Search Input Field */}
        <div className="relative w-full sm:w-60 md:w-64 xl:w-72 shrink-0">
          <Search className="w-3.5 h-3.5 text-[#7b889b] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหาชื่อหลักสูตร หรือคำสำคัญ..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8.5 pr-8 py-1.5 text-xs font-semibold neu-input rounded-xl focus:ring-0 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7b889b] hover:text-rose-500 cursor-pointer p-0.5 transition-colors"
              title="ล้างคำค้นหา"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Center-Right: View Switcher */}
        <div className="flex items-center neu-inset p-1.5 rounded-2xl self-start md:self-auto shrink-0 gap-1.5">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'neu-card-sm text-[#5e81ac] font-black'
                : 'text-[#4c566a] hover:text-[#2e3440]'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>ปฏิทิน (Calendar)</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'neu-card-sm text-[#5e81ac] font-black'
                : 'text-[#4c566a] hover:text-[#2e3440]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>รายการหลักสูตร (Courses)</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setViewMode('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'admin'
                  ? 'neu-card-sm text-[#5e81ac] font-black'
                  : 'text-[#7b889b] hover:text-[#2e3440]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#5e81ac]" />
              <span>แดชบอร์ดแอดมิน</span>
            </button>
          )}
        </div>

        {/* Right: Only shown when Administrator is active */}
        {isAdmin && (
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Sync Button (Admin Only) */}
            <button
              onClick={onSync}
              disabled={isSyncing}
              title="ซิงค์ข้อมูลกับฐานข้อมูลส่วนกลาง"
              className="neu-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#3b4252] rounded-xl cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#5e81ac]' : 'text-[#5e81ac]'}`} />
              <span className="hidden sm:inline">ซิงค์ชีต (Sync)</span>
            </button>

            {/* Admin Badge & Exit */}
            <div className="flex items-center gap-2 neu-inset px-3 py-1.5 rounded-xl text-xs font-bold text-[#3b4252]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm"></span>
              <span className="text-[#2e3440]">ผู้ดูแลระบบ</span>
              {user && (
                <span className="text-[11px] text-[#7b889b] max-w-[100px] truncate hidden md:inline">
                  ({user.displayName || user.email})
                </span>
              )}
              <button
                onClick={onExitAdmin}
                className="text-xs text-[#5e81ac] hover:text-rose-500 font-bold ml-1 cursor-pointer"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
