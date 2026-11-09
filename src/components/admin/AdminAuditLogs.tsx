import React, { useState, useEffect } from 'react';
import { AuditLogItem } from '../../types';
import { api } from '../../api/client';
import { ShieldCheck, History, Clock, User, Terminal } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await api.getAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error('Failed to load audit logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-700" />
            <span>سجل العمليات والتدقيق الإداري (Audit Logs)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            سجل أمني تلقائي غير قابل للمسح يرصد كافة الإجراءات الإدارية، تعديلات بريدي موب، وتغييرات الصلاحيات.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-xs">جاري تحميل سجل التدقيق...</div>
      ) : logs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
          لا توجد عمليات مسجلة بعد.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">التاريخ والوقت</th>
                  <th className="py-3 px-4">المسؤول</th>
                  <th className="py-3 px-4">نوع الإجراء</th>
                  <th className="py-3 px-4">تفاصيل العملية</th>
                  <th className="py-3 px-4">عنوان IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 font-sans">
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs tabular-nums">
                      {log.createdAt.split('T')[0]} {log.createdAt.split('T')[1]?.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {log.adminName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-xs" dir="ltr">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
