import React, { useState, useEffect } from 'react';
import { TrainingEvent, TrainingCategory } from '../types';
import { CATEGORY_COLORS } from '../services/sheetsService';
import { X, Save, Calendar, Settings } from 'lucide-react';

interface EventFormModalProps {
  isOpen: boolean;
  event: TrainingEvent | null;
  initialDate?: string;
  onClose: () => void;
  onSave: (payload: Partial<TrainingEvent> & { title: string; start: string }) => void;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  event,
  initialDate,
  onClose,
  onSave,
}) => {
  const [category, setCategory] = useState<TrainingCategory>('Soft Skill Training');
  const [color, setColor] = useState('#FFF2CC');
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState<string>('ไม่ต้องลงทะเบียน');
  const [formSheet, setFormSheet] = useState<string>('');
  const [openDate, setOpenDate] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (event) {
      setCategory((event.category as TrainingCategory) || 'Soft Skill Training');
      setColor(event.color || CATEGORY_COLORS[event.category as TrainingCategory] || '#FFF2CC');
      setTitle(event.title || '');
      setStart(event.start || '');
      setEnd(event.end || event.start || '');
      setStartTime(event.startTime || '');
      setEndTime(event.endTime || '');
      setStatus(event.status || 'ไม่ต้องลงทะเบียน');
      setFormSheet(event.formSheet || '');
      setOpenDate(event.openDate || '');
      setCloseDate(event.closeDate || '');
      setLocation(event.location || '');
      setDescription(event.description || '');
    } else {
      const defaultDate = initialDate || new Date().toISOString().split('T')[0];
      setCategory('Soft Skill Training');
      setColor(CATEGORY_COLORS['Soft Skill Training']);
      setTitle('');
      setStart(defaultDate);
      setEnd(defaultDate);
      setStartTime('09:00');
      setEndTime('16:00');
      setStatus('ไม่ต้องลงทะเบียน');
      setFormSheet('');
      setOpenDate('');
      setCloseDate('');
      setLocation('');
      setDescription('');
    }
  }, [event, initialDate, isOpen]);

  if (!isOpen) return null;

  const handleCategoryChange = (newCat: TrainingCategory) => {
    setCategory(newCat);
    setColor(CATEGORY_COLORS[newCat] || '#D8DEE9');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !start) {
      alert('กรุณาระบุหัวข้อและวันที่เริ่มต้น');
      return;
    }
    if (end && start > end) {
      alert('วันที่สิ้นสุดห้ามน้อยกว่าวันที่เริ่มต้น');
      return;
    }

    onSave({
      id: event ? event.id : undefined,
      category,
      title: title.trim(),
      start,
      end: end || start,
      startTime,
      endTime,
      location: location.trim(),
      description: description.trim(),
      color,
      status,
      formSheet,
      openDate,
      closeDate,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2e3440]/30 backdrop-blur-xs">
      <div className="neu-card rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-[#e0e5ec]">
        {/* Header */}
        <div className="p-5 flex items-center justify-between neu-card-sm bg-[#e0e5ec]">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#5e81ac]" />
            <h3 className="text-base md:text-lg font-black text-[#2e3440] tracking-tight">
              {event ? 'แก้ไขแผนงานอบรม (Edit Course)' : 'เพิ่มแผนงานอบรมใหม่ (Add Course)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="neu-btn p-2 rounded-xl text-[#7b889b] hover:text-rose-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 md:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Category & Color */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-black text-[#4c566a] uppercase tracking-wider block mb-1.5">
                หมวดหมู่ (Category)
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as TrainingCategory)}
                className="w-full text-xs font-semibold p-2.5 neu-input rounded-xl"
              >
                <option value="Soft Skill Training">Soft Skill Training</option>
                <option value="Technical Skills Training">Technical Skills Training</option>
                <option value="HSE and ISO Training">HSE and ISO Training</option>
                <option value="Orientation">Orientation</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-black text-[#4c566a] uppercase tracking-wider block mb-1.5">
                สีประจำหลักสูตร (Color)
              </label>
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value.toUpperCase())}
                  className="w-10 h-10 p-0.5 rounded-xl neu-card-sm cursor-pointer"
                />
                <input
                  type="text"
                  value={color}
                  maxLength={7}
                  onChange={(e) => setColor(e.target.value.toUpperCase())}
                  className="flex-1 text-xs font-mono font-bold p-2.5 neu-input rounded-xl uppercase"
                />
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[11px] font-black text-[#4c566a] uppercase tracking-wider block mb-1.5">
              ชื่อหลักสูตร (Course Title) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="ระบุชื่อหลักสูตรอบรม"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs font-bold p-2.5 neu-input rounded-xl"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-black text-[#4c566a] uppercase tracking-wider block mb-1.5">
                วันที่เริ่มต้น (Start Date) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full text-xs font-medium p-2.5 neu-input rounded-xl"
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-[#4c566a] uppercase tracking-wider block mb-1.5">
                วันที่สิ้นสุด (End Date)
              </label>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full text-xs font-medium p-2.5 neu-input rounded-xl"
              />
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-black text-[#4c566a] uppercase tracking-wider block mb-1.5">
                เวลาเริ่ม (Start Time)
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-xs font-medium p-2.5 neu-input rounded-xl"
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-[#4c566a] uppercase tracking-wider block mb-1.5">
                เวลาสิ้นสุด (End Time)
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full text-xs font-medium p-2.5 neu-input rounded-xl"
              />
            </div>
          </div>

          {/* Registration Settings Section */}
          <div className="p-4.5 neu-inset rounded-3xl space-y-3.5">
            <div className="flex items-center gap-1.5 text-xs font-black text-[#5e81ac]">
              <Settings className="w-4 h-4 text-[#5e81ac]" />
              <span>การตั้งค่าการลงทะเบียน (Registration Settings)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-black text-[#4c566a] uppercase tracking-wider block mb-1.5">
                  สถานะการลงทะเบียน (Status)
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 neu-input rounded-xl"
                >
                  <option value="ไม่ต้องลงทะเบียน">ไม่ต้องลงทะเบียน (No Registration)</option>
                  <option value="เปิด">เปิด (Open)</option>
                  <option value="ปิด">ปิด (Closed)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black text-[#4c566a] uppercase tracking-wider block mb-1.5">
                  ชีตบันทึกข้อมูล (Form Sheet)
                </label>
                <select
                  value={formSheet}
                  onChange={(e) => setFormSheet(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 neu-input rounded-xl font-mono"
                >
                  <option value="">- ไม่ใช้ฟอร์ม -</option>
                  <option value="Register-1">Register-1</option>
                  <option value="Register-2">Register-2</option>
                  <option value="Register-3">Register-3</option>
                  <option value="Register-4">Register-4</option>
                  <option value="Register-5">Register-5</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-black text-[#4c566a] uppercase tracking-wider block mb-1.5">
                  วันเริ่มเปิดรับลงทะเบียน (Open Date)
                </label>
                <input
                  type="date"
                  value={openDate}
                  onChange={(e) => setOpenDate(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 neu-input rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-[#4c566a] uppercase tracking-wider block mb-1.5">
                  วันปิดรับลงทะเบียน (Close Date)
                </label>
                <input
                  type="date"
                  value={closeDate}
                  onChange={(e) => setCloseDate(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 neu-input rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-[11px] font-black text-[#4c566a] uppercase tracking-wider block mb-1.5">
              สถานที่อบรม / ลิงก์ออนไลน์ (Location / Online Meeting)
            </label>
            <input
              type="text"
              placeholder="เช่น ห้องประชุม 1 อาคารบริหาร หรือ MS Teams Link"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full text-xs font-medium p-2.5 neu-input rounded-xl"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-black text-[#4c566a] uppercase tracking-wider block mb-1.5">
              คำอธิบายหลักสูตร (Description)
            </label>
            <textarea
              rows={3}
              placeholder="วัตถุประสงค์และรายละเอียดการอบรม..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs font-medium p-2.5 neu-input rounded-xl"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#4c566a] neu-btn cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black neu-btn-accent cursor-pointer"
            >
              <Save className="w-4 h-4 text-white" />
              <span>บันทึกหลักสูตร (Save Course)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
