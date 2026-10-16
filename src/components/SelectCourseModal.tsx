import React from 'react';
import { TrainingEvent } from '../types';
import { X, Calendar, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              เลือกหลักสูตรที่ต้องการลงทะเบียน
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              หลักสูตรที่เปิดรับลงทะเบียนในขณะนี้ ({openCourses.length} หลักสูตร)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Course List */}
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {openCourses.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
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
                className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="min-w-0 pr-2">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1 border border-black/5"
                    style={{ backgroundColor: c.color, color: c.textColor || '#1e293b' }}
                  >
                    {c.category}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {c.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {c.start}
                    </span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-slate-400 shrink-0 transition-all">
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
