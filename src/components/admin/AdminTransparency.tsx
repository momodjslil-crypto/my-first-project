import React, { useState, useEffect } from 'react';
import { TransparencyRecord } from '../../types';
import { api } from '../../api/client';
import { ShieldCheck, Download, Search, CheckCircle2, TrendingUp, Calendar, Filter } from 'lucide-react';

export const AdminTransparency: React.FC = () => {
  const [records, setRecords] = useState<TransparencyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const data = await api.getTransparencyLedger();
      setRecords(data);
    } catch (err) {
      console.error('Failed to load ledger', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const totalVolume = records.reduce((acc, curr) => acc + curr.amount, 0);

  // Unique groups for filter
  const groupNames = Array.from(new Set(records.map((r) => r.groupName)));

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.maskedMember.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.approvedBy.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGroup = selectedGroupFilter === 'all' || r.groupName === selectedGroupFilter;

    return matchesSearch && matchesGroup;
  });

  const exportCSV = () => {
    window.open('/api/reports/export/transparency', '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-700" />
            <span>سجل الشفافية المالي المعتمد</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            سجل غير قابل للتعديل يوثق جميع المساهمات الدورية وتسليمات أوعية الحلقات التضامنية بأسماء مستعارة لحفظ الخصوصية.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="text-right bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
            <span className="text-[10px] text-emerald-700 font-bold block">إجمالي الوعاء المعتمد</span>
            <span className="font-extrabold text-emerald-900 text-base tabular-nums">
              {totalVolume.toLocaleString()} دج
            </span>
          </div>

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>تصدير Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث برمز العضو، اسم المجموعة، أو المسؤول المعتمد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        {groupNames.length > 0 && (
          <div className="w-full sm:w-auto">
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-emerald-600"
            >
              <option value="all">جميع المجموعات ({groupNames.length})</option>
              {groupNames.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 text-xs">جاري تحميل سجل الشفافية...</div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-2">
          <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">سجل الشفافية فارغ حالياً</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            يتم تسجيل العمليات آلياً ومباشرة بمجرد موافقة المسؤول على وصولات بريدي موب أو تسليم وعاء دورة الاستحقاق.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">رقم العملية</th>
                  <th className="py-3 px-4">التاريخ والوقت</th>
                  <th className="py-3 px-4">نوع المعاملة</th>
                  <th className="py-3 px-4">المجموعة التكافلية</th>
                  <th className="py-3 px-4">العضو (مستعار للخصوصية)</th>
                  <th className="py-3 px-4">المبلغ المعتمد</th>
                  <th className="py-3 px-4">رقم الدورة</th>
                  <th className="py-3 px-4">الجهة المعتمدة</th>
                  <th className="py-3 px-4 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {rec.id}
                    </td>
                    <td className="py-3 px-4 text-slate-600 tabular-nums">
                      {rec.date.split('T')[0]} {rec.date.split('T')[1]?.slice(0, 5)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {rec.type === 'مساهمة_دورية' ? 'مساهمة دورية مؤكدة' : 'تسليم وعاء الحلقة للمستفيد'}
                    </td>
                    <td className="py-3 px-4 font-medium text-emerald-800">
                      {rec.groupName}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {rec.maskedMember}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-emerald-700 tabular-nums">
                        {rec.amount.toLocaleString()} دج
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      الدور #{rec.cycleRound}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {rec.approvedBy}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>معتمد وموثق</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
        🔒 ضمان النزاهة: لا يمكن لأي مستخدم أو منظم أو مسؤول حذف أو تعديل أي سجل مالي بعد اعتماده، لضمان أعلى درجات الموثوقية التعاونية.
      </div>

    </div>
  );
};
