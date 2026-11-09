import React, { useState, useEffect } from 'react';
import { PaymentProof } from '../../types';
import { api } from '../../api/client';
import { FileCheck, CheckCircle2, XCircle, Eye, AlertCircle, Calendar, Hash, Image as ImageIcon, X } from 'lucide-react';

export const AdminPaymentProofs: React.FC = () => {
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Modals
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [rejectingProofId, setRejectingProofId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchProofs = async () => {
    try {
      setLoading(true);
      const data = await api.getPaymentProofs();
      setProofs(data);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'فشل تحميل إثباتات الدفع' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProofs();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(true);
      const res = await api.approvePaymentProof(id);
      setProofs((prev) => prev.map((p) => (p.id === id ? res.proof : p)));
      setFeedbackMsg({ type: 'success', text: 'تم اعتماد الوصل بنجاح وتسجيله في سجل الشفافية' });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'فشل اعتماد الوصل' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingProofId || !rejectionReason.trim()) return;

    try {
      setActionLoading(true);
      const res = await api.rejectPaymentProof(rejectingProofId, rejectionReason);
      setProofs((prev) => prev.map((p) => (p.id === rejectingProofId ? res.proof : p)));
      setRejectingProofId(null);
      setRejectionReason('');
      setFeedbackMsg({ type: 'success', text: 'تم رفض الوصل وإشعار العضو بالسبب' });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'فشل رفض الوصل' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredProofs = proofs.filter((p) => {
    if (activeFilter === 'all') return true;
    return p.status === activeFilter;
  });

  const pendingCount = proofs.filter((p) => p.status === 'pending').length;

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-emerald-700" />
            <span>مراجعة واعتماد إثباتات الدفع (وصولات بريدي موب)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            التحقق من وصولات التحويل البنكي، والاعتماد الفوري مع الإدراج الآلي في سجل الشفافية.
          </p>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الكل ({proofs.length})
          </button>
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeFilter === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            قيد المراجعة ({pendingCount})
          </button>
          <button
            onClick={() => setActiveFilter('approved')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeFilter === 'approved' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            المقبولة ({proofs.filter((p) => p.status === 'approved').length})
          </button>
          <button
            onClick={() => setActiveFilter('rejected')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeFilter === 'rejected' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            المرفوضة ({proofs.filter((p) => p.status === 'rejected').length})
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Proofs Table */}
      {loading ? (
        <div className="p-8 text-center text-slate-500">
          <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-xs">جاري تحميل إثباتات الدفع...</p>
        </div>
      ) : filteredProofs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">لا توجد إثباتات دفع في هذه القائمة</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            عند قيام الأعضاء برفع وصولات بريدي موب للمجموعات التكافلية، ستظهر هنا مباشرة للمراجعة والاعتماد.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3.5 px-4">العضو / رقم العضوية</th>
                  <th className="py-3.5 px-4">المجموعة</th>
                  <th className="py-3.5 px-4">المبلغ المسدد</th>
                  <th className="py-3.5 px-4">تاريخ الدفع</th>
                  <th className="py-3.5 px-4">صورة الوصل</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4 text-center">الإجراء الإداري</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProofs.map((proof) => (
                  <tr key={proof.id} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* Member */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{proof.memberName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{proof.membershipNo}</div>
                    </td>

                    {/* Group */}
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {proof.groupName}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-emerald-700 tabular-nums">
                        {proof.amount.toLocaleString()} دج
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-600 tabular-nums">
                      {proof.paymentDate}
                    </td>

                    {/* Receipt Image Thumbnail */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setPreviewImage(proof.receiptImage)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-slate-200"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>معاينة الوصل</span>
                      </button>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {proof.status === 'pending' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          قيد المراجعة
                        </span>
                      )}
                      {proof.status === 'approved' && (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            مقبول ومكتمل
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            بواسطة {proof.reviewedByAdminName}
                          </span>
                        </div>
                      )}
                      {proof.status === 'rejected' && (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            مرفوض
                          </span>
                          {proof.rejectionReason && (
                            <span className="block text-[10px] text-rose-600 max-w-xs truncate" title={proof.rejectionReason}>
                              السبب: {proof.rejectionReason}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      {proof.status === 'pending' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleApprove(proof.id)}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                          >
                            اعتماد
                          </button>
                          <button
                            onClick={() => {
                              setRejectingProofId(proof.id);
                              setRejectionReason('');
                            }}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            رفض
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">تم البت</span>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm">معاينة وصل التحويل بريدي موب</h4>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-100 rounded-xl p-2">
              <img
                src={previewImage}
                alt="وصل التحويل"
                className="max-h-[65vh] w-auto rounded-lg shadow-sm object-contain"
              />
            </div>

            <div className="text-center text-xs text-slate-500">
              ⚠️ يتم التحقق من عدم تكرار البصمة الرقمية للوصل قبل الاعتماد.
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal with Mandatory Reason */}
      {rejectingProofId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>رفض وصل الدفع</span>
              </h4>
              <button
                onClick={() => setRejectingProofId(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  سبب الرفض الموجه للعضو <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="مثال: صورة الوصل غير واضحة / المبلغ المحول غير مطابق لقيمة الفئة / لم يصل التحويل للحساب..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingProofId(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'جاري الرفض...' : 'تأكيد الرفض وإشعار العضو'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
