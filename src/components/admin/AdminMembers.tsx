import React, { useState, useEffect } from 'react';
import { User, CircularGroup } from '../../types';
import { api } from '../../api/client';
import { Users, UserPlus, Shield, UserX, UserCheck, Trash2, Search, CheckCircle2, AlertCircle, X, ShieldAlert } from 'lucide-react';

export const AdminMembers: React.FC = () => {
  const [members, setMembers] = useState<User[]>([]);
  const [groups, setGroups] = useState<CircularGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newMemberData, setNewMemberData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'member',
    groupId: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [membersData, groupsData] = await Promise.all([api.getMembers(), api.getGroups()]);
      setMembers(membersData);
      setGroups(groupsData);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل تحميل قائمة الأعضاء' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberData.name.trim() || !newMemberData.email.trim() || !newMemberData.password) return;

    try {
      setActionLoading(true);
      const res = await api.createMember(newMemberData);
      setMembers((prev) => [...prev, res.user]);
      setShowAddModal(false);
      setNewMemberData({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'member',
        groupId: '',
      });
      setFeedback({ type: 'success', text: `تمت إضافة العضو ${res.user.name} برقم العضوية ${res.user.membershipNo} بنجاح` });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل إضافة العضو' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (user.role === 'super_admin') return;
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';

    try {
      setActionLoading(true);
      await api.updateMemberStatus(user.id, nextStatus);
      setMembers((prev) => prev.map((m) => (m.id === user.id ? { ...m, status: nextStatus } : m)));
      setFeedback({ type: 'success', text: `تم تغيير حالة العضو إلى: ${nextStatus === 'active' ? 'نشط' : 'معلق'}` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل تعديل حالة العضو' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleRole = async (user: User) => {
    if (user.role === 'super_admin') return;
    const nextRole = user.role === 'organizer' ? 'member' : 'organizer';

    try {
      setActionLoading(true);
      await api.updateMemberRole(user.id, nextRole);
      setMembers((prev) => prev.map((m) => (m.id === user.id ? { ...m, role: nextRole } : m)));
      setFeedback({ type: 'success', text: `تم تحديث رتبة العضو إلى: ${nextRole === 'organizer' ? 'منسق/منظم' : 'عضو'}` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل ترقية العضو' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMember = async (user: User) => {
    if (user.role === 'super_admin') {
      alert('لا يمكن حذف المسؤول الرئيسي (الملك)');
      return;
    }

    if (!window.confirm(`هل أنت متأكد من حذف العضو ${user.name} (${user.membershipNo}) نهائياً؟`)) {
      return;
    }

    try {
      setActionLoading(true);
      await api.deleteMember(user.id);
      setMembers((prev) => prev.filter((m) => m.id !== user.id));
      setFeedback({ type: 'success', text: 'تم حذف العضو بنجاح' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل حذف العضو' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.membershipNo.toLowerCase().includes(q) ||
      (m.phone && m.phone.includes(q))
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-700" />
            <span>إدارة الأعضاء والمنظمين</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            سجل الأعضاء المعتمد، التحكم في أرقام العضوية، الصلاحيات، وحالات التفعيل والتعليق.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>إضافة عضو يدوياً</span>
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

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="ابحث بالاسم، رقم العضوية، أو البريد الإلكتروني..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
        />
      </div>

      {/* Members Table */}
      {loading ? (
        <div className="p-8 text-center text-slate-500">
          <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-xs">جاري تحميل سجل الأعضاء...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">لا يوجد أعضاء في هذا البحث</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            تأكد من عبارة البحث أو قم بإضافة عضو جديد أو قبول طلبات الانضمام المعلقة.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3.5 px-4">رقم العضوية</th>
                  <th className="py-3.5 px-4">الاسم والبريد</th>
                  <th className="py-3.5 px-4">الهاتف</th>
                  <th className="py-3.5 px-4">الرتبة</th>
                  <th className="py-3.5 px-4">المجموعة التابعة</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4">تاريخ التسجيل</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Membership No */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {member.membershipNo}
                    </td>

                    {/* Name & Email */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{member.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono" dir="ltr">{member.email}</div>
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-4 font-mono text-slate-600" dir="ltr">
                      {member.phone || '—'}
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      {member.role === 'super_admin' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          <Shield className="w-3 h-3 text-amber-600" />
                          <span>المسؤول (الملك)</span>
                        </span>
                      ) : member.role === 'organizer' ? (
                        <span className="inline-flex items-center text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          منسق/منظم
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">
                          عضو
                        </span>
                      )}
                    </td>

                    {/* Group */}
                    <td className="py-3 px-4 text-slate-700">
                      {member.groupName || 'غير منضم'}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          member.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {member.status === 'active' ? 'نشط' : 'معلق'}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-500 tabular-nums">
                      {member.createdAt.split('T')[0]}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      {member.role === 'super_admin' ? (
                        <span className="text-[11px] text-slate-400 font-semibold">صلاحية سيادية</span>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* Toggle Active / Suspended */}
                          <button
                            onClick={() => handleToggleStatus(member)}
                            className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title={member.status === 'active' ? 'تعليق الحساب' : 'تفعيل الحساب'}
                          >
                            {member.status === 'active' ? <UserX className="w-4 h-4 text-amber-600" /> : <UserCheck className="w-4 h-4 text-emerald-600" />}
                          </button>

                          {/* Toggle Role (Organizer) */}
                          <button
                            onClick={() => handleToggleRole(member)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title={member.role === 'organizer' ? 'تنزيل لمنصب عضو عادي' : 'ترقية لمنصب منسق/منظم'}
                          >
                            <Shield className="w-4 h-4 text-slate-500" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteMember(member)}
                            className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف العضو نهائياً"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-700" />
                <span>إضافة عضو جديد يدوياً</span>
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  الاسم الكامل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="اسم ولقب العضو"
                  value={newMemberData.name}
                  onChange={(e) => setNewMemberData({ ...newMemberData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  البريد الإلكتروني <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  placeholder="member@example.com"
                  value={newMemberData.email}
                  onChange={(e) => setNewMemberData({ ...newMemberData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-left"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    كلمة المرور الابتدائية <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newMemberData.password}
                    onChange={(e) => setNewMemberData({ ...newMemberData, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    placeholder="05 / 06 / 07 XX XX XX XX"
                    value={newMemberData.phone}
                    onChange={(e) => setNewMemberData({ ...newMemberData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-left"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    الدور / الرتبة
                  </label>
                  <select
                    value={newMemberData.role}
                    onChange={(e) => setNewMemberData({ ...newMemberData, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="member">عضو عادي</option>
                    <option value="organizer">منسق / منظم مجموعة</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    تعيين لمجموعة (اختياري)
                  </label>
                  <select
                    value={newMemberData.groupId}
                    onChange={(e) => setNewMemberData({ ...newMemberData, groupId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="">-- بدون مجموعة حالياً --</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.tierAmount.toLocaleString()} دج)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'جاري الإضافة...' : 'إضافة وتوليد رقم العضوية'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
