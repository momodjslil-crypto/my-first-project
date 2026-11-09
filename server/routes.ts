import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  readDb,
  writeDb,
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  generateMembershipNo,
  User,
  CircularGroup,
  CircularMember,
  GroupSlot,
  RoleTransitionLog,
  createDefaultSlots,
  PaymentProof,
  TransparencyRecord,
  AuditLogItem,
  NotificationItem,
} from './db.js';

export const apiRouter = express.Router();

// Middleware: Authenticate user
export interface AuthRequest extends Request {
  user?: User;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'غير مصرح، يُرجى تسجيل الدخول' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const userId = verifyToken(token);
  if (!userId) {
    res.status(401).json({ error: 'رمز الدخول غير صالح أو منتهي الصلاحية' });
    return;
  }

  const db = readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    res.status(401).json({ error: 'المستخدم غير موجود' });
    return;
  }

  if (user.status === 'suspended') {
    res.status(403).json({ error: 'تم تعليق هذا الحساب من قبل الإدارة' });
    return;
  }

  req.user = user;
  next();
}

// Middleware: Super Admin only ("الملك")
export function superAdminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'super_admin') {
    res.status(403).json({ error: 'هذا الإجراء متاح حصرياً للمسؤول الرئيسي (الملك)' });
    return;
  }
  next();
}

// Helper to log administrative audit trail
function logAudit(admin: User, action: string, details: string, ip?: string): void {
  try {
    const db = readDb();
    const item: AuditLogItem = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      adminId: admin.id,
      adminName: admin.name,
      action,
      details,
      ipAddress: ip || '127.0.0.1',
      createdAt: new Date().toISOString(),
    };
    db.auditLogs.unshift(item);
    if (db.auditLogs.length > 500) {
      db.auditLogs = db.auditLogs.slice(0, 500);
    }
    writeDb(db);
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

// Helper to push in-app notification
function pushNotification(targetUserId: string | 'all', title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert' = 'info'): void {
  try {
    const db = readDb();
    const item: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      targetUserId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    db.notifications.unshift(item);
    writeDb(db);
  } catch (err) {
    console.error('Failed to push notification:', err);
  }
}

// ==========================================
// 1. SYSTEM & SETUP ENDPOINTS
// ==========================================

// Get system setup status
apiRouter.get('/system/status', (req: Request, res: Response) => {
  const db = readDb();
  res.json({
    isSetup: db.system.isSetup,
    platformName: db.system.platformName,
    setupDate: db.system.setupDate,
    totalAdmins: db.users.filter((u) => u.role === 'super_admin').length,
    activeTiers: db.financialTiers.filter((t) => t.isActive),
  });
});

// Setup Initial Super Admin ("الملك") - ONE TIME ONLY
apiRouter.post('/auth/setup-admin', (req: Request, res: Response) => {
  const { name, email, password, confirmPassword, phone, nationalId } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ error: 'كلمة المرور وتأكيد كلمة المرور غير متطابقين' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'يجب أن لا تقل كلمة المرور عن 6 أحرف أو أرقام' });
    return;
  }

  const db = readDb();
  if (db.system.isSetup || db.users.some((u) => u.role === 'super_admin')) {
    res.status(403).json({ error: 'تم إعداد حساب المسؤول الرئيسي مسبقاً، ولا يمكن تكرار هذه العملية.' });
    return;
  }

  const adminId = `admin_${Date.now()}`;
  const superAdmin: User = {
    id: adminId,
    membershipNo: 'TKF-ADMIN-01',
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password),
    phone: phone?.trim() || '',
    nationalId: nationalId?.trim() || '',
    role: 'super_admin',
    status: 'active',
    referralCode: 'TKF-ADMIN-01',
    invitedBy: null,
    invitedByName: null,
    referralCount: 0,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  db.users.push(superAdmin);
  db.system.isSetup = true;
  db.system.setupDate = new Date().toISOString();
  db.system.superAdminId = adminId;

  // Initialize BaridiMob placeholder with admin info
  db.baridiMob.lastUpdated = new Date().toISOString();
  db.baridiMob.updatedByAdminId = adminId;
  db.baridiMob.updatedByAdminName = superAdmin.name;

  writeDb(db);

  logAudit(superAdmin, 'تأسيس المنصة', 'تم إنشاء حساب المسؤول الرئيسي (الملك) وإطلاق المنصة من الصفر');
  pushNotification(adminId, 'مرحباً بك في تكافل', 'تم إعداد حسابك بنجاح كمسؤول رئيسي للمنصة. يمكنك الآن ضبط إعدادات بريدي موب وإضافة المجموعات والأعضاء.', 'success');

  const token = generateToken(adminId);
  const { passwordHash: _, ...safeUser } = superAdmin;
  res.json({
    message: 'تم إنشاء حساب المسؤول الرئيسي بنجاح',
    user: safeUser,
    token,
  });
});

// ==========================================
// 2. AUTHENTICATION (Login, Register, Me)
// ==========================================

// User Login
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
    return;
  }

  const db = readDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user) {
    res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    return;
  }

  if (!verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    return;
  }

  if (user.status === 'suspended') {
    res.status(403).json({ error: 'حسابك معلق حالياً من قبل الإدارة. يرجى التواصل مع المسؤول.' });
    return;
  }

  user.lastLogin = new Date().toISOString();
  writeDb(db);

  const token = generateToken(user.id);
  const { passwordHash: _, ...safeUser } = user;
  res.json({
    message: 'تم تسجيل الدخول بنجاح',
    user: safeUser,
    token,
  });
});

// Register New Member
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, password, confirmPassword, phone, referralCode, groupInviteCode } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ error: 'كلمات المرور غير متطابقة' });
    return;
  }

  const db = readDb();
  if (db.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
    res.status(400).json({ error: 'هذا البريد الإلكتروني مسجل بالفعل' });
    return;
  }

  const memberId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const membershipNo = generateMembershipNo(db.users.length);

  // Referral tracking
  let inviterUser: User | undefined;
  if (referralCode) {
    const cleanRef = referralCode.trim().toUpperCase();
    inviterUser = db.users.find(
      (u) =>
        u.membershipNo.toUpperCase() === cleanRef ||
        (u.referralCode && u.referralCode.toUpperCase() === cleanRef)
    );
    if (inviterUser) {
      inviterUser.referralCount = (inviterUser.referralCount || 0) + 1;
    }
  }

  const newMember: User = {
    id: memberId,
    membershipNo,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password),
    phone: phone?.trim() || '',
    role: 'member',
    status: 'active',
    referralCode: membershipNo,
    invitedBy: inviterUser ? inviterUser.id : null,
    invitedByName: inviterUser ? inviterUser.name : null,
    referralCount: 0,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  db.users.push(newMember);

  if (inviterUser) {
    pushNotification(
      inviterUser.id,
      'دعوة ناجحة جديدة!',
      `انضم العضو الجديد ${newMember.name} عبر رابط دعوتك الخاص (رقم العضوية ${newMember.membershipNo}).`,
      'success'
    );
  }

  // If registering via group invite code, register join request automatically
  if (groupInviteCode) {
    const group = db.groups.find((g) => g.inviteCode === groupInviteCode);
    if (group) {
      db.joinRequests.push({
        id: `join_${Date.now()}`,
        groupId: group.id,
        groupName: group.name,
        userId: newMember.id,
        userName: newMember.name,
        userEmail: newMember.email,
        userPhone: newMember.phone,
        membershipNo: newMember.membershipNo,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      pushNotification('all', 'طلب انضمام جديد', `قدم العضو ${newMember.name} (${newMember.membershipNo}) طلب انضمام لمجموعة ${group.name}`, 'info');
    }
  }

  writeDb(db);

  pushNotification(newMember.id, 'مرحباً بك في منصة تكافل', `أهلاً بك يا ${newMember.name}. رقم عضويتك هو ${membershipNo}. يمكنك الآن استعراض المجموعات ورفع إثباتات الدفع.`, 'success');

  const token = generateToken(newMember.id);
  const { passwordHash: _, ...safeUser } = newMember;
  res.json({
    message: 'تم إنشاء الحساب بنجاح',
    user: safeUser,
    token,
  });
});

// Get Current Logged In User
apiRouter.get('/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const { passwordHash: _, ...safeUser } = req.user!;
  const db = readDb();
  
  // Attach current group details if any
  let currentGroup: CircularGroup | null = null;
  if (req.user?.groupId) {
    currentGroup = db.groups.find((g) => g.id === req.user?.groupId) || null;
  }

  res.json({
    user: safeUser,
    group: currentGroup,
  });
});

