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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="rounded-2xl w-full max-w-lg overflow-hidden flex flex-col bg-white border border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="p-5 relative border-b border-slate-100 bg-slate-50/70">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2 pr-10">
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-md border border-black/5"
              style={{ backgroundColor: event.color, color: event.textColor || '#0f172a' }}
            >
              {event.category}
            </span>

            {isAdmin && event.formSheet && (
              <span className="text-[11px] font-mono font-semibold text-[#1e3a8a] bg-blue-50 border border-blue-200/70 px-2 py-0.5 rounded-md">
                Sheet: {event.formSheet}
              </span>
            )}
          </div>

          <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-snug">{event.title}</h3>
        </div>

        {/* Body Details */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3.5 bg-slate-50/80 p-4 rounded-xl border border-slate-200/60">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                วันที่อบรม (Date)
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                <Calendar className="w-4 h-4 text-[#1e3a8a] shrink-0" />
                <span>
                  {event.start} {event.end && event.end !== event.start ? ` ถึง ${event.end}` : ''}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                เวลา (Time)
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                <Clock className="w-4 h-4 text-[#1e3a8a] shrink-0" />
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
            <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
                สถานะการลงทะเบียน (Registration Status)
              </span>

              {isOpen ? (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 mb-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>เปิดรับลงทะเบียนในระบบ</span>
                  </div>

                  {(event.openDate || event.closeDate) && (
                    <div className="text-[11px] text-slate-600 mb-3 bg-slate-50 border border-slate-200/60 p-2.5 rounded-lg font-medium">
                      <span>เปิด: {event.openDate || '-'}</span>
                      <span className="mx-2">·</span>
                      <span>ปิด: {event.closeDate || '-'}</span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      onClose();
                      onStartRegistration(event);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1e3a8a] to-[#172554] hover:from-[#172554] hover:to-[#0f172a] shadow-xs cursor-pointer transition-all"
                  >
                    <UserCheck className="w-4 h-4 text-white" />
                    <span>คลิกเพื่อลงทะเบียนหลักสูตรนี้ (Register Now)</span>
                  </button>
                </div>
              ) : isClosed ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span>ปิดรับลงทะเบียนแล้ว (Closed)</span>
                </div>
              ) : null}
            </div>
          )}

          {/* Location */}
          {event.location && (
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                สถานที่ / ช่องทางออนไลน์ (Location)
              </span>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200/60 p-3 rounded-xl">
                <MapPin className="w-4 h-4 text-[#1e3a8a] shrink-0" />
                <span className="break-words">{event.location}</span>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                รายละเอียดหลักสูตร (Description)
              </span>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl whitespace-pre-wrap font-normal">
                {event.description}
              </p>
            </div>
          )}
        </div>

        {/* Admin Footer Actions */}
        {isAdmin && (
          <div className="p-4 flex items-center justify-between bg-slate-50/80 border-t border-slate-200">
            <span className="text-xs font-semibold text-slate-500">จัดการหลักสูตร (Admin)</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onEdit(event);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#1e3a8a] bg-white hover:bg-slate-50 border border-slate-200 cursor-pointer transition-colors"
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 cursor-pointer transition-colors"
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
