import React, { useState, useEffect } from 'react';
import { User, CircularGroup, PaymentProof, JoinRequest, GroupCreationRequest, TransparencyRecord } from '../../types';
import { api } from '../../api/client';
import { AdminOverview } from './AdminOverview';
import { AdminMembers } from './AdminMembers';
import { AdminGroups } from './AdminGroups';
import { AdminBaridiMob } from './AdminBaridiMob';
import { AdminPaymentProofs } from './AdminPaymentProofs';
import { AdminRequests } from './AdminRequests';
import { AdminTransparency } from './AdminTransparency';
import { AdminFinancialTiers } from './AdminFinancialTiers';
import { AdminSupport } from './AdminSupport';
import { AdminAuditLogs } from './AdminAuditLogs';
import { AdminReports } from './AdminReports';
import {
  LayoutDashboard,
  Users,
  Layers,
  CreditCard,
  FileCheck,
  Inbox,
  ShieldCheck,
  Coins,
  MessageSquare,
  History,
  FileText,
  RefreshCw,
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Shared state for counts
  const [members, setMembers] = useState<User[]>([]);
  const [groups, setGroups] = useState<CircularGroup[]>([]);
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [groupRequests, setGroupRequests] = useState<GroupCreationRequest[]>([]);
  const [transparency, setTransparency] = useState<TransparencyRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const reloadData = async () => {
    try {
      setRefreshing(true);
      const [m, g, p, j, gr, t] = await Promise.all([
        api.getMembers(),
        api.getGroups(),
        api.getPaymentProofs(),
        api.getAllJoinRequests(),
        api.getAllGroupRequests(),
        api.getTransparencyLedger(),
      ]);
      setMembers(m);
      setGroups(g);
      setProofs(p);
      setJoinRequests(j);
      setGroupRequests(gr);
      setTransparency(t);
    } catch (err) {
      console.error('Failed to refresh data', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    reloadData();
  }, [activeTab]);

  const pendingProofsCount = proofs.filter((p) => p.status === 'pending').length;
  const pendingRequestsCount =
    joinRequests.filter((r) => r.status === 'pending').length +
    groupRequests.filter((r) => r.status === 'pending').length;

  const navItems = [
    { id: 'overview', label: 'لوحة المؤشرات', icon: LayoutDashboard },
    { id: 'members', label: 'الأعضاء والمنسقين', icon: Users, badge: members.length },
    { id: 'groups', label: 'الحلقات الدائرية', icon: Layers, badge: groups.length },
    { id: 'baridimob', label: 'بيانات بريدي موب', icon: CreditCard },
    { id: 'proofs', label: 'إثباتات الدفع', icon: FileCheck, badge: pendingProofsCount, badgeColor: 'bg-amber-500 text-white' },
    { id: 'requests', label: 'الطلبات والمقترحات', icon: Inbox, badge: pendingRequestsCount, badgeColor: 'bg-emerald-600 text-white' },
    { id: 'transparency', label: 'سجل الشفافية', icon: ShieldCheck },
    { id: 'tiers', label: 'الفئات المالية (دج)', icon: Coins },
    { id: 'support', label: 'مركز الدعم والرسائل', icon: MessageSquare },
    { id: 'reports', label: 'التقارير والتصدير', icon: FileText },
    { id: 'audit', label: 'سجل العمليات والتدقيق', icon: History },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Navigation Subheader */}
      <div className="no-print bg-white border border-slate-200 rounded-2xl p-2 shadow-sm flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                      item.badgeColor || (isActive ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={reloadData}
          disabled={refreshing}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
          title="تحديث البيانات"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>

      {/* Main Tab View */}
      <div>
        {activeTab === 'overview' && (
          <AdminOverview
            members={members}
            groups={groups}
            proofs={proofs}
            joinRequests={joinRequests}
            groupRequests={groupRequests}
            transparencyRecords={transparency}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'members' && <AdminMembers />}

        {activeTab === 'groups' && <AdminGroups />}

        {activeTab === 'baridimob' && <AdminBaridiMob />}

        {activeTab === 'proofs' && <AdminPaymentProofs />}

        {activeTab === 'requests' && <AdminRequests />}

        {activeTab === 'transparency' && <AdminTransparency />}

        {activeTab === 'tiers' && <AdminFinancialTiers />}

        {activeTab === 'support' && <AdminSupport />}

        {activeTab === 'reports' && (
          <AdminReports
            members={members}
            groups={groups}
            proofs={proofs}
            transparency={transparency}
          />
        )}

        {activeTab === 'audit' && <AdminAuditLogs />}
      </div>

    </div>
  );
};