// Password recovery simulation (safe update with email)
apiRouter.post('/auth/forgot-password', (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور الجديدة مطلوبان' });
    return;
  }

  const db = readDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    res.status(404).json({ error: 'لم يتم العثور على حساب بهذا البريد الإلكتروني' });
    return;
  }

  user.passwordHash = hashPassword(newPassword);
  writeDb(db);

  pushNotification(user.id, 'تحديث كلمة المرور', 'تم تحديث كلمة المرور الخاصة بحسابك بنجاح.', 'warning');
  res.json({ message: 'تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.' });
});

// ==========================================
// 3. MEMBERS MANAGEMENT (Admin)
// ==========================================

// List all members
apiRouter.get('/members', authMiddleware, superAdminMiddleware, (req: AuthRequest, res: Response) => {
  const db = readDb();
  const safeUsers = db.users.map(({ passwordHash: _, ...user }) => {
    const group = db.groups.find((g) => g.id === user.groupId);
    return {
      ...user,
      groupName: group ? group.name : null,
    };
  });
  res.json(safeUsers);
});

// Add member manually by admin
apiRouter.post('/members', authMiddleware, superAdminMiddleware, (req: AuthRequest, res: Response) => {
  const { name, email, password, phone, role, groupId } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' });
    return;
  }

  const db = readDb();
  if (db.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
    res.status(400).json({ error: 'هذا البريد الإلكتروني مسجل بالفعل' });
    return;
  }

  const newId = `user_${Date.now()}`;
  const membershipNo = generateMembershipNo(db.users.length);
  const referralCode = `TKF-${Math.floor(1000 + Math.random() * 9000)}`;

  const newUser: User = {
    id: newId,
    membershipNo,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password),
    phone: phone?.trim() || '',
    role: role === 'organizer' ? 'organizer' : 'member',
    status: 'active',
    groupId: groupId || null,
    referralCode,
    referralCount: 0,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);

  // If group assigned, add to group members ring
  if (groupId) {
    const group = db.groups.find((g) => g.id === groupId);
    if (group && !group.members.some((m) => m.userId === newUser.id)) {
      group.members.push({
        userId: newUser.id,
        name: newUser.name,
        membershipNo: newUser.membershipNo,
        positionInRing: group.members.length + 1,
        hasReceivedTurn: false,
        joinDate: new Date().toISOString(),
      });
    }
  }

  writeDb(db);
  logAudit(req.user!, 'إضافة عضو يدوياً', `تمت إضافة العضو ${newUser.name} (${newUser.membershipNo}) بواسطة الإدارة`);

  const { passwordHash: _, ...safeUser } = newUser;
  res.json({ message: 'تمت إضافة العضو بنجاح', user: safeUser });
});

// Update member status (Active / Suspended)
apiRouter.patch('/members/:id/status', authMiddleware, superAdminMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== 'active' && status !== 'suspended') {
    res.status(400).json({ error: 'حالة غير صالحة' });
    return;
  }

  const db = readDb();
  const user = db.users.find((u) => u.id === id);
  if (!user) {
    res.status(404).json({ error: 'العضو غير موجود' });
    return;
  }

  if (user.role === 'super_admin') {
    res.status(403).json({ error: 'لا يمكن تعديل حالة المسؤول الرئيسي (الملك)' });
    return;
  }

  user.status = status;
  writeDb(db);

  logAudit(req.user!, 'تغيير حالة عضو', `تم تغيير حالة العضو ${user.name} (${user.membershipNo}) إلى ${status === 'active' ? 'نشط' : 'معلق'}`);
  pushNotification(user.id, 'تحديث حالة الحساب', `تم تغيير حالة حسابك في المنصة إلى: ${status === 'active' ? 'نشط' : 'معلق'}`, status === 'active' ? 'success' : 'alert');

  res.json({ message: 'تم تحديث حالة العضو بنجاح', status: user.status });
});

// Update member role (organizer / member)
apiRouter.patch('/members/:id/role', authMiddleware, superAdminMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (role !== 'member' && role !== 'organizer') {
    res.status(400).json({ error: 'رتبة غير صالحة' });
    return;
  }

  const db = readDb();
  const user = db.users.find((u) => u.id === id);
  if (!user) {
    res.status(404).json({ error: 'العضو غير موجود' });
    return;
  }

  if (user.role === 'super_admin') {
    res.status(403).json({ error: 'لا يمكن تغيير رتبة المسؤول الرئيسي' });
    return;
  }

  user.role = role;
  writeDb(db);

  logAudit(req.user!, 'تغيير رتبة مستخدم', `تم تغيير رتبة ${user.name} إلى ${role === 'organizer' ? 'منسق/منظم' : 'عضو'}`);
  pushNotification(user.id, 'ترقية الصلاحيات', `تم تعديل دورك في المنصة إلى: ${role === 'organizer' ? 'منسق مجموعة' : 'عضو'}`);

  res.json({ message: 'تم تحديث الرتبة بنجاح', role: user.role });
});

// Delete member
apiRouter.delete('/members/:id', authMiddleware, superAdminMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const userIndex = db.users.findIndex((u) => u.id === id);

  if (userIndex === -1) {
    res.status(404).json({ error: 'العضو غير موجود' });
    return;
  }

  if (db.users[userIndex].role === 'super_admin') {
    res.status(403).json({ error: 'لا يمكن حذف المسؤول الرئيسي نهائياً' });
    return;
  }

  const removedUser = db.users[userIndex];
  db.users.splice(userIndex, 1);

  // Remove from any group members rings
  db.groups.forEach((g) => {
    g.members = g.members.filter((m) => m.userId !== id);
    // Re-index circular positions
    g.members.forEach((m, idx) => {
      m.positionInRing = idx + 1;
    });
  });

  writeDb(db);
  logAudit(req.user!, 'حذف عضو', `تم حذف حساب العضو ${removedUser.name} (${removedUser.membershipNo})`);

  res.json({ message: 'تم حذف العضو بنجاح' });
});

// ==========================================
// 4. CIRCULAR GROUPS (ROSCA / حلقات دائرية)
// ==========================================

// List groups
apiRouter.get('/groups', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = readDb();
  // Filter for organizers or members if requested, or return full list
  res.json(db.groups);
});

// Get single group details
apiRouter.get('/groups/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const group = db.groups.find((g) => g.id === id || g.code === id || g.inviteCode === id);
  if (!group) {
    res.status(404).json({ error: 'المجموعة غير موجودة' });
    return;
  }
  res.json(group);
});

// Create new circular group (Super Admin only or approved creation)
apiRouter.post('/groups', authMiddleware, superAdminMiddleware, (req: AuthRequest, res: Response) => {
  const { name, tierId, organizerId, cycleDuration, maxMembers, notes } = req.body;

  if (!name || !tierId) {
    res.status(400).json({ error: 'اسم المجموعة والفئة المالية مطلوبان' });
    return;
  }

  const db = readDb();
  const tier = db.financialTiers.find((t) => t.id === tierId);
  if (!tier) {
    res.status(400).json({ error: 'الفئة المالية المحددة غير صالحة' });
    return;
  }

  let organizer = db.users.find((u) => u.id === organizerId);
  if (!organizer) {
    organizer = req.user!;
  }

  const groupId = `group_${Date.now()}`;
  const code = `HALAQA-${Math.floor(100 + Math.random() * 900)}`;
  const inviteCode = crypto.randomBytes(6).toString('hex');

  const slots = createDefaultSlots();
  const potAmount = tier.amount * 7;

  const newGroup: CircularGroup = {
    id: groupId,
    name: name.trim(),
    code,
    tierId: tier.id,
    tierAmount: tier.amount,
    potAmount,
    organizerId: organizer.id,
    organizerName: organizer.name,
    kingUserId: organizer.id,
    kingName: organizer.name,
    kingMembershipNo: organizer.membershipNo,
    kingBaridiMob: {
      holderName: organizer.name,
      rip: db.baridiMob.rip || '',
      cle: db.baridiMob.cle || '',
      phone: organizer.phone || db.baridiMob.phone || '',
      notes: 'التحويل المباشر لملك الحلقة',
    },
    slots,
    status: 'active',
    inviteCode,
    cycleDuration: cycleDuration || 'monthly',
    currentCycleIndex: 1,
    completedCycles: 0,
    members: [
      {
        userId: organizer.id,
        name: organizer.name,
        membershipNo: organizer.membershipNo,
        positionInRing: 0,
        hasReceivedTurn: false,
        joinDate: new Date().toISOString(),
      },
    ],
    maxMembers: 8,
    roleTransitionLogs: [],
    startDate: new Date().toISOString(),
    notes: notes?.trim() || '',
    createdAt: new Date().toISOString(),
  };

  db.groups.push(newGroup);
  writeDb(db);

  logAudit(req.user!, 'إنشاء حلقة دائرية', `تم إنشاء مجموعة ${newGroup.name} (${newGroup.code}) بفئة ${newGroup.tierAmount} دج`);
  pushNotification('all', 'مجموعة تعاونية جديدة', `تم إطلاق مجموعة دائرية جديدة: "${newGroup.name}" بقيمة ${newGroup.tierAmount.toLocaleString()} دج لكل دورة.`);

  res.json({ message: 'تم إنشاء المجموعة بنجاح', group: newGroup });
});

