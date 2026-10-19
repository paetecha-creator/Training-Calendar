import React from 'react';
import {
  UserCheck,
  Edit3,
  ShieldCheck,
  CheckSquare,
  Square,
  LogOut,
  CheckCheck,
} from 'lucide-react';
import { TrainingCategory, Language } from '../types';
import { TohokuLogo } from './TohokuLogo';
import { translations } from '../utils/translations';

interface SidebarProps {
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
  onToggleAllCategories: () => void;
  categoryCounts: Record<string, number>;
  openCoursesCount: number;
  onOpenRegisterModal: () => void;
  hasLatestSubmission: boolean;
  onEditLatestSubmission: () => void;
  isAdmin: boolean;
  onOpenAdminManage: () => void;
  onOpenAdminLogin: () => void;
  onExitAdmin: () => void;
  lang?: Language;
}

const CATEGORIES: Array<{ key: TrainingCategory; labelTh: string; labelEn: string; color: string }> = [
  { key: 'Soft Skill Training', labelTh: 'Soft Skill Training', labelEn: 'Soft Skill Training', color: '#FFF2CC' },
  { key: 'Technical Skills Training', labelTh: 'Technical Skills', labelEn: 'Technical Skills', color: '#DDEBF7' },
  { key: 'HSE and ISO Training', labelTh: 'HSE and ISO Training', labelEn: 'HSE and ISO Training', color: '#F8CBAD' },
  { key: 'Orientation', labelTh: 'Orientation (ปฐมนิเทศ)', labelEn: 'Orientation', color: '#E2EFDA' },
  { key: 'Other', labelTh: 'Other (อื่นๆ)', labelEn: 'Other', color: '#D8DEE9' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  selectedCategories,
  onToggleCategory,
  onToggleAllCategories,
  categoryCounts,
  openCoursesCount,
  onOpenRegisterModal,
  hasLatestSubmission,
  onEditLatestSubmission,
  isAdmin,
  onOpenAdminManage,
  onOpenAdminLogin,
  onExitAdmin,
  lang = 'th',
}) => {
  const t = translations[lang] || translations.th;
  const isAllSelected = selectedCategories.length === CATEGORIES.length;

  return (
    <aside className="w-full lg:w-64 xl:w-72 h-full neu-card rounded-2xl p-3.5 md:p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
      <div>
        {/* Original Company Logo - Clean presentation without company name caption */}
        <div className="flex flex-col items-center justify-center text-center mb-4 pb-3 border-b border-slate-200/60">
          <TohokuLogo size="lg" />
        </div>

        {/* Action Button: Register Course (Displayed ONLY when there are open courses for registration) */}
        {(openCoursesCount > 0 || hasLatestSubmission) && (
          <div className="space-y-2 mb-4">
            {openCoursesCount > 0 && (
              <button
                onClick={onOpenRegisterModal}
                className="w-full py-2.5 px-3 rounded-xl font-black text-xs text-white bg-gradient-to-r from-[#1e3a8a] via-[#1d4ed8] to-[#1e3a8a] shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border border-blue-400/30"
              >
                <UserCheck className="w-4 h-4 text-white" />
                <span className="tracking-wide">{t.registerBtn}</span>
                <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
                  {openCoursesCount} {t.coursesCountSuffix}
                </span>
              </button>
            )}

            {/* View / Edit Latest Registration (Appears ONLY right after registering in the active session) */}
            {hasLatestSubmission && (
              <button
                onClick={onEditLatestSubmission}
                className="w-full py-2 px-2.5 rounded-xl font-bold text-[11px] text-[#1e3a8a] bg-blue-50/80 hover:bg-blue-100/90 border border-blue-200/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{t.viewEditLatest}</span>
              </button>
            )}
          </div>
        )}

        {/* Category Filters (CSS selector 7: flat inset list) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black text-slate-700 tracking-wider uppercase">
              {t.categoriesTitle}
            </span>

            {/* Quick Toggle All Button */}
            <button
              type="button"
              onClick={onToggleAllCategories}
              className="flex items-center gap-1 text-[10px] font-bold text-[#1e3a8a] hover:text-blue-900 cursor-pointer p-0.5 rounded transition-colors"
              title={isAllSelected ? (lang === 'th' ? 'ยกเลิกการเลือกทั้งหมด' : 'Deselect all') : (lang === 'th' ? 'เลือกทั้งหมด' : 'Select all')}
            >
              <CheckCheck className="w-3 h-3 text-[#1e3a8a]" />
              <span>{isAllSelected ? (lang === 'th' ? 'ล้าง' : 'Clear') : (lang === 'th' ? 'ทั้งหมด' : 'All')}</span>
              <span className="text-slate-500 font-semibold">
                ({selectedCategories.length}/{CATEGORIES.length})
              </span>
            </button>
          </div>

          <div className="space-y-1.5">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategories.includes(cat.key);
              const count = categoryCounts[cat.key] || 0;
              const label = lang === 'th' ? cat.labelTh : cat.labelEn;

              return (
                <button
                  key={cat.key}
                  onClick={() => onToggleCategory(cat.key)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none text-left border ${
                    isSelected
                      ? 'neu-btn text-slate-900 border-slate-300/80 shadow-2xs font-extrabold'
                      : 'bg-white/40 text-slate-400 border-transparent hover:bg-white/80'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-2xs border border-black/10"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate">{label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#1e3a8a]" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Admin Section (Bottom of Left Sidebar - CSS selector 6) */}
      <div className="pt-3.5 space-y-2 mt-auto border-t border-slate-200/60">
        {isAdmin ? (
          <div className="p-3 neu-inset rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1e3a8a]">
                <ShieldCheck className="w-4 h-4 text-[#1e3a8a]" />
                <span>{t.adminControl}</span>
              </div>
              <button
                onClick={onExitAdmin}
                title={lang === 'th' ? 'ออกจากโหมดผู้ดูแลระบบ' : 'Exit Admin Mode'}
                className="text-slate-400 hover:text-rose-500 cursor-pointer p-1 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={onOpenAdminManage}
              className="w-full py-1.5 px-3 text-xs font-bold neu-btn text-slate-700 hover:text-[#1e3a8a] rounded-lg transition-all cursor-pointer text-center"
            >
              {t.manageRegistrations}
            </button>

            {/* Firebase Live Cloud Database status */}
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-medium">
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Firebase Live
              </span>
              <span className="text-[10px] text-slate-400">
                {lang === 'th' ? 'ซิงค์สดทุกเครื่อง' : 'Real-time Sync'}
              </span>
            </div>
          </div>
        ) : (
          /* General User: Clean Admin Login Button at bottom */
          <button
            onClick={onOpenAdminLogin}
            className="w-full py-2.5 px-3 text-xs font-bold text-slate-700 hover:text-[#1e3a8a] neu-btn rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-[#1e3a8a]" />
            <span>{t.adminLogin}</span>
          </button>
        )}
      </div>
    </aside>
  );
};
