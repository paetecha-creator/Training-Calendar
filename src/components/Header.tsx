import React from 'react';
import {
  Calendar as CalendarIcon,
  List,
  ShieldCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
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
}) => {
  // English uppercase month & year e.g. "OCTOBER 2026"
  const monthName = currentDate
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    .toUpperCase();

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-2 sticky top-0 z-30 shadow-xs shrink-0 w-full">
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Website Title & Month Navigation */}
        <div className="flex items-center gap-3 md:gap-4 flex-wrap">
          {/* Website Title: MONTHLY TRAINING CALENDAR */}
          <div className="flex flex-col pr-4 border-r border-slate-200 shrink-0">
            <span className="text-base md:text-lg font-black text-slate-900 tracking-wider uppercase leading-tight">
              MONTHLY TRAINING CALENDAR
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Corporate Training Plan & Registration
            </span>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 shrink-0">
              <button
                onClick={onPrevMonth}
                title="Previous Month"
                className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={onToday}
                className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                TODAY
              </button>
              <button
                onClick={onNextMonth}
                title="Next Month"
                className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h1 className="text-base md:text-xl font-black text-slate-900 tracking-tight uppercase whitespace-nowrap">
              {monthName}
            </h1>
          </div>
        </div>

        {/* Center: View Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto shrink-0">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>ปฏิทิน (Calendar)</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>รายการหลักสูตร (Courses)</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setViewMode('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'admin'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-amber-700 hover:text-amber-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>แดชบอร์ดแอดมิน</span>
            </button>
          )}
        </div>

        {/* Right: Only shown when Administrator is active */}
        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            {/* Sync Button (Admin Only) */}
            <button
              onClick={onSync}
              disabled={isSyncing}
              title="ซิงค์ข้อมูลกับฐานข้อมูลส่วนกลาง"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">ซิงค์ชีต (Sync)</span>
            </button>

            {/* Admin Badge & Exit */}
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-xs font-bold text-amber-900">ผู้ดูแลระบบ</span>
              {user && (
                <span className="text-[11px] text-slate-500 max-w-[100px] truncate hidden md:inline">
                  ({user.displayName || user.email})
                </span>
              )}
              <button
                onClick={onExitAdmin}
                className="text-xs text-amber-700 hover:text-amber-900 font-bold ml-1.5 underline cursor-pointer"
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
