import React, { useState, useEffect } from 'react';
import { HolidayItem } from '../types';
import { X, Calendar, Save, Sparkles, Tag, FileText } from 'lucide-react';

interface HolidayFormModalProps {
  isOpen: boolean;
  holiday: HolidayItem | null;
  initialDate?: string;
  onClose: () => void;
  onSave: (data: Partial<HolidayItem> & { date: string; name: string }) => Promise<void>;
}

const HOLIDAY_CATEGORIES = [
  'วันหยุดนักขัตฤกษ์',
  'วันหยุดบริษัท',
  'วันหยุดชดเชย',
  'วันหยุดพิเศษตามประกาศ',
];

export const HolidayFormModal: React.FC<HolidayFormModalProps> = ({
  isOpen,
  holiday,
  initialDate,
  onClose,
  onSave,
}) => {
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('วันหยุดนักขัตฤกษ์');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (holiday) {
      setDate(holiday.date || '');
      setName(holiday.name || '');
      setCategory(holiday.category || 'วันหยุดนักขัตฤกษ์');
      setDescription(holiday.description || '');
    } else {
      const defaultDate = initialDate || new Date().toISOString().split('T')[0];
      setDate(defaultDate);
      setName('');
      setCategory('วันหยุดนักขัตฤกษ์');
      setDescription('');
    }
    setErrorMsg(null);
  }, [holiday, initialDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !name.trim()) {
      setErrorMsg('กรุณาระบุวันที่และชื่อวันหยุดให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onSave({
        id: holiday?.id,
        date,
        name: name.trim(),
        category,
        description: description.trim(),
      });
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="rounded-2xl w-full max-w-md overflow-hidden flex flex-col bg-white border border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="p-5 flex items-center justify-between bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 border-b border-rose-200/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {holiday ? 'แก้ไขข้อมูลวันหยุดประจำปี' : 'เพิ่มข้อมูลวันหยุดประจำปี'}
              </h3>
              <p className="text-[11px] text-slate-600 font-medium">
                บันทึกลงฐานข้อมูล Firebase เรียลไทม์ และแสดงบนปฏิทินทันที
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-white/80 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-600">
              {errorMsg}
            </div>
          )}

          {/* Holiday Date */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              วันที่วันหยุด (Holiday Date) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 outline-none"
              />
            </div>
          </div>

          {/* Holiday Name */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              ชื่อวันหยุด (Holiday Name) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น วันขึ้นปีใหม่, วันสงกรานต์, วันหยุดพิเศษประจำปี"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              ประเภทวันหยุด (Category)
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 outline-none"
              >
                {HOLIDAY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              คำอธิบายเพิ่มเติม (Description)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <textarea
                rows={2}
                placeholder="ระบุหมายเหตุหรือรายละเอียดเพิ่มเติม (ถ้ามี)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกวันหยุด'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