// Update group
apiRouter.put('/groups/:id', authMiddleware, superAdminMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, status, notes, cycleDuration, maxMembers, organizerId } = req.body;

  const db = readDb();
  const group = db.groups.find((g) => g.id === id);
  if (!group) {
    res.status(404).json({ error: 'المجموعة غير موجودة' });
    return;
  }

  if (name) group.name = name.trim();
  if (status) group.status = status;
  if (notes !== undefined) group.notes = notes;
  if (cycleDuration) group.cycleDuration = cycleDuration;
  if (maxMembers) group.maxMembers = parseInt(maxMembers);
  if (organizerId) {
    const org = db.users.find((u) => u.id === organizerId);
    if (org) {
      group.organizerId = org.id;
      group.organizerName = org.name;
    }
  }

  writeDb(db);
  logAudit(req.user!, 'تعديل مجموعة', `تم تعديل بيانات المجموعة ${group.name} (${group.code})`);

  res.json({ message: 'تم تعديل المجموعة بنجاح', group });
});

// Advance group cycle turn (Super Admin or Group Organizer)
apiRouter.post('/groups/:id/advance-turn', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const group = db.groups.find((g) => g.id === id);
  if (!group) {
    res.status(404).json({ error: 'المجموعة غير موجودة' });
    return;
  }

  if (req.user!.role !== 'super_admin' && group.organizerId !== req.user!.id) {
    res.status(403).json({ error: 'غير مصرح لك بتقديم دورة الاستحقاق' });
    return;
  }

  if (group.members.length === 0) {
    res.status(400).json({ error: 'لا يمكن تقديم الدورة لمجموعة فارغة بدون أعضاء' });
    return;
  }

  const currentMember = group.members.find((m) => m.positionInRing === group.currentCycleIndex);
  if (currentMember) {
    currentMember.hasReceivedTurn = true;
    currentMember.payoutDate = new Date().toISOString();

    // Log in transparency ledger
    const totalPot = group.tierAmount * group.members.length;
    const record: TransparencyRecord = {
      id: `trans_${Date.now()}`,
      date: new Date().toISOString(),
      type: 'تسليم_استحقاق_دورة',
      amount: totalPot,
      groupId: group.id,
      groupName: group.name,
      maskedMember: `عضو #${currentMember.membershipNo}`,
      status: 'معتمد',
      cycleRound: group.currentCycleIndex,
      approvedBy: req.user!.name,
      notes: `تسليم وعاء الحلقة التعاونية للدور رقم ${group.currentCycleIndex}`,
    };
    db.transparencyLedger.unshift(record);
  }

  // Advance index
  if (group.currentCycleIndex >= group.members.length) {
    group.currentCycleIndex = 1; // Restart cycle or complete
    pushNotification('all', 'اكتمال دورة المجموعة', `اكتملت جميع أدوار حلقة ${group.name} بنجاح! وبدأت دورة جديدة.`);
  } else {
    group.currentCycleIndex += 1;
  }

  const nextMember = group.members.find((m) => m.positionInRing === group.currentCycleIndex);
  if (nextMember) {
    pushNotification(nextMember.userId, 'حان دورك في الاستحقاق!', `مبارك لك! لقد حان دورك (المرتبة ${nextMember.positionInRing}) لاستلام وعاء الحلقة في مجموعة ${group.name}.`, 'success');
  }

  writeDb(db);
  logAudit(req.user!, 'تقديم دورة الحلقة', `تم تقديم دورة حلقة ${group.name} إلى الدور ${group.currentCycleIndex}`);

  res.json({ message: 'تم تقديم دورة الاستحقاق بنجاح', currentCycleIndex: group.currentCycleIndex, group });
});

// Regenerate group invite code
apiRouter.post('/groups/:id/regenerate-invite', authMiddleware, superAdminMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const group = db.groups.find((g) => g.id === id);
  if (!group) {
    res.status(404).json({ error: 'المجموعة غير موجودة' });
    return;
  }

  group.inviteCode = crypto.randomBytes(6).toString('hex');
  writeDb(db);
  logAudit(req.user!, 'تغيير رابط المجموعة', `تم تجديد رابط الدعوة لمجموعة ${group.name}`);

  res.json({ message: 'تم تجديد رابط الدعوة بنجاح', inviteCode: group.inviteCode });
});

// Delete group
apiRouter.delete('/groups/:id', authMiddleware, superAdminMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const groupIdx = db.groups.findIndex((g) => g.id === id);
  if (groupIdx === -1) {
    res.status(404).json({ error: 'المجموعة غير موجودة' });
    return;
  }

  const removedGroup = db.groups[groupIdx];
  db.groups.splice(groupIdx, 1);

  // Clear group assignment from users
  db.users.forEach((u) => {
    if (u.groupId === id) {
      u.groupId = null;
    }
  });

  writeDb(db);
  logAudit(req.user!, 'حذف مجموعة', `تم حذف مجموعة ${removedGroup.name} (${removedGroup.code})`);

  res.json({ message: 'تم حذف المجموعة بنجاح' });
});

// Prohibit manual member injection (Must join via group link/code and reserve seat self-service)
apiRouter.post('/groups/:id/members', authMiddleware, (req: AuthRequest, res: Response) => {
  res.status(403).json({
    error: 'يُحظر الإدراج اليدوي للأعضاء من قبل المسؤول أو الأعضاء. يجب على كل عضو الدخول برابط المجموعة وحجز مقعده الشاغر بنفسه.',
  });
});

// Lookup group by code or invite link
apiRouter.get('/groups/lookup/:identifier', authMiddleware, (req: AuthRequest, res: Response) => {
  const { identifier } = req.params;
  const db = readDb();
  const clean = identifier.trim();

  // Extract code if user pasted a full URL
  let targetCode = clean;
  if (clean.includes('invite=')) {
    targetCode = clean.split('invite=')[1].split('&')[0];
  }

  const group = db.groups.find(
    (g) =>
      g.id === targetCode ||
      g.code.toUpperCase() === targetCode.toUpperCase() ||
      g.inviteCode === targetCode
  );

  if (!group) {
    res.status(404).json({ error: 'لم يتم العثور على مجموعة بهذا الرابط أو الرمز' });
    return;
  }

  // Ensure slots exist
  if (!group.slots || group.slots.length !== 7) {
    group.slots = createDefaultSlots();
    writeDb(db);
  }

  res.json(group);
});

