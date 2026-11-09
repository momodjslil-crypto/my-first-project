import React, { useState } from 'react';
import { api, setStoredToken } from '../api/client';
import { User } from '../types';
import { Lock, Mail, User as UserIcon, Phone, X, AlertCircle, CheckCircle2, ShieldCheck, KeyRound } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  initialInviteCode?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialInviteCode,
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>(initialInviteCode ? 'register' : 'login');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register State
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    groupInviteCode: initialInviteCode || '',
  });

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setLoading(true);
      const res = await api.login(loginEmail, loginPassword);
      setStoredToken(res.token);
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'بيانات الدخول غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (regData.password !== regData.confirmPassword) {
      setError('كلمة المرور وتأكيد كلمة المرور غير متطابقين');
      return;
    }

    if (regData.password.length < 6) {
      setError('يجب ألا تقل كلمة المرور عن 6 أحرف');
      return;
    }

    try {
      setLoading(true);
      const res = await api.register(regData);
      setStoredToken(res.token);
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'فشل إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setLoading(true);
      const res = await api.forgotPassword(forgotEmail, newPassword);
      setSuccess(res.message);
      setTimeout(() => {
        setTab('login');
        setLoginEmail(forgotEmail);
        setLoginPassword(newPassword);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'فشلت استعادة كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Brand Header */}
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-sm">
            ت
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {tab === 'login' && 'تسجيل الدخول إلى حسابك'}
            {tab === 'register' && 'إنشاء حساب عضو جديد'}
            {tab === 'forgot' && 'استرجاع كلمة المرور'}
          </h3>
          <p className="text-xs text-slate-500">
            منصة تكافل التعاونية للادخار والحلقات الدائرية
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
              setSuccess(null);
            }}
            className={`py-2 rounded-lg transition-colors cursor-pointer ${
              tab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
              setSuccess(null);
            }}
            className={`py-2 rounded-lg transition-colors cursor-pointer ${
              tab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تسجيل عضو جديد
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* Tab 1: Login */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                البريد الإلكتروني <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                dir="ltr"
                placeholder="name@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-900 text-left focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  كلمة المرور <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTab('forgot');
                    setError(null);
                  }}
                  className="text-[11px] text-emerald-700 hover:underline cursor-pointer"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'جاري التحقق...' : 'دخول'}
            </button>
          </form>
        )}

        {/* Tab 2: Register */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                الاسم الكامل <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="الاسم واللقب"
                value={regData.name}
                onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                البريد الإلكتروني <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                dir="ltr"
                placeholder="name@example.com"
                value={regData.email}
                onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-900 text-left focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  كلمة المرور <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  تأكيد الكلمة <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={regData.confirmPassword}
                  onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                رقم الهاتف الجزائري
              </label>
              <input
                type="tel"
                dir="ltr"
                placeholder="05 / 06 / 07 XX XX XX XX"
                value={regData.phone}
                onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-900 text-left focus:outline-none focus:border-emerald-600"
              />
            </div>

            {regData.groupInviteCode && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                🔗 رمز الدعوة المفعل: <span className="font-mono font-bold">{regData.groupInviteCode}</span> (سيتم إرسال طلب انضمام للحلقة مباشرة).
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'جاري التسجيل...' : 'إنشاء حساب عضو جديد'}
            </button>
          </form>
        )}

        {/* Tab 3: Forgot Password */}
        {tab === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                بريدك الإلكتروني المسجل <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                dir="ltr"
                placeholder="name@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-900 text-left focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                كلمة المرور الجديدة <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTab('login')}
                className="flex-1 py-2 px-3 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
              >
                {loading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
