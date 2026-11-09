import React, { useState, useEffect } from 'react';
import { CircularGroup, FinancialTier, User } from '../../types';
import { api } from '../../api/client';
import { CircularRingVisualizer } from './CircularRingVisualizer';
import {
  Layers,
  Plus,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  X,
  Crown,
  CreditCard,
  History,
  ShieldCheck,
} from 'lucide-react';

export const AdminGroups: React.FC = () => {
  const [groups, setGroups] = useState<CircularGroup[]>([]);
  const [tiers, setTiers] = useState<FinancialTier[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Active group selected for Ring Visualizer
  const [selectedGroup, setSelectedGroup] = useState<CircularGroup | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditKingBaridiMobModal, setShowEditKingBaridiMobModal] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  // Form Data for New Group
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    tierId: '',
    kingUserId: '',
    cycleDuration: 'monthly',
    notes: '',
  });

  // Form Data for King BaridiMob
  const [kingBaridiMobForm, setKingBaridiMobForm] = useState({
    holderName: '',
    rip: '',
    cle: '',
    phone: '',
    notes: '',
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupsData, tiersData, membersData] = await Promise.all([
        api.getGroups(),
        api.getFinancialTiers(),
        api.getMembers(),
      ]);
      setGroups(groupsData);
      setTiers(tiersData);
      setMembers(membersData);

      if (groupsData.length > 0) {
        if (!selectedGroup) {
          setSelectedGroup(groupsData[0]);
        } else {
          const updated = groupsData.find((g) => g.id === selectedGroup.id);
          if (updated) setSelectedGroup(updated);
        }
      }

      if (tiersData.length > 0 && !newGroupData.tierId) {
        setNewGroupData((prev) => ({ ...prev, tierId: tiersData[0].id }));
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل تحميل بيانات المجموعات' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupData.name.trim() || !newGroupData.tierId) return;

    try {
      setActionLoading(true);
      const res = await api.createGroup(newGroupData);
      setGroups((prev) => [...prev, res.group]);
      setSelectedGroup(res.group);
      setShowCreateModal(false);
      setNewGroupData({
        name: '',
        tierId: tiers[0]?.id || '',
        kingUserId: '',
        cycleDuration: 'monthly',
        notes: '',
      });
      setFeedback({
        type: 'success',
        text: `تم إنشاء حلقة "${res.group.name}" بنجاح مع الملك (${res.group.kingName}) وتجهيز المقاعد السبعة الشاغرة.`,
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل إنشاء الحلقة' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (group: CircularGroup) => {
    const nextStatus = group.status === 'active' ? 'paused' : 'active';
    try {
      setActionLoading(true);
      const res = await api.updateGroup(group.id, { status: nextStatus });
      setGroups((prev) => prev.map((g) => (g.id === group.id ? res.group : g)));
      if (selectedGroup?.id === group.id) setSelectedGroup(res.group);
      setFeedback({
        type: 'success',
        text: `تم تغيير حالة الحلقة إلى: ${nextStatus === 'active' ? 'نشطة' : 'متوقفة مؤقتاً'}`,
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل تغيير حالة الحلقة' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerateInvite = async (group: CircularGroup) => {
    try {
      setActionLoading(true);
      const res = await api.regenerateGroupInvite(group.id);
      const updated = { ...group, inviteCode: res.inviteCode };
      setGroups((prev) => prev.map((g) => (g.id === group.id ? updated : g)));
      if (selectedGroup?.id === group.id) setSelectedGroup(updated);
      setFeedback({ type: 'success', text: 'تم تجديد رابط الدعوة المستقل للحلقة بنجاح' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل تجديد الرابط' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGroup = async (group: CircularGroup) => {
    if (!window.confirm(`هل أنت متأكد من حذف حلقة "${group.name}"؟`)) {
      return;
    }

    try {
      setActionLoading(true);
      await api.deleteGroup(group.id);
      setGroups((prev) => prev.filter((g) => g.id !== group.id));
      if (selectedGroup?.id === group.id) {
        setSelectedGroup(groups.find((g) => g.id !== group.id) || null);
      }
      setFeedback({ type: 'success', text: 'تم حذف الحلقة بنجاح' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل حذف الحلقة' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifySlotPayment = async (slotNumber: number, action: 'approve' | 'reject', reason?: string) => {
    if (!selectedGroup) return;
    try {
      setActionLoading(true);
      const res = await api.verifySlot(selectedGroup.id, slotNumber, action, reason);
      setGroups((prev) => prev.map((g) => (g.id === selectedGroup.id ? res.group : g)));
      setSelectedGroup(res.group);
      setFeedback({
        type: 'success',
        text: action === 'approve'
          ? `تم اعتماد دفع المقعد رقم ${slotNumber} للملك (${res.group.kingName}) بنجاح ✓`
          : `تم رفض وصل المقعد رقم ${slotNumber}`,
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل مراجعة دفع المقعد' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransitionRoles = async () => {
    if (!selectedGroup) return;
    if (!window.confirm(`تأكيد انتقال الأدوار لحلقة "${selectedGroup.name}": سيتوج العضو في المقعد رقم 1 كملك جديد، وينتقل الملك الحالي إلى المقعد رقم 7؟`)) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.transitionRoles(selectedGroup.id);
      setGroups((prev) => prev.map((g) => (g.id === selectedGroup.id ? res.group : g)));
      setSelectedGroup(res.group);
      setFeedback({
        type: 'success',
        text: `تم انتقال الأدوار وتتويج الملك الجديد (${res.group.kingName}) بنجاح وإرسال الإشعارات وتوثيق العملية في سجل الشفافية.`,
      });
      setTimeout(() => setFeedback(null), 6000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل انتقال الأدوار' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenKingBaridiMobModal = () => {
    if (!selectedGroup) return;
    setKingBaridiMobForm({
      holderName: selectedGroup.kingBaridiMob?.holderName || selectedGroup.kingName,
      rip: selectedGroup.kingBaridiMob?.rip || '',
      cle: selectedGroup.kingBaridiMob?.cle || '',
      phone: selectedGroup.kingBaridiMob?.phone || '',
      notes: selectedGroup.kingBaridiMob?.notes || '',
    });
    setShowEditKingBaridiMobModal(true);
  };

  const handleSaveKingBaridiMob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    try {
      setActionLoading(true);
      const res = await api.updateKingBaridiMob(selectedGroup.id, kingBaridiMobForm);
      setGroups((prev) => prev.map((g) => (g.id === selectedGroup.id ? res.group : g)));
      setSelectedGroup(res.group);
      setShowEditKingBaridiMobModal(false);
      setFeedback({ type: 'success', text: 'تم تحديث معلومات بريدي موب الخاصة بملك الحلقة بنجاح' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل تحديث بيانات بريدي موب' });
    } finally {
      setActionLoading(false);
    }
  };

  const copyInviteLink = (group: CircularGroup) => {
    const inviteUrl = `${window.location.origin}?invite=${group.inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInviteId(group.id);
    setTimeout(() => setCopiedInviteId(null), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-700" />
            <span>إدارة الحلقات التكافلية الدائرية (الملك في الوسط + 7 مقاعد)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            نظام الحلقات الدائرية المتتابعة: ملك في الوسط يستلم مساهمات 7 مقاعد، وانتقال تلقائي للأدوار عند اكتمال الدفع.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء حلقة دائرية جديدة</span>
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

      {/* Notice on Self-Service Model */}
      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold">قاعدة الانضمام الذاتي الشفاف:</span>
          <p className="text-amber-800 leading-relaxed">
            وفقاً لضوابط المنصة، لا يمكن للمسؤول ولا للأعضاء إدراج أسماء يدوياً في المقاعد. يقوم الأعضاء بالدخول إلى حساباتهم ولصق رابط دعوة الحلقة، ثم اختيار المقعد الشاغر (1 إلى 7) وحجزه بأنفسهم وتحويل المساهمة لحساب الملك.
          </p>
        </div>
      </div>

      {/* Active Group Visualizer Section */}
      {selectedGroup && (
        <div className="space-y-3">
          <CircularRingVisualizer
            group={selectedGroup}
            isSuperAdmin={true}
            onVerifySlot={handleVerifySlotPayment}
            onTransitionRoles={handleTransitionRoles}
            onUpdateKingBaridiMob={handleOpenKingBaridiMobModal}
          />

          {/* Role Transition History for selected group if any */}
          {selectedGroup.roleTransitionLogs && selectedGroup.roleTransitionLogs.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b pb-2">
                <History className="w-4 h-4 text-emerald-700" />
                <span>سجل انتقال الأدوار التاريخي لهذه الحلقة (الدورات المكتملة: {selectedGroup.completedCycles || 0})</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {selectedGroup.roleTransitionLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">
                        الدورة {log.round}: تتويج {log.toKingName} ملكاً جديداً
                      </span>
                      <span className="text-slate-500 block text-[11px]">
                        الملك السابق ({log.fromKingName}) استلم وعاءه ({log.totalCollected.toLocaleString()} دج) وانتقل للمقعد رقم 7.
                      </span>
                    </div>
                    <span className="font-mono text-slate-400 text-[11px]" dir="ltr">
                      {new Date(log.date).toLocaleDateString('ar-DZ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Groups List Table */}
      {loading ? (
        <div className="p-8 text-center text-slate-500">
          <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-xs">جاري تحميل الحلقات...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">لا توجد حلقات حالياً</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            تبدأ المنصة نظيفة تماماً دون مجموعات وهمية. انقر فوق الزر أعلاه لإنشاء أول حلقة دائرية واختيار الملك الأولي.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3.5 px-4">اسم الحلقة / الرمز</th>
                  <th className="py-3.5 px-4">الفئة والمساهمة</th>
                  <th className="py-3.5 px-4">ملك الحلقة (في الوسط)</th>
                  <th className="py-3.5 px-4">حالة المقاعد السبعة</th>
                  <th className="py-3.5 px-4">الوعاء الكامل للملك</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4">رابط الدعوة المستقل</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groups.map((group) => {
                  const isCurrent = selectedGroup?.id === group.id;
                  const slots = group.slots || [];
                  const occupiedCount = slots.filter((s) => s.userId !== null).length;
                  const paidCount = slots.filter((s) => s.userId !== null && s.paymentStatus === 'paid').length;
                  const pot = group.potAmount || group.tierAmount * 7;

                  return (
                    <tr
                      key={group.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCurrent ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      {/* Name & Code */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{group.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-emerald-700 text-white px-2 py-0.5 rounded-full font-medium">
                              المعروضة
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{group.code}</div>
                      </td>

                      {/* Tier */}
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-emerald-700 tabular-nums">
                          {group.tierAmount.toLocaleString()} دج
                        </span>
                        <span className="text-[10px] text-slate-400 block">لكل مقعد ({group.cycleDuration === 'monthly' ? 'شهرياً' : 'أسبوعياً'})</span>
                      </td>

                      {/* King */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900">
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                          <span>{group.kingName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{group.kingMembershipNo}</span>
                      </td>

                      {/* 7 Slots Status */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 tabular-nums">
                          {occupiedCount} / 7 مقاعد محجوزة
                        </div>
                        <div className="text-[11px] text-emerald-700 font-medium">
                          {paidCount} / 7 مدفوعة للملك
                        </div>
                      </td>

                      {/* Pot */}
                      <td className="py-3 px-4 font-black text-slate-900 tabular-nums">
                        {pot.toLocaleString()} دج
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            group.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {group.status === 'active' ? 'نشطة' : 'متوقفة'}
                        </span>
                      </td>

                      {/* Invite Link */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => copyInviteLink(group)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-slate-200"
                            title="نسخ رابط الدعوة للمجموعة"
                          >
                            {copiedInviteId === group.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                            )}
                            <span>{copiedInviteId === group.id ? 'تم النسخ' : 'نسخ الرابط'}</span>
                          </button>
                          
                          <button
                            onClick={() => handleRegenerateInvite(group)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 cursor-pointer"
                            title="تجديد رابط الدعوة"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* View Ring */}
                          <button
                            onClick={() => setSelectedGroup(group)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="معاينة الحلقة ومقاعدها"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Pause / Resume */}
                          <button
                            onClick={() => handleToggleStatus(group)}
                            className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title={group.status === 'active' ? 'إيقاف الحلقة' : 'تفعيل الحلقة'}
                          >
                            {group.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteGroup(group)}
                            className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف الحلقة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Group */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <span>إنشاء حلقة تكافلية دائرية جديدة (ملك في الوسط + 7 مقاعد)</span>
              </h4>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              
              {/* Group Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  اسم الحلقة التكافلية <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: حلقة الوفاء التكافلية الأولى"
                  value={newGroupData.name}
                  onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Financial Tier */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  الفئة المالية للمقعد <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newGroupData.tierId}
                  onChange={(e) => setNewGroupData({ ...newGroupData, tierId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                >
                  {tiers
                    .filter((t) => t.isActive)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.amount.toLocaleString()} دج لكل مقعد · الوعاء الكامل: {(t.amount * 7).toLocaleString()} دج)
                      </option>
                    ))}
                </select>
              </div>

              {/* King Selection (Optional, otherwise defaults to current creator) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  تعيين ملك الحلقة الأولي (في مركز الحلقة)
                </label>
                <select
                  value={newGroupData.kingUserId}
                  onChange={(e) => setNewGroupData({ ...newGroupData, kingUserId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="">-- المسؤول الحالي (الافتراضي) --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.membershipNo}) - {m.role === 'super_admin' ? 'المسؤول الرئيسي' : m.role === 'organizer' ? 'منسق' : 'عضو'}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500 block">
                  الملك هو الشخص الذي يتوسط الحلقة وتُدفع إليه مساهمات المقاعد السبعة في هذه الدورة.
                </span>
              </div>

              {/* Cycle Duration */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  دورية الاستحقاق
                </label>
                <select
                  value={newGroupData.cycleDuration}
                  onChange={(e) => setNewGroupData({ ...newGroupData, cycleDuration: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="monthly">شهرية (كل شهر)</option>
                  <option value="biweekly">نصف شهرية (كل أسبوعين)</option>
                  <option value="weekly">أسبوعية</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  تعليمات وضوابط خاصة بالحلقة
                </label>
                <textarea
                  rows={2}
                  placeholder="تعليمات أو شروط خاصة بهذه الحلقة..."
                  value={newGroupData.notes}
                  onChange={(e) => setNewGroupData({ ...newGroupData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'جاري الإنشاء...' : 'إنشاء الحلقة وتوليد الرابط المستقل'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit King's BaridiMob Info */}
      {showEditKingBaridiMobModal && selectedGroup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-700" />
                <span>تعديل بريدي موب لملك الحلقة: {selectedGroup.kingName}</span>
              </h4>
              <button
                onClick={() => setShowEditKingBaridiMobModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKingBaridiMob} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  اسم صاحب الحساب (الملك)
                </label>
                <input
                  type="text"
                  required
                  value={kingBaridiMobForm.holderName}
                  onChange={(e) => setKingBaridiMobForm({ ...kingBaridiMobForm, holderName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  رقم الحساب البريدي RIP (20 رقماً)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  required
                  placeholder="00799999000000000000"
                  value={kingBaridiMobForm.rip}
                  onChange={(e) => setKingBaridiMobForm({ ...kingBaridiMobForm, rip: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    المفتاح Clé
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={2}
                    placeholder="99"
                    value={kingBaridiMobForm.cle}
                    onChange={(e) => setKingBaridiMobForm({ ...kingBaridiMobForm, cle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    placeholder="05XXXXXXXX"
                    value={kingBaridiMobForm.phone}
                    onChange={(e) => setKingBaridiMobForm({ ...kingBaridiMobForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  ملاحظات أو توجيهات التحويل
                </label>
                <textarea
                  rows={2}
                  value={kingBaridiMobForm.notes}
                  onChange={(e) => setKingBaridiMobForm({ ...kingBaridiMobForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditKingBaridiMobModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'جاري الحفظ...' : 'حفظ البيانات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