// Self-service slot reservation by member via group link/code
apiRouter.post('/groups/join-slot', authMiddleware, (req: AuthRequest, res: Response) => {
  const { groupIdentifier, slotNumber } = req.body;

  if (!groupIdentifier || !slotNumber) {
    res.status(400).json({ error: 'رمز المجموعة ورقم المقعد مطلوبان' });
    return;
  }

  const slotNum = parseInt(slotNumber);
  if (isNaN(slotNum) || slotNum < 1 || slotNum > 7) {
    res.status(400).json({ error: 'رقم المقعد يجب أن يكون بين 1 و 7' });
    return;
  }

  const db = readDb();
  let clean = groupIdentifier.trim();
  if (clean.includes('invite=')) {
    clean = clean.split('invite=')[1].split('&')[0];
  }

  const group = db.groups.find(
    (g) =>
      g.id === clean ||
      g.code.toUpperCase() === clean.toUpperCase() ||
      g.inviteCode === clean
  );

  if (!group) {
    res.status(404).json({ error: 'المجموعة غير موجودة' });
    return;
  }

  if (group.status !== 'active') {
    res.status(400).json({ error: 'هذه المجموعة متوقفة حالياً ولا تقبل انضمام أعضاء جدد' });
    return;
  }

  // Ensure slots initialized
  if (!group.slots || group.slots.length !== 7) {
    group.slots = createDefaultSlots();
  }

  // Check if user is already King of this group
  if (group.kingUserId === req.user!.id) {
    res.status(400).json({ error: 'أنت ملك هذه الحلقة بالفعل' });
    return;
  }

  // Check if user already reserved a slot in this group
  const existingSlot = group.slots.find((s) => s.userId === req.user!.id);
  if (existingSlot) {
    res.status(400).json({ error: `أنت حاجز بالفعل للمقعد رقم ${existingSlot.slotNumber} في هذه الحلقة` });
    return;
  }

  const targetSlot = group.slots.find((s) => s.slotNumber === slotNum);
  if (!targetSlot) {
    res.status(404).json({ error: 'المقعد غير موجود' });
    return;
  }

  if (targetSlot.userId) {
    res.status(400).json({ error: `المقعد رقم ${slotNum} محجوز مسبقاً، يُرجى اختيار مقعد شاغر آخر` });
    return;
  }

  // Reserve slot
  targetSlot.userId = req.user!.id;
  targetSlot.userName = req.user!.name;
  targetSlot.membershipNo = req.user!.membershipNo;
  targetSlot.invitedBy = req.user!.invitedByName || null;
  targetSlot.paymentStatus = 'unpaid';
  targetSlot.joinedAt = new Date().toISOString();

  // Add to group.members for tracking
  if (!group.members.some((m) => m.userId === req.user!.id)) {
    group.members.push({
      userId: req.user!.id,
      name: req.user!.name,
      membershipNo: req.user!.membershipNo,
      positionInRing: slotNum,
      hasReceivedTurn: false,
      joinDate: new Date().toISOString(),
    });
  }

  req.user!.groupId = group.id;

  writeDb(db);

  logAudit(
    req.user!,
    'حجز مقعد في حلقة',
    `حجز العضو ${req.user!.name} المقعد رقم ${slotNum} في مجموعة ${group.name}`
  );

  pushNotification(
    group.kingUserId,
    'حجز مقعد جديد في حلقتك!',
    `قام العضو ${req.user!.name} (${req.user!.membershipNo}) بحجز المقعد رقم ${slotNum} في حلقتك "${group.name}".`,
    'info'
  );

  pushNotification(
    req.user!.id,
    'تم تأكيد حجز مقعدك!',
    `أهلاً بك في حلقة "${group.name}". تم حجز المقعد رقم ${slotNum} لك بنجاح. يُرجى تحويل المساهمة (${group.tierAmount.toLocaleString()} دج) لحساب ملك الحلقة.`,
    'success'
  );

  res.json({
    message: `تم حجز المقعد رقم ${slotNum} بنجاح في حلقة ${group.name}`,
    group,
    reservedSlot: targetSlot,
  });
});

// Update King's BaridiMob details for a group
apiRouter.put('/groups/:id/king-baridimob', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { holderName, rip, cle, phone, notes } = req.body;

  const db = readDb();
  const group = db.groups.find((g) => g.id === id);
  if (!group) {
    res.status(404).json({ error: 'المجموعة غير موجودة' });
    return;
  }

  const isKing = group.kingUserId === req.user!.id;
  const isSuperAdmin = req.user!.role === 'super_admin';

  if (!isKing && !isSuperAdmin) {
    res.status(403).json({ error: 'فقط ملك الحلقة أو المسؤول الرئيسي يمكنه تعديل بيانات بريدي موب للحلقة' });
    return;
  }

  group.kingBaridiMob = {
    holderName: holderName?.trim() || group.kingName,
    rip: rip?.trim().replace(/\s+/g, '') || '',
    cle: cle ? cle.trim() : '',
    phone: phone ? phone.trim() : '',
    notes: notes ? notes.trim() : '',
  };

  writeDb(db);

  // Notify active members in the 7 slots
  group.slots.forEach((s) => {
    if (s.userId) {
      pushNotification(
        s.userId,
        'تحديث بيانات دفع ملك الحلقة',
        `قام ملك الحلقة (${group.kingName}) بتحديث بيانات بريدي موب الخاصة باستقبال المساهمات في مجموعة ${group.name}.`,
        'warning'
      );
    }
  });

  res.json({ message: 'تم تحديث بيانات بريدي موب لملك الحلقة بنجاح', group, kingBaridiMob: group.kingBaridiMob });
});

// Slot payment: Member in a slot uploads proof of payment to the King
apiRouter.post('/groups/:id/pay-slot', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { slotNumber, receiptImage, notes, paymentDate } = req.body;

  if (!receiptImage) {
    res.status(400).json({ error: 'صورة وصل التحويل مطلوبة' });
    return;
  }

  const db = readDb();
  const group = db.groups.find((g) => g.id === id);
  if (!group) {
    res.status(404).json({ error: 'المجموعة غير موجودة' });
    return;
  }

  const slotNum = parseInt(slotNumber);
  const slot = group.slots?.find((s) => s.slotNumber === slotNum && s.userId === req.user!.id);
  if (!slot) {
    res.status(403).json({ error: 'أنت لست شاغراً لهذا المقعد في هذه الحلقة' });
    return;
  }

  // Create payment proof record
  const proofId = `proof_${Date.now()}`;
  const receiptHash = crypto.createHash('sha256').update(receiptImage.slice(0, 1000) + group.tierAmount + Date.now()).digest('hex');

  const newProof: PaymentProof = {
    id: proofId,
    memberId: req.user!.id,
    memberName: req.user!.name,
    memberEmail: req.user!.email,
    membershipNo: req.user!.membershipNo,
    groupId: group.id,
    groupName: group.name,
    amount: group.tierAmount,
    paymentDate: paymentDate || new Date().toISOString().split('T')[0],
    receiptImage,
    receiptHash,
    notes: notes?.trim() || `دفع المساهمة للمقعد رقم ${slotNum} لملك الحلقة (${group.kingName})`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  db.paymentProofs.unshift(newProof);

  slot.paymentStatus = 'pending';
  slot.paymentProofId = proofId;
  slot.receiptImage = receiptImage;

  writeDb(db);

  pushNotification(
    group.kingUserId,
    'وصل دفع جديد للمراجعة!',
    `رفع العضو ${req.user!.name} في المقعد رقم ${slotNum} وصل تحويل مساهمته (${group.tierAmount.toLocaleString()} دج) لك للمراجعة والاعتماد.`,
    'info'
  );

  res.json({ message: 'تم رفع وصل الدفع لملك الحلقة وهو قيد المراجعة والاعتماد', group, proof: newProof });
});

// Slot payment verification: King or Super Admin approves or rejects slot payment
apiRouter.post('/groups/:id/verify-slot', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { slotNumber, action, reason } = req.body;

  const db = readDb();
  const group = db.groups.find((g) => g.id === id);
  if (!group) {
    res.status(404).json({ error: 'المجموعة غير موجودة' });
    return;
  }

  const isKing = group.kingUserId === req.user!.id;
  const isSuperAdmin = req.user!.role === 'super_admin';

  if (!isKing && !isSuperAdmin) {
    res.status(403).json({ error: 'فقط ملك الحلقة أو المسؤول الرئيسي مخول باعتماد مدفوعات المقاعد' });
    return;
  }

  const slotNum = parseInt(slotNumber);
  const slot = group.slots?.find((s) => s.slotNumber === slotNum);
  if (!slot || !slot.userId) {
    res.status(404).json({ error: 'المقعد غير موجود أو شاغر' });
    return;
  }

  if (action === 'approve') {
    slot.paymentStatus = 'paid';

    // Update corresponding PaymentProof if any
    if (slot.paymentProofId) {
      const p = db.paymentProofs.find((proof) => proof.id === slot.paymentProofId);
      if (p) {
        p.status = 'approved';
        p.reviewedAt = new Date().toISOString();
        p.reviewedByAdminName = req.user!.name;
      }
    }

    // Add to Transparency Ledger
    const transItem: TransparencyRecord = {
      id: `trans_${Date.now()}`,
      date: new Date().toISOString(),
      type: 'مساهمة_دورية',
      amount: group.tierAmount,
      groupId: group.id,
      groupName: group.name,
      maskedMember: `عضو المقعد #${slotNum} (${slot.userName})`,
      status: 'معتمد',
      cycleRound: group.completedCycles + 1,
      approvedBy: `ملك الحلقة (${group.kingName})`,
      notes: `تأكيد وصول مساهمة المقعد رقم ${slotNum} لحساب بريدي موب الخاص بالملك`,
    };
    db.transparencyLedger.unshift(transItem);

    pushNotification(
      slot.userId,
      'تم اعتماد مساهمتك بنجاح!',
      `أكد ملك الحلقة استلام مساهمتك (${group.tierAmount.toLocaleString()} دج) في المقعد رقم ${slotNum} في حلقة "${group.name}".`,
      'success'
    );

    // Check if all 7 slots are now fully paid!
    const allPaid = group.slots.every((s) => s.userId && s.paymentStatus === 'paid');
    if (allPaid) {
      pushNotification(
        group.kingUserId,
        '🎉 اكتمل دفع جميع الأعضاء السبعة!',
        `مبروك! تم دفع جميع المقاعد السبعة بإجمالي (${group.potAmount.toLocaleString()} دج). يمكنك الآن تفعيل انتقال الأدوار وتتويج الملك الجديد.`,
        'success'
      );
      pushNotification(
        'all',
        'اكتمال وعاء حلقة تضامنية',
        `اكتمل تسليم كافة مساهمات حلقة "${group.name}" بإجمالي ${group.potAmount.toLocaleString()} دج للملك ${group.kingName}.`,
        'info'
      );
    }
  } else {
    slot.paymentStatus = 'unpaid';

    if (slot.paymentProofId) {
      const p = db.paymentProofs.find((proof) => proof.id === slot.paymentProofId);
      if (p) {
        p.status = 'rejected';
        p.rejectionReason = reason || 'وصل الدفع غير مطابق';
        p.reviewedAt = new Date().toISOString();
      }
    }

    pushNotification(
      slot.userId,
      'تم رفض وصل الدفع',
      `تم رفض وصل دفع المقعد رقم ${slotNum} في حلقة "${group.name}". السبب: ${reason || 'المبلغ غير مطابق أو لم يصل التحويل'}. يُرجى التحقق وإعادة الرفع.`,
      'alert'
    );
  }

  writeDb(db);
  res.json({ message: 'تم تحديث حالة الدفع للمقعد بنجاح', group, slot });
});

