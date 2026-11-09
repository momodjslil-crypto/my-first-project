import React from 'react';
import { User } from '../types';
import { Bell, LogOut, ShieldAlert, User as UserIcon, Layers, FileCheck } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeView: string;
  setActiveView: (view: string) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  unreadNotifsCount: number;
  onOpenNotifs: () => void;
  onOpenLegal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeView,
  setActiveView,
  onOpenAuth,
  onLogout,
  unreadNotifsCount,
  onOpenNotifs,
  onOpenLegal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveView(currentUser?.role === 'super_admin' ? 'admin' : 'home')}
            className="flex items-center gap-2.5 text-right cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-700/20 group-hover:bg-emerald-700 transition-colors">
              <span className="font-extrabold text-lg leading-none">ت</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
                منصة تكافل
              </span>
              <span className="text-[10px] text-slate-500 font-medium -mt-1">
                التعاونية الدائرية
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: 4-5 single-line clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveView(currentUser?.role === 'super_admin' ? 'admin' : 'home')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeView === 'home' || activeView === 'admin'
                ? 'text-emerald-700 font-semibold border-b-2 border-emerald-600'
                : 'hover:text-slate-900'
            }`}
          >
            {currentUser?.role === 'super_admin' ? 'لوحة الملك' : 'الرئيسية'}
          </button>

          <button
            onClick={() => setActiveView('groups')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeView === 'groups'
                ? 'text-emerald-700 font-semibold border-b-2 border-emerald-600'
                : 'hover:text-slate-900'
            }`}
          >
            الحلقات الدائرية
          </button>

          <button
            onClick={() => setActiveView('transparency')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeView === 'transparency'
                ? 'text-emerald-700 font-semibold border-b-2 border-emerald-600'
                : 'hover:text-slate-900'
            }`}
          >
            سجل الشفافية
          </button>

          <button
            onClick={() => setActiveView('baridimob')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeView === 'baridimob'
                ? 'text-emerald-700 font-semibold border-b-2 border-emerald-600'
                : 'hover:text-slate-900'
            }`}
          >
            بيانات بريدي موب
          </button>

          <button
            onClick={onOpenLegal}
            className="whitespace-nowrap shrink-0 transition-colors py-1 hover:text-slate-900 text-slate-500"
          >
            الشروط والضوابط
          </button>
        </nav>

        {/* Zone 3: 1 primary action / Account Area */}
        <div className="flex items-center gap-3 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-3">
              {/* Notification Button */}
              <button
                onClick={onOpenNotifs}
                className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="الإشعارات"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-600 rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {/* User Identity Chip */}
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[11px] text-slate-500 tabular-nums">
                  {currentUser.role === 'super_admin' ? 'المسؤول الرئيسي (الملك)' : currentUser.membershipNo}
                </span>
              </div>

              {/* Action Button: Logout */}
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
            >
              تسجيل الدخول / الانضمام
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
