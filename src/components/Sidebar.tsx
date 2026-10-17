import React from 'react';
import {
  UserCheck,
  Edit3,
  ExternalLink,
  ShieldCheck,
  CheckSquare,
  Square,
  LogOut,
  CheckCheck,
} from 'lucide-react';
import { TrainingCategory } from '../types';
import { SPREADSHEET_ID } from '../services/sheetsService';
import { TohokuLogo } from './TohokuLogo';

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
}

const CATEGORIES: Array<{ key: TrainingCategory; label: string; color: string }> = [
  { key: 'Soft Skill Training', label: 'Soft Skill Training', color: '#FFF2CC' },
  { key: 'Technical Skills Training', label: 'Technical Skills', color: '#DDEBF7' },
  { key: 'HSE and ISO Training', label: 'HSE and ISO Training', color: '#F8CBAD' },
  { key: 'Orientation', label: 'Orientation (ปฐมนิเทศ)', color: '#E2EFDA' },
  { key: 'Other', label: 'Other (อื่นๆ)', color: '#D8DEE9' },
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
}) => {
  const isAllSelected = selectedCategories.length === CATEGORIES.length;

  return (
    <aside className="w-full lg:w-72 xl:w-80 h-full neu-card rounded-2xl p-4 md:p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
      <div>
        {/* Company Logo & Subheading */}
        <div className="flex flex-col items-center justify-center text-center mb-5 pb-4 border-b border-slate-200/60">
          <TohokuLogo size="lg" className="justify-center mb-1.5" />
          <span className="text-[10px] font-extrabold text-[#1e3a8a] uppercase tracking-widest">
            Corporate Training Plan
          </span>
        </div>

        {/* Quick Registration Button (CSS selector 8: embossed navy primary button with dual shadow) */}
        {openCoursesCount > 0 ? (
          <div className="mb-5">
            <button
              onClick={onOpenRegisterModal}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm neu-btn-accent cursor-pointer btn-attention tracking-wide shadow-sm"
            >
              <UserCheck className="w-4.5 h-4.5 text-white" />
              <span>ลงทะเบียนอบรม ({openCoursesCount} หลักสูตร)</span>
            </button>

            {hasLatestSubmission && (
              <button
                onClick={onEditLatestSubmission}
                className="w-full mt-2.5 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold text-[#1e3a8a] bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/70 transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#1e3a8a]" />
                <span>ดู/แก้ไขข้อมูลที่ลงทะเบียนล่าสุด</span>
              </button>
            )}
          </div>
        ) : hasLatestSubmission ? (
          <div className="mb-5">
            <button
              onClick={onEditLatestSubmission}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold text-[#1e3a8a] bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/70 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#1e3a8a]" />
              <span>ดู/แก้ไขข้อมูลที่ลงทะเบียนล่าสุด</span>
            </button>
          </div>
        ) : null}

        {/* Category Filters with Clickable X/X badge for Select All */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              หมวดหมู่หลักสูตร (CATEGORIES)
            </h3>
            {/* Clickable 5/5 Badge to Select All Categories */}
            <button
              type="button"
              onClick={onToggleAllCategories}
              title={
                isAllSelected
                  ? 'คลิกเพื่อยกเลิกการเลือกทั้งหมด (Deselect All)'
                  : 'คลิกเพื่อเลือกทุกหมวดหลักสูตร (Select All Categories)'
              }
              className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                isAllSelected
                  ? 'bg-[#1e3a8a] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{selectedCategories.length}/{CATEGORIES.length}</span>
            </button>
          </div>

          <div className="space-y-1.5">
            {CATEGORIES.map((cat) => {
              const isChecked = selectedCategories.includes(cat.key);
              const count = categoryCounts[cat.key] || 0;

              return (
                <button
                  key={cat.key}
                  onClick={() => onToggleCategory(cat.key)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer text-left border ${
                    isChecked
                      ? 'bg-slate-50/90 border-slate-200/90 text-slate-900 shadow-2xs font-semibold'
                      : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate mr-2">
                    <span
                      className="w-3 h-3 rounded-md shadow-2xs shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate">{cat.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        count > 0 ? 'bg-slate-100 text-slate-700' : 'text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                    {isChecked ? (
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

      {/* Footer Admin Section (Bottom of Left Sidebar - CSS selector 6: debossed/embossed tactile button) */}
      <div className="pt-3.5 space-y-2 mt-auto border-t border-slate-200/60">
        {isAdmin ? (
          <div className="p-3 neu-inset rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1e3a8a]">
                <ShieldCheck className="w-4 h-4 text-[#1e3a8a]" />
                <span>โหมดผู้ดูแลระบบ (Admin)</span>
              </div>
              <button
                onClick={onExitAdmin}
                title="ออกจากโหมดผู้ดูแลระบบ"
                className="text-slate-400 hover:text-rose-500 cursor-pointer p-1 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={onOpenAdminManage}
              className="w-full py-1.5 px-3 text-xs font-bold neu-btn text-slate-700 hover:text-[#1e3a8a] rounded-lg transition-all cursor-pointer text-center"
            >
              จัดการข้อมูลการลงทะเบียน
            </button>

            {/* Google Sheets link visible ONLY to Admin */}
            <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
              <span>Google Sheet ID:</span>
              <a
                href={`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                title="เปิด Google Sheets ในแท็บใหม่"
                className="flex items-center gap-1 text-[#1e3a8a] hover:underline font-mono"
              >
                1gqp55...
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        ) : (
          /* General User: Clean Admin Login Button at the bottom of left sidebar (CSS selector 6) */
          <button
            onClick={onOpenAdminLogin}
            className="w-full py-2.5 px-3 text-xs font-bold text-slate-700 hover:text-[#1e3a8a] neu-btn rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-[#1e3a8a]" />
            <span>เข้าสู่ระบบผู้ดูแล (Admin Login)</span>
          </button>
        )}
      </div>
    </aside>
  );
};
