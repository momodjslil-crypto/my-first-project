import {
  User,
  CircularGroup,
  FinancialTier,
  BaridiMobConfig,
  PaymentProof,
  TransparencyRecord,
  JoinRequest,
  GroupCreationRequest,
  SupportTicket,
  NotificationItem,
  AuditLogItem,
  SystemStatus,
  RoleTransitionLog,
} from '../types';

const TOKEN_KEY = 'takaful_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'حدث خطأ أثناء معالجة الطلب');
  }

  return data as T;
}

export const api = {
  // System
  getSystemStatus: () => request<SystemStatus>('/system/status'),
  setupAdmin: (payload: { name: string; email: string; password: string; confirmPassword: string; phone?: string; nationalId?: string }) =>
    request<{ message: string; user: User; token: string }>('/auth/setup-admin', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Auth
  login: (email: string, password: string) =>
    request<{ message: string; user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (payload: { name: string; email: string; password: string; confirmPassword: string; phone?: string; groupInviteCode?: string }) =>
    request<{ message: string; user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCurrentUser: () =>
    request<{ user: User; group: CircularGroup | null }>('/auth/me'),
  forgotPassword: (email: string, newPassword: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    }),

  // Members (Admin)
  getMembers: () => request<User[]>('/members'),
  createMember: (payload: { name: string; email: string; password: string; phone?: string; role?: string; groupId?: string }) =>
    request<{ message: string; user: User }>('/members', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateMemberStatus: (id: string, status: 'active' | 'suspended') =>
    request<{ message: string; status: string }>(`/members/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  updateMemberRole: (id: string, role: 'organizer' | 'member') =>
    request<{ message: string; role: string }>(`/members/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
  deleteMember: (id: string) =>
    request<{ message: string }>(`/members/${id}`, {
      method: 'DELETE',
    }),

  // Circular Groups
  getGroups: () => request<CircularGroup[]>('/groups'),
  getGroup: (id: string) => request<CircularGroup>(`/groups/${id}`),
  lookupGroup: (identifier: string) => request<CircularGroup>(`/groups/lookup/${encodeURIComponent(identifier)}`),
  joinSlot: (payload: { groupIdentifier?: string; groupId?: string; slotNumber: number }) =>
    request<{ message: string; group: CircularGroup; reservedSlot: any }>('/groups/join-slot', {
      method: 'POST',
      body: JSON.stringify({
        groupIdentifier: payload.groupIdentifier || payload.groupId,
        slotNumber: payload.slotNumber,
      }),
    }),
  updateKingBaridiMob: (groupId: string, payload: { holderName: string; rip: string; cle?: string; phone?: string; notes?: string }) =>
    request<{ message: string; group: CircularGroup; kingBaridiMob: any }>(`/groups/${groupId}/king-baridimob`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  paySlot: (groupId: string, payload: { slotNumber: number; receiptImage: string; notes?: string; paymentDate?: string }) =>
    request<{ message: string; group: CircularGroup; proof: any }>(`/groups/${groupId}/pay-slot`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  verifySlot: (
    groupId: string,
    slotOrPayload: number | { slotNumber: number; action: 'approve' | 'reject'; reason?: string },
    action?: 'approve' | 'reject',
    reason?: string
  ) => {
    const payload =
      typeof slotOrPayload === 'number'
        ? { slotNumber: slotOrPayload, action, reason }
        : slotOrPayload;
    return request<{ message: string; group: CircularGroup; slot: any }>(`/groups/${groupId}/verify-slot`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  transitionRoles: (groupId: string) =>
    request<{ message: string; group: CircularGroup; transitionLog: RoleTransitionLog }>(`/groups/${groupId}/transition-roles`, {
      method: 'POST',
    }),
  getReferralStats: () =>
    request<{
      referralCode: string;
      referralCount: number;
      totalInvited: number;
      invitedUsers: Array<{ id: string; name: string; membershipNo: string; createdAt: string; status: string; groupName: string }>;
      groupInfo: any;
    }>('/member/referral-stats'),
  createGroup: (payload: { name: string; tierId: string; organizerId?: string; cycleDuration?: string; maxMembers?: number; notes?: string }) =>
    request<{ message: string; group: CircularGroup }>('/groups', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateGroup: (id: string, payload: Partial<CircularGroup>) =>
    request<{ message: string; group: CircularGroup }>(`/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  advanceGroupTurn: (id: string) =>
    request<{ message: string; currentCycleIndex: number; group: CircularGroup }>(`/groups/${id}/advance-turn`, {
      method: 'POST',
    }),
  regenerateGroupInvite: (id: string) =>
    request<{ message: string; inviteCode: string }>(`/groups/${id}/regenerate-invite`, {
      method: 'POST',
    }),
  deleteGroup: (id: string) =>
    request<{ message: string }>(`/groups/${id}`, {
      method: 'DELETE',
    }),
  addGroupMember: (groupId: string, payload: { userId: string; positionInRing?: number }) =>
    request<{ message: string; group: CircularGroup }>(`/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  removeGroupMember: (groupId: string, userId: string) =>
    request<{ message: string; group: CircularGroup }>(`/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    }),
  reorderGroupRing: (groupId: string, orderedUserIds: string[]) =>
    request<{ message: string; group: CircularGroup }>(`/groups/${groupId}/reorder-ring`, {
      method: 'PUT',
      body: JSON.stringify({ orderedUserIds }),
    }),

  // Financial Tiers
  getFinancialTiers: () => request<FinancialTier[]>('/financial-tiers'),
  updateFinancialTiers: (tiers: FinancialTier[]) =>
    request<{ message: string; financialTiers: FinancialTier[] }>('/financial-tiers', {
      method: 'PUT',
      body: JSON.stringify({ tiers }),
    }),

  // BaridiMob
  getBaridiMob: () => request<BaridiMobConfig>('/baridimob'),
  updateBaridiMob: (payload: { holderName: string; rip: string; cle: string; phone: string; notes: string }) =>
    request<{ message: string; baridiMob: BaridiMobConfig }>('/baridimob', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Payments & Proofs
  uploadPaymentProof: (payload: { groupId: string; amount: number; paymentDate: string; receiptImage: string; notes?: string }) =>
    request<{ message: string; proof: PaymentProof }>('/payments/proofs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getPaymentProofs: () => request<PaymentProof[]>('/payments/proofs'),
  approvePaymentProof: (id: string) =>
    request<{ message: string; proof: PaymentProof }>(`/payments/proofs/${id}/approve`, {
      method: 'POST',
    }),
  rejectPaymentProof: (id: string, reason: string) =>
    request<{ message: string; proof: PaymentProof }>(`/payments/proofs/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // Transparency Ledger
  getTransparencyLedger: () => request<TransparencyRecord[]>('/transparency-ledger'),

  // Join Requests
  submitJoinRequest: (payload: { groupId?: string; inviteCode?: string }) =>
    request<{ message: string; request: JoinRequest }>('/groups/join-request', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getAllJoinRequests: () => request<JoinRequest[]>('/groups/join-requests/all'),
  approveJoinRequest: (id: string) =>
    request<{ message: string; request: JoinRequest }>(`/groups/join-requests/${id}/approve`, {
      method: 'POST',
    }),
  rejectJoinRequest: (id: string) =>
    request<{ message: string; request: JoinRequest }>(`/groups/join-requests/${id}/reject`, {
      method: 'POST',
    }),

  // Group Creation Requests
  submitGroupRequest: (payload: { groupName: string; tierAmount: number; cycleDuration: string; maxMembers: number; reason?: string }) =>
    request<{ message: string; request: GroupCreationRequest }>('/groups/create-request', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getAllGroupRequests: () => request<GroupCreationRequest[]>('/groups/create-requests/all'),
  approveGroupRequest: (id: string) =>
    request<{ message: string; group: CircularGroup }>(`/groups/create-requests/${id}/approve`, {
      method: 'POST',
    }),
  rejectGroupRequest: (id: string) =>
    request<{ message: string; proposal: GroupCreationRequest }>(`/groups/create-requests/${id}/reject`, {
      method: 'POST',
    }),

  // Support
  getSupportTickets: () => request<SupportTicket[]>('/support/tickets'),
  createSupportTicket: (payload: { subject: string; message: string }) =>
    request<{ message: string; ticket: SupportTicket }>('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  replySupportTicket: (id: string, content: string) =>
    request<{ message: string; ticket: SupportTicket }>(`/support/tickets/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  closeSupportTicket: (id: string) =>
    request<{ message: string; ticket: SupportTicket }>(`/support/tickets/${id}/close`, {
      method: 'PATCH',
    }),

  // Notifications
  getNotifications: () => request<NotificationItem[]>('/notifications'),
  markNotificationsRead: () => request<{ message: string }>('/notifications/mark-read', { method: 'POST' }),

  // Audit Logs (Admin)
  getAuditLogs: () => request<AuditLogItem[]>('/audit-logs'),
};
