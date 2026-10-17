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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2e3440]/30 backdrop-blur-xs">
      <div className="neu-card rounded-3xl w-full max-w-md overflow-hidden flex flex-col bg-[#e0e5ec]">
        {/* Header */}
        <div className="p-5 flex items-center justify-between neu-card-sm bg-[#e0e5ec]">
          <div>
            <h3 className="text-base font-black text-[#2e3440] tracking-tight">
              เลือกหลักสูตรที่ต้องการลงทะเบียน
            </h3>
            <p className="text-xs text-[#7b889b] font-medium mt-0.5">
              หลักสูตรที่เปิดรับลงทะเบียนในขณะนี้ ({openCourses.length} หลักสูตร)
            </p>
          </div>
          <button
            onClick={onClose}
            className="neu-btn p-2 rounded-xl text-[#7b889b] hover:text-rose-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Course List */}
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {openCourses.length === 0 ? (
            <div className="text-center py-8 text-[#7b889b] text-xs font-semibold">
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
                className="w-full text-left p-3.5 rounded-2xl neu-card-sm hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-between group cursor-pointer bg-[#e0e5ec]"
              >
                <div className="min-w-0 pr-2">
                  <span
                    className="text-[10px] font-black px-2.5 py-0.5 rounded-lg inline-block mb-1 shadow-2xs"
                    style={{ backgroundColor: c.color, color: c.textColor || '#2e3440' }}
                  >
                    {c.category}
                  </span>
                  <h4 className="text-xs font-black text-[#2e3440] group-hover:text-[#5e81ac] transition-colors truncate">
                    {c.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-[#7b889b] mt-1 font-semibold">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#5e81ac]" />
                      {c.start}
                    </span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl neu-inset-sm flex items-center justify-center text-[#5e81ac] shrink-0 group-hover:scale-105 transition-all">
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
