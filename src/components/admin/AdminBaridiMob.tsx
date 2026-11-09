import React, { useState, useEffect } from 'react';
import { BaridiMobConfig } from '../../types';
import { api } from '../../api/client';
import { CreditCard, Save, ShieldAlert, CheckCircle2, History, AlertTriangle, Copy, Check } from 'lucide-react';

export const AdminBaridiMob: React.FC = () => {
  const [config, setConfig] = useState<BaridiMobConfig | null>(null);
  const [formData, setFormData] = useState({
    holderName: '',
    rip: '',
    cle: '',
    phone: '',
    notes: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await api.getBaridiMob();
      setConfig(data);
      setFormData({
        holderName: data.holderName || '',
        rip: data.rip || '',
        cle: data.cle || '',
        phone: data.phone || '',
        notes: data.notes || '',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل تحميل بيانات بريدي موب');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!formData.holderName.trim() || !formData.rip.trim()) {
      setErrorMsg('اسم صاحب الحساب ورقم الـ RIP مطلوبان');
      return;
    }

    try {
      setSaving(true);
      const res = await api.updateBaridiMob(formData);
      setConfig(res.baridiMob);
      setSuccessMsg('تم تحديث بيانات بريدي موب بنجاح وإرسال إشعار لكافة الأعضاء وتسجيل العملية في السجل الإداري.');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل حفظ التعديلات');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-2 text-xs">جاري تحميل بيانات بريدي موب...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-700" />
            <span>إدارة معلومات الدفع عبر بريدي موب (BaridiMob)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            الحساب البريدي الرسمي المعتمد لاستقبال مساهمات الأعضاء. التعديل متاح حصرياً للمسؤول الرئيسي (الملك).
          </p>
        </div>

        {config?.lastUpdated && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <History className="w-4 h-4 text-slate-400" />
            <span>
              آخر تحديث: <span className="font-semibold">{config.lastUpdated.split('T')[0]}</span> بواسطة <span className="font-semibold text-slate-700">{config.updatedByAdminName}</span>
            </span>
          </div>
        )}
      </div>

      {/* Critical Security Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-950">تنبيه أمان وخصوصية الأعضاء الإلزامي:</p>
          <p className="leading-relaxed">
            المنصة لا تطلب إطلاقاً من الأعضاء إدخال الرقم السري لبطاقة الذهبية، رمز OTP، أو كلمة مرور بريدي موب. يدخل العضو إلى تطبيقه الرسمي بنفسه ويجري التحويل إلى الـ RIP الموضح أدناه، ثم يرفع صورة الوصل فقط.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Form Card */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Account Holder Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                اسم صاحب الحساب البريدي <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="الاسم واللقب كما هو مدون في الصك البريدي"
                value={formData.holderName}
                onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {/* RIP */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                رقم الحساب البريدي الجاري RIP (20 رقماً) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                dir="ltr"
                placeholder="00799999000000000000"
                value={formData.rip}
                onChange={(e) => setFormData({ ...formData, rip: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-left"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Clé */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  المفتاح Clé
                </label>
                <input
                  type="text"
                  dir="ltr"
                  placeholder="مثال: 45"
                  value={formData.cle}
                  onChange={(e) => setFormData({ ...formData, cle: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-left"
                />
              </div>

              {/* Contact Phone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  رقم الهاتف المالي المرتبط
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  placeholder="05 / 06 / 07 XX XX XX XX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-left"
                />
              </div>
            </div>

            {/* Transfer Notes / Instructions */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                إرشادات التحويل الموجهة للأعضاء
              </label>
              <textarea
                rows={3}
                placeholder="توجيهات تظهر للعضو أثناء التحويل (مثلاً: يُرجى ذكر رقم العضوية في خانة الملاحظات داخل تطبيق بريدي موب)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ ونشر التعديل لجميع الأعضاء'}</span>
            </button>
          </form>
        </div>

        {/* Live Preview Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            معاينة البطاقة كما يراها الأعضاء:
          </div>

          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-6 shadow-xl border border-slate-700 relative overflow-hidden">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  B
                </div>
                <span className="font-bold tracking-tight text-sm">بريدي موب · BaridiMob</span>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                الحساب الرسمي
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">صاحب الحساب:</span>
                <span className="font-bold text-base text-white">
                  {formData.holderName || 'اسم صاحب الحساب'}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-slate-400">رقم الحساب RIP:</span>
                  {formData.rip && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formData.rip, 'rip')}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'rip' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'rip' ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                  )}
                </div>
                <div className="font-mono text-sm sm:text-base text-emerald-300 font-semibold tracking-wider bg-slate-800/80 p-2.5 rounded-lg border border-slate-700 text-left" dir="ltr">
                  {formData.rip || '00799999000000000000'}
                </div>
              </div>

              {formData.cle && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400 text-[11px]">المفتاح Clé:</span>
                  <span className="font-mono font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
                    {formData.cle}
                  </span>
                </div>
              )}
            </div>

            {formData.notes && (
              <div className="mt-4 pt-3 border-t border-slate-700/60 text-[11px] text-slate-300 leading-relaxed">
                📌 {formData.notes}
              </div>
            )}

          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-800 block">ضوابط التحويل:</span>
            <p>1. يحظر على المنظمين أو أي مستخدم آخر تعديل هذه البيانات.</p>
            <p>2. يتم تدوين هوية المسؤول وتاريخ التعديل في سجل الشفافية وسجل التدقيق الإداري.</p>
          </div>

        </div>

      </div>

    </div>
  );
};
