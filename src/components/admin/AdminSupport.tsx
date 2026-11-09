import React, { useState, useEffect } from 'react';
import { SupportTicket } from '../../types';
import { api } from '../../api/client';
import { MessageSquare, Send, CheckCircle2, AlertCircle, Clock, Check, User, Shield } from 'lucide-react';

export const AdminSupport: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await api.getSupportTickets();
      setTickets(data);
      if (data.length > 0 && !selectedTicket) {
        setSelectedTicket(data[0]);
      } else if (selectedTicket) {
        const updated = data.find((t) => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل تحميل التذاكر' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    try {
      setSending(true);
      const res = await api.replySupportTicket(selectedTicket.id, replyText);
      setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? res.ticket : t)));
      setSelectedTicket(res.ticket);
      setReplyText('');
      setFeedback({ type: 'success', text: 'تم إرسال الرد وإشعار العضو بنجاح' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل إرسال الرد' });
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    try {
      const res = await api.closeSupportTicket(ticketId);
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? res.ticket : t)));
      if (selectedTicket?.id === ticketId) setSelectedTicket(res.ticket);
      setFeedback({ type: 'success', text: 'تم إغلاق التذكرة' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل إغلاق التذكرة' });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-700" />
            <span>مركز الدعم الفني واستفسارات الأعضاء</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            محادثات مباشرة بين الأعضاء والمسؤول الرئيسي للإجابة عن الاستفسارات وحل المشاكل الفنية.
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
        <div className="p-8 text-center text-slate-500 text-xs">جاري تحميل رسائل الدعم...</div>
      ) : tickets.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs space-y-2">
          <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
          <h4 className="text-sm font-bold text-slate-800">صندوق الدعم الفني فارغ</h4>
          <p className="text-xs text-slate-500">لا توجد رسائل أو استفسارات واردة من الأعضاء حالياً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
          
          {/* Tickets Sidebar */}
          <div className="lg:col-span-4 border-l border-slate-200 divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {tickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected ? 'bg-emerald-50/80 border-r-4 border-r-emerald-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 truncate max-w-[170px]">
                      {t.subject}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        t.status === 'open'
                          ? 'bg-amber-100 text-amber-800'
                          : t.status === 'answered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t.status === 'open' ? 'جديد' : t.status === 'answered' ? 'تم الرد' : 'مغلقة'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{t.userName} ({t.userRole === 'organizer' ? 'منسق' : 'عضو'})</span>
                    <span className="tabular-nums">{t.createdAt.split('T')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conversation Thread */}
          <div className="lg:col-span-8 flex flex-col justify-between p-6">
            {selectedTicket ? (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{selectedTicket.subject}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      العضو: <span className="font-semibold text-slate-800">{selectedTicket.userName}</span> · التاريخ: {selectedTicket.createdAt.split('T')[0]}
                    </div>
                  </div>

                  {selectedTicket.status !== 'closed' && (
                    <button
                      onClick={() => handleCloseTicket(selectedTicket.id)}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      إغلاق التذكرة
                    </button>
                  )}
                </div>

                {/* Messages Box */}
                <div className="space-y-4 max-h-[350px] overflow-y-auto p-2">
                  {selectedTicket.messages.map((msg) => {
                    const isAdmin = msg.senderRole === 'super_admin';
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 max-w-xl ${
                          isAdmin ? 'mr-auto flex-row-reverse text-left' : 'ml-auto'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                            isAdmin ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>

                        <div
                          className={`p-3.5 rounded-2xl text-xs sm:text-sm space-y-1 shadow-sm leading-relaxed ${
                            isAdmin
                              ? 'bg-emerald-700 text-white rounded-tl-none'
                              : 'bg-slate-100 text-slate-900 rounded-tr-none'
                          }`}
                        >
                          <div
                            className={`text-[10px] font-semibold opacity-75 ${
                              isAdmin ? 'text-emerald-100' : 'text-slate-500'
                            }`}
                          >
                            {msg.senderName} · {msg.createdAt.split('T')[1]?.slice(0, 5)}
                          </div>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Form */}
                {selectedTicket.status !== 'closed' ? (
                  <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-200 flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="اكتب ردك المباشر للعضو هنا..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                    <button
                      type="submit"
                      disabled={sending || !replyText.trim()}
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{sending ? 'جاري الإرسال...' : 'إرسال'}</span>
                    </button>
                  </form>
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                    هذه التذكرة مغلقة حالياً.
                  </div>
                )}

              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                حدد تذكرة من القائمة الجانبية لقراءة الرسائل والرد عليها.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