// Role transition: Crown Slot #1 as New King, Old King becomes member in Slot #7, remaining slots shift
apiRouter.post('/groups/:id/transition-roles', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const group = db.groups.find((g) => g.id === id);

  if (!group) {
    res.status(404).json({ error: 'المجموعة غير موجودة' });
    return;
  }

  const isKing = group.kingUserId === req.user!.id;
  const isSuperAdmin = req.user!.role === 'super_admin';

  if (!isKing && !isSuperAdmin) {
    res.status(403).json({ error: 'فقط ملك الحلقة أو المسؤول الرئيسي يمكنه تفعيل انتقال الأدوار' });
    return;
  }

  // Ensure Slot 1 has an occupant
  const slot1 = group.slots.find((s) => s.slotNumber === 1);
  if (!slot1 || !slot1.userId) {
    res.status(400).json({ error: 'لا يمكن تفعيل الانتقال: لا يوجد عضو في المقعد رقم 1 ليصبح الملك الجديد' });
    return;
  }

  const oldKingName = group.kingName;
  const oldKingId = group.kingUserId;
  const oldKingMembershipNo = group.kingMembershipNo;

  const newKingId = slot1.userId;
  const newKingName = slot1.userName!;
  const newKingMembershipNo = slot1.membershipNo!;

  // 1. Shift slots 2-7 up by 1 position (Slot 2 becomes 1, Slot 3 becomes 2... Slot 7 becomes 6)
  // 2. Old King takes Slot 7 as a regular member!
  const newSlots: GroupSlot[] = [1, 2, 3, 4, 5, 6, 7].map((num) => {
    if (num < 7) {
      const occupant = group.slots.find((s) => s.slotNumber === num + 1);
      return {
        slotNumber: num,
        userId: occupant?.userId || null,
        userName: occupant?.userName || null,
        membershipNo: occupant?.membershipNo || null,
        invitedBy: occupant?.invitedBy || null,
        paymentStatus: 'unpaid' as const,
        paymentProofId: null,
        receiptImage: null,
        joinedAt: occupant?.joinedAt || null,
      };
    } else {
      // Slot 7 becomes the old King who is now a regular member!
      return {
        slotNumber: 7,
        userId: oldKingId,
        userName: oldKingName,
        membershipNo: oldKingMembershipNo,
        invitedBy: null,
        paymentStatus: 'unpaid' as const,
        paymentProofId: null,
        receiptImage: null,
        joinedAt: new Date().toISOString(),
      };
    }
  });

  group.slots = newSlots;

  // Crown new King
  group.kingUserId = newKingId;
  group.kingName = newKingName;
  group.kingMembershipNo = newKingMembershipNo;
  group.kingBaridiMob = {
    holderName: newKingName,
    rip: '',
    cle: '',
    phone: '',
    notes: 'يُرجى من الملك الجديد إدخال بيانات بريدي موب الخاصة به لاستقبال دفعات الأعضاء',
  };

  group.completedCycles = (group.completedCycles || 0) + 1;
  group.currentCycleIndex = group.completedCycles + 1;

  // Log role transition
  const transitionLog: RoleTransitionLog = {
    id: `role_trans_${Date.now()}`,
    round: group.completedCycles,
    fromKingName: oldKingName,
    toKingName: newKingName,
    date: new Date().toISOString(),
    totalCollected: group.potAmount,
    details: `اكتملت الدورة #${group.completedCycles}. استلم الملك السابق ${oldKingName} الوعاء الكامل (${group.potAmount.toLocaleString()} دج) وانتقل لدور عضو في المقعد رقم 7، وأصبح العضو رقم 1 ${newKingName} هو الملك الجديد للحلقة.`,
  };

  if (!group.roleTransitionLogs) group.roleTransitionLogs = [];
  group.roleTransitionLogs.unshift(transitionLog);

  // Add certified record in Transparency Ledger
  const ledgerRec: TransparencyRecord = {
    id: `trans_${Date.now()}`,
    date: new Date().toISOString(),
    type: 'تسليم_استحقاق_دورة',
    amount: group.potAmount,
    groupId: group.id,
    groupName: group.name,
    maskedMember: `الملك السابق: ${oldKingName}`,
    status: 'معتمد',
    cycleRound: group.completedCycles,
    approvedBy: 'نظام انتقال الأدوار التلقائي',
    notes: `تسليم وعاء الحلقة كاملاً (${group.potAmount.toLocaleString()} دج) للملك ${oldKingName} وتتويج ${newKingName} ملكاً جديداً`,
  };
  db.transparencyLedger.unshift(ledgerRec);

  // Send notifications
  pushNotification(
    newKingId,
    '👑 مبارك لك! أصبحت الملك الجديد للحلقة!',
    `تهانينا! انتقل وعاء الحلقة وتُوّجت ملكاً لحلقة "${group.name}". يُرجى ضبط بيانات بريدي موب الخاصة بك في خانة الملك لاستقبال مساهمات الأعضاء.`,
    'success'
  );

  pushNotification(
    oldKingId,
    'انتقال الدور بنجاح',
    `تم تسليمك وعاء التكافل بالكامل (${group.potAmount.toLocaleString()} دج) للدورة المنقضية، وأصبحت الآن عضواً مساهماً في المقعد رقم 7 لمتابعة الدورة الجديدة.`,
    'info'
  );

  // Notify other members
  group.slots.forEach((s) => {
    if (s.userId && s.userId !== newKingId && s.userId !== oldKingId) {
      pushNotification(
        s.userId,
        'انتقال الأدوار في حلقتك',
        `تُوّج ${newKingName} ملكاً جديداً لحلقة "${group.name}". تقدم موقع مقعدك بالمرتبة التالية (#${s.slotNumber}).`,
        'info'
      );
    }
  });

  writeDb(db);
  logAudit(
    req.user!,
    'انتقال الأدوار وتتويج الملك',
    `انتقال الأدوار في مجموعة ${group.name}: الملك السابق ${oldKingName} تحول لعضو، والعضو رقم 1 ${newKingName} أصبح الملك الجديد`
  );

  res.json({
    message: 'تم انتقال الأدوار وتتويج الملك الجديد بنجاح!',
    group,
    transitionLog,
  });
});

// Member referral stats and activity endpoint
apiRouter.get('/member/referral-stats', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = readDb();
  const invited = db.users.filter((u) => u.invitedBy === req.user!.id);

  // Find member's active group and slot
  let myGroup: CircularGroup | null = null;
  let mySlot: GroupSlot | null = null;
  let isKingOfGroup = false;

  for (const g of db.groups) {
    if (g.kingUserId === req.user!.id) {
      myGroup = g;
      isKingOfGroup = true;
      break;
    }
    const slot = g.slots?.find((s) => s.userId === req.user!.id);
    if (slot) {
      myGroup = g;
      mySlot = slot;
      break;
    }
  }

  res.json({
    referralCode: req.user!.referralCode || req.user!.membershipNo,
    referralCount: req.user!.referralCount || invited.length,
    totalInvited: invited.length,
    invitedUsers: invited.map((u) => {
      const g = db.groups.find((grp) => grp.id === u.groupId);
      return {
        id: u.id,
        name: u.name,
        membershipNo: u.membershipNo,
        createdAt: u.createdAt,
        status: u.status,
        groupName: g ? g.name : 'غير منضم بعد',
      };
    }),
    groupInfo: myGroup
      ? {
          id: myGroup.id,
          name: myGroup.name,
          code: myGroup.code,
          isKing: isKingOfGroup,
          slotNumber: mySlot ? mySlot.slotNumber : null,
          paymentStatus: mySlot ? mySlot.paymentStatus : isKingOfGroup ? 'king' : 'unpaid',
          potAmount: myGroup.potAmount,
          tierAmount: myGroup.tierAmount,
        }
      : null,
  });
});

