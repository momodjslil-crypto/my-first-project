import React, { useState } from 'react';
import { CircularGroup, GroupSlot } from '../../types';
import {
  Crown,
  Check,
  CreditCard,
  UserCheck,
  AlertCircle,
  Copy,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
  Clock,
  Eye,
  FileCheck,
} from 'lucide-react';

interface CircularRingVisualizerProps {
  group: CircularGroup;
  currentUserId?: string;
  isSuperAdmin?: boolean;
  onSelectVacantSlot?: (slotNumber: number) => void;
  onPaySlot?: (slotNumber: number) => void;
  onVerifySlot?: (slotNumber: number, action: 'approve' | 'reject', reason?: string) => void;
  onTransitionRoles?: () => void;
  onUpdateKingBaridiMob?: () => void;
}

export const CircularRingVisualizer: React.FC<CircularRingVisualizerProps> = ({
  group,
  currentUserId,
  isSuperAdmin = false,
  onSelectVacantSlot,
  onPaySlot,
  onVerifySlot,
  onTransitionRoles,
  onUpdateKingBaridiMob,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<GroupSlot | null>(null);
  const [showKingInfoModal, setShowKingInfoModal] = useState(false);
  const [copiedRip, setCopiedRip] = useState(false);

  // Fallback slots if group was created before update
  const slots: GroupSlot[] = group.slots && group.slots.length === 7
    ? group.slots
    : [1, 2, 3, 4, 5, 6, 7].map((num) => {
        const m = group.members?.find((mem) => mem.positionInRing === num);
        return {
          slotNumber: num,
          userId: m?.userId || null,
          userName: m?.name || null,
          membershipNo: m?.membershipNo || null,
          invitedBy: null,
          paymentStatus: (m?.hasReceivedTurn ? 'paid' : 'unpaid') as any,
          paymentProofId: null,
          receiptImage: null,
          joinedAt: m?.joinDate || null,
        };
      });

  const isKing = currentUserId === group.kingUserId;
  const canManage = isKing || isSuperAdmin;

  const paidCount = slots.filter((s) => s.userId && s.paymentStatus === 'paid').length;
  const occupiedCount = slots.filter((s) => s.userId !== null).length;
  const allPaid = occupiedCount === 7 && paidCount === 7;
  const potAmount = group.tierAmount * 7;

  // SVG Geometry
  const size = 420;
  const center = size / 2;
  const radius = 145;

  const copyRip = () => {
    if (group.kingBaridiMob?.rip) {
      navigator.clipboard.writeText(group.kingBaridiMob.rip);
      setCopiedRip(true);
      setTimeout(() => setCopiedRip(false), 2000);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      
      {/* Group Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              حلقة التكافل الدائرية: {group.name}
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {group.code}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            دورة المساهمة: <span className="font-bold text-slate-800 tabular-nums">{group.tierAmount.toLocaleString()} دج</span> لكل مقعد · الوعاء الكامل للملك: <span className="font-extrabold text-emerald-800 tabular-nums">{potAmount.toLocaleString()} دج (7 × {group.tierAmount.toLocaleString()} دج)</span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* King BaridiMob Info Button */}
          <button
            onClick={() => setShowKingInfoModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-emerald-700" />
            <span>بيانات بريدي موب للملك</span>
          </button>

          {/* Role Transition Button */}
          {canManage && allPaid && onTransitionRoles && (
            <button
              onClick={onTransitionRoles}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer animate-pulse"
            >
              <Crown className="w-4 h-4" />
              <span>تتويج الملك الجديد وانتقال الأدوار</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Ring & Details Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* SVG Ring Viewport */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] flex items-center justify-center">
            
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${size} ${size}`}
              className="overflow-visible"
            >
              {/* Outer guide circle */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="8"
                strokeDasharray="6 6"
              />

              {/* Connecting spokes from King to 7 slots */}
              {slots.map((slot, i) => {
                const angle = (i / 7) * 2 * Math.PI - Math.PI / 2;
                const x = center + radius * Math.cos(angle);
                const y = center + radius * Math.sin(angle);
                const isPaid = slot.paymentStatus === 'paid';

                return (
                  <line
                    key={`spoke-${slot.slotNumber}`}
                    x1={center}
                    y1={center}
                    x2={x}
                    y2={y}
                    stroke={isPaid ? '#10b981' : '#cbd5e1'}
                    strokeWidth={isPaid ? '3' : '1.5'}
                    strokeOpacity={isPaid ? '0.8' : '0.4'}
                  />
                );
              })}

              {/* 7 Outer Slots */}
              {slots.map((slot, i) => {
                const angle = (i / 7) * 2 * Math.PI - Math.PI / 2;
                const x = center + radius * Math.cos(angle);
                const y = center + radius * Math.sin(angle);
                const isOccupied = slot.userId !== null;
                const isPaid = slot.paymentStatus === 'paid';
                const isPending = slot.paymentStatus === 'pending';
                const isSelected = selectedSlot?.slotNumber === slot.slotNumber;
                const isMe = currentUserId && slot.userId === currentUserId;

                let fill = '#ffffff';
                let stroke = '#94a3b8';
                let strokeWidth = '2';

                if (isPaid) {
                  fill = '#ecfdf5';
                  stroke = '#10b981';
                  strokeWidth = '3';
                } else if (isPending) {
                  fill = '#eff6ff';
                  stroke = '#3b82f6';
                  strokeWidth = '3';
                } else if (isOccupied) {
                  fill = '#fffbeb';
                  stroke = '#f59e0b';
                  strokeWidth = '2.5';
                } else {
                  fill = '#f8fafc';
                  stroke = '#cbd5e1';
                }

                if (isSelected || isMe) {
                  stroke = '#047857';
                  strokeWidth = '4';
                }

                return (
                  <g
                    key={`slot-node-${slot.slotNumber}`}
                    className="cursor-pointer transition-transform hover:scale-110"
                    onClick={() => {
                      setSelectedSlot(slot);
                      if (!isOccupied && onSelectVacantSlot) {
                        onSelectVacantSlot(slot.slotNumber);
                      }
                    }}
                  >
                    {/* Pulsing indicator if this slot is the user */}
                    {isMe && (
                      <circle
                        cx={x}
                        cy={y}
                        r="32"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        className="animate-ping opacity-25"
                      />
                    )}

                    <circle
                      cx={x}
                      cy={y}
                      r="24"
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                    />

                    {/* Slot number icon */}
                    {isPaid ? (
                      <Check
                        x={x - 9}
                        y={y - 9}
                        width="18"
                        height="18"
                        className="text-emerald-600 stroke-[3]"
                      />
                    ) : (
                      <text
                        x={x}
                        y={y + 5}
                        textAnchor="middle"
                        fontSize="13"
                        fontWeight="bold"
                        fill={isOccupied ? '#1e293b' : '#94a3b8'}
                        fontFamily="Cairo"
                      >
                        {slot.slotNumber}
                      </text>
                    )}

                    {/* Member name or Vacant label */}
                    <text
                      x={x}
                      y={y + (y > center ? 36 : -30)}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill={isOccupied ? '#0f172a' : '#64748b'}
                      fontFamily="Cairo"
                    >
                      {isOccupied ? slot.userName?.split(' ')[0] : `مقعد ${slot.slotNumber} شاغر`}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Central King Throne in the Center */}
            <div
              onClick={() => setShowKingInfoModal(true)}
              className="absolute inset-0 m-auto w-40 h-40 rounded-full bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white flex flex-col items-center justify-center p-3 text-center shadow-xl border-4 border-white cursor-pointer hover:scale-105 transition-transform"
            >
              <Crown className="w-6 h-6 text-amber-200 mb-0.5 animate-bounce" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-100">
                الملك في الوسط
              </span>
              <span className="text-sm font-black leading-tight max-w-[130px] truncate text-white">
                {group.kingName}
              </span>
              <span className="text-[10px] font-mono text-amber-200 mt-0.5">
                {group.kingMembershipNo}
              </span>
              <div className="mt-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-bold tabular-nums">
                {potAmount.toLocaleString()} دج
              </div>
            </div>

          </div>

          {/* Progress Strip */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span>مدفوع للملك ({paidCount}/7)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              <span>بانتظار الدفع ({occupiedCount - paidCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-400"></span>
              <span>مقاعد شاغرة ({7 - occupiedCount})</span>
            </div>
          </div>
        </div>

        {/* Selected Slot Inspector & Actions */}
        <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-6 border border-slate-200/80 space-y-5">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-700">
              {selectedSlot ? `معاينة المقعد رقم ${selectedSlot.slotNumber}` : 'تفاصيل المقاعد السبعة المحيطة'}
            </span>
            {selectedSlot && (
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  selectedSlot.userId
                    ? selectedSlot.paymentStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedSlot.paymentStatus === 'pending'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {selectedSlot.userId
                  ? selectedSlot.paymentStatus === 'paid'
                    ? 'تم الدفع للملك ✓'
                    : selectedSlot.paymentStatus === 'pending'
                    ? 'الوصل قيد المراجعة'
                    : 'محجوز (غير مدفوع)'
                  : 'شاغر متاح للحجز'}
              </span>
            )}
          </div>

          {selectedSlot ? (
            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">العضو الشاغل:</span>
                <span className="font-bold text-slate-900">
                  {selectedSlot.userName || 'المقعد متاح شاغر'}
                </span>
              </div>

              {selectedSlot.userId && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">رقم العضوية:</span>
                    <span className="font-mono text-slate-800 font-bold">
                      {selectedSlot.membershipNo}
                    </span>
                  </div>

                  {selectedSlot.invitedBy && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">تمت دعوته بواسطة:</span>
                      <span className="font-semibold text-emerald-800">
                        {selectedSlot.invitedBy}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">المبلغ المستحق لملك الحلقة:</span>
                    <span className="font-extrabold text-emerald-800 tabular-nums">
                      {group.tierAmount.toLocaleString()} دج
                    </span>
                  </div>
                </>
              )}

              {/* Action Buttons for this slot */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                
                {/* 1. If vacant and member wants to reserve */}
                {!selectedSlot.userId && onSelectVacantSlot && (
                  <button
                    onClick={() => onSelectVacantSlot(selectedSlot.slotNumber)}
                    className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
                  >
                    احجز المقعد رقم {selectedSlot.slotNumber} الآن
                  </button>
                )}

                {/* 2. If occupied by current user and unpaid -> Pay button */}
                {selectedSlot.userId === currentUserId && selectedSlot.paymentStatus !== 'paid' && onPaySlot && (
                  <button
                    onClick={() => onPaySlot(selectedSlot.slotNumber)}
                    className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>رفع وصل تحويل {group.tierAmount.toLocaleString()} دج للملك</span>
                  </button>
                )}

                {/* 3. If King or Super Admin and slot has uploaded proof -> Verify buttons */}
                {canManage && selectedSlot.userId && selectedSlot.paymentStatus !== 'paid' && onVerifySlot && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onVerifySlot(selectedSlot.slotNumber, 'approve')}
                      className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                      تأكيد استلام الدفع للملك ✓
                    </button>
                    <button
                      onClick={() => onVerifySlot(selectedSlot.slotNumber, 'reject', 'الوصل غير مطابق')}
                      className="py-2 px-3 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                      رفض
                    </button>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-500 space-y-2">
              <p>انقر على أي مقعد من المقاعد السبعة المحيطة بالملك لمعاينة تفاصيله أو حجز المقعد الشاغر.</p>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-right space-y-1 text-[11px]">
                <span className="font-bold text-slate-800 block">قاعدة انتقال الأدوار:</span>
                <p>• المقعد رقم 1 هو المرشح ليكون الملك الجديد في الدورة القادمة.</p>
                <p>• عند اكتمال دفع جميع المقاعد (7 × {group.tierAmount.toLocaleString()} دج)، يستلم الملك وعاءه بالكامل، ويتحول لعضو في المقعد رقم 7، ويتوج العضو رقم 1 ملكاً جديداً.</p>
              </div>
            </div>
          )}

          {/* Transition Roles Big Callout if 7 are paid */}
          {allPaid && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-emerald-900 block flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>اكتملت مساهمات المقاعد السبعة بنجاح ({potAmount.toLocaleString()} دج)</span>
              </span>
              <p className="text-emerald-800 leading-relaxed">
                الملك ({group.kingName}) استلم كامل الوعاء. العضو في المقعد رقم 1 ({slots[0]?.userName}) مؤهل الآن للتتويج كملك جديد للحلقة.
              </p>
              {canManage && onTransitionRoles && (
                <button
                  onClick={onTransitionRoles}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  تأكيد انتقال الأدوار وتتويج العضو رقم 1 كملك
                </button>
              )}
            </div>
          )}

        </div>

      </div>

      {/* King's BaridiMob Modal */}
      {showKingInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  بيانات الدفع لملك الحلقة: {group.kingName}
                </h4>
              </div>
              <button
                onClick={() => setShowKingInfoModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-5 shadow-lg border border-slate-700 space-y-3">
                <div className="flex justify-between items-center text-xs border-b border-slate-700 pb-2">
                  <span className="text-slate-400">اسم صاحب الحساب (الملك):</span>
                  <span className="font-bold text-white text-sm">
                    {group.kingBaridiMob?.holderName || group.kingName}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-400">رقم الحساب البريدي RIP:</span>
                    {group.kingBaridiMob?.rip && (
                      <button
                        onClick={copyRip}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedRip ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedRip ? 'تم النسخ' : 'نسخ'}</span>
                      </button>
                    )}
                  </div>
                  <div className="font-mono text-sm sm:text-base font-bold text-emerald-300 bg-slate-800 p-2.5 rounded-lg border border-slate-700 text-left" dir="ltr">
                    {group.kingBaridiMob?.rip || 'لم يُحدد الـ RIP بعد'}
                  </div>
                </div>

                {group.kingBaridiMob?.cle && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">المفتاح Clé:</span>
                    <span className="font-mono font-bold text-white">{group.kingBaridiMob.cle}</span>
                  </div>
                )}

                {group.kingBaridiMob?.phone && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">الهاتف المرتبط:</span>
                    <span className="font-mono font-semibold text-slate-200" dir="ltr">{group.kingBaridiMob.phone}</span>
                  </div>
                )}
              </div>

              {group.kingBaridiMob?.notes && (
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border italic">
                  "{group.kingBaridiMob.notes}"
                </p>
              )}

              {/* If Current User is the King -> Option to update their BaridiMob info */}
              {(isKing || isSuperAdmin) && onUpdateKingBaridiMob && (
                <button
                  onClick={() => {
                    setShowKingInfoModal(false);
                    onUpdateKingBaridiMob();
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  تعديل معلومات بريدي موب الخاصة بي كملك
                </button>
              )}

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                ⚠️ يتم التحويل مباشرة من تطبيق بريدي موب لحساب الملك، ثم رفع صورة الوصل لتأكيد حجز المقعد ودفع المساهمة.
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
