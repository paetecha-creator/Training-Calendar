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
  Menu,
  Languages,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Language } from '../types';
import { translations } from '../utils/translations';

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
  onToggleMobileMenu?: () => void;
  lang?: Language;
  onToggleLang?: (lang: Language) => void;
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
  onToggleMobileMenu,
  lang = 'th',
  onToggleLang,
}) => {
  const t = translations[lang] || translations.th;

  // Month & Year string formatted according to language
  const monthName =
    lang === 'th'
      ? currentDate
          .toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
          .toUpperCase()
      : currentDate
          .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          .toUpperCase();

  return (
    <header className="neu-card px-3 sm:px-4 py-2 sm:py-2.5 sticky top-0 z-30 shrink-0 w-full">
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
        {/* Left: Mobile Menu Toggle + Website Title & Month Navigation */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-5 flex-wrap">
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden neu-btn p-2 rounded-xl text-slate-700 hover:text-[#1e3a8a] flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="เปิดเมนูหมวดหมู่และลงทะเบียน"
            >
              <Menu className="w-4 h-4 text-[#1e3a8a]" />
              <span className="text-[11px] font-bold text-[#1e3a8a] hidden sm:inline">หมวดหมู่</span>
            </button>
          )}

          {/* Website Title: MONTHLY TRAINING CALENDAR */}
          <div className="flex flex-col pr-2 sm:pr-3 shrink-0">
            <span className="text-sm sm:text-base md:text-lg font-extrabold text-[#0f172a] tracking-tight uppercase leading-tight">
              {t.appTitle}
            </span>
            <span className="text-[9px] sm:text-[10px] font-extrabold text-[#1e3a8a] uppercase tracking-wider">
              {t.appSubtitle}
            </span>
          </div>

          {/* Month Navigator (CSS selector 4: debossed inset well) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center neu-inset rounded-xl p-0.5 sm:p-1 shrink-0 gap-1">
              <button
                onClick={onPrevMonth}
                title={lang === 'th' ? 'เดือนก่อนหน้า' : 'Previous Month'}
                className="neu-btn p-1 sm:p-1.5 rounded-lg cursor-pointer flex items-center justify-center text-slate-700 hover:text-[#1e3a8a]"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={onToday}
                className="neu-btn px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-bold text-slate-800 hover:text-[#1e3a8a] rounded-lg cursor-pointer"
              >
                {t.today}
              </button>
              <button
                onClick={onNextMonth}
                title={lang === 'th' ? 'เดือนถัดไป' : 'Next Month'}
                className="neu-btn p-1 sm:p-1.5 rounded-lg cursor-pointer flex items-center justify-center text-slate-700 hover:text-[#1e3a8a]"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            <h1 className="text-sm sm:text-base md:text-lg font-extrabold text-[#0f172a] tracking-tight uppercase whitespace-nowrap">
              {monthName}
            </h1>
          </div>
        </div>

        {/* Center-Left: Search Input Field (CSS selector 5: debossed concave input) */}
        <div className="relative w-full sm:w-60 md:w-64 xl:w-72 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8.5 pr-8 py-2 text-xs font-medium neu-input rounded-xl focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 cursor-pointer p-0.5 transition-colors"
              title="ล้างคำค้นหา"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Center-Right: View Switcher (CSS selector 2: debossed concave container with raised active button) */}
        <div className="flex items-center neu-inset p-1 rounded-xl self-start md:self-auto shrink-0 gap-1">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'neu-btn text-[#1e3a8a] font-extrabold'
                : 'text-slate-600 hover:text-[#1e3a8a]'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>{t.calendarView}</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'neu-btn text-[#1e3a8a] font-extrabold'
                : 'text-slate-600 hover:text-[#1e3a8a]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>{t.coursesView}</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setViewMode('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'admin'
                  ? 'neu-btn text-[#1e3a8a] font-extrabold'
                  : 'text-slate-600 hover:text-[#1e3a8a]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#1e3a8a]" />
              <span>{t.adminDashboard}</span>
            </button>
          )}
        </div>

        {/* Right: Language Switcher, Live Status & Actions */}
        <div className="flex items-center gap-2 md:gap-2.5 shrink-0 flex-wrap">
          {/* Language Toggle (TH / EN) Switch */}
          {onToggleLang && (
            <div
              className="flex items-center neu-inset p-0.5 rounded-xl shrink-0"
              title={lang === 'th' ? 'เปลี่ยนภาษาแสดงผล (TH / EN)' : 'Toggle Display Language (TH / EN)'}
            >
              <button
                type="button"
                onClick={() => onToggleLang('th')}
                className={`px-2 py-1 text-[11px] font-extrabold rounded-lg cursor-pointer transition-all ${
                  lang === 'th'
                    ? 'neu-btn text-[#1e3a8a] font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                TH
              </button>
              <button
                type="button"
                onClick={() => onToggleLang('en')}
                className={`px-2 py-1 text-[11px] font-extrabold rounded-lg cursor-pointer transition-all ${
                  lang === 'en'
                    ? 'neu-btn text-[#1e3a8a] font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                EN
              </button>
            </div>
          )}

          {/* Live Status indicator - Shown ONLY in Admin view */}
          {viewMode === 'admin' && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs"
              title={t.liveSyncDesc}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold tracking-tight text-[11px] sm:text-xs">
                {t.liveSync}
              </span>
            </div>
          )}

          {/* Sync / Refresh Button (CSS selector 3: convex raised tactile button) */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            title={lang === 'th' ? 'กดเพื่ออัปเดตข้อมูลล่าสุดจาก Firebase ทันที' : 'Refresh live data from Firebase'}
            className="neu-btn flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-800 rounded-lg cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#1e3a8a]' : 'text-[#1e3a8a]'}`} />
            <span className="hidden sm:inline">{t.updateBtn}</span>
          </button>

          {/* Admin Badge & Exit (Only shown when Administrator is active) */}
          {isAdmin && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 neu-inset-sm">
              <span className="text-[#0f172a] font-bold">{t.adminRole}</span>
              {user && (
                <span className="text-[11px] text-slate-500 max-w-[80px] truncate hidden md:inline">
                  ({user.displayName || user.email})
                </span>
              )}
              <button
                onClick={onExitAdmin}
                className="text-xs text-[#1e3a8a] hover:text-rose-500 font-bold ml-0.5 cursor-pointer transition-colors"
              >
                {t.logout}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
