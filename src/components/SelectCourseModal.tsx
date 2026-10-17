import React from 'react';
import { TrainingEvent } from '../types';
import { X, Calendar, ChevronRight } from 'lucide-react';

interface SelectCourseModalProps {
  isOpen: boolean;
  openCourses: TrainingEvent[];
  onClose: () => void;
  onSelectCourse: (course: TrainingEvent) => void;
}

export const SelectCourseModal: React.FC<SelectCourseModalProps> = ({
  isOpen,
  openCourses,
  onClose,
  onSelectCourse,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="rounded-2xl w-full max-w-md overflow-hidden flex flex-col bg-white border border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="p-5 flex items-center justify-between bg-slate-50/80 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              เลือกหลักสูตรที่ต้องการลงทะเบียน
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              หลักสูตรที่เปิดรับลงทะเบียนในขณะนี้ ({openCourses.length} หลักสูตร)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Course List */}
        <div className="p-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
          {openCourses.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-semibold">
              ยังไม่มีหลักสูตรที่เปิดรับลงทะเบียนในขณะนี้
            </div>
          ) : (
            openCourses.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  onSelectCourse(c);
                  onClose();
                }}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-[#1e3a8a]/40 hover:shadow-xs hover:bg-slate-50/50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="min-w-0 pr-2">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md inline-block mb-1 border border-black/5"
                    style={{ backgroundColor: c.color, color: c.textColor || '#0f172a' }}
                  >
                    {c.category}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#1e3a8a] transition-colors truncate">
                    {c.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#1e3a8a]" />
                      {c.start}
                    </span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/70 flex items-center justify-center text-[#1e3a8a] shrink-0 group-hover:bg-[#1e3a8a] group-hover:text-white transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
