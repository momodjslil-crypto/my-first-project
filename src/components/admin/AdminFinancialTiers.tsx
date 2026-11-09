import React, { useState, useEffect } from 'react';
import { FinancialTier } from '../../types';
import { api } from '../../api/client';
import { Coins, Save, CheckCircle2, AlertCircle, ToggleLeft, ToggleRight, Edit2 } from 'lucide-react';

export const AdminFinancialTiers: React.FC = () => {
  const [tiers, setTiers] = useState<FinancialTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTiers = async () => {
    try {
      setLoading(true);
      const data = await api.getFinancialTiers();
      setTiers(data);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل تحميل الفئات المالية' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTiers();
  }, []);

  const handleUpdateAmount = (id: string, newAmount: number) => {
    setTiers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, amount: newAmount } : t))
    );
  };

  const handleToggleActive = (id: string) => {
    setTiers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t))
    );
  };

  const handleUpdateName = (id: string, name: string) => {
    setTiers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name } : t))
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.updateFinancialTiers(tiers);
      setTiers(res.financialTiers);
      setFeedback({ type: 'success', text: 'تم حفظ وتحديث الفئات المالية التكافلية بنجاح' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل حفظ الفئات' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Coins className="w-6 h-6 text-emerald-700" />
            <span>إدارة الفئات المالية التكافلية (بالدينار الجزائري DZD)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ضبط مبالغ الحلقات الدائرية (2000 دج، 3000 دج، 4000 دج، والفئة المخصصة الإدارية)، وحالات التفعيل والإيقاف.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${
            feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" /> : <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-xs">جاري تحميل الفئات...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tiers.map((tier, idx) => (
            <div
              key={tier.id}
              className={`bg-white border rounded-2xl p-6 shadow-sm transition-all space-y-4 ${
                tier.isActive ? 'border-slate-200' : 'border-slate-200/60 opacity-60 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={tier.name}
                    onChange={(e) => handleUpdateName(tier.id, e.target.value)}
                    className="font-bold text-slate-900 text-sm bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleActive(tier.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    tier.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tier.isActive ? 'نشطة' : 'متوقفة'}
                </button>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500">
                  قيمة المساهمة لكل دورة (دج)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="500"
                    step="500"
                    value={tier.amount}
                    onChange={(e) => handleUpdateAmount(tier.id, parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-base font-extrabold text-emerald-800 tabular-nums focus:outline-none focus:border-emerald-600 font-mono"
                  />
                  <span className="absolute left-4 top-3 text-xs font-bold text-slate-400">
                    دج
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                {tier.description}
              </p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>مثال لحلقة من 10 أعضاء:</span>
                <span className="font-bold text-slate-700 tabular-nums">
                  وعاء الاستحقاق = {(tier.amount * 10).toLocaleString()} دج
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sharia & Legal Integrity Notice */}
      <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 text-xs text-emerald-950 space-y-1.5 leading-relaxed">
        <h4 className="font-bold text-emerald-900 flex items-center gap-1.5 text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>ضوابط العدالة التكافلية وحظر الربا والتسويق الهرمي</span>
        </h4>
        <p>
          جميع المبالغ المستلمة في الحلقات الدائرية هي مساهمات متساوية تُرد بالكامل لأصحابها في أدوارهم المحددة دون زيادة ولا نقصان (قرض حسن وتكافل تضامني خالص).
        </p>
        <p>
          يُحظر في المنصة ربط أي مبالغ أو استحقاقات بجلب أعضاء جدد، وتخضع جميع الحلقات لجدول زمني دائري محدد مسبقاً بشفافية كاملة.
        </p>
      </div>

    </div>
  );
};
