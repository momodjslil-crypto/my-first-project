import React, { useState } from 'react';
import { User, CircularGroup, PaymentProof, TransparencyRecord } from '../../types';
import { FileText, Download, Printer, CheckCircle2, ShieldCheck, Building2, Calendar } from 'lucide-react';

interface AdminReportsProps {
  members: User[];
  groups: CircularGroup[];
  proofs: PaymentProof[];
  transparency: TransparencyRecord[];
}

export const AdminReports: React.FC<AdminReportsProps> = ({
  members,
  groups,
  proofs,
  transparency,
}) => {
  const [printSection, setPrintSection] = useState<'financial' | 'members' | 'groups'>('financial');

  const handlePrint = () => {
    window.print();
  };

  const totalVolume = transparency.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-8">
      
      {/* Header (hidden in print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-700" />
            <span>التقارير المالية والإدارية (تصدير Excel وطباعة PDF)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            استخراج وتصدير الكشوفات الدورية والتقارير المعتمدة بصيغتي Excel وPDF مع التوثيق المالي.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Printer className="w-4 h-4 text-emerald-400" />
          <span>طباعة التقرير المعتمد / حفظ كـ PDF</span>
        </button>
      </div>

      {/* Excel / CSV Export Cards (hidden in print) */}
      <div className="no-print space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          تصدير الملفات بصيغة Excel (CSV):
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <a
            href="/api/reports/export/members"
            download
            className="p-4 bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl shadow-sm flex items-center justify-between transition-all group"
          >
            <div>
              <div className="font-bold text-sm text-slate-900 group-hover:text-emerald-700">
                تقرير الأعضاء والمنظمين
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {members.length} عضو مسجل بالمنصة
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
          </a>

          <a
            href="/api/reports/export/groups"
            download
            className="p-4 bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl shadow-sm flex items-center justify-between transition-all group"
          >
            <div>
              <div className="font-bold text-sm text-slate-900 group-hover:text-emerald-700">
                تقرير الحلقات التكافلية
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {groups.length} حلقة دائرية مسجلة
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
          </a>

          <a
            href="/api/reports/export/transparency"
            download
            className="p-4 bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl shadow-sm flex items-center justify-between transition-all group"
          >
            <div>
              <div className="font-bold text-sm text-slate-900 group-hover:text-emerald-700">
                كشف سجل الشفافية المالي
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {transparency.length} معاملة معتمدة
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
          </a>

        </div>
      </div>

      {/* Select Report View */}
      <div className="no-print flex items-center gap-2 border-b border-slate-200 pb-2">
        <span className="text-xs font-semibold text-slate-600">معاينة التقرير المطبوع:</span>
        <button
          onClick={() => setPrintSection('financial')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
            printSection === 'financial' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          التقرير المالي الدوري
        </button>
        <button
          onClick={() => setPrintSection('groups')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
            printSection === 'groups' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          كشف الحلقات الدائرية
        </button>
        <button
          onClick={() => setPrintSection('members')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
            printSection === 'members' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          كشف الأعضاء
        </button>
      </div>

      {/* Certified Printable Sheet (Prints flawlessly on A4) */}
      <div className="bg-white border border-slate-300 rounded-2xl p-8 sm:p-12 shadow-sm space-y-8 print:p-0 print:border-none print:shadow-none">
        
        {/* Printable Official Header */}
        <div className="flex items-center justify-between pb-6 border-b-2 border-slate-900">
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              منصة تكافل التعاونية الدائرية
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">
              الجمهورية الجزائرية الديمقراطية الشعبية · نظام الادخار التضامني المعتمد
            </div>
          </div>

          <div className="text-left font-mono text-xs text-slate-500 space-y-0.5" dir="ltr">
            <div>REF: TKF-REP-{new Date().getFullYear()}-{Date.now().toString().slice(-4)}</div>
            <div>DATE: {new Date().toISOString().split('T')[0]}</div>
            <div className="text-emerald-700 font-bold">STATUS: OFFICIAL / CERTIFIED</div>
          </div>
        </div>

        {/* Report Title */}
        <div className="text-center space-y-1">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
            {printSection === 'financial' && 'كشف الحساب المالي الدوري وتوثيق سجل الشفافية'}
            {printSection === 'groups' && 'بيان الحلقات التكافلية الدائرية النشطة وأدوار الأعضاء'}
            {printSection === 'members' && 'السجل الإداري العام للأعضاء المسجلين والمنسقين'}
          </h2>
          <p className="text-xs text-slate-500">
            وثيقة إدارية صادرة عن المسؤول الرئيسي (الملك) لمنصة تكافل
          </p>
        </div>

        {/* Financial Summary KPIs */}
        {printSection === 'financial' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 border border-slate-200 rounded-xl p-4 bg-slate-50/60 text-center">
              <div>
                <span className="text-[11px] text-slate-500 block">إجمالي الوعاء المعتمد:</span>
                <span className="text-lg font-bold text-emerald-800 font-mono">
                  {totalVolume.toLocaleString()} دج
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">المعاملات المؤكدة:</span>
                <span className="text-lg font-bold text-slate-900 font-mono">
                  {transparency.length}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">إثباتات الدفع المقبولة:</span>
                <span className="text-lg font-bold text-slate-900 font-mono">
                  {proofs.filter((p) => p.status === 'approved').length}
                </span>
              </div>
            </div>

            {/* Financial Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-800 text-slate-700 font-bold">
                    <th className="py-2">رقم المعاملة</th>
                    <th className="py-2">التاريخ</th>
                    <th className="py-2">المجموعة</th>
                    <th className="py-2">العضو المستعار</th>
                    <th className="py-2">المبلغ المعتمد</th>
                    <th className="py-2">المصادق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {transparency.slice(0, 15).map((t) => (
                    <tr key={t.id} className="py-2">
                      <td className="py-2 font-mono text-[11px]">{t.id}</td>
                      <td className="py-2 tabular-nums">{t.date.split('T')[0]}</td>
                      <td className="py-2 font-semibold">{t.groupName}</td>
                      <td className="py-2 font-mono">{t.maskedMember}</td>
                      <td className="py-2 font-bold font-mono text-emerald-800">{t.amount.toLocaleString()} دج</td>
                      <td className="py-2">{t.approvedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Groups Summary Table */}
        {printSection === 'groups' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-800 text-slate-700 font-bold">
                  <th className="py-2">رمز المجموعة</th>
                  <th className="py-2">الاسم</th>
                  <th className="py-2">الفئة</th>
                  <th className="py-2">المنسق</th>
                  <th className="py-2">عدد الأعضاء</th>
                  <th className="py-2">الدور الحالي</th>
                  <th className="py-2">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {groups.map((g) => (
                  <tr key={g.id}>
                    <td className="py-2 font-mono">{g.code}</td>
                    <td className="py-2 font-bold">{g.name}</td>
                    <td className="py-2 font-bold text-emerald-800 font-mono">{g.tierAmount.toLocaleString()} دج</td>
                    <td className="py-2">{g.organizerName}</td>
                    <td className="py-2 font-mono">{g.members.length} / {g.maxMembers}</td>
                    <td className="py-2 font-mono">#{g.currentCycleIndex}</td>
                    <td className="py-2">{g.status === 'active' ? 'نشطة' : 'متوقفة'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Members Table */}
        {printSection === 'members' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-800 text-slate-700 font-bold">
                  <th className="py-2">رقم العضوية</th>
                  <th className="py-2">الاسم</th>
                  <th className="py-2">البريد</th>
                  <th className="py-2">الهاتف</th>
                  <th className="py-2">الرتبة</th>
                  <th className="py-2">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {members.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2 font-mono font-bold">{m.membershipNo}</td>
                    <td className="py-2 font-semibold">{m.name}</td>
                    <td className="py-2 font-mono" dir="ltr">{m.email}</td>
                    <td className="py-2 font-mono" dir="ltr">{m.phone || '—'}</td>
                    <td className="py-2">{m.role === 'super_admin' ? 'المسؤول الرئيسي' : m.role === 'organizer' ? 'منسق' : 'عضو'}</td>
                    <td className="py-2">{m.status === 'active' ? 'نشط' : 'معلق'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Certified Footer Signatures */}
        <div className="pt-12 mt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs text-slate-700">
          <div>
            <span className="font-bold block mb-1">الختم والمصادقة الإدارية:</span>
            <div className="w-32 h-20 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
              ختم منصة تكافل الرسمي
            </div>
          </div>

          <div className="text-left" dir="ltr">
            <span className="font-bold block mb-1">SUPER ADMIN SIGNATURE:</span>
            <div className="font-mono text-slate-500 italic text-sm mt-4">
              [ Approved & Certified by Super Admin ]
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
