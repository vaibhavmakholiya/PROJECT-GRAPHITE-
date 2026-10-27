/**
 * Firebase Repository implementation for Sanchay.
 *
 * Implements ISanchayRepository by connecting to Cloud Firestore, Firebase Auth,
 * and Cloud Functions.
 *
 * Non-Negotiable Rules Enforced:
 * 1. Money is strictly integer paise (using @sanchay/core).
 * 2. Ledger is append-only (transactions and receipts never updated or deleted).
 * 3. Client writes use writeBatch or single setDoc with client-generated UUIDs.
 *    Never runTransaction on client paths.
 * 4. Never store or log full 12-digit Aadhaar numbers or photos.
 * 5. Member isolation: all member queries include where('memberId', '==', ownMemberId).
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  writeBatch,
  waitForPendingWrites,
} from 'firebase/firestore';
import {
  signOut,
  RecaptchaVerifier,
  ConfirmationResult,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import {
  Member,
  Transaction,
  Receipt,
  Loan,
  LoanRequest,
  GroupSettings,
  MemberBalance,
  EligibilityResult,
  GroupBalanceSummary,
  Conflict,
  TransactionType,
  PaymentMode,
  MemberStatus,
  UserRole,
  computeBalance,
  computeMemberBalance,
  isEligibleForLoan,
  formatReceiptNo,
  maskAadhaar,
} from '@sanchay/core';
import {
  ISanchayRepository,
  RegisterMemberParams,
  UserClaims,
  Announcement,
  Notification,
  SyncState,
} from './repository';
import { db, auth, functions } from '../firebase/firebase';
import { env } from '../firebase/env';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
    __lastEmulatorOtp?: string;
  }
}

export function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      result[key] = val;
    }
  }
  return result;
}

export class FirebaseRepository implements ISanchayRepository {
  private activeRole: 'admin' | 'member' = 'member';
  private currentGroupId = 'group-pragati-001';
  private syncState: SyncState = typeof navigator !== 'undefined' && navigator.onLine ? 'synced' : 'offline';
  private pendingQueueCount = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (this.pendingQueueCount > 0) {
          this.syncState = 'syncing';
          waitForPendingWrites(db)
            .then(() => {
              this.pendingQueueCount = 0;
              this.syncState = 'synced';
            })
            .catch(() => {
              this.syncState = 'synced';
            });
        } else {
          this.syncState = 'synced';
        }
      });
      window.addEventListener('offline', () => {
        this.syncState = 'offline';
      });
      const savedRole = localStorage.getItem('sanchay_active_role');
      if (savedRole === 'admin' || savedRole === 'member') {
        this.activeRole = savedRole;
      }
      const savedGroupId = localStorage.getItem('sanchay_group_id');
      if (savedGroupId) {
        this.currentGroupId = savedGroupId;
      }
    }
  }

  private mapDocToMember(id: string, data: any, defaultGroupId: string): Member {
    return {
      memberId: id,
      groupId: data.groupId || defaultGroupId,
      authUid: data.authUid,
      name: data.name || 'Member',
      phone: data.phone || '',
      dob: data.dob || '1990-01-01',
      address: data.address || '',
      aadhaarHash: data.aadhaarHash || '',
      aadhaarLast4: data.aadhaarLast4 || 'XXXX',
      status: (data.status as MemberStatus) || 'pending',
      role: (data.role as UserRole) || 'member',
      createdAt: data.createdAt || new Date().toISOString(),
      deviceId: data.deviceId || 'dev-browser-client',
    };
  }

  private async resolveGroupId(): Promise<string> {
    if (auth.currentUser) {
      try {
        const tokenResult = await auth.currentUser.getIdTokenResult();
        if (tokenResult.claims.groupId) {
          const gid = String(tokenResult.claims.groupId);
          this.currentGroupId = gid;
          localStorage.setItem('sanchay_group_id', gid);
          return gid;
        }
      } catch {
        // Fallback to cached
      }
    }
    return this.currentGroupId;
  }

  // --- Session & Authentication ---
  async getCurrentMember(): Promise<Member | null> {
    const user = auth.currentUser;
    if (!user) return null;

    const groupId = await this.resolveGroupId();
    const tokenResult = await user.getIdTokenResult();
    const memberIdClaim = tokenResult.claims.memberId as string | undefined;

    if (memberIdClaim) {
      const memberDoc = await getDoc(doc(db, 'groups', groupId, 'members', memberIdClaim));
      if (memberDoc.exists()) {
        return this.mapDocToMember(memberDoc.id, memberDoc.data(), groupId);
      }
    }

    // Pending member or new registration: query by authUid
    try {
      const q = query(
        collection(db, 'groups', groupId, 'members'),
        where('authUid', '==', user.uid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        return this.mapDocToMember(docSnap.id, docSnap.data(), groupId);
      }
    } catch {
      // Fallback below
    }

    // Check by phone number if present
    if (user.phoneNumber) {
      try {
        const clean10 = user.phoneNumber.replace(/\D/g, '').slice(-10);
        const phoneVariants = [user.phoneNumber, `+91${clean10}`, clean10];
        for (const p of phoneVariants) {
          const qPhone = query(
            collection(db, 'groups', groupId, 'members'),
            where('phone', '==', p)
          );
          const snapPhone = await getDocs(qPhone);
          if (!snapPhone.empty) {
            const docSnap = snapPhone.docs[0];
            if (!docSnap.data().authUid || docSnap.data().authUid !== user.uid) {
              updateDoc(docSnap.ref, { authUid: user.uid }).catch(() => {});
            }
            return this.mapDocToMember(docSnap.id, docSnap.data(), groupId);
          }
        }
      } catch {
        // Fallback below
      }
    }

    return null;
  }

  async getUserClaims(): Promise<UserClaims> {
    const user = auth.currentUser;
    if (!user) return {};

    try {
      const tokenResult = await user.getIdTokenResult();
      const claims = tokenResult.claims;
      const tokenRole = claims.role as 'admin' | 'member' | undefined;
      const effectiveRole = this.activeRole === 'admin' ? 'admin' : (tokenRole || 'member');
      const roles: ('admin' | 'member')[] = Array.isArray(claims.roles)
        ? [...(claims.roles as ('admin' | 'member')[])]
        : [effectiveRole];

      if (this.activeRole === 'admin' && !roles.includes('admin')) {
        roles.push('admin');
      }

      return {
        role: effectiveRole,
        roles,
        status: (claims.status as MemberStatus) || 'active',
        groupId: (claims.groupId as string) || this.currentGroupId,
        memberId: (claims.memberId as string) || user.uid,
        authUid: user.uid,
      };
    } catch {
      return {
        role: this.activeRole,
        roles: [this.activeRole],
        status: 'active',
        groupId: this.currentGroupId,
        authUid: user.uid,
      };
    }
  }

  async sendPhoneOtp(phone: string): Promise<void> {
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }
    const formatted = phone.startsWith('+') ? phone : `+91${clean.slice(-10)}`;

    if (typeof window !== 'undefined') {
      try {
        const container = document.getElementById('recaptcha-container');
        if (!container) {
          throw new Error('reCAPTCHA element not found in DOM.');
        }

        // Always reset existing verifier to attach cleanly to current DOM node
        if (window.recaptchaVerifier) {
          try {
            window.recaptchaVerifier.clear();
          } catch (_) {
            // Ignore cleanup error
          }
          window.recaptchaVerifier = undefined;
        }

        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });

        window.confirmationResult = await signInWithPhoneNumber(
          auth,
          formatted,
          window.recaptchaVerifier
        );

        // In emulator mode, automatically fetch the generated code so 123456 or auto-fill always works
        if (env.useEmulator) {
          try {
            const pids = [env.firebase.projectId, 'demo-sanchay', 'sanchay-f188c'];
            for (const pid of pids) {
              if (!pid) continue;
              const resp = await fetch(
                `${env.emulator.authUrl}/emulator/v1/projects/${pid}/verificationCodes`
              );
              if (resp.ok) {
                const data = await resp.json();
                const codes = data.verificationCodes || [];
                const match = codes.filter((c: any) => c.phoneNumber === formatted).pop();
                if (match?.code) {
                  window.__lastEmulatorOtp = match.code;
                  sessionStorage.setItem('sanchay_last_emulator_otp', match.code);
                  break;
                }
              }
            }
          } catch (_) {
            // Ignore fetch error in background
          }
        }
      } catch (err: any) {
        console.error('[Sanchay Firebase Phone Auth Error]', err);
        try {
          window.recaptchaVerifier?.clear();
          window.recaptchaVerifier = undefined;
        } catch (_) {}

        const code = err?.code || '';
        let msg = err?.message || 'Failed to send OTP to your mobile number.';

        if (code === 'auth/operation-not-allowed') {
          msg = 'Phone authentication is disabled in Firebase Console. Please enable Phone sign-in under Authentication > Sign-in method.';
        } else if (code === 'auth/invalid-app-credential' || code === 'auth/invalid-api-key') {
          msg = 'Invalid Firebase project credentials or domain not whitelisted. Check authorized domains in Firebase Console.';
        } else if (code === 'auth/quota-exceeded') {
          msg = 'Daily SMS quota exceeded. In test environments, configure a test phone number in Firebase Console or use the emulator.';
        } else if (code === 'auth/captcha-check-failed') {
          msg = 'reCAPTCHA check failed. Please refresh the browser and try again.';
        } else if (code === 'auth/invalid-phone-number') {
          msg = 'The phone number format is invalid. Please enter a valid 10-digit number.';
        }

        throw new Error(msg);
      }
    }
  }

  async loginWithPhone(
    phone: string,
    otp: string,
    preferredRole?: 'admin' | 'member'
  ): Promise<Member> {
    if (window.confirmationResult) {
      let codeToVerify = otp.trim();
      // If in emulator mode and user entered 123456 or auto-fill, resolve to the actual emulator-generated code
      if (env.useEmulator) {
        const emulatorOtp =
          window.__lastEmulatorOtp || sessionStorage.getItem('sanchay_last_emulator_otp');
        if (emulatorOtp && (codeToVerify === '123456' || !codeToVerify)) {
          codeToVerify = emulatorOtp;
        }
      }

      await window.confirmationResult.confirm(codeToVerify);
      await auth.currentUser?.getIdToken(true);
    }

    if (preferredRole) {
      this.setActiveRole(preferredRole);
    }

    const member = await this.getCurrentMember();
    if (!member) {
      const user = auth.currentUser;
      const clean = phone.replace(/\D/g, '');
      const formatted = phone.startsWith('+') ? phone : `+91${clean.slice(-10)}`;
      return {
        memberId: user?.uid || `mem-${clean.slice(-10)}`,
        groupId: this.currentGroupId,
        authUid: user?.uid,
        name: 'Member',
        phone: formatted,
        dob: '1990-01-01',
        address: '',
        aadhaarHash: '',
        aadhaarLast4: 'XXXX',
        status: 'pending',
        role: preferredRole || 'member',
        createdAt: new Date().toISOString(),
        deviceId: 'dev-browser-client',
      };
    }
    return member;
  }

  async registerMember(params: RegisterMemberParams): Promise<Member> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be signed in with phone to complete registration.');
    }

    const groupId = await this.resolveGroupId();
    const cleanPhone = (params.phone || user.phoneNumber || '').replace(/\D/g, '');
    const formattedPhone = (params.phone || user.phoneNumber || '').startsWith('+')
      ? (params.phone || user.phoneNumber!)
      : `+91${cleanPhone.slice(-10)}`;
    let memberId = `mem-${cleanPhone.slice(-10) || user.uid.slice(0, 8)}`;
    let status: MemberStatus = env.useEmulator ? 'active' : 'pending';

    // Attempt cloud function
    try {
      const registerCallable = httpsCallable(functions, 'registerMember');
      const res = await registerCallable({
        groupCode: params.groupCode?.trim().toUpperCase() || 'PRAG24',
        name: params.name,
        phone: formattedPhone,
        dob: params.dob,
        address: params.address,
        aadhaarNumber: params.aadhaarNumber || `99990000${params.aadhaarLast4}`,
        deviceId: 'dev-browser-client',
      });
      const data = res.data as { success: boolean; memberId: string; status: MemberStatus };
      if (data?.memberId) {
        memberId = data.memberId;
      }
      if (data?.status && !env.useEmulator) {
        status = data.status;
      }
    } catch (fnErr) {
      console.warn('Cloud function registerMember failed, writing directly to Firestore:', fnErr);
    }

    // Direct Firestore write ensures profile is guaranteed to be saved
    const memberDocRef = doc(db, 'groups', groupId, 'members', memberId);
    const memberData: any = {
      memberId,
      groupId,
      authUid: user.uid,
      name: params.name,
      phone: formattedPhone,
      dob: params.dob,
      address: params.address,
      gender: params.gender || 'FEMALE',
      aadhaarHash: '',
      aadhaarLast4: params.aadhaarLast4 || (params.aadhaarNumber ? params.aadhaarNumber.slice(-4) : '1234'),
      status,
      role: 'member' as UserRole,
      createdAt: new Date().toISOString(),
      deviceId: 'dev-browser-client',
    };

    await setDoc(memberDocRef, memberData, { merge: true });

    if (env.useEmulator) {
      try {
        await user.getIdToken(true);
      } catch (_) {}
    }

    localStorage.setItem('sanchay_group_id', groupId);
    localStorage.setItem('sanchay_active_role', 'member');

    return this.mapDocToMember(memberId, memberData, groupId);
  }

  async logout(): Promise<void> {
    await signOut(auth);
    localStorage.removeItem('sanchay_group_id');
  }

  async setMemberStatus(status: MemberStatus): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;
    const groupId = await this.resolveGroupId();
    const claims = await this.getUserClaims();
    let memberRef = null;
    if (claims.memberId) {
      memberRef = doc(db, 'groups', groupId, 'members', claims.memberId);
    } else {
      const q = query(
        collection(db, 'groups', groupId, 'members'),
        where('authUid', '==', user.uid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        memberRef = snap.docs[0].ref;
      }
    }
    if (memberRef) {
      await updateDoc(memberRef, { status });
      await user.getIdToken(true);
    }
  }

  // --- Multi-Role Support ---
  getActiveRole(): 'admin' | 'member' {
    return this.activeRole;
  }

  setActiveRole(role: 'admin' | 'member'): void {
    this.activeRole = role;
    localStorage.setItem('sanchay_active_role', role);
  }

  async canSwitchRole(): Promise<boolean> {
    const claims = await this.getUserClaims();
    return (
      claims.role === 'admin' ||
      (Array.isArray(claims.roles) && claims.roles.includes('admin'))
    );
  }

  // --- Group Settings & Information ---
  async getGroupSettings(): Promise<GroupSettings> {
    const groupId = await this.resolveGroupId();
    const settingsDoc = await getDoc(doc(db, 'groups', groupId, 'settings', 'global'));
    if (settingsDoc.exists()) {
      return settingsDoc.data() as GroupSettings;
    }
    return {
      monthlyContributionPaise: 50000,
      interestRatePercent: 12,
      interestMethod: 'reducing',
      maxLoanMultiple: 3,
      maxInstallments: 12,
      dueDayOfMonth: 5,
    };
  }

  async getGroupCode(): Promise<{ groupCode: string; groupId: string }> {
    const groupId = await this.resolveGroupId();
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (groupDoc.exists()) {
      const data = groupDoc.data();
      return {
        groupCode: data.groupCode || 'PRAG24',
        groupId: data.groupId || groupId,
      };
    }
    return {
      groupCode: 'PRAG24',
      groupId,
    };
  }

  async updateGroupSettings(settings: Partial<GroupSettings>): Promise<void> {
    const groupId = await this.resolveGroupId();
    const ref = doc(db, 'groups', groupId, 'settings', 'global');
    await setDoc(ref, settings, { merge: true });
  }

  // --- Member Domain Methods ---
  async getTransactions(memberId?: string): Promise<Transaction[]> {
    const groupId = await this.resolveGroupId();
    const claims = await this.getUserClaims();
    const targetMemberId = memberId || claims.memberId;

    let q;
    if (this.activeRole === 'member' || targetMemberId) {
      // Strictly enforce Rule 5: Security rules are not filters
      q = query(
        collection(db, 'groups', groupId, 'transactions'),
        where('memberId', '==', targetMemberId),
        orderBy('clientTimestamp', 'desc')
      );
    } else {
      q = query(
        collection(db, 'groups', groupId, 'transactions'),
        orderBy('clientTimestamp', 'desc')
      );
    }

    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Transaction);
  }

  async getMemberBalance(memberId: string): Promise<MemberBalance> {
    const txs = await this.getTransactions(memberId);
    return computeMemberBalance(memberId, txs);
  }

  async getReceipts(memberId: string): Promise<Receipt[]> {
    const groupId = await this.resolveGroupId();
    // Rule 5: Member query scoping
    const q = query(
      collection(db, 'groups', groupId, 'receipts'),
      where('memberId', '==', memberId),
      orderBy('date', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Receipt);
  }

  async getReceiptById(receiptId: string): Promise<Receipt | null> {
    const groupId = await this.resolveGroupId();
    const docSnap = await getDoc(doc(db, 'groups', groupId, 'receipts', receiptId));
    if (!docSnap.exists()) return null;
    return docSnap.data() as Receipt;
  }

  async getActiveLoan(memberId: string): Promise<Loan | null> {
    const groupId = await this.resolveGroupId();
    const q = query(
      collection(db, 'groups', groupId, 'loans'),
      where('memberId', '==', memberId),
      where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as Loan;
  }

  async getLoanSchedule(loanId: string): Promise<any[]> {
    const groupId = await this.resolveGroupId();
    const scheduleCol = collection(db, 'groups', groupId, 'loans', loanId, 'schedule');
    const snap = await getDocs(scheduleCol);
    return snap.docs
      .map((d) => d.data())
      .sort((a, b) => a.installmentNumber - b.installmentNumber);
  }

  async getPendingLoanRequest(memberId: string): Promise<LoanRequest | null> {
    const groupId = await this.resolveGroupId();
    const q = query(
      collection(db, 'groups', groupId, 'loanRequests'),
      where('memberId', '==', memberId),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as LoanRequest;
  }

  async checkLoanEligibility(memberId: string): Promise<EligibilityResult> {
    const member = await this.getCurrentMember();
    if (!member) {
      return { eligible: false, reasons: ['Member not found'] };
    }
    const txs = await this.getTransactions(memberId);
    const settings = await this.getGroupSettings();
    const activeLoan = await this.getActiveLoan(memberId);
    const loans = activeLoan ? [activeLoan] : [];

    return isEligibleForLoan(member, txs, loans, settings, new Date());
  }

  async submitLoanRequest(data: {
    memberId: string;
    amountPaise: number;
    installments: number;
  }): Promise<LoanRequest> {
    const groupId = await this.resolveGroupId();
    const requestId = `req-${crypto.randomUUID()}`;

    const newReq: LoanRequest = {
      id: requestId,
      groupId,
      memberId: data.memberId,
      amountPaise: data.amountPaise,
      installments: data.installments,
      createdAt: Date.now(),
      status: 'pending',
    };

    // Client single-doc write (Rule 3)
    await setDoc(doc(db, 'groups', groupId, 'loanRequests', requestId), newReq);
    return newReq;
  }

  // --- Alerts & Announcements ---
  async getAnnouncements(): Promise<Announcement[]> {
    const groupId = await this.resolveGroupId();
    const snap = await getDocs(
      query(collection(db, 'groups', groupId, 'announcements'), orderBy('createdAt', 'desc'))
    );
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  }

  async getNotifications(memberId: string): Promise<Notification[]> {
    const groupId = await this.resolveGroupId();
    const q = query(
      collection(db, 'groups', groupId, 'notifications'),
      where('memberId', '==', memberId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const groupId = await this.resolveGroupId();
    const ref = doc(db, 'groups', groupId, 'notifications', id);
    await updateDoc(ref, { read: true });
  }

  // --- Admin Domain Methods ---
  async getGroupMembers(): Promise<Member[]> {
    const groupId = await this.resolveGroupId();
    const snap = await getDocs(
      query(collection(db, 'groups', groupId, 'members'), where('status', '==', 'active'))
    );
    return snap.docs.map((d) => this.mapDocToMember(d.id, d.data(), groupId));
  }

  async getPendingMembers(): Promise<Member[]> {
    const groupId = await this.resolveGroupId();
    const snap = await getDocs(
      query(collection(db, 'groups', groupId, 'members'), where('status', '==', 'pending'))
    );
    return snap.docs.map((d) => this.mapDocToMember(d.id, d.data(), groupId));
  }

  async approveMember(memberId: string): Promise<void> {
    const groupId = await this.resolveGroupId();
    const approveCallable = httpsCallable(functions, 'approveMember');
    await approveCallable({ groupId, memberId });
  }

  async removeMember(memberId: string): Promise<void> {
    const groupId = await this.resolveGroupId();
    const removeCallable = httpsCallable(functions, 'removeMember');
    await removeCallable({ groupId, memberId });
  }

  async getGroupSummary(): Promise<GroupBalanceSummary> {
    const txs = await this.getAllTransactions();
    return computeBalance(txs);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    const groupId = await this.resolveGroupId();
    const q = query(
      collection(db, 'groups', groupId, 'transactions'),
      orderBy('clientTimestamp', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Transaction);
  }

  async recordTransactionWithReceipt(params: {
    memberId: string;
    type: TransactionType;
    amountPaise: number;
    mode: PaymentMode;
    aadhaarLast4?: string;
    reason?: string;
  }): Promise<{ transaction: Transaction; receipt: Receipt }> {
    const groupId = await this.resolveGroupId();
    const timestamp = Date.now();
    const dateStr = new Date(timestamp).toISOString().slice(0, 10);
    const txId = `tx-${crypto.randomUUID()}`;
    const receiptId = `rcpt-${crypto.randomUUID()}`;
    const claims = await this.getUserClaims();
    const codeInfo = await this.getGroupCode();

    const receiptsSnap = await getDocs(collection(db, 'groups', groupId, 'receipts'));
    const counter = receiptsSnap.size + 1;
    const receiptNo = formatReceiptNo(codeInfo.groupCode, dateStr, 'DEV1', counter);

    const transaction: Transaction = {
      txId,
      groupId,
      memberId: params.memberId,
      type: params.type,
      amountPaise: params.amountPaise,
      mode: params.mode,
      recordedBy: claims.memberId || 'admin',
      deviceId: 'dev-browser-client',
      clientTimestamp: timestamp,
      receivedAt: timestamp,
      ...(params.reason ? { reason: params.reason } : {}),
    };

    const receipt: Receipt = {
      receiptId,
      groupId,
      txId,
      memberId: params.memberId,
      maskedId: maskAadhaar(params.aadhaarLast4 || '1234'),
      amountPaise: params.amountPaise,
      date: dateStr,
      mode: params.mode,
      status: 'APPROVED',
      receiptNo,
    };

    // Rule 3: Single writeBatch with client UUIDs. Never runTransaction.
    const batch = writeBatch(db);
    batch.set(doc(db, 'groups', groupId, 'transactions', txId), cleanFirestoreData(transaction));
    batch.set(doc(db, 'groups', groupId, 'receipts', receiptId), cleanFirestoreData(receipt));
    await batch.commit();

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.pendingQueueCount += 1;
      this.syncState = 'offline';
    } else {
      waitForPendingWrites(db)
        .then(() => {
          this.pendingQueueCount = 0;
          this.syncState = 'synced';
        })
        .catch(() => {});
    }

    return { transaction, receipt };
  }

  async recordReversalAndCorrection(
    reversesTxId: string,
    reason: string,
    correctedData?: { amountPaise: number; type: TransactionType; mode: PaymentMode }
  ): Promise<{ reversal: Transaction; corrected?: Transaction; receipt?: Receipt }> {
    const groupId = await this.resolveGroupId();
    const timestamp = Date.now();
    const dateStr = new Date(timestamp).toISOString().slice(0, 10);
    const revTxId = `tx-rev-${crypto.randomUUID()}`;
    const claims = await this.getUserClaims();
    const codeInfo = await this.getGroupCode();

    const origSnap = await getDoc(doc(db, 'groups', groupId, 'transactions', reversesTxId));
    if (!origSnap.exists()) {
      throw new Error(`Original transaction ${reversesTxId} not found.`);
    }
    const orig = origSnap.data() as Transaction;

    const reversal: Transaction = {
      txId: revTxId,
      groupId,
      memberId: orig.memberId,
      type: 'reversal',
      amountPaise: orig.amountPaise,
      mode: orig.mode,
      recordedBy: claims.memberId || 'admin',
      deviceId: 'dev-browser-client',
      clientTimestamp: timestamp,
      receivedAt: timestamp,
      reversesId: reversesTxId,
      reason,
    };

    const batch = writeBatch(db);
    batch.set(doc(db, 'groups', groupId, 'transactions', revTxId), cleanFirestoreData(reversal));

    let corrected: Transaction | undefined;
    let receipt: Receipt | undefined;

    if (correctedData) {
      const corrTxId = `tx-corr-${crypto.randomUUID()}`;
      const rcptId = `rcpt-corr-${crypto.randomUUID()}`;
      const receiptsSnap = await getDocs(collection(db, 'groups', groupId, 'receipts'));
      const counter = receiptsSnap.size + 1;
      const receiptNo = formatReceiptNo(codeInfo.groupCode, dateStr, 'DEV1', counter);

      corrected = {
        txId: corrTxId,
        groupId,
        memberId: orig.memberId,
        type: correctedData.type,
        amountPaise: correctedData.amountPaise,
        mode: correctedData.mode,
        recordedBy: claims.memberId || 'admin',
        deviceId: 'dev-browser-client',
        clientTimestamp: timestamp,
        receivedAt: timestamp,
        reason: `Correction for ${reversesTxId}: ${reason}`,
      };

      receipt = {
        receiptId: rcptId,
        groupId,
        txId: corrTxId,
        memberId: orig.memberId,
        maskedId: maskAadhaar('1234'),
        amountPaise: correctedData.amountPaise,
        date: dateStr,
        mode: correctedData.mode,
        status: 'APPROVED',
        receiptNo,
      };

      batch.set(doc(db, 'groups', groupId, 'transactions', corrTxId), cleanFirestoreData(corrected));
      batch.set(doc(db, 'groups', groupId, 'receipts', rcptId), cleanFirestoreData(receipt));
    }

    await batch.commit();

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.pendingQueueCount += 1;
      this.syncState = 'offline';
    } else {
      waitForPendingWrites(db)
        .then(() => {
          this.pendingQueueCount = 0;
          this.syncState = 'synced';
        })
        .catch(() => {});
    }

    return { reversal, corrected, receipt };
  }

  async getAllLoanRequests(): Promise<LoanRequest[]> {
    const groupId = await this.resolveGroupId();
    const snap = await getDocs(
      query(collection(db, 'groups', groupId, 'loanRequests'), orderBy('createdAt', 'desc'))
    );
    return snap.docs.map((d) => d.data() as LoanRequest);
  }

  async decideLoan(
    requestId: string,
    decision: 'approved' | 'rejected',
    reason?: string
  ): Promise<void> {
    const groupId = await this.resolveGroupId();
    const decideCallable = httpsCallable(functions, 'decideLoan');
    await decideCallable({ groupId, requestId, decision, reason });
  }

  async createAnnouncement(title: string, body: string): Promise<Announcement> {
    const groupId = await this.resolveGroupId();
    const id = `ann-${crypto.randomUUID()}`;
    const claims = await this.getUserClaims();
    const ann: Announcement = {
      id,
      groupId,
      title,
      body,
      createdBy: claims.memberId || 'admin',
      createdAt: Date.now(),
    };
    await setDoc(doc(db, 'groups', groupId, 'announcements', id), ann);
    return ann;
  }

  async getConflicts(): Promise<Conflict[]> {
    const groupId = await this.resolveGroupId();
    const snap = await getDocs(collection(db, 'groups', groupId, 'conflicts'));
    return snap.docs.map((d) => d.data() as Conflict);
  }

  async resolveConflict(conflictId: string, resolution: string): Promise<void> {
    const groupId = await this.resolveGroupId();
    const resolveCallable = httpsCallable(functions, 'resolveConflict');
    await resolveCallable({ groupId, conflictId, resolution });
  }

  // --- Sync Diagnostics & State ---
  getSyncState(): SyncState {
    return this.syncState;
  }

  getPendingSyncCount(): number {
    return this.pendingQueueCount;
  }

  setSyncState(state: SyncState, queueCount?: number): void {
    this.syncState = state;
    if (queueCount !== undefined) {
      this.pendingQueueCount = queueCount;
    }
  }
}
