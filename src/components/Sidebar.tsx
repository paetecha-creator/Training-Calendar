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
    <aside className="w-full lg:w-72 xl:w-80 h-full neu-card rounded-3xl p-4 md:p-5 flex flex-col justify-between shrink-0 overflow-y-auto bg-[#e0e5ec]">
      <div>
        {/* Company Logo & Subheading */}
        <div className="flex flex-col items-center justify-center text-center mb-5 pb-4">
          <TohokuLogo size="lg" className="justify-center mb-1.5" />
          <span className="text-[11px] font-bold text-[#7b889b] uppercase tracking-widest">
            Corporate Training Plan
          </span>
        </div>

        {/* Quick Registration Button */}
        {openCoursesCount > 0 ? (
          <div className="mb-5">
            <button
              onClick={onOpenRegisterModal}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm neu-btn-accent cursor-pointer btn-attention tracking-wide"
            >
              <UserCheck className="w-4.5 h-4.5 text-white" />
              <span>ลงทะเบียนอบรม ({openCoursesCount} หลักสูตร)</span>
            </button>

            {hasLatestSubmission && (
              <button
                onClick={onEditLatestSubmission}
                className="w-full mt-2.5 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-[#5e81ac] neu-btn cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#5e81ac]" />
                <span>ดู/แก้ไขข้อมูลที่ลงทะเบียนล่าสุด</span>
              </button>
            )}
          </div>
        ) : (
          <div className="mb-5 p-3.5 neu-inset rounded-2xl text-center">
            <p className="text-xs font-semibold text-[#7b889b]">ขณะนี้ยังไม่มีหลักสูตรเปิดรับลงทะเบียน</p>
          </div>
        )}

        {/* Category Filters with Clickable X/X badge for Select All */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black text-[#4c566a] uppercase tracking-wider">
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
              className={`flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                isAllSelected
                  ? 'neu-btn-accent text-white'
                  : 'neu-btn text-[#4c566a]'
              }`}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{selectedCategories.length}/{CATEGORIES.length}</span>
            </button>
          </div>

          <div className="space-y-2">
            {CATEGORIES.map((cat) => {
              const isChecked = selectedCategories.includes(cat.key);
              const count = categoryCounts[cat.key] || 0;

              return (
                <button
                  key={cat.key}
                  onClick={() => onToggleCategory(cat.key)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${
                    isChecked
                      ? 'neu-card-sm text-[#2e3440]'
                      : 'neu-inset-sm text-[#7b889b] opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate mr-2">
                    <span
                      className="w-3.5 h-3.5 rounded-lg shadow-sm shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate">{cat.label}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${
                        count > 0 ? 'neu-inset-sm text-[#3b4252]' : 'text-[#7b889b]'
                      }`}
                    >
                      {count}
                    </span>
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-[#5e81ac]" />
                    ) : (
                      <Square className="w-4 h-4 text-[#9aa5b5]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Admin Section (Bottom of Left Sidebar) */}
      <div className="pt-3.5 space-y-2 mt-auto">
        {isAdmin ? (
          <div className="p-3.5 neu-inset rounded-2xl">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-[#5e81ac]">
                <ShieldCheck className="w-4 h-4 text-[#5e81ac]" />
                <span>โหมดผู้ดูแลระบบ (Admin)</span>
              </div>
              <button
                onClick={onExitAdmin}
                title="ออกจากโหมดผู้ดูแลระบบ"
                className="text-[#7b889b] hover:text-rose-500 cursor-pointer p-1 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={onOpenAdminManage}
              className="w-full py-2 px-3 text-xs font-bold neu-btn text-[#3b4252] hover:text-[#5e81ac] rounded-xl transition-all cursor-pointer text-center"
            >
              จัดการข้อมูลการลงทะเบียน
            </button>

            {/* Google Sheets link visible ONLY to Admin */}
            <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between text-[10px] text-[#7b889b]">
              <span>Google Sheet ID:</span>
              <a
                href={`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                title="เปิด Google Sheets ในแท็บใหม่"
                className="flex items-center gap-1 text-[#5e81ac] hover:underline font-mono"
              >
                1gqp55...
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        ) : (
          /* General User: Clean Admin Login Button at the bottom of left sidebar */
          <button
            onClick={onOpenAdminLogin}
            className="w-full py-2.5 px-3 text-xs font-bold text-[#3b4252] hover:text-[#2e3440] neu-btn rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-[#5e81ac]" />
            <span>เข้าสู่ระบบผู้ดูแล (Admin Login)</span>
          </button>
        )}
      </div>
    </aside>
  );
};
