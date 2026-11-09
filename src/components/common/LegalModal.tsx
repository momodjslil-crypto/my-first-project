import React, { useState } from 'react';
import { ShieldCheck, Scale, FileText, Lock, AlertTriangle, X, CheckCircle2 } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'financial' | 'disputes'>('financial');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 relative max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                الضوابط القانونية وشروط الاستخدام والخصوصية
              </h3>
              <p className="text-xs text-slate-500">
                منصة تكافل التعاونية الدائرية · الإطار التنظيمي التضامني
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold shrink-0 gap-1">
          <button
            onClick={() => setActiveTab('financial')}
            className={`py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'financial' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            السياسة المالية والشرعية
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'terms' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            شروط الاستخدام
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'privacy' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            سياسة الخصوصية
          </button>
          <button
            onClick={() => setActiveTab('disputes')}
            className={`py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'disputes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            آلية حل النزاعات
          </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed pr-1 flex-1">
          
          {activeTab === 'financial' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-950 space-y-2">
                <h4 className="font-bold text-sm text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>طبيعة التعاملات المالية ونموذج الادخار التضامني (القرعة التكافلية)</span>
                </h4>
                <p>
                  تعتمد المنصة نموذج الجمعية الدائرية (ROSCA)، وهو نظام ادخار وتكافل اجتماعي معروف في المجتمع الجزائري يقوم على تدوير المبالغ بين أعضاء المجموعة الواحدة بدون أي فوائد ربوية وبدون أي مضاربة.
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-900">المبادئ الجوهرية للتعاملات:</h5>
                <ul className="list-disc list-inside space-y-1.5 text-slate-600">
                  <li><strong>حظر التسويق الهرمي:</strong> لا ترتبط استحقاقات الأعضاء أو أرباحهم بجلب مشتركين جدد إطلاقاً.</li>
                  <li><strong>التساوي الكامل:</strong> مجموع ما يدفعه العضو طيلة دورة الحلقة يساوي تماماً الوعاء الذي يستلمه عند حلول دوره المحدد مسبقاً.</li>
                  <li><strong>سجل الشفافية:</strong> يتم توثيق كل عملية دفع أو تسليم وعاء في سجل الشفافية المتاح لأعضاء المجموعة.</li>
                  <li><strong>حظر جمع الودائع:</strong> المنصة ليست بنكاً ولا تدير محافظ استثمارية؛ تقتصر على تنظيم الأدوار وتوثيق وصولات بريدي موب الفعلية.</li>
                </ul>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                ⚠️ <span className="font-bold">تنبيه قانوني:</span> يجب التأكد من الامتثال للقوانين واللوائح المصرفية السارية في الجمهورية الجزائرية الديمقراطية الشعبية قبل التعامل بمبالغ حقيقية كبيرة.
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-900">1. أهلية الاستخدام</h4>
              <p>
                يشترط في العضو أن يكون بالغاً للسن القانوني، ومسؤولاً عن صحة بياناته المسجلة وسلامة التحويلات التي يجريها عبر بريدي موب.
              </p>

              <h4 className="font-bold text-sm text-slate-900">2. الالتزام بالدفع في الموعد</h4>
              <p>
                يلتزم كل عضو في الحلقة الدائرية بسداد مساهمته المحددة في بداية كل دورة، ورفع وصل التحويل الرسمي لتفادي تعليق حسابه أو اتخاذ إجراءات إدارية.
              </p>

              <h4 className="font-bold text-sm text-slate-900">3. صلاحيات المسؤول الرئيسي (الملك)</h4>
              <p>
                يمتلك المسؤول الرئيسي الصلاحية الحصرية في مراجعة وقبول أو رفض وصولات التحويل، وإنشاء المجموعات وإيقافها، وتعديل إعدادات بريدي موب، ولا يجوز لأي عضو أو منظم التعدي على هذه الصلاحيات.
              </p>

              <h4 className="font-bold text-sm text-slate-900">4. حظر تكرار الوصولات</h4>
              <p>
                يُعد تقديم وصل دفع مزور أو مستخدم سابقاً مخالفة جسيمة تؤدي إلى الإيقاف الفوري للحساب والإحالة للتدقيق الإداري.
              </p>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-900">1. سرية البيانات الحساسة</h4>
              <p>
                المنصة <span className="underline font-bold">لا تطلب ولا تخزن إطلاقاً</span> أي معلومات سرية متعلقة بحسابات بريدي موب ككلمات المرور، أرقام البطاقة الذهبية، أو رموز التحقق OTP.
              </p>

              <h4 className="font-bold text-sm text-slate-900">2. حماية بيانات الأعضاء في سجل الشفافية</h4>
              <p>
                في سجل الشفافية العام والمجموعات، تُعرض العمليات بأسماء مستعارة (مثال: عضو #TKF-1024) لحماية الخصوصية المصرفية للأعضاء ومنع تسريب بياناتهم الشخصية.
              </p>

              <h4 className="font-bold text-sm text-slate-900">3. حماية إثباتات الدفع</h4>
              <p>
                صور وصولات التحويل لا يراها سوى العضو صاحب الوصل والمسؤول الرئيسي المخول بالمصادقة عليها عبر خوادم آمنة ومشفرة.
              </p>
            </div>
          )}

          {activeTab === 'disputes' && (
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-900">1. آلية فض النزاعات الودية</h4>
              <p>
                في حال وجود أي خلاف حول موعد الاستحقاق أو صحة وصل التحويل، يتم اللجوء أولاً لمركز الدعم المباشر ومراجعة سجل التدقيق الإداري (Audit Logs).
              </p>

              <h4 className="font-bold text-sm text-slate-900">2. التعويض وإعادة الترتيب</h4>
              <p>
                إذا تخلف أحد أعضاء الحلقة عن السداد، يتولى منسق المجموعة بالتعاون مع المسؤول الرئيسي إعادة ترتيب الأدوار واستبدال العضو المخالف بما يحفظ حقوق باقي أعضاء الحلقة.
              </p>

              <h4 className="font-bold text-sm text-slate-900">3. السجل غير القابل للتعديل</h4>
              <p>
                تُعتبر القيود المسجلة في سجل الشفافية وسجل التدقيق الإداري بينة قاطعة على حصول المعاملة ومصادقة الإدارة عليها.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">منصة تكافل التعاونية · نظام حماية الأعضاء</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            فهمت وموافق
          </button>
        </div>

      </div>
    </div>
  );
};
