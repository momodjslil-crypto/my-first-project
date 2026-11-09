import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Lock, Mail, Phone, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { api, setStoredToken } from '../api/client';
import { User } from '../types';

interface AdminSetupProps {
  onSetupSuccess: (user: User) => void;
}

export const AdminSetup: React.FC<AdminSetupProps> = ({ onSetupSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    nationalId: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError('يرجى ملء جميع الحقول الإلزامية');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('كلمة المرور وتأكيد كلمة المرور غير متطابقين');
      return;
    }

    if (formData.password.length < 6) {
      setError('يجب ألا تقل كلمة المرور عن 6 أحرف أو أرقام');
      return;
    }

    try {
      setLoading(true);
      const res = await api.setupAdmin(formData);
      setStoredToken(res.token);
      onSetupSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'فشلت عملية إنشاء حساب المسؤول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center p-4 sm:p-6 text-slate-100">
      <div className="w-full max-w-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-10 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-2">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            تهيئة المنصة · إنشاء حساب المسؤول الرئيسي (الملك)
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            مرحباً بك في منصة تكافل التعاونية. تبدأ المنصة فارغة من الصفر. يُرجى إنشاء حساب المسؤول ذي الصلاحيات الإدارية الكاملة لإدارة المجموعات، إثباتات الدفع، وإعدادات بريدي موب.
          </p>
        </div>

        {/* Warning Note */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-200">تنبيه حماية النظام:</p>
            <p className="leading-relaxed">
              عملية التأسيس متاحة <span className="underline font-bold">مرة واحدة فقط</span>. سيحصل هذا الحساب تلقائياً على رتبة المسؤول الرئيسي (الملك) بصلاحيات شاملة غير قابلة للإلغاء من قبل أي عضو أو منسق.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                الاسم الكامل <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="مثال: محمد بن علي"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                البريد الإلكتروني للإدارة <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  dir="ltr"
                  placeholder="admin@takaful-dz.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-left"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                كلمة المرور <span className="text-rose-400">*</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                تأكيد كلمة المرور <span className="text-rose-400">*</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                رقم الهاتف الجزائري (اختياري)
              </label>
              <input
                type="tel"
                dir="ltr"
                placeholder="05 / 06 / 07 XX XX XX XX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-left"
              />
            </div>

            {/* National ID / Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                رقم بطاقة التعريف أو مرجع إداري
              </label>
              <input
                type="text"
                placeholder="مرجع إداري خاص بالمسؤول"
                value={formData.nationalId}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm sm:text-base shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>اعتماد حساب المسؤول الرئيسي وبدء تشغيل المنصة</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
          منصة تكافل التعاونية · نظام الادخار التضامني والدفع عبر بريدي موب بالدينار الجزائري
        </div>

      </div>
    </div>
  );
};
