export interface User {
  id: string;
  membershipNo: string;
  name: string;
  email: string;
  phone?: string;
  nationalId?: string;
  role: 'super_admin' | 'organizer' | 'member';
  status: 'active' | 'suspended';
  groupId?: string | null;
  groupName?: string | null;
  referralCode: string;
  invitedBy?: string | null;
  invitedByName?: string | null;
  referralCount: number;
  createdAt: string;
  lastLogin?: string;
}

export interface CircularMember {
  userId: string;
  name: string;
  membershipNo: string;
  positionInRing: number;
  hasReceivedTurn: boolean;
  payoutDate?: string | null;
  joinDate: string;
}

export interface GroupSlot {
  slotNumber: number; // 1 to 7
  userId: string | null;
  userName: string | null;
  membershipNo: string | null;
  invitedBy?: string | null;
  paymentStatus: 'unpaid' | 'pending' | 'paid';
  paymentProofId?: string | null;
  receiptImage?: string | null;
  joinedAt?: string | null;
}

export interface RoleTransitionLog {
  id: string;
  round: number;
  fromKingName: string;
  toKingName: string;
  date: string;
  totalCollected: number;
  details: string;
}

export interface CircularGroup {
  id: string;
  name: string;
  code: string;
  tierId: string;
  tierAmount: number; // in DZD
  potAmount: number; // e.g. tierAmount * 7
  organizerId: string;
  organizerName: string;
  kingUserId: string; // King in the center
  kingName: string;
  kingMembershipNo: string;
  kingBaridiMob?: {
    holderName: string;
    rip: string;
    cle?: string;
    phone?: string;
    notes?: string;
  };
  slots: GroupSlot[]; // Exactly 7 surrounding slots
  status: 'active' | 'paused' | 'completed';
  inviteCode: string;
  cycleDuration: 'monthly' | 'biweekly' | 'weekly';
  currentCycleIndex: number;
  completedCycles: number;
  members: CircularMember[];
  maxMembers: number;
  roleTransitionLogs?: RoleTransitionLog[];
  startDate?: string;
  notes?: string;
  createdAt: string;
}

export interface FinancialTier {
  id: string;
  name: string;
  amount: number;
  description: string;
  isActive: boolean;
  isCustom?: boolean;
}

export interface BaridiMobConfig {
  holderName: string;
  rip: string;
  cle: string;
  phone: string;
  notes: string;
  lastUpdated: string;
  updatedByAdminId: string;
  updatedByAdminName: string;
}

export interface PaymentProof {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  membershipNo: string;
  groupId: string;
  groupName: string;
  amount: number;
  paymentDate: string;
  receiptImage: string;
  receiptHash: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  reviewedByAdminId?: string | null;
  reviewedByAdminName?: string | null;
  createdAt: string;
}

export interface TransparencyRecord {
  id: string;
  date: string;
  type: 'مساهمة_دورية' | 'تسليم_استحقاق_دورة' | 'رسوم_تشغيل';
  amount: number;
  groupId: string;
  groupName: string;
  maskedMember: string;
  status: 'معتمد';
  cycleRound: number;
  approvedBy: string;
  notes?: string;
}

export interface JoinRequest {
  id: string;
  groupId: string;
  groupName: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  membershipNo: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface GroupCreationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  groupName: string;
  tierAmount: number;
  cycleDuration: 'monthly' | 'biweekly' | 'weekly';
  maxMembers: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  subject: string;
  status: 'open' | 'answered' | 'closed';
  createdAt: string;
  messages: Array<{
    id: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    content: string;
    createdAt: string;
  }>;
}

export interface NotificationItem {
  id: string;
  targetUserId: string | 'all';
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export interface SystemStatus {
  isSetup: boolean;
  platformName: string;
  setupDate: string | null;
  totalAdmins: number;
  activeTiers: FinancialTier[];
}
