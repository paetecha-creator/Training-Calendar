import React, { useState } from 'react';
import { X, ShieldCheck, User, KeyRound } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  onGoogleSignIn?: () => Promise<void>;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onGoogleSignIn,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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

  const handleGoogleClick = async () => {
    if (!onGoogleSignIn) return;
    setErrorMsg(null);
    setIsGoogleLoading(true);
    try {
      await onGoogleSignIn();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="rounded-2xl w-full max-w-sm overflow-hidden flex flex-col bg-white border border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="p-5 flex items-center justify-between bg-slate-50/80 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#1e3a8a]" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">เข้าสู่ระบบผู้ดูแล (Admin Login)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-600">
              {errorMsg}
            </div>
          )}

          {/* Quick Google Sign-In for Direct Google Sheets Sync */}
          {onGoogleSignIn && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-xs cursor-pointer transition-all disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isGoogleLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google (ซิงค์ Sheets อัตโนมัติ)'}</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  หรือใช้รหัสผ่าน Admin
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                ชื่อผู้ใช้ (Username)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Admin"
                  autoComplete="off"
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]/20 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]/20 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1e3a8a] to-[#172554] hover:from-[#172554] hover:to-[#0f172a] shadow-xs cursor-pointer transition-all mt-2"
            >
              เข้าสู่ระบบ (Sign In)
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
