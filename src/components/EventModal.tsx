import React from 'react';
import { TrainingEvent } from '../types';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface EventModalProps {
  event: TrainingEvent | null;
  onClose: () => void;
  isAdmin: boolean;
  onStartRegistration: (event: TrainingEvent) => void;
  onEdit: (event: TrainingEvent) => void;
  onDelete: (eventId: string) => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  event,
  onClose,
  isAdmin,
  onStartRegistration,
  onEdit,
  onDelete,
}) => {
  if (!event) return null;

  const isOpen = event.status === 'เปิด';
  const isClosed = event.status === 'ปิด';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2e3440]/30 backdrop-blur-xs">
      <div className="neu-card rounded-3xl w-full max-w-lg overflow-hidden flex flex-col bg-[#e0e5ec]">
        {/* Header */}
        <div className="p-5 relative neu-card-sm bg-[#e0e5ec]">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 neu-btn p-2 rounded-xl text-[#7b889b] hover:text-rose-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2 pr-10">
            <span
              className="text-xs font-black px-3 py-1 rounded-xl shadow-xs"
              style={{ backgroundColor: event.color, color: event.textColor || '#2e3440' }}
            >
              {event.category}
            </span>

            {isAdmin && event.formSheet && (
              <span className="text-[11px] font-mono font-bold text-[#5e81ac] neu-inset-sm px-2 py-0.5 rounded-lg">
                Sheet: {event.formSheet}
              </span>
            )}
          </div>

          <h3 className="text-lg md:text-xl font-black text-[#2e3440] leading-snug">{event.title}</h3>
        </div>

        {/* Body Details */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3.5 neu-inset p-4 rounded-2xl">
            <div>
              <span className="text-[11px] font-black text-[#7b889b] uppercase tracking-wider block mb-1">
                วันที่อบรม (Date)
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2e3440]">
                <Calendar className="w-4 h-4 text-[#5e81ac] shrink-0" />
                <span>
                  {event.start} {event.end && event.end !== event.start ? ` ถึง ${event.end}` : ''}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-black text-[#7b889b] uppercase tracking-wider block mb-1">
                เวลา (Time)
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2e3440]">
                <Clock className="w-4 h-4 text-[#5e81ac] shrink-0" />
                <span>
                  {event.startTime && event.endTime
                    ? `${event.startTime} - ${event.endTime} น.`
                    : event.startTime
                    ? `เริ่ม ${event.startTime} น.`
                    : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Registration Status */}
          {event.status !== 'ไม่ต้องลงทะเบียน' && (
            <div className="p-4 rounded-2xl neu-card-sm bg-[#e0e5ec]">
              <span className="text-[11px] font-black text-[#7b889b] uppercase tracking-wider block mb-2.5">
                สถานะการลงทะเบียน (Registration Status)
              </span>

              {isOpen ? (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#5e81ac] mb-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#5e81ac]" />
                    <span>เปิดรับลงทะเบียนในระบบ</span>
                  </div>

                  {(event.openDate || event.closeDate) && (
                    <div className="text-[11px] text-[#4c566a] mb-3 neu-inset-sm p-2.5 rounded-xl font-medium">
                      <span>เปิด: {event.openDate || '-'}</span>
                      <span className="mx-2">|</span>
                      <span>ปิด: {event.closeDate || '-'}</span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      onClose();
                      onStartRegistration(event);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-black neu-btn-accent cursor-pointer btn-attention"
                  >
                    <UserCheck className="w-4 h-4 text-white" />
                    <span>คลิกเพื่อลงทะเบียนหลักสูตรนี้ (Register Now)</span>
                  </button>
                </div>
              ) : isClosed ? (
                <div className="flex items-center gap-2 text-xs font-bold text-rose-500 neu-inset-sm p-2.5 rounded-xl">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span>ปิดรับลงทะเบียนแล้ว (Closed)</span>
                </div>
              ) : null}
            </div>
          )}

          {/* Location */}
          {event.location && (
            <div>
              <span className="text-[11px] font-black text-[#7b889b] uppercase tracking-wider block mb-1">
                สถานที่ / ช่องทางออนไลน์ (Location)
              </span>
              <div className="flex items-center gap-2 text-xs font-bold text-[#2e3440] neu-inset p-3.5 rounded-2xl">
                <MapPin className="w-4 h-4 text-[#5e81ac] shrink-0" />
                <span className="break-words">{event.location}</span>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div>
              <span className="text-[11px] font-black text-[#7b889b] uppercase tracking-wider block mb-1">
                รายละเอียดหลักสูตร (Description)
              </span>
              <p className="text-xs text-[#3b4252] leading-relaxed neu-inset p-3.5 rounded-2xl whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}
        </div>

        {/* Admin Footer Actions */}
        {isAdmin && (
          <div className="p-4 neu-card-sm flex items-center justify-between bg-[#e0e5ec]">
            <span className="text-xs font-bold text-[#7b889b]">จัดการหลักสูตร (Admin)</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onEdit(event);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold neu-btn text-[#5e81ac] cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>แก้ไข (Edit)</span>
              </button>
              <button
                onClick={() => {
                  if (confirm(`คุณต้องการลบหลักสูตร "${event.title}" หรือไม่?`)) {
                    onDelete(event.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold neu-btn text-rose-500 hover:text-rose-600 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบ (Delete)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
