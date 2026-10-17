import React, { useState } from 'react';
import { X, ShieldCheck, User, KeyRound } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Verify credentials
    if (username.trim() === 'Admin' && password.trim() === '122333') {
      onLoginSuccess();
      setUsername('');
      setPassword('');
      onClose();
    } else {
      setErrorMsg('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2e3440]/30 backdrop-blur-xs">
      <div className="neu-card rounded-3xl w-full max-w-sm overflow-hidden flex flex-col bg-[#e0e5ec]">
        {/* Header */}
        <div className="p-5 flex items-center justify-between neu-card-sm bg-[#e0e5ec]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#5e81ac]" />
            <h3 className="text-base font-black text-[#2e3440] tracking-tight">เข้าสู่ระบบผู้ดูแล (Admin Login)</h3>
          </div>
          <button
            onClick={onClose}
            className="neu-btn p-2 rounded-xl text-[#7b889b] hover:text-rose-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleLogin} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 neu-inset rounded-2xl text-xs font-bold text-rose-500">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="text-[11px] font-black text-[#4c566a] uppercase tracking-wider block mb-1.5">
              ชื่อผู้ใช้ (Username)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#7b889b] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder=""
                autoComplete="off"
                className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold neu-input rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-[#4c566a] uppercase tracking-wider block mb-1.5">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#7b889b] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
                autoComplete="current-password"
                className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold neu-input rounded-xl"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl text-xs font-black neu-btn-accent cursor-pointer mt-3"
          >
            เข้าสู่ระบบ (Sign In)
          </button>
        </form>
      </div>
    </div>
  );
};