// Remove member from group
apiRouter.delete('/groups/:id/members/:userId', authMiddleware, superAdminMiddleware, (req: AuthRequest, res: Response) => {
  const { id, userId } = req.params;
  const db = readDb();
  const group = db.groups.find((g) => g.id === id);
  if (!group) {
    res.status(404).json({ error: 'المجموعة غير موجودة' });
    return;
  }

  group.members = group.members.filter((m) => m.userId !== userId);
  // Re-adjust ring positions
  group.members.forEach((m, idx) => {
    m.positionInRing = idx + 1;
  });

  const user = db.users.find((u) => u.id === userId);
  if (user && user.groupId === id) {
    user.groupId = null;
  }

  writeDb(db);
  logAudit(req.user!, 'إزالة عضو من الحلقة', `تمت إزالة ${user?.name || userId} من مجموعة ${group.name}`);

  res.json({ message: 'تمت إزالة العضو من الحلقة وتعديل الترتيب الدائري', group });
});

// Reorder ring positions (Super Admin)
apiRouter.put('/groups/:id/reorder-ring', authMiddleware, superAdminMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { orderedUserIds } = req.body; // array of userId in desired order

  if (!Array.isArray(orderedUserIds)) {
    res.status(400).json({ error: 'قائمة الأعضاء غير صحيحة' });
    return;
  }

  const db = readDb();
  const group = db.groups.find((g) => g.id === id);
  if (!group) {
    res.status(404).json({ error: 'المجموعة غير موجودة' });
    return;
  }

  const updatedMembers: CircularMember[] = [];
  orderedUserIds.forEach((uid, index) => {
    const existing = group.members.find((m) => m.userId === uid);
    if (existing) {
      updatedMembers.push({
        ...existing,
        positionInRing: index + 1,
      });
    }
  });

  group.members = updatedMembers;
  writeDb(db);

  logAudit(req.user!, 'إعادة ترتيب أدوار الحلقة', `تم تعديل ترتيب الأدوار الدائرية لمجموعة ${group.name}`);
  res.json({ message: 'تم حفظ ترتيب أدوار الحلقة بنجاح', group });
});

// ==========================================
// 5. FINANCIAL TIERS
// ==========================================

// Get financial tiers
apiRouter.get('/financial-tiers', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.financialTiers);
});

// Update financial tiers (Super Admin only)
apiRouter.put('/financial-tiers', authMiddleware, superAdminMiddleware, (req: AuthRequest, res: Response) => {
  const { tiers } = req.body;
  if (!Array.isArray(tiers)) {
    res.status(400).json({ error: 'بيانات الفئات غير صالحة' });
    return;
  }

  const db = readDb();
  db.financialTiers = tiers;
  writeDb(db);

  logAudit(req.user!, 'تعديل الفئات المالية', 'تم تحديث مبالغ وحالات الفئات المالية التكافلية');
  res.json({ message: 'تم حفظ الفئات المالية بنجاح', financialTiers: db.financialTiers });
});

// ==========================================
// 6. BARIDIMOB PAYMENT SETTINGS
// ==========================================

// Get BaridiMob details (Accessible to members, but only read-only!)
apiRouter.get('/baridimob', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = readDb();
  res.json(db.baridiMob);
});

// Update BaridiMob details (STRICTLY SUPER ADMIN - "الملك" ONLY)
apiRouter.put('/baridimob', authMiddleware, superAdminMiddleware, (req: AuthRequest, res: Response) => {
  const { holderName, rip, cle, phone, notes } = req.body;

  if (!holderName || !rip) {
    res.status(400).json({ error: 'اسم صاحب الحساب ورقم الـ RIP مطلوبان' });
    return;
  }

  const db = readDb();
  db.baridiMob = {
    holderName: holderName.trim(),
    rip: rip.trim().replace(/\s+/g, ''),
    cle: cle ? cle.trim() : '',
    phone: phone ? phone.trim() : '',
    notes: notes ? notes.trim() : '',
    lastUpdated: new Date().toISOString(),
    updatedByAdminId: req.user!.id,
    updatedByAdminName: req.user!.name,
  };

  writeDb(db);

  logAudit(req.user!, 'تحديث معلومات بريدي موب', `تم تحديث الحساب البريدي الجاري إلى: ${db.baridiMob.holderName} (RIP: ${db.baridiMob.rip})`);
  pushNotification('all', 'تحديث معلومات الدفع بريدي موب', `قام المسؤول الرئيسي بتحديث معلومات الحساب البريدي بريدي موب. يُرجى التحقق من الحساب قبل إجراء أي تحويل جديد.`, 'warning');

  res.json({
    message: 'تم تحديث معلومات بريدي موب بنجاح وتسجيل العملية في السجل الإداري',
    baridiMob: db.baridiMob,
  });
});

// ==========================================
// 7. PAYMENT PROOFS (رفع ومراجعة إثباتات الدفع)
// ==========================================

// Upload receipt proof (Member)
apiRouter.post('/payments/proofs', authMiddleware, (req: AuthRequest, res: Response) => {
  const { groupId, amount, paymentDate, receiptImage, notes } = req.body;

  if (!groupId || !amount || !receiptImage) {
    res.status(400).json({ error: 'المجموعة والمبلغ وصورة الوصل مطلوبة' });
    return;
  }

  const db = readDb();
  const group = db.groups.find((g) => g.id === groupId);
  if (!group) {
    res.status(404).json({ error: 'المجموعة غير موجودة' });
    return;
  }

  // Calculate receipt hash for duplicate prevention
  const receiptHash = crypto.createHash('sha256').update(receiptImage.slice(0, 1000) + amount + paymentDate).digest('hex');

  // Prevent duplicate receipt submission
  const duplicate = db.paymentProofs.find((p) => p.receiptHash === receiptHash && p.status !== 'rejected');
  if (duplicate) {
    res.status(400).json({ error: 'تم رفع هذا الوصل مسبقاً وهو قيد المراجعة أو معتمد بالفعل. يُمنع تكرار الوصل نفسه.' });
    return;
  }

  const newProof: PaymentProof = {
    id: `proof_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    memberId: req.user!.id,
    memberName: req.user!.name,
    memberEmail: req.user!.email,
    membershipNo: req.user!.membershipNo,
    groupId: group.id,
    groupName: group.name,
    amount: parseFloat(amount),
    paymentDate: paymentDate || new Date().toISOString().split('T')[0],
    receiptImage,
    receiptHash,
    notes: notes?.trim() || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  db.paymentProofs.unshift(newProof);
  writeDb(db);

  pushNotification('all', 'وصل دفع جديد', `رفع العضو ${req.user!.name} (${req.user!.membershipNo}) إثبات دفع بقيمة ${newProof.amount.toLocaleString()} دج لمجموعة ${group.name}.`, 'info');

  res.json({ message: 'تم رفع إثبات الدفع بنجاح وهو الآن قيد المراجعة من طرف المسؤول', proof: newProof });
});

// Get payment proofs (Admin gets all, Member gets their own)
apiRouter.get('/payments/proofs', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = readDb();
  if (req.user!.role === 'super_admin' || req.user!.role === 'organizer') {
    res.json(db.paymentProofs);
  } else {
    const userProofs = db.paymentProofs.filter((p) => p.memberId === req.user!.id);
    res.json(userProofs);
  }
});

// Approve payment proof (Super Admin only)
apiRouter.post('/payments/proofs/:id/approve', authMiddleware, superAdminMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const proof = db.paymentProofs.find((p) => p.id === id);

  if (!proof) {
    res.status(404).json({ error: 'إثبات الدفع غير موجود' });
    return;
  }

  if (proof.status === 'approved') {
    res.status(400).json({ error: 'هذا الوصل معتمد بالفعل' });
    return;
  }

  proof.status = 'approved';
  proof.reviewedAt = new Date().toISOString();
  proof.reviewedByAdminId = req.user!.id;
  proof.reviewedByAdminName = req.user!.name;

  // Add entry to Transparency Ledger
  const group = db.groups.find((g) => g.id === proof.groupId);
  const ledgerItem: TransparencyRecord = {
    id: `trans_${Date.now()}`,
    date: new Date().toISOString(),
    type: 'مساهمة_دورية',
    amount: proof.amount,
    groupId: proof.groupId,
    groupName: proof.groupName,
    maskedMember: `عضو #${proof.membershipNo}`,
    status: 'معتمد',
    cycleRound: group ? group.currentCycleIndex : 1,
    approvedBy: req.user!.name,
    notes: `مساهمة معتمدة بوصل بريدي موب مؤكد`,
  };
  db.transparencyLedger.unshift(ledgerItem);

  writeDb(db);

  logAudit(req.user!, 'اعتماد إثبات دفع', `تم قبول وصل الدفع للعضو ${proof.memberName} بمبلغ ${proof.amount.toLocaleString()} دج`);
  pushNotification(proof.memberId, 'تم قبول الدفع!', `تمت مراجعة وقبول وصل تحويلك بقيمة ${proof.amount.toLocaleString()} دج لمجموعة ${proof.groupName} بنجاح.`, 'success');

  res.json({ message: 'تم اعتماد إثبات الدفع وإدراجه في سجل الشفافية بنجاح', proof });
});

