import React from 'react';
import { TrainingEvent } from '../types';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  FileText,
  UserCheck,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header with category color strip */}
        <div
          className="p-5 relative border-b border-slate-100"
          style={{
            background: `linear-gradient(135deg, ${event.color}40 0%, #ffffff 100%)`,
          }}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-xs font-bold px-3 py-1 rounded-full border border-black/5"
              style={{ backgroundColor: event.color, color: event.textColor || '#1e293b' }}
            >
              {event.category}
            </span>

            {isAdmin && event.formSheet && (
              <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                Sheet: {event.formSheet}
              </span>
            )}
          </div>

          <h3 className="text-xl font-black text-slate-900 leading-snug">{event.title}</h3>
        </div>

        {/* Body Details */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
            <div>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                วันที่อบรม (Date)
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  {event.start} {event.end && event.end !== event.start ? ` ถึง ${event.end}` : ''}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                เวลา (Time)
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
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
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                สถานะการลงทะเบียน (Registration Status)
              </span>

              {isOpen ? (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>เปิดรับลงทะเบียนในระบบ</span>
                  </div>

                  {(event.openDate || event.closeDate) && (
                    <div className="text-[11px] text-slate-500 mb-3 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/60">
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
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-colors btn-attention cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>คลิกเพื่อลงทะเบียนหลักสูตรนี้ (Register Now)</span>
                  </button>
                </div>
              ) : isClosed ? (
                <div className="flex items-center gap-2 text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span>ปิดรับลงทะเบียนแล้ว (Closed)</span>
                </div>
              ) : null}
            </div>
          )}

          {/* Location */}
          {event.location && (
            <div>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                สถานที่ / ช่องทางออนไลน์ (Location)
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="text-break">{event.location}</span>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                รายละเอียดหลักสูตร (Description)
              </span>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60 whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}
        </div>

        {/* Admin Footer Actions */}
        {isAdmin && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">จัดการหลักสูตร (Admin)</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onEdit(event);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer"
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
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
