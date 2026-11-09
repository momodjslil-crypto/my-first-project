import React from 'react';
import { User, CircularGroup, PaymentProof, JoinRequest, GroupCreationRequest, TransparencyRecord } from '../../types';
import { Users, Layers, FileCheck, Inbox, TrendingUp, AlertTriangle, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

interface AdminOverviewProps {
  members: User[];
  groups: CircularGroup[];
  proofs: PaymentProof[];
  joinRequests: JoinRequest[];
  groupRequests: GroupCreationRequest[];
  transparencyRecords: TransparencyRecord[];
  onNavigateTab: (tab: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  members,
  groups,
  proofs,
  joinRequests,
  groupRequests,
  transparencyRecords,
  onNavigateTab,
}) => {
  const activeGroups = groups.filter((g) => g.status === 'active').length;
  const pausedGroups = groups.filter((g) => g.status === 'paused').length;

  const pendingProofs = proofs.filter((p) => p.status === 'pending').length;
  const approvedProofs = proofs.filter((p) => p.status === 'approved').length;
  const rejectedProofs = proofs.filter((p) => p.status === 'rejected').length;

  const pendingJoin = joinRequests.filter((r) => r.status === 'pending').length;
  const pendingGroupReqs = groupRequests.filter((r) => r.status === 'pending').length;

  // Total volume confirmed
  const totalVolume = transparencyRecords.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>لوحة تحكم المسؤول الرئيسي (الملك)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            مرحباً بك في إدارة منصة تكافل التعاونية
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
            النظام يعمل بكامل كفاءته بقاعدة بيانات حقيقية وبدون أي بيانات وهمية. تابع العمليات المالية، المجموعات الدائرية، واعتمادات بريدي موب فورياً.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <button
            onClick={() => onNavigateTab('proofs')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm cursor-pointer whitespace-nowrap flex items-center gap-1.5"
          >
            <span>مراجعة الوصولات ({pendingProofs})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Members */}
        <div
          onClick={() => onNavigateTab('members')}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-emerald-300 transition-all cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي الأعضاء</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
              {members.length}
            </span>
            <span className="text-xs text-slate-500">
              {members.filter((m) => m.role === 'organizer').length} منسق
            </span>
          </div>
        </div>

        {/* Circular Groups */}
        <div
          onClick={() => onNavigateTab('groups')}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-emerald-300 transition-all cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">الحلقات الدائرية</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
              {groups.length}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="text-emerald-700 font-semibold">{activeGroups} نشطة</span>
              <span>·</span>
              <span className="text-amber-700">{pausedGroups} متوقفة</span>
            </div>
          </div>
        </div>

        {/* Payment Proofs Under Review */}
        <div
          onClick={() => onNavigateTab('proofs')}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-amber-300 transition-all cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إثباتات الدفع</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-amber-700 tabular-nums">
              {pendingProofs}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="text-emerald-700 font-semibold">{approvedProofs} مقبول</span>
              <span>·</span>
              <span className="text-rose-700">{rejectedProofs} مرفوض</span>
            </div>
          </div>
        </div>

        {/* Total Transacted Volume */}
        <div
          onClick={() => onNavigateTab('transparency')}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-emerald-300 transition-all cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">الوعاء المعتمد (الشفافية)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-800 tabular-nums">
              {totalVolume.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-700">دج</span>
          </div>
        </div>

      </div>

      {/* Actionable Queues & Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Requests Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Inbox className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-slate-900 text-sm">طلبات الانضمام والمجموعات المعلقة</h3>
            </div>
            <button
              onClick={() => onNavigateTab('requests')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
            >
              عرض الكل
            </button>
          </div>

          <div className="space-y-3">
            <div
              onClick={() => onNavigateTab('requests')}
              className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800">طلبات انضمام الأعضاء للحلقات</span>
                <p className="text-[11px] text-slate-500">أعضاء يرغبون في الدخول لحلقات عبر روابط الدعوة</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold tabular-nums ${
                pendingJoin > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {pendingJoin} طلب
              </span>
            </div>

            <div
              onClick={() => onNavigateTab('requests')}
              className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800">مقترحات إنشاء مجموعات جديدة</span>
                <p className="text-[11px] text-slate-500">مقترحات مقدمة من الأعضاء لتأسيس حلقات جديدة وتعيينهم منسقين</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold tabular-nums ${
                pendingGroupReqs > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {pendingGroupReqs} مقترح
              </span>
            </div>
          </div>
        </div>

        {/* Recent Transparency Transactions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">آخر العمليات في سجل الشفافية</h3>
            <button
              onClick={() => onNavigateTab('transparency')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
            >
              عرض السجل المالي
            </button>
          </div>

          {transparencyRecords.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              لم تُسجل أي معاملات مالية معتمدة بعد. ستظهر العمليات هنا بمجرد اعتماد وصولات الدفع.
            </div>
          ) : (
            <div className="space-y-2.5">
              {transparencyRecords.slice(0, 4).map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{rec.groupName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({rec.maskedMember})</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      الدورة #{rec.cycleRound} · معتمد بواسطة {rec.approvedBy}
                    </span>
                  </div>

                  <div className="text-left font-mono">
                    <span className="font-extrabold text-emerald-700 block">
                      +{rec.amount.toLocaleString()} دج
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {rec.date.split('T')[0]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
