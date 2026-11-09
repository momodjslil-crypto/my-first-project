import React, { useState, useEffect } from 'react';
import { JoinRequest, GroupCreationRequest } from '../../types';
import { api } from '../../api/client';
import { Inbox, CheckCircle2, XCircle, Clock, Users, Layers, AlertCircle } from 'lucide-react';

export const AdminRequests: React.FC = () => {
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [groupRequests, setGroupRequests] = useState<GroupCreationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'join' | 'groups'>('join');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const [joins, proposals] = await Promise.all([
        api.getAllJoinRequests(),
        api.getAllGroupRequests(),
      ]);
      setJoinRequests(joins);
      setGroupRequests(proposals);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل تحميل الطلبات' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApproveJoin = async (id: string) => {
    try {
      setActionLoading(true);
      const res = await api.approveJoinRequest(id);
      setJoinRequests((prev) => prev.map((r) => (r.id === id ? res.request : r)));
      setFeedback({ type: 'success', text: 'تمت الموافقة على طلب الانضمام وإدراج العضو في الحلقة الدائرية' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل قبول الطلب' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectJoin = async (id: string) => {
    try {
      setActionLoading(true);
      const res = await api.rejectJoinRequest(id);
      setJoinRequests((prev) => prev.map((r) => (r.id === id ? res.request : r)));
      setFeedback({ type: 'success', text: 'تم رفض طلب الانضمام' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل رفض الطلب' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveGroup = async (id: string) => {
    try {
      setActionLoading(true);
      const res = await api.approveGroupRequest(id);
      setGroupRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
      setFeedback({ type: 'success', text: `تم اعتماد مجموعة ${res.group.name} وتعيين صاحبها منسقاً لها وتوليد رابطها المستقل` });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل اعتماد المجموعة' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectGroup = async (id: string) => {
    try {
      setActionLoading(true);
      const res = await api.rejectGroupRequest(id);
      setGroupRequests((prev) => prev.map((r) => (r.id === id ? res.proposal : r)));
      setFeedback({ type: 'success', text: 'تم رفض مقترح إنشاء المجموعة' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل رفض المقترح' });
    } finally {
      setActionLoading(false);
    }
  };

  const pendingJoins = joinRequests.filter((r) => r.status === 'pending');
  const pendingGroups = groupRequests.filter((r) => r.status === 'pending');

  return (
    <div className="space-y-6">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Inbox className="w-6 h-6 text-emerald-700" />
            <span>إدارة الطلبات الواردة والمقترحات</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            مراجعة طلبات الانضمام عبر روابط الدعوة، ومقترحات الأعضاء لإنشاء مجموعات جديدة وتعيين المنظمين.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('join')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'join' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            طلبات الانضمام ({pendingJoins.length})
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'groups' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            مقترحات المجموعات ({pendingGroups.length})
          </button>
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

      {/* Tab 1: Join Requests */}
      {activeTab === 'join' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center text-slate-500">جاري التحميل...</div>
          ) : joinRequests.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-xs">
              لا توجد طلبات انضمام واردة حالياً.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-right border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-3 px-4">العضو</th>
                    <th className="py-3 px-4">رقم العضوية</th>
                    <th className="py-3 px-4">المجموعة المطلوبة</th>
                    <th className="py-3 px-4">الهاتف</th>
                    <th className="py-3 px-4">التاريخ</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4 text-center">القرار</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {joinRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-900">{req.userName}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{req.membershipNo}</td>
                      <td className="py-3 px-4 font-medium text-emerald-800">{req.groupName}</td>
                      <td className="py-3 px-4 font-mono text-slate-600" dir="ltr">{req.userPhone || '—'}</td>
                      <td className="py-3 px-4 text-slate-500 tabular-nums">{req.createdAt.split('T')[0]}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            req.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : req.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {req.status === 'pending' ? 'قيد المراجعة' : req.status === 'approved' ? 'مقبول' : 'مرفوض'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {req.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleApproveJoin(req.id)}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                            >
                              قبول
                            </button>
                            <button
                              onClick={() => handleRejectJoin(req.id)}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                            >
                              رفض
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">مكتمل</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Group Creation Proposals */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center text-slate-500">جاري التحميل...</div>
          ) : groupRequests.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-xs">
              لا توجد مقترحات لإنشاء مجموعات حالياً.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupRequests.map((prop) => (
                <div key={prop.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-900 text-sm">{prop.groupName}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        prop.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : prop.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {prop.status === 'pending' ? 'بانتظار موافقة الملك' : prop.status === 'approved' ? 'معتمدة' : 'مرفوضة'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">مقدم المقترح (المنسق المرشح):</span>
                      <span className="font-semibold text-slate-800">{prop.userName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">المبلغ المقترح للدورة:</span>
                      <span className="font-bold text-emerald-700 tabular-nums">{prop.tierAmount.toLocaleString()} دج</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">دورية الاستحقاق:</span>
                      <span>{prop.cycleDuration === 'monthly' ? 'شهرية' : 'أسبوعية'}</span>
                    </div>
                    {prop.reason && (
                      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 italic">
                        "{prop.reason}"
                      </div>
                    )}
                  </div>

                  {prop.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleRejectGroup(prop.id)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg font-semibold cursor-pointer"
                      >
                        رفض
                      </button>
                      <button
                        onClick={() => handleApproveGroup(prop.id)}
                        disabled={actionLoading}
                        className="px-4 py-1.5 text-xs text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg font-semibold cursor-pointer shadow-sm"
                      >
                        اعتماد وتعيين منسقاً
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
