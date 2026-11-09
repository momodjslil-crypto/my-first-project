import React, { useState, useEffect } from 'react';
import { User, CircularGroup, GroupSlot, PaymentProof } from '../../types';
import { api } from '../../api/client';
import { CircularRingVisualizer } from '../admin/CircularRingVisualizer';
import {
  CreditCard,
  Upload,
  FileCheck,
  CheckCircle2,
  Clock,
  Layers,
  Copy,
  Check,
  AlertTriangle,
  MessageSquare,
  ShieldCheck,
  PlusCircle,
  Users,
  Search,
  Crown,
  Share2,
  Sparkles,
  X,
  ExternalLink,
} from 'lucide-react';

interface MemberDashboardProps {
  currentUser: User;
  onOpenLegal: () => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ currentUser, onOpenLegal }) => {
  const [group, setGroup] = useState<CircularGroup | null>(null);
  const [myProofs, setMyProofs] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(true);

  // Referral & Activity Stats
  const [referralStats, setReferralStats] = useState<{
    referralCode: string;
    referralCount: number;
    totalInvited: number;
    invitedUsers: Array<{ id: string; name: string; membershipNo: string; createdAt: string; status: string; groupName: string }>;
    groupInfo: any;
  } | null>(null);

  // Group Search & Join via Paste Link/Code
  const [pastedCode, setPastedCode] = useState('');
  const [searchedGroup, setSearchedGroup] = useState<CircularGroup | null>(null);
  const [searchingGroup, setSearchingGroup] = useState(false);
  const [selectedSlotToJoin, setSelectedSlotToJoin] = useState<number | null>(null);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState<number | null>(null); // slotNumber
  const [showKingBaridiModal, setShowKingBaridiModal] = useState(false);
  const [showInvitedListModal, setShowInvitedListModal] = useState(false);
  const [showGroupRequestModal, setShowGroupRequestModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Upload Form Data
  const [uploadData, setUploadData] = useState({
    receiptImage: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // King BaridiMob Form Data
  const [kingBaridiData, setKingBaridiData] = useState({
    holderName: '',
    rip: '',
    cle: '',
    phone: '',
    notes: '',
  });

  // Group Proposal Form Data
  const [groupProposalData, setGroupProposalData] = useState({
    groupName: '',
    tierAmount: '2000',
    cycleDuration: 'monthly',
    maxMembers: 8,
    reason: '',
  });

  // Support Message
  const [supportMessage, setSupportMessage] = useState({ subject: '', message: '' });

  const [copiedRefLink, setCopiedRefLink] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [meRes, proofsRes, refStats] = await Promise.all([
        api.getCurrentUser(),
        api.getPaymentProofs(),
        api.getReferralStats(),
      ]);

      setGroup(meRes.group);
      setMyProofs(proofsRes);
      setReferralStats(refStats);

      if (meRes.group && meRes.group.kingBaridiMob) {
        setKingBaridiData({
          holderName: meRes.group.kingBaridiMob.holderName || '',
          rip: meRes.group.kingBaridiMob.rip || '',
          cle: meRes.group.kingBaridiMob.cle || '',
          phone: meRes.group.kingBaridiMob.phone || '',
          notes: meRes.group.kingBaridiMob.notes || '',
        });
      }
    } catch (err: any) {
      console.error('Failed to load member dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Lookup group by pasted link/code
  const handleLookupGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedCode.trim()) return;

    try {
      setSearchingGroup(true);
      setFeedback(null);
      const lookedUp = await api.lookupGroup(pastedCode);
      setSearchedGroup(lookedUp);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'لم يتم العثور على حلقة بهذا الرابط أو الرمز' });
    } finally {
      setSearchingGroup(false);
    }
  };

  // Self-reserve slot in a group
  const handleConfirmJoinSlot = async (slotNumber: number) => {
    const targetGroup = searchedGroup || group;
    if (!targetGroup) return;

    try {
      setActionLoading(true);
      const res = await api.joinSlot({
        groupIdentifier: targetGroup.inviteCode || targetGroup.code || targetGroup.id,
        slotNumber,
      });

      setGroup(res.group);
      setSearchedGroup(null);
      setPastedCode('');
      setSelectedSlotToJoin(null);
      setFeedback({ type: 'success', text: `تم حجز المقعد رقم ${slotNumber} بنجاح في حلقة "${res.group.name}". يمكنك الآن تحويل المساهمة لملك الحلقة.` });
      setTimeout(() => setFeedback(null), 5000);
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل حجز المقعد' });
    } finally {
      setActionLoading(false);
    }
  };

  // Upload receipt proof for slot
  const handleReceiptImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('حجم الصورة كبير، يرجى اختيار صورة أقل من 10 ميغابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadData((prev) => ({ ...prev, receiptImage: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSlotPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || showUploadModal === null || !uploadData.receiptImage) return;

    try {
      setActionLoading(true);
      const res = await api.paySlot(group.id, {
        slotNumber: showUploadModal,
        receiptImage: uploadData.receiptImage,
        notes: uploadData.notes,
        paymentDate: uploadData.paymentDate,
      });

      setGroup(res.group);
      setShowUploadModal(null);
      setUploadData({
        receiptImage: '',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setFeedback({ type: 'success', text: 'تم رفع وصل الدفع لملك الحلقة وهو قيد المراجعة والاعتماد' });
      setTimeout(() => setFeedback(null), 5000);
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل رفع الوصل' });
    } finally {
      setActionLoading(false);
    }
  };

  // King or Admin verifies slot
  const handleVerifySlot = async (slotNumber: number, action: 'approve' | 'reject', reason?: string) => {
    if (!group) return;

    try {
      setActionLoading(true);
      const res = await api.verifySlot(group.id, { slotNumber, action, reason });
      setGroup(res.group);
      setFeedback({
        type: 'success',
        text: action === 'approve' ? `تم اعتماد دفع المقعد رقم ${slotNumber} بنجاح ✓` : `تم رفض وصل المقعد رقم ${slotNumber}`,
      });
      setTimeout(() => setFeedback(null), 4000);
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل تحديث حالة الدفع' });
    } finally {
      setActionLoading(false);
    }
  };

  // King or Admin triggers role transition when all 7 are paid
  const handleTransitionRoles = async () => {
    if (!group) return;
    if (!window.confirm('هل أنت متأكد من تفعيل انتقال الأدوار؟ سيتحول الملك السابق لعضو، والعضو رقم 1 سيصبح الملك الجديد.')) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.transitionRoles(group.id);
      setGroup(res.group);
      setFeedback({ type: 'success', text: '👑 تم انتقال الأدوار بنجاح وتتويج الملك الجديد!' });
      setTimeout(() => setFeedback(null), 5000);
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل تفعيل انتقال الأدوار' });
    } finally {
      setActionLoading(false);
    }
  };

  // Update King's BaridiMob
  const handleSaveKingBaridi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;

    try {
      setActionLoading(true);
      await api.updateKingBaridiMob(group.id, kingBaridiData);
      setShowKingBaridiModal(false);
      setFeedback({ type: 'success', text: 'تم تحديث بيانات بريدي موب الخاصة بك كملك للحلقة وإشعار الأعضاء' });
      setTimeout(() => setFeedback(null), 4000);
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل حفظ بيانات بريدي موب' });
    } finally {
      setActionLoading(false);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}?ref=${currentUser.membershipNo}`;
    navigator.clipboard.writeText(link);
    setCopiedRefLink(true);
    setTimeout(() => setCopiedRefLink(false), 2000);
  };

  const isKingOfGroup = group && group.kingUserId === currentUser.id;
  const mySlot = group?.slots?.find((s) => s.userId === currentUser.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Financial Risks & Anti-Scam Disclaimer Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 text-amber-900 text-xs space-y-2">
        <div className="flex items-center gap-2 font-black text-amber-950 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>الشفافية المالية ومسؤوليات المشاركة:</span>
        </div>
        <p className="leading-relaxed">
          • <span className="font-bold">المشاركة اختيارية بالكامل:</span> لا يوجد ربح مضمون أو عائد استثماري؛ نظام الحلقات هو تكافل ادخاري دائر (ROSCA) تتطلب كل حلقة اكتمال أعضائها.
          <br />
          • <span className="font-bold">حظر الحسابات الوهمية والوصولات المزورة:</span> كل وصل يتم التحقق من بصمته الرقمية، وأي تلاعب يؤدي للإيقاف الفوري للحساب ومصادرة الحق في الحلقة.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${
            feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Top Section: Membership Card + Referral Activity Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Digital Membership Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-700/80 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-lg">
                ت
              </div>
              <div>
                <span className="font-black text-sm block tracking-tight">بطاقة عضوية تكافل</span>
                <span className="text-[10px] text-slate-400">نظام الحلقات الدائرية</span>
              </div>
            </div>

            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
              {currentUser.status === 'active' ? 'عضو نشط' : 'معلق'}
            </span>
          </div>

          <div className="my-5 space-y-4">
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">اسم العضو:</span>
              <span className="text-xl font-black text-white">{currentUser.name}</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">رقم العضوية:</span>
                <span className="font-mono text-base font-extrabold text-emerald-400 tracking-wider">
                  {currentUser.membershipNo}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">الحالة في الحلقة:</span>
                <span className="font-bold text-xs text-amber-300">
                  {isKingOfGroup ? '👑 الملك في الوسط' : mySlot ? `المقعد رقم ${mySlot.slotNumber}` : 'غير منضم'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>تاريخ التسجيل: {currentUser.createdAt.split('T')[0]}</span>
            <span className="font-mono text-slate-500">DZ-COOP</span>
          </div>
        </div>

        {/* Personal Referral & Activity Hub */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-emerald-700" />
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                لوحة الدعوات والنشاط (رابطك الخاص)
              </h3>
            </div>
            <button
              onClick={() => setShowInvitedListModal(true)}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
            >
              سجل المدعوين ({referralStats?.totalInvited || 0})
            </button>
          </div>

          {/* Referral Link Copy Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600">
              رابط الدعوة الخاص بك لدعوة العائلة والأصدقاء:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                dir="ltr"
                value={`${window.location.origin}?ref=${currentUser.membershipNo}`}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none"
              />
              <button
                onClick={copyReferralLink}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {copiedRefLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedRefLink ? 'تم النسخ' : 'نسخ الرابط'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              💡 كل عضو يسجل عبر رابطك يُسجل تلقائياً تحت اسمك وتُحسب لك في إحصائيات النشاط.
            </p>
          </div>

          {/* Referral Stats Cards */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-500 block">إجمالي المدعوين</span>
              <span className="text-xl font-extrabold text-slate-900 font-mono tabular-nums">
                {referralStats?.totalInvited || 0}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-500 block">الدعوات المكتملة</span>
              <span className="text-xl font-extrabold text-emerald-700 font-mono tabular-nums">
                {referralStats?.invitedUsers.filter((u) => u.status === 'active').length || 0}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-500 block">موقعك في المجموعة</span>
              <span className="text-sm font-bold text-amber-700 block truncate">
                {isKingOfGroup ? 'الملك 👑' : mySlot ? `مقعد #${mySlot.slotNumber}` : 'شاغر'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Paste Group Link / Code To Enter & Reserve a Seat (Self-Service) */}
      {!group && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="max-w-2xl mx-auto text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-2">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              الانضمام إلى حلقة دائرية وحجز مقعدك ذاتياً
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              لا يمكن لأحد إدراجك يدوياً؛ ألصق رابط الدعوة أو رمز المجموعة الذي استلمته من صديقك أو الإدارة لاستعراض المقاعد السبعة المحيطة بالملك وحجز مقعدك الشاغر.
            </p>
          </div>

          <form onSubmit={handleLookupGroup} className="max-w-xl mx-auto flex items-center gap-2">
            <input
              type="text"
              required
              placeholder="ألصق رابط المجموعة أو رمزها (مثال: HALAQA-482 أو الرابط الكامل)"
              value={pastedCode}
              onChange={(e) => setPastedCode(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
            <button
              type="submit"
              disabled={searchingGroup || !pastedCode.trim()}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            >
              {searchingGroup ? 'جاري البحث...' : 'استعراض المقاعد'}
            </button>
          </form>

          {/* Searched Group Ring Preview */}
          {searchedGroup && (
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <div className="text-center">
                <span className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full font-bold">
                  تم العثور على حلقة: {searchedGroup.name} · فئة {searchedGroup.tierAmount.toLocaleString()} دج
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  انقر على أي مقعد شاغر من المقاعد السبعة المحيطة بالملك لحجزه فوراً.
                </p>
              </div>

              <CircularRingVisualizer
                group={searchedGroup}
                currentUserId={currentUser.id}
                onSelectVacantSlot={(slotNumber) => handleConfirmJoinSlot(slotNumber)}
              />
            </div>
          )}
        </div>
      )}

      {/* Active Group Visualization (If Member Belongs to Group) */}
      {group && (
        <div className="space-y-6">
          
          {/* King Notification / Control Banner if user IS King */}
          {isKingOfGroup && (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-amber-700/10 border border-amber-500/30 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-right">
                <div className="flex items-center gap-2">
                  <Crown className="w-6 h-6 text-amber-600" />
                  <h4 className="font-black text-amber-950 text-base">
                    أنت الملك في وسط هذه الحلقة!
                  </h4>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  تستلم مساهمات المقاعد السبعة ({group.tierAmount.toLocaleString()} دج × 7 = <span className="font-extrabold">{group.potAmount.toLocaleString()} دج</span>). اضبط معلومات بريدي موب الخاصة بك وقم بمراجعة وصولات دفع الأعضاء.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowKingBaridiModal(true)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                >
                  تعديل بريدي موب الخاص بي كملك
                </button>

                {group.slots.every((s) => s.userId && s.paymentStatus === 'paid') && (
                  <button
                    onClick={handleTransitionRoles}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer animate-pulse"
                  >
                    تتويج الملك الجديد (العضو رقم 1)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Group Ring Visualizer */}
          <CircularRingVisualizer
            group={group}
            currentUserId={currentUser.id}
            isSuperAdmin={currentUser.role === 'super_admin'}
            onSelectVacantSlot={(slotNumber) => handleConfirmJoinSlot(slotNumber)}
            onPaySlot={(slotNumber) => setShowUploadModal(slotNumber)}
            onVerifySlot={handleVerifySlot}
            onTransitionRoles={handleTransitionRoles}
            onUpdateKingBaridiMob={() => setShowKingBaridiModal(true)}
          />

        </div>
      )}

      {/* Payment Proofs History */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-700" />
              <span>سجل إثباتات الدفع ومساهماتي</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة وصولات التحويل الخاصة بمقعدك وحالات الاعتماد والرفض من طرف ملك الحلقة.
            </p>
          </div>

          {mySlot && mySlot.paymentStatus !== 'paid' && (
            <button
              onClick={() => setShowUploadModal(mySlot.slotNumber)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
            >
              + رفع وصل تحويل المقعد #{mySlot.slotNumber}
            </button>
          )}
        </div>

        {myProofs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            لم تسجل أي وصولات دفع بعد. قم برفع وصل تحويل المساهمة لحساب ملك الحلقة.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">رقم الوصل</th>
                  <th className="py-3 px-4">المجموعة</th>
                  <th className="py-3 px-4">المبلغ</th>
                  <th className="py-3 px-4">تاريخ الدفع</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">الملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myProofs.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{p.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.groupName}</td>
                    <td className="py-3 px-4 font-extrabold text-emerald-800 tabular-nums">
                      {p.amount.toLocaleString()} دج
                    </td>
                    <td className="py-3 px-4 text-slate-600 tabular-nums">{p.paymentDate}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          p.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'pending'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {p.status === 'approved' ? 'مقبول ومعتمد' : p.status === 'pending' ? 'قيد المراجعة' : 'مرفوض'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      {p.rejectionReason ? <span className="text-rose-600 font-semibold">{p.rejectionReason}</span> : p.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Support Strip */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-700" />
            <span>هل تحتاج مساعدة أو لديك استفسار حول حجز المقاعد؟</span>
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            تواصل مباشرة مع إدارة منصة تكافل لحل أي مسألة تقنية أو مالية.
          </p>
        </div>

        <button
          onClick={() => setShowSupportModal(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap"
        >
          مراسلة الإدارة
        </button>
      </div>

      {/* Modal: Upload Proof for Slot */}
      {showUploadModal !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-700" />
                <span>رفع وصل تحويل المقعد رقم {showUploadModal} للملك</span>
              </h4>
              <button
                onClick={() => setShowUploadModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSlotPaymentSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs border">
                <div className="flex justify-between">
                  <span>المبلغ المطلوب تحويله:</span>
                  <span className="font-extrabold text-emerald-800 font-mono">
                    {group?.tierAmount.toLocaleString()} دج
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>المستلم (الملك):</span>
                  <span className="font-bold text-slate-800">{group?.kingName}</span>
                </div>
                {group?.kingBaridiMob?.rip && (
                  <div className="flex justify-between">
                    <span>حساب بريدي موب RIP:</span>
                    <span className="font-mono font-bold text-slate-900" dir="ltr">{group.kingBaridiMob.rip}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  صورة وصل التحويل (سكرين شوت من بريدي موب) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleReceiptImageChange}
                  className="w-full text-xs text-slate-500 file:ml-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>

              {uploadData.receiptImage && (
                <div className="p-2 border rounded-xl bg-slate-50 flex items-center justify-center">
                  <img
                    src={uploadData.receiptImage}
                    alt="معاينة الوصل"
                    className="max-h-40 rounded-lg object-contain shadow-sm"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  ملاحظات
                </label>
                <input
                  type="text"
                  placeholder="ملاحظات حول التحويل..."
                  value={uploadData.notes}
                  onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !uploadData.receiptImage}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'جاري الرفع...' : 'تأكيد الرفع للملك'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: King BaridiMob Configuration */}
      {showKingBaridiModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <span>إعداد بيانات بريدي موب لملك الحلقة</span>
              </h4>
              <button
                onClick={() => setShowKingBaridiModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKingBaridi} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  اسم صاحب الحساب (الملك) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={kingBaridiData.holderName}
                  onChange={(e) => setKingBaridiData({ ...kingBaridiData, holderName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  رقم الحساب البريدي الجاري RIP (20 رقماً) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  placeholder="00799999000000000000"
                  value={kingBaridiData.rip}
                  onChange={(e) => setKingBaridiData({ ...kingBaridiData, rip: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-emerald-600 text-left"
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
                    value={kingBaridiData.cle}
                    onChange={(e) => setKingBaridiData({ ...kingBaridiData, cle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-600 text-left"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={kingBaridiData.phone}
                    onChange={(e) => setKingBaridiData({ ...kingBaridiData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-600 text-left"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  إرشادات للأعضاء السبعة عند التحويل
                </label>
                <textarea
                  rows={2}
                  placeholder="توجيهات تظهر للأعضاء عند الدفع..."
                  value={kingBaridiData.notes}
                  onChange={(e) => setKingBaridiData({ ...kingBaridiData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKingBaridiModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'جاري الحفظ...' : 'حفظ ونشر للأعضاء'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Invited Users List */}
      {showInvitedListModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-700" />
                <span>سجل الأعضاء المسجلين عبر رابط دعوتك</span>
              </h4>
              <button
                onClick={() => setShowInvitedListModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100">
              {referralStats?.invitedUsers.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  لم يسجل أي عضو عبر رابطك بعد. شارك رابط دعوتك مع معارفك!
                </div>
              ) : (
                referralStats?.invitedUsers.map((inv) => (
                  <div key={inv.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{inv.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {inv.membershipNo} · انضم في {inv.createdAt.split('T')[0]}
                      </span>
                    </div>

                    <div className="text-left space-y-0.5">
                      <span className="text-emerald-800 font-semibold block">{inv.groupName}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {inv.status === 'active' ? 'نشط' : 'معلق'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-left">
              <button
                onClick={() => setShowInvitedListModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Support Ticket */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-700" />
                <span>مراسلة إدارة منصة تكافل</span>
              </h4>
              <button
                onClick={() => setShowSupportModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!supportMessage.subject || !supportMessage.message) return;
                try {
                  setActionLoading(true);
                  await api.createSupportTicket(supportMessage);
                  setShowSupportModal(false);
                  setSupportMessage({ subject: '', message: '' });
                  setFeedback({ type: 'success', text: 'تم إرسال تذكرتك للإدارة بنجاح' });
                  setTimeout(() => setFeedback(null), 4000);
                } catch (err: any) {
                  setFeedback({ type: 'error', text: err.message || 'فشل إرسال الرسالة' });
                } finally {
                  setActionLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  الموضوع <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="موضوع استفسارك..."
                  value={supportMessage.subject}
                  onChange={(e) => setSupportMessage({ ...supportMessage, subject: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  تفاصيل الرسالة <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="اكتب رسالتك بوضوح..."
                  value={supportMessage.message}
                  onChange={(e) => setSupportMessage({ ...supportMessage, message: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'جاري الإرسال...' : 'إرسال'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
