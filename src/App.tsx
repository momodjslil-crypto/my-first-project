import React, { useState, useEffect } from 'react';
import { api, clearStoredToken } from './api/client';
import { User, NotificationItem, SystemStatus } from './types';
import { AdminSetup } from './components/AdminSetup';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MemberDashboard } from './components/member/MemberDashboard';
import { AdminTransparency } from './components/admin/AdminTransparency';
import { AdminBaridiMob } from './components/admin/AdminBaridiMob';
import { PublicGroupsView } from './components/common/PublicGroupsView';
import { AuthModal } from './components/AuthModal';
import { LegalModal } from './components/common/LegalModal';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import {
  Layers,
  ShieldCheck,
  CreditCard,
  Users,
  Coins,
  ArrowRight,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Active View: 'home' | 'admin' | 'member' | 'groups' | 'transparency' | 'baridimob'
  const [activeView, setActiveView] = useState('home');

  // Modals & Drawers
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [inviteCodeFromUrl, setInviteCodeFromUrl] = useState<string | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Initial check
  const initApp = async () => {
    try {
      setLoading(true);
      // Check query params for invite link
      const urlParams = new URLSearchParams(window.location.search);
      const invite = urlParams.get('invite');
      if (invite) {
        setInviteCodeFromUrl(invite);
      }

      const status = await api.getSystemStatus();
      setSystemStatus(status);

      if (status.isSetup) {
        // Try fetching current logged-in user
        try {
          const me = await api.getCurrentUser();
          setCurrentUser(me.user);
          if (me.user.role === 'super_admin') {
            setActiveView('admin');
          } else {
            setActiveView('member');
          }
          // Fetch notifications
          const notifs = await api.getNotifications();
          setNotifications(notifs);
        } catch {
          // Guest session
          if (invite) {
            setIsAuthOpen(true);
          }
        }
      }
    } catch (err) {
      console.error('Failed to initialize app', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initApp();
  }, []);

  const handleLogout = () => {
    clearStoredToken();
    setCurrentUser(null);
    setActiveView('home');
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'super_admin') {
      setActiveView('admin');
    } else {
      setActiveView('member');
    }
    // Refresh notifications
    api.getNotifications().then(setNotifications).catch(() => {});
  };

  const handleMarkNotifsRead = async () => {
    try {
      await api.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-300 font-semibold text-sm">جاري تهيئة منصة تكافل التعاونية...</p>
        </div>
      </div>
    );
  }

  // 1. Initial Setup Wizard (Strictly shown once when system is not yet initialized)
  if (systemStatus && !systemStatus.isSetup) {
    return (
      <AdminSetup
        onSetupSuccess={(user) => {
          setSystemStatus((prev) => (prev ? { ...prev, isSetup: true, totalAdmins: 1 } : null));
          handleAuthSuccess(user);
        }}
      />
    );
  }

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-emerald-600 selection:text-white" dir="rtl">
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        unreadNotifsCount={unreadNotifsCount}
        onOpenNotifs={() => setIsNotifsOpen(true)}
        onOpenLegal={() => setIsLegalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* Admin Dashboard */}
        {activeView === 'admin' && currentUser?.role === 'super_admin' && (
          <AdminDashboard currentUser={currentUser} />
        )}

        {/* Member Dashboard */}
        {activeView === 'member' && currentUser && (
          <MemberDashboard currentUser={currentUser} onOpenLegal={() => setIsLegalOpen(true)} />
        )}

        {/* Public Groups Explorer */}
        {activeView === 'groups' && (
          <PublicGroupsView currentUser={currentUser} onOpenAuth={() => setIsAuthOpen(true)} />
        )}

        {/* Transparency Ledger View */}
        {activeView === 'transparency' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AdminTransparency />
          </div>
        )}

        {/* BaridiMob Details View */}
        {activeView === 'baridimob' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AdminBaridiMob />
          </div>
        )}

        {/* Guest Landing Portal (When user is not logged in and on home view) */}
        {activeView === 'home' && !currentUser && (
          <div className="space-y-16 py-10 sm:py-16">
            
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                <div className="lg:col-span-7 space-y-6 text-right">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>منصة تعاونية دائرية رقمية بالدينار الجزائري</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                    التكافل الدائري المنظم، بكل شفافية وأمان عبر بريدي موب
                  </h1>

                  <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                    منصة ويب حقيقية تدير حلقات الادخار التضامني (القرعة والجمعيات التعاونية). بدون فوائد، بدون تسويق هرمي، وبتوثيق رسمي لكل دينار في سجل الشفافية المعتمد.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <button
                      onClick={() => setIsAuthOpen(true)}
                      className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>الانضمام وإنشاء حساب عضو</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setActiveView('groups')}
                      className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm rounded-xl border border-slate-300 shadow-sm transition-all cursor-pointer"
                    >
                      استعراض الحلقات المتاحة
                    </button>
                  </div>

                  {/* Trust markers */}
                  <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-xs text-slate-600">
                    <div>
                      <span className="font-extrabold text-slate-900 block text-sm">بريدي موب الرسمي</span>
                      <span>تحويلات مباشرة دون طلب كلمة السر</span>
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-900 block text-sm">حلقات دائرية متساوية</span>
                      <span>أدوار محددة سلفاً بعدالة كاملة</span>
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-900 block text-sm">سجل شفافية موثق</span>
                      <span>كل وصل يخضع للمطابقة الإدارية</span>
                    </div>
                  </div>
                </div>

                {/* Right Hero Visual Card */}
                <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-8 shadow-2xl border border-slate-700/80 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        ت
                      </div>
                      <span className="font-bold text-sm">نموذج الحلقة الدائرية (ROSCA)</span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                      DZD CURRENCY
                    </span>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1">
                      <span className="text-slate-400 block">فئات المساهمة المعتمدة:</span>
                      <span className="font-bold text-emerald-300 text-sm">
                        2,000 دج · 3,000 دج · 4,000 دج · فئات مخصصة
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1">
                      <span className="text-slate-400 block">ضمانات الأمان المالي:</span>
                      <p className="text-slate-300 leading-relaxed text-[11px]">
                        المنصة مبنية من الصفر بقاعدة بيانات حقيقية وبدون أي حسابات أو مجموعات وهمية، تحت إدارة وإشراف المسؤول الرئيسي لضمان حقوق كل عضو.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    تسجيل الدخول للمنصة
                  </button>
                </div>

              </div>
            </div>

            {/* Public Groups & Transparency Quick View */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <PublicGroupsView currentUser={currentUser} onOpenAuth={() => setIsAuthOpen(true)} />
            </div>

          </div>
        )}

      </main>

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialInviteCode={inviteCodeFromUrl}
      />

      <LegalModal
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
      />

      <NotificationDrawer
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkNotifsRead}
      />

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 mt-16 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-800 text-sm">منصة تكافل التعاونية</span>
            <span>·</span>
            <span>نظام الحلقات الدائرية والادخار التضامني بالدينار الجزائري</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsLegalOpen(true)}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              الشروط والأحكام
            </button>
            <button
              onClick={() => setIsLegalOpen(true)}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              سياسة الخصوصية
            </button>
            <button
              onClick={() => setIsLegalOpen(true)}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              الضوابط المالية في الجزائر
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
