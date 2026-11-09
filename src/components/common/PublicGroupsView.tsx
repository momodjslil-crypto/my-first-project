import React, { useState, useEffect } from 'react';
import { CircularGroup, User } from '../../types';
import { api } from '../../api/client';
import { CircularRingVisualizer } from '../admin/CircularRingVisualizer';
import {
  Layers,
  Crown,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
} from 'lucide-react';

interface PublicGroupsViewProps {
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const PublicGroupsView: React.FC<PublicGroupsViewProps> = ({ currentUser, onOpenAuth }) => {
  const [groups, setGroups] = useState<CircularGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewGroup, setPreviewGroup] = useState<CircularGroup | null>(null);
  const [slotToReserve, setSlotToReserve] = useState<{ group: CircularGroup; slotNumber: number } | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await api.getGroups();
      setGroups(data);
      if (data.length > 0) {
        setPreviewGroup((prev) => (prev ? data.find((g) => g.id === prev.id) || data[0] : data[0]));
      }
    } catch (err) {
      console.error('Failed to load groups', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleSelectVacantSlot = (group: CircularGroup, slotNumber: number) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setSlotToReserve({ group, slotNumber });
  };

  const handleConfirmReservation = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!slotToReserve) return;

    try {
      setActionLoading(true);
      const res = await api.joinSlot({
        groupId: slotToReserve.group.id,
        slotNumber: slotToReserve.slotNumber,
      });
      setFeedback({
        type: 'success',
        text: `تم حجز المقعد رقم ${slotToReserve.slotNumber} بنجاح في حلقة "${res.group.name}". توجه إلى لوحة حسابك لرفع وصل تحويل ${res.group.tierAmount.toLocaleString()} دج لملك الحلقة.`,
      });
      setSlotToReserve(null);
      await fetchGroups();
      setTimeout(() => setFeedback(null), 7000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل حجز المقعد' });
    } finally {
      setActionLoading(false);
    }
  };

  const copyInvite = (group: CircularGroup) => {
    const inviteUrl = `${window.location.origin}?invite=${group.inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedCodeId(group.id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-700" />
            <span>الحلقات التكافلية الدائرية (الملك في الوسط + 7 مقاعد)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            اختر حلقتك واحجز مقعدك الشاغر من بين المقاعد السبعة المحيطة بالملك، وساهم في دورة التكافل المالي المباشر.
          </p>
        </div>
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
        <div className="p-12 text-center text-slate-500 text-xs">جاري تحميل الحلقات...</div>
      ) : groups.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <Layers className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">لا توجد حلقات دائرية مفتوحة حالياً</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            تبدأ المنصة نظيفة تماماً. سيقوم المسؤول الرئيسي بفتح الحلقات الأولى وإتاحة المقاعد السبعة للمشاركين.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Active Preview Visualizer */}
          {previewGroup && (
            <div className="space-y-3">
              <CircularRingVisualizer
                group={previewGroup}
                currentUserId={currentUser?.id}
                onSelectVacantSlot={(slotNum) => handleSelectVacantSlot(previewGroup, slotNum)}
              />
            </div>
          )}

          {/* Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => {
              const slots = group.slots || [];
              const occupiedCount = slots.filter((s) => s.userId !== null).length;
              const isFull = occupiedCount >= 7;
              const isSelected = previewGroup?.id === group.id;
              const potAmount = group.potAmount || group.tierAmount * 7;

              return (
                <div
                  key={group.id}
                  className={`bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 transition-all ${
                    isSelected ? 'border-emerald-600 ring-2 ring-emerald-600/10' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {group.code}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          group.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {group.status === 'active' ? 'نشطة' : 'متوقفة'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-base text-slate-900">{group.name}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-amber-800 font-bold mt-1">
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                        <span>الملك الحالي: {group.kingName}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">المساهمة لكل مقعد:</span>
                        <span className="font-extrabold text-emerald-800 tabular-nums">
                          {group.tierAmount.toLocaleString()} دج
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">الوعاء الكامل للملك:</span>
                        <span className="font-black text-slate-900 tabular-nums">
                          {potAmount.toLocaleString()} دج (7 × {group.tierAmount.toLocaleString()} دج)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">المقاعد المحجوزة:</span>
                        <span className="font-mono font-bold text-slate-700">
                          {occupiedCount} / 7 مقاعد
                        </span>
                      </div>
                    </div>

                    {group.notes && (
                      <p className="text-xs text-slate-600 italic">
                        "{group.notes}"
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setPreviewGroup(group)}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                    >
                      معاينة المقاعد
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => copyInvite(group)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
                        title="نسخ رابط دعوة الحلقة"
                      >
                        {copiedCodeId === group.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>

                      {isFull ? (
                        <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-semibold">
                          الحلقة مكتملة
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setPreviewGroup(group);
                            const firstVacant = (group.slots || []).find((s) => s.userId === null);
                            if (firstVacant) {
                              handleSelectVacantSlot(group, firstVacant.slotNumber);
                            }
                          }}
                          disabled={group.status !== 'active'}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-40"
                        >
                          احجز مقعداً شاغراً
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Reserve Vacant Slot Modal */}
      {slotToReserve && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>حجز المقعد رقم {slotToReserve.slotNumber} في "{slotToReserve.group.name}"</span>
              </h4>
              <button
                onClick={() => setSlotToReserve(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border">
                <div className="flex justify-between">
                  <span>المبلغ المطلوب دفعه للملك:</span>
                  <span className="font-extrabold text-emerald-800 tabular-nums">
                    {slotToReserve.group.tierAmount.toLocaleString()} دج
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>ملك الحلقة (مستلم المساهمة):</span>
                  <span className="font-bold text-slate-800">{slotToReserve.group.kingName}</span>
                </div>
                <div className="flex justify-between">
                  <span>رقم المقعد الذي ستحجزه:</span>
                  <span className="font-bold text-emerald-700 font-mono">المقعد #{slotToReserve.slotNumber}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1 text-[11px] leading-relaxed">
                <span className="font-bold block">تنبيه الشفافية:</span>
                <p>
                  عند تأكيد الحجز، ستلتزم بتحويل {slotToReserve.group.tierAmount.toLocaleString()} دج لحساب بريدي موب الخاص بملك الحلقة ورفع صورة الوصل للاعتماد.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSlotToReserve(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmReservation}
                disabled={actionLoading}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'جاري الحجز...' : `تأكيد حجز المقعد #${slotToReserve.slotNumber}`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

