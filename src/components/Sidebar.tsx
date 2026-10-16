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
  { key: 'Other', label: 'Other (อื่นๆ)', color: '#EAEAEA' },
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
    <aside className="w-full lg:w-72 xl:w-80 h-full bg-white border border-slate-200/80 rounded-2xl p-4 md:p-5 shadow-xs flex flex-col justify-between shrink-0 overflow-y-auto">
      <div>
        {/* Company Logo & Subheading */}
        <div className="flex flex-col items-center justify-center text-center mb-5 pb-4 border-b border-slate-100">
          <TohokuLogo size="lg" className="justify-center mb-1.5" />
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            Corporate Training Plan
          </span>
        </div>

        {/* Quick Registration Button */}
        {openCoursesCount > 0 ? (
          <div className="mb-5">
            <button
              onClick={onOpenRegisterModal}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-slate-900 shadow-md hover:shadow-lg transition-all btn-attention cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-slate-900" />
              <span>ลงทะเบียนอบรม ({openCoursesCount} หลักสูตร)</span>
            </button>

            {hasLatestSubmission && (
              <button
                onClick={onEditLatestSubmission}
                className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>ดู/แก้ไขข้อมูลที่ลงทะเบียนล่าสุด</span>
              </button>
            )}
          </div>
        ) : (
          <div className="mb-5 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <p className="text-xs font-medium text-slate-500">ขณะนี้ยังไม่มีหลักสูตรเปิดรับลงทะเบียน</p>
          </div>
        )}

        {/* Category Filters with Clickable X/X badge for Select All */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">
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
              className={`flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
                isAllSelected
                  ? 'bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-400/30'
                  : 'bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 border border-slate-300'
              }`}
            >
              <CheckCheck className="w-3 h-3" />
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
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                    isChecked
                      ? 'bg-slate-50 text-slate-900 border border-slate-200 shadow-2xs'
                      : 'text-slate-400 hover:bg-slate-50/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate mr-2">
                    <span
                      className="w-3.5 h-3.5 rounded-md border border-slate-300 shadow-2xs shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate">{cat.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                        count > 0 ? 'bg-white text-slate-700 border border-slate-200' : 'text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
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

      {/* Footer Admin Section (Bottom of Left Sidebar) */}
      <div className="pt-3 border-t border-slate-100 space-y-2 mt-auto">
        {isAdmin ? (
          <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <ShieldCheck className="w-4 h-4" />
                <span>โหมดผู้ดูแลระบบ (Admin)</span>
              </div>
              <button
                onClick={onExitAdmin}
                title="ออกจากโหมดผู้ดูแลระบบ"
                className="text-slate-400 hover:text-rose-400 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={onOpenAdminManage}
              className="w-full py-2 px-3 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer text-center"
            >
              จัดการข้อมูลการลงทะเบียน
            </button>

            {/* Google Sheets link visible ONLY to Admin */}
            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>Google Sheet ID:</span>
              <a
                href={`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                title="เปิด Google Sheets ในแท็บใหม่"
                className="flex items-center gap-1 text-blue-400 hover:underline font-mono"
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
            className="w-full py-2.5 px-3 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <span>เข้าสู่ระบบผู้ดูแล (Admin Login)</span>
          </button>
        )}
      </div>
    </aside>
  );
};
