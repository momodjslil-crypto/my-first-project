import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  membershipNo: string; // e.g. TKF-1001
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  nationalId?: string;
  role: 'super_admin' | 'organizer' | 'member';
  status: 'active' | 'suspended';
  groupId?: string | null;
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
  positionInRing: number; // 1, 2, 3...
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
  tierAmount: number; // in DZD (e.g. 2000)
  potAmount: number; // e.g. 2000 * 7 = 14000 DZD
  organizerId: string;
  organizerName: string;
  kingUserId: string; // The King in the center
  kingName: string;
  kingMembershipNo: string;
  kingBaridiMob?: {
    holderName: string;
    rip: string;
    cle?: string;
    phone?: string;
    notes?: string;
  };
  slots: GroupSlot[]; // Exactly 7 slots around the King (1 to 7)
  status: 'active' | 'paused' | 'completed';
  inviteCode: string;
  cycleDuration: 'monthly' | 'biweekly' | 'weekly';
  currentCycleIndex: number; // Current round
  completedCycles: number;
  members: CircularMember[];
  maxMembers: number; // 7 slots + 1 king
  roleTransitionLogs?: RoleTransitionLog[];
  startDate?: string;
  notes?: string;
  createdAt: string;
}

export function createDefaultSlots(): GroupSlot[] {
  return [1, 2, 3, 4, 5, 6, 7].map((num) => ({
    slotNumber: num,
    userId: null,
    userName: null,
    membershipNo: null,
    invitedBy: null,
    paymentStatus: 'unpaid',
    paymentProofId: null,
    receiptImage: null,
    joinedAt: null,
  }));
}

export interface FinancialTier {
  id: string;
  name: string;
  amount: number; // DZD
  description: string;
  isActive: boolean;
  isCustom?: boolean;
}

export interface BaridiMobConfig {
  holderName: string;
  rip: string; // e.g. 00799999002345678901
  cle: string; // e.g. 45
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
  amount: number; // DZD
  paymentDate: string;
  receiptImage: string; // Base64 data URL
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
  amount: number; // DZD
  groupId: string;
  groupName: string;
  maskedMember: string; // e.g. "عضو #TKF-1024"
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

export interface DatabaseSchema {
  system: {
    isSetup: boolean;
    platformName: string;
    setupDate: string | null;
    superAdminId: string | null;
  };
  users: User[];
  groups: CircularGroup[];
  financialTiers: FinancialTier[];
  baridiMob: BaridiMobConfig;
  paymentProofs: PaymentProof[];
  transparencyLedger: TransparencyRecord[];
  joinRequests: JoinRequest[];
  groupCreationRequests: GroupCreationRequest[];
  supportTickets: SupportTicket[];
  notifications: NotificationItem[];
  auditLogs: AuditLogItem[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'takaful_db.json');

const INITIAL_DB: DatabaseSchema = {
  system: {
    isSetup: false,
    platformName: 'منصة تكافل التعاونية',
    setupDate: null,
    superAdminId: null,
  },
  users: [],
  groups: [],
  financialTiers: [
    {
      id: 'tier_2000',
      name: 'فئة التكافل الأساسية',
      amount: 2000,
      description: 'مساهمة ميسرة قدرها 2,000 دج شهرياً',
      isActive: true,
      isCustom: false,
    },
    {
      id: 'tier_3000',
      name: 'فئة التضامن الفضية',
      amount: 3000,
      description: 'مساهمة قدرها 3,000 دج شهرياً',
      isActive: true,
      isCustom: false,
    },
    {
      id: 'tier_4000',
      name: 'فئة التضامن الذهبية',
      amount: 4000,
      description: 'مساهمة قدرها 4,000 دج شهرياً',
      isActive: true,
      isCustom: false,
    },
    {
      id: 'tier_custom',
      name: 'الفئة المخصصة الإدارية',
      amount: 5000,
      description: 'فئة رابعة يحدد المسؤول قيمتها بدقة بالدينار الجزائري',
      isActive: true,
      isCustom: true,
    },
  ],
  baridiMob: {
    holderName: '',
    rip: '',
    cle: '',
    phone: '',
    notes: 'الرجاء كتابة رقم العضوية واسم المجموعة في خانة الملاحظات عند التحويل عبر بريدي موب.',
    lastUpdated: '',
    updatedByAdminId: '',
    updatedByAdminName: '',
  },
  paymentProofs: [],
  transparencyLedger: [],
  joinRequests: [],
  groupCreationRequests: [],
  supportTickets: [],
  notifications: [],
  auditLogs: [],
};

// Security Helpers
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

export function generateToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString('base64url');
  const signature = crypto.createHmac('sha256', 'takaful-secret-key-dz').update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyToken(token: string): string | null {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;
    const expectedSig = crypto.createHmac('sha256', 'takaful-secret-key-dz').update(payload).digest('base64url');
    if (signature !== expectedSig) return null;
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    return decoded.userId || null;
  } catch {
    return null;
  }
}

export function generateMembershipNo(existingCount: number): string {
  return `TKF-${(1001 + existingCount).toString()}`;
}

// Ensure database file exists
function initDb(): void {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
  }
}

initDb();

export function readDb(): DatabaseSchema {
  try {
    initDb();
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to read database, returning default:', err);
    return INITIAL_DB;
  }
}

export function writeDb(db: DatabaseSchema): void {
  try {
    initDb();
    const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('Failed to write database:', err);
    throw err;
  }
}
