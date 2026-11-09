import React from 'react';
import { NotificationItem } from '../../types';
import { Bell, Check, X, Info, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 left-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-white shadow-2xl border-r border-slate-200 flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-slate-900 text-sm">مركز التنبيهات والإشعارات</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
            {notifications.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                <Bell className="w-8 h-8 mx-auto text-slate-200" />
                <p>لا توجد إشعارات جديدة حالياً.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-xl transition-colors space-y-1 ${
                    notif.isRead ? 'bg-white opacity-70' : 'bg-emerald-50/50 border border-emerald-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      {notif.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      {notif.type === 'alert' && <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />}
                      {notif.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                      {notif.type === 'info' && <Info className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{notif.title}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {notif.createdAt.split('T')[1]?.slice(0, 5)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pr-5">
                    {notif.message}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-slate-100">
              <button
                onClick={onMarkAllRead}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                تحديد جميع الإشعارات كمقروءة
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