// Reject payment proof (Super Admin only)
apiRouter.post('/payments/proofs/:id/reject', authMiddleware, superAdminMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    res.status(400).json({ error: 'يجب تحديد سبب الرفض' });
    return;
  }

  const db = readDb();
  const proof = db.paymentProofs.find((p) => p.id === id);
  if (!proof) {
    res.status(404).json({ error: 'إثبات الدفع غير موجود' });
    return;
  }

  proof.status = 'rejected';
  proof.rejectionReason = reason.trim();
  proof.reviewedAt = new Date().toISOString();
  proof.reviewedByAdminId = req.user!.id;
  proof.reviewedByAdminName = req.user!.name;

  writeDb(db);

  logAudit(req.user!, 'رفض إثبات دفع', `تم رفض وصل الدفع للعضو ${proof.memberName} - السبب: ${proof.rejectionReason}`);
  pushNotification(proof.memberId, 'تم رفض وصل التحويل', `عذراً، تم رفض وصل الدفع الخاص بك لمجموعة ${proof.groupName}. السبب: ${proof.rejectionReason}. يُرجى التحقق وإعادة الرفع.`, 'alert');

  res.json({ message: 'تم رفض إثبات الدفع وتنبيه العضو بالسبب', proof });
});

// ==========================================
// 8. TRANSPARENCY LEDGER (سجل الشفافية)
// ==========================================

apiRouter.get('/transparency-ledger', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = readDb();
  res.json(db.transparencyLedger);
});

// ==========================================
// 9. JOIN REQUESTS & GROUP PROPOSALS
// ==========================================

// Submit join request via group invite link
apiRouter.post('/groups/join-request', authMiddleware, (req: AuthRequest, res: Response) => {
  const { groupId, inviteCode } = req.body;
  const db = readDb();

  const group = db.groups.find((g) => g.id === groupId || g.inviteCode === inviteCode);
  if (!group) {
    res.status(404).json({ error: 'المجموعة غير موجودة أو رابط الدعوة غير صالح' });
    return;
  }

  if (group.members.some((m) => m.userId === req.user!.id)) {
    res.status(400).json({ error: 'أنت عضو بالفعل في هذه المجموعة' });
    return;
  }

  const existingRequest = db.joinRequests.find((r) => r.groupId === group.id && r.userId === req.user!.id && r.status === 'pending');
  if (existingRequest) {
    res.status(400).json({ error: 'لقد أرسلت طلباً مسبقاً وهو قيد المراجعة' });
    return;
  }

  const joinReq = {
    id: `join_${Date.now()}`,
    groupId: group.id,
    groupName: group.name,
    userId: req.user!.id,
    userName: req.user!.name,
    userEmail: req.user!.email,
    userPhone: req.user!.phone,
    membershipNo: req.user!.membershipNo,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
  };

  db.joinRequests.unshift(joinReq);
  writeDb(db);

  pushNotification('all', 'طلب انضمام جديد', `طلب العضو ${req.user!.name} (${req.user!.membershipNo}) الانضمام إلى مجموعة "${group.name}".`, 'info');

  res.json({ message: 'تم إرسال طلب الانضمام إلى المسؤول بنجاح', request: joinReq });
});

// List join requests (Admin)
apiRouter.get('/groups/join-requests/all', authMiddleware, superAdminMiddleware, (req: AuthRequest, res: Response) => {
  const db = readDb();
  res.json(db.joinRequests);
});

// Approve join request
apiRouter.post('/groups/join-requests/:id/approve', authMiddleware, superAdminMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const request = db.joinRequests.find((r) => r.id === id);

  if (!request) {
    res.status(404).json({ error: 'طلب الانضمام غير موجود' });
    return;
  }

  const group = db.groups.find((g) => g.id === request.groupId);
  if (!group) {
    res.status(404).json({ error: 'المجموعة لم تعد متوفرة' });
    return;
  }

  request.status = 'approved';

  // Add user to group ring
  if (!group.members.some((m) => m.userId === request.userId)) {
    group.members.push({
      userId: request.userId,
      name: request.userName,
      membershipNo: request.membershipNo,
      positionInRing: group.members.length + 1,
      hasReceivedTurn: false,
      joinDate: new Date().toISOString(),
    });
  }

  const user = db.users.find((u) => u.id === request.userId);
  if (user) {
    user.groupId = group.id;
  }

  writeDb(db);

  logAudit(req.user!, 'قبول طلب انضمام', `تم قبول انضمام العضو ${request.userName} لمجموعة ${group.name}`);
  pushNotification(request.userId, 'تم قبول طلب انضمامك!', `وافق المسؤول على انضمامك لمجموعة "${group.name}". موقعك في الحلقة هو ${group.members.length}.`, 'success');

  res.json({ message: 'تمت الموافقة على طلب الانضمام وإدراج العضو في الحلقة', request });
});

// Reject join request
apiRouter.post('/groups/join-requests/:id/reject', authMiddleware, superAdminMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const request = db.joinRequests.find((r) => r.id === id);

  if (!request) {
    res.status(404).json({ error: 'طلب الانضمام غير موجود' });
    return;
  }

  request.status = 'rejected';
  writeDb(db);

  logAudit(req.user!, 'رفض طلب انضمام', `تم رفض انضمام العضو ${request.userName} لمجموعة ${request.groupName}`);
  pushNotification(request.userId, 'تم رفض طلب الانضمام', `نعتذر، لم تتم الموافقة على طلب انضمامك لمجموعة ${request.groupName}.`, 'alert');

  res.json({ message: 'تم رفض طلب الانضمام', request });
});

// Submit proposal to create a group (Member)
apiRouter.post('/groups/create-request', authMiddleware, (req: AuthRequest, res: Response) => {
  const { groupName, tierAmount, cycleDuration, maxMembers, reason } = req.body;

  if (!groupName || !tierAmount) {
    res.status(400).json({ error: 'اسم المجموعة والمبلغ التكافلي مطلوبان' });
    return;
  }

  const db = readDb();
  const newRequest = {
    id: `greq_${Date.now()}`,
    userId: req.user!.id,
    userName: req.user!.name,
    userEmail: req.user!.email,
    groupName: groupName.trim(),
    tierAmount: parseFloat(tierAmount),
    cycleDuration: cycleDuration || 'monthly',
    maxMembers: maxMembers ? parseInt(maxMembers) : 10,
    reason: reason?.trim() || '',
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
  };

  db.groupCreationRequests.unshift(newRequest);
  writeDb(db);

  pushNotification('all', 'مقترح مجموعة جديدة', `اقترح العضو ${req.user!.name} إنشاء مجموعة جديدة: "${newRequest.groupName}".`, 'info');

  res.json({ message: 'تم إرسال مقترح إنشاء المجموعة للمسؤول الرئيسي للمراجعة', request: newRequest });
});

// List group creation proposals (Admin)
apiRouter.get('/groups/create-requests/all', authMiddleware, superAdminMiddleware, (req: AuthRequest, res: Response) => {
  const db = readDb();
  res.json(db.groupCreationRequests);
});

// Approve group proposal (Creates group and assigns creator as organizer!)
apiRouter.post('/groups/create-requests/:id/approve', authMiddleware, superAdminMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const proposal = db.groupCreationRequests.find((r) => r.id === id);

  if (!proposal) {
    res.status(404).json({ error: 'الطلب غير موجود' });
    return;
  }

  proposal.status = 'approved';

  // Upgrade creator to organizer if not super_admin
  const creator = db.users.find((u) => u.id === proposal.userId);
  if (creator && creator.role !== 'super_admin') {
    creator.role = 'organizer';
  }

  // Create the circular group
  const groupId = `group_${Date.now()}`;
  const code = `HALAQA-${Math.floor(100 + Math.random() * 900)}`;
  const inviteCode = crypto.randomBytes(6).toString('hex');

  const newGroup: CircularGroup = {
    id: groupId,
    name: proposal.groupName,
    code,
    tierId: 'tier_custom',
    tierAmount: proposal.tierAmount,
    potAmount: proposal.tierAmount * 7,
    organizerId: proposal.userId,
    organizerName: proposal.userName,
    kingUserId: creator ? creator.id : proposal.userId,
    kingName: creator ? creator.name : proposal.userName,
    kingMembershipNo: creator ? creator.membershipNo : 'TKF-001',
    kingBaridiMob: {
      holderName: creator ? creator.name : proposal.userName,
      rip: '',
      cle: '',
      phone: creator?.phone || '',
      notes: '',
    },
    slots: createDefaultSlots(),
    status: 'active',
    inviteCode,
    cycleDuration: proposal.cycleDuration,
    currentCycleIndex: 1,
    completedCycles: 0,
    members: creator
      ? [
          {
            userId: creator.id,
            name: creator.name,
            membershipNo: creator.membershipNo,
            positionInRing: 1,
            hasReceivedTurn: false,
            joinDate: new Date().toISOString(),
          },
        ]
      : [],
    maxMembers: 8,
    roleTransitionLogs: [],
    notes: `تم إنشاء المجموعة بناءً على مقترح العضو ${proposal.userName}`,
    createdAt: new Date().toISOString(),
  };

  if (creator) {
    creator.groupId = newGroup.id;
  }

  db.groups.push(newGroup);
  writeDb(db);

  logAudit(req.user!, 'الموافقة على مقترح مجموعة', `تم اعتماد مجموعة ${newGroup.name} وتعيين ${proposal.userName} منسقاً لها`);
  pushNotification(proposal.userId, 'تم قبول مجموعتك وتعيينك منسقاً!', `تهانينا! وافق المسؤول الرئيسي على مجموعتك "${newGroup.name}". أصبحت الآن منسقاً لها ويمكنك دعوة الأعضاء عبر الرابط.`, 'success');

  res.json({ message: 'تم اعتماد المجموعة بنجاح وتعيين العضو منسقاً لها', group: newGroup });
});

// Reject group proposal
apiRouter.post('/groups/create-requests/:id/reject', authMiddleware, superAdminMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const proposal = db.groupCreationRequests.find((r) => r.id === id);

  if (!proposal) {
    res.status(404).json({ error: 'الطلب غير موجود' });
    return;
  }

  proposal.status = 'rejected';
  writeDb(db);

  logAudit(req.user!, 'رفض مقترح مجموعة', `تم رفض مقترح إنشاء مجموعة ${proposal.groupName} المقدم من ${proposal.userName}`);
  pushNotification(proposal.userId, 'تم رفض مقترح المجموعة', `عذراً، لم تتم الموافقة على إنشاء مجموعة ${proposal.groupName} من طرف المسؤول.`, 'alert');

  res.json({ message: 'تم رفض المقترح', proposal });
});

// ==========================================
// 10. SUPPORT & MESSAGES (الدعم الفني والتواصل)
// ==========================================

// Get user tickets or all tickets for admin
apiRouter.get('/support/tickets', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = readDb();
  if (req.user!.role === 'super_admin') {
    res.json(db.supportTickets);
  } else {
    const tickets = db.supportTickets.filter((t) => t.userId === req.user!.id);
    res.json(tickets);
  }
});

// Create new support ticket
apiRouter.post('/support/tickets', authMiddleware, (req: AuthRequest, res: Response) => {
  const { subject, message } = req.body;
  if (!subject || !message) {
    res.status(400).json({ error: 'موضوع الرسالة والمحتوى مطلوبان' });
    return;
  }

  const db = readDb();
  const ticket = {
    id: `ticket_${Date.now()}`,
    userId: req.user!.id,
    userName: req.user!.name,
    userRole: req.user!.role,
    subject: subject.trim(),
    status: 'open' as const,
    createdAt: new Date().toISOString(),
    messages: [
      {
        id: `msg_${Date.now()}`,
        senderId: req.user!.id,
        senderName: req.user!.name,
        senderRole: req.user!.role,
        content: message.trim(),
        createdAt: new Date().toISOString(),
      },
    ],
  };

  db.supportTickets.unshift(ticket);
  writeDb(db);

  pushNotification('all', 'تذكرة دعم جديدة', `أرسل ${req.user!.name} رسالة جديدة بعنوان: "${ticket.subject}".`, 'info');

  res.json({ message: 'تم إرسال تذكرة الدعم بنجاح', ticket });
});

// Reply to support ticket
apiRouter.post('/support/tickets/:id/messages', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content) {
    res.status(400).json({ error: 'محتوى الرد مطلوب' });
    return;
  }

  const db = readDb();
  const ticket = db.supportTickets.find((t) => t.id === id);
  if (!ticket) {
    res.status(404).json({ error: 'التذكرة غير موجودة' });
    return;
  }

  ticket.messages.push({
    id: `msg_${Date.now()}`,
    senderId: req.user!.id,
    senderName: req.user!.name,
    senderRole: req.user!.role,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  });

  if (req.user!.role === 'super_admin') {
    ticket.status = 'answered';
    pushNotification(ticket.userId, 'رد جديد من الدعم', `قام المسؤول بالرد على تذكرتك: "${ticket.subject}".`, 'info');
  } else {
    ticket.status = 'open';
  }

  writeDb(db);
  res.json({ message: 'تم إرسال الرد بنجاح', ticket });
});

// Close ticket
apiRouter.patch('/support/tickets/:id/close', authMiddleware, superAdminMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const ticket = db.supportTickets.find((t) => t.id === id);
  if (!ticket) {
    res.status(404).json({ error: 'التذكرة غير موجودة' });
    return;
  }

  ticket.status = 'closed';
  writeDb(db);
  res.json({ message: 'تم إغلاق التذكرة بنجاح', ticket });
});

// ==========================================
// 11. NOTIFICATIONS
// ==========================================

apiRouter.get('/notifications', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = readDb();
  const userNotifs = db.notifications.filter((n) => n.targetUserId === 'all' || n.targetUserId === req.user!.id);
  res.json(userNotifs);
});

apiRouter.post('/notifications/mark-read', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = readDb();
  db.notifications.forEach((n) => {
    if (n.targetUserId === 'all' || n.targetUserId === req.user!.id) {
      n.isRead = true;
    }
  });
  writeDb(db);
  res.json({ message: 'تم تحديد جميع الإشعارات كمقروءة' });
});

// ==========================================
// 12. AUDIT LOGS & REPORTS EXPORT
// ==========================================

// Audit logs (Admin only)
apiRouter.get('/audit-logs', authMiddleware, superAdminMiddleware, (req: AuthRequest, res: Response) => {
  const db = readDb();
  res.json(db.auditLogs);
});

// CSV Export for Excel
apiRouter.get('/reports/export/:type', authMiddleware, superAdminMiddleware, (req: AuthRequest, res: Response) => {
  const { type } = req.params;
  const db = readDb();
  let csvContent = '\uFEFF'; // UTF-8 BOM for Arabic in Excel

  if (type === 'members') {
    csvContent += 'رقم العضوية,الاسم,البريد الإلكتروني,رقم الهاتف,الرتبة,الحالة,تاريخ التسجيل\n';
    db.users.forEach((u) => {
      csvContent += `"${u.membershipNo}","${u.name}","${u.email}","${u.phone || ''}","${u.role}","${u.status}","${u.createdAt.split('T')[0]}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="takaful_members.csv"');
    res.send(csvContent);
    return;
  }

  if (type === 'transparency') {
    csvContent += 'المعرف,التاريخ,نوع العملية,المبلغ (دج),المجموعة,العضو,الجهة المعتمدة,الدورة\n';
    db.transparencyLedger.forEach((t) => {
      csvContent += `"${t.id}","${t.date.split('T')[0]}","${t.type}","${t.amount}","${t.groupName}","${t.maskedMember}","${t.approvedBy}","${t.cycleRound}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="transparency_ledger.csv"');
    res.send(csvContent);
    return;
  }

  if (type === 'groups') {
    csvContent += 'رمز المجموعة,اسم المجموعة,المبلغ الدائري,المنسق,الحالة,عدد الأعضاء,الدور الحالي\n';
    db.groups.forEach((g) => {
      csvContent += `"${g.code}","${g.name}","${g.tierAmount}","${g.organizerName}","${g.status}","${g.members.length}","${g.currentCycleIndex}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="takaful_groups.csv"');
    res.send(csvContent);
    return;
  }

  res.status(400).json({ error: 'نوع التقرير غير مدعوم' });
});
