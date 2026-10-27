import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let testEnv: RulesTestEnvironment;

const PROJECT_ID = 'demo-sanchay-rules';
const GROUP_ID = 'group-001';
const OTHER_GROUP_ID = 'group-999';

const ADMIN_UID = 'admin-user';
const MEMBER_1_UID = 'member-1-user';
const MEMBER_1_ID = 'mem-001';
const MEMBER_2_UID = 'member-2-user';
const MEMBER_2_ID = 'mem-002';

beforeAll(async () => {
  const rulesPath = path.resolve(__dirname, '../firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: rulesContent,
      host: process.env.FIRESTORE_EMULATOR_HOST?.split(':')[0] || '127.0.0.1',
      port: Number(process.env.FIRESTORE_EMULATOR_HOST?.split(':')[1]) || Number(process.env.FIRESTORE_EMULATOR_PORT) || 8085
    }
  });
});

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

describe('Sanchay Firestore Security Rules', () => {
  // Helper to obtain authenticated Firestore context
  const getAdminContext = () =>
    testEnv.authenticatedContext(ADMIN_UID, {
      groupId: GROUP_ID,
      role: 'admin',
      memberId: 'admin-001'
    }).firestore();

  const getMember1Context = () =>
    testEnv.authenticatedContext(MEMBER_1_UID, {
      groupId: GROUP_ID,
      role: 'member',
      memberId: MEMBER_1_ID
    }).firestore();

  const getMember2Context = () =>
    testEnv.authenticatedContext(MEMBER_2_UID, {
      groupId: GROUP_ID,
      role: 'member',
      memberId: MEMBER_2_ID
    }).firestore();

  const getUnauthContext = () => testEnv.unauthenticatedContext().firestore();

  const getOtherGroupContext = () =>
    testEnv.authenticatedContext('other-user', {
      groupId: OTHER_GROUP_ID,
      role: 'admin',
      memberId: 'other-001'
    }).firestore();

  describe('Multi-Tenant Isolation', () => {
    it('should deny unauthenticated access to all group collections', async () => {
      const db = getUnauthContext();
      const settingsRef = doc(db, `groups/${GROUP_ID}/settings/global`);
      await assertFails(getDoc(settingsRef));
    });

    it('should deny cross-group access even if caller is an admin of another group', async () => {
      const otherDb = getOtherGroupContext();
      const settingsRef = doc(otherDb, `groups/${GROUP_ID}/settings/global`);
      await assertFails(getDoc(settingsRef));
    });

    it('should allow public lookup of groupCodeIndex for new member registration', async () => {
      const adminDb = getAdminContext();
      const codeRef = doc(adminDb, 'groupCodeIndex/PRAG24');
      await assertSucceeds(setDoc(codeRef, { groupId: GROUP_ID, groupCode: 'PRAG24' }));

      const unauthDb = getUnauthContext();
      await assertSucceeds(getDoc(doc(unauthDb, 'groupCodeIndex/PRAG24')));
    });
  });

  describe('Append-Only Transactions & Receipts (Non-Negotiable Rules 2 & 3)', () => {
    it('should allow admin to create a valid contribution transaction', async () => {
      const db = getAdminContext();
      const txRef = doc(db, `groups/${GROUP_ID}/transactions/tx-101`);
      await assertSucceeds(
        setDoc(txRef, {
          txId: 'tx-101',
          groupId: GROUP_ID,
          memberId: MEMBER_1_ID,
          type: 'contribution',
          amountPaise: 50000,
          mode: 'cash',
          recordedBy: 'admin-001',
          deviceId: 'dev-admin',
          clientTimestamp: Date.now()
        })
      );
    });

    it('should allow admin to create a valid reversal transaction with reason and reversesId', async () => {
      const db = getAdminContext();
      const txRef = doc(db, `groups/${GROUP_ID}/transactions/tx-rev-101`);
      await assertSucceeds(
        setDoc(txRef, {
          txId: 'tx-rev-101',
          groupId: GROUP_ID,
          memberId: MEMBER_1_ID,
          type: 'reversal',
          amountPaise: 50000,
          mode: 'cash',
          recordedBy: 'admin-001',
          deviceId: 'dev-admin',
          clientTimestamp: Date.now(),
          reversesId: 'tx-101',
          reason: 'Entry duplicated by mistake'
        })
      );
    });

    it('should reject a reversal transaction missing reason or reversesId', async () => {
      const db = getAdminContext();
      const txRef = doc(db, `groups/${GROUP_ID}/transactions/tx-rev-invalid`);
      await assertFails(
        setDoc(txRef, {
          txId: 'tx-rev-invalid',
          groupId: GROUP_ID,
          memberId: MEMBER_1_ID,
          type: 'reversal',
          amountPaise: 50000,
          mode: 'cash',
          recordedBy: 'admin-001',
          deviceId: 'dev-admin',
          clientTimestamp: Date.now()
          // missing reversesId and reason
        })
      );
    });

    it('should STRICTLY DENY transaction updates even by admin (Append-Only)', async () => {
      // Seed transaction using admin context
      const db = getAdminContext();
      const txRef = doc(db, `groups/${GROUP_ID}/transactions/tx-immutable`);
      await assertSucceeds(
        setDoc(txRef, {
          txId: 'tx-immutable',
          groupId: GROUP_ID,
          memberId: MEMBER_1_ID,
          type: 'contribution',
          amountPaise: 50000,
          mode: 'cash',
          recordedBy: 'admin-001',
          deviceId: 'dev-admin',
          clientTimestamp: Date.now()
        })
      );

      // Attempt to modify amountPaise
      await assertFails(updateDoc(txRef, { amountPaise: 60000 }));
    });

    it('should STRICTLY DENY transaction deletion even by admin (Append-Only)', async () => {
      const db = getAdminContext();
      const txRef = doc(db, `groups/${GROUP_ID}/transactions/tx-to-delete`);
      await assertSucceeds(
        setDoc(txRef, {
          txId: 'tx-to-delete',
          groupId: GROUP_ID,
          memberId: MEMBER_1_ID,
          type: 'contribution',
          amountPaise: 50000,
          mode: 'cash',
          recordedBy: 'admin-001',
          deviceId: 'dev-admin',
          clientTimestamp: Date.now()
        })
      );

      // Attempt deletion
      await assertFails(deleteDoc(txRef));
    });

    it('should allow admin to create receipt and deny update/delete (Append-Only)', async () => {
      const db = getAdminContext();
      const receiptRef = doc(db, `groups/${GROUP_ID}/receipts/rcpt-001`);
      await assertSucceeds(
        setDoc(receiptRef, {
          receiptId: 'rcpt-001',
          groupId: GROUP_ID,
          txId: 'tx-101',
          memberId: MEMBER_1_ID,
          amountPaise: 50000,
          status: 'APPROVED',
          receiptNo: 'PRAG-202610-DEV1-0001'
        })
      );

      // Deny update and delete
      await assertFails(updateDoc(receiptRef, { amountPaise: 60000 }));
      await assertFails(deleteDoc(receiptRef));
    });

    it('should deny regular members from writing transactions directly', async () => {
      const db = getMember1Context();
      const txRef = doc(db, `groups/${GROUP_ID}/transactions/tx-mem-write`);
      await assertFails(
        setDoc(txRef, {
          txId: 'tx-mem-write',
          groupId: GROUP_ID,
          memberId: MEMBER_1_ID,
          type: 'contribution',
          amountPaise: 50000,
          mode: 'cash',
          recordedBy: MEMBER_1_ID,
          deviceId: 'dev-member',
          clientTimestamp: Date.now()
        })
      );
    });

    it('should strictly reject transactions containing raw Aadhaar numbers (Privacy Rule 4)', async () => {
      const db = getAdminContext();
      const txRef = doc(db, `groups/${GROUP_ID}/transactions/tx-aadhaar-leak`);
      await assertFails(
        setDoc(txRef, {
          txId: 'tx-aadhaar-leak',
          groupId: GROUP_ID,
          memberId: MEMBER_1_ID,
          type: 'contribution',
          amountPaise: 50000,
          mode: 'cash',
          recordedBy: 'admin-001',
          deviceId: 'dev-admin',
          clientTimestamp: Date.now(),
          aadhaarNumber: '123456789012' // Prohibited field
        })
      );
    });
  });

  describe('Member Scoping and Privacy', () => {
    it('should allow member to read own profile, but deny reading other member profiles', async () => {
      // Seed member docs as admin
      const adminDb = getAdminContext();
      await setDoc(doc(adminDb, `groups/${GROUP_ID}/members/${MEMBER_1_ID}`), {
        memberId: MEMBER_1_ID,
        name: 'Member One'
      });
      await setDoc(doc(adminDb, `groups/${GROUP_ID}/members/${MEMBER_2_ID}`), {
        memberId: MEMBER_2_ID,
        name: 'Member Two'
      });

      const m1Db = getMember1Context();
      await assertSucceeds(getDoc(doc(m1Db, `groups/${GROUP_ID}/members/${MEMBER_1_ID}`)));
      await assertFails(getDoc(doc(m1Db, `groups/${GROUP_ID}/members/${MEMBER_2_ID}`)));
    });

    it('should allow member to read own transactions, but deny reading other member transactions', async () => {
      const adminDb = getAdminContext();
      await setDoc(doc(adminDb, `groups/${GROUP_ID}/transactions/tx-m1`), {
        txId: 'tx-m1',
        groupId: GROUP_ID,
        memberId: MEMBER_1_ID,
        amountPaise: 50000,
        type: 'contribution',
        mode: 'cash'
      });
      await setDoc(doc(adminDb, `groups/${GROUP_ID}/transactions/tx-m2`), {
        txId: 'tx-m2',
        groupId: GROUP_ID,
        memberId: MEMBER_2_ID,
        amountPaise: 50000,
        type: 'contribution',
        mode: 'cash'
      });

      const m1Db = getMember1Context();
      await assertSucceeds(getDoc(doc(m1Db, `groups/${GROUP_ID}/transactions/tx-m1`)));
      await assertFails(getDoc(doc(m1Db, `groups/${GROUP_ID}/transactions/tx-m2`)));
    });

    it('should allow pending member without custom claims to read own profile by authUid and deny other access', async () => {
      const adminDb = getAdminContext();
      const PENDING_UID = 'pending-auth-uid-123';
      const PENDING_MEM_ID = 'mem-pending-123';

      await setDoc(doc(adminDb, `groups/${GROUP_ID}/members/${PENDING_MEM_ID}`), {
        memberId: PENDING_MEM_ID,
        groupId: GROUP_ID,
        authUid: PENDING_UID,
        name: 'Pending Member',
        status: 'pending',
        role: 'member'
      });

      // Authenticated with UID but NO custom claims yet
      const pendingDb = testEnv.authenticatedContext(PENDING_UID, {}).firestore();

      // Allowed: read own pending member document
      await assertSucceeds(getDoc(doc(pendingDb, `groups/${GROUP_ID}/members/${PENDING_MEM_ID}`)));

      // Denied: reading another member's document
      await assertFails(getDoc(doc(pendingDb, `groups/${GROUP_ID}/members/${MEMBER_1_ID}`)));

      // Denied: reading group settings or transactions without custom claims
      await assertFails(getDoc(doc(pendingDb, `groups/${GROUP_ID}/settings/global`)));
      await assertFails(getDoc(doc(pendingDb, `groups/${GROUP_ID}/transactions/tx-m1`)));
    });
  });

  describe('Loan Requests Self-Service', () => {
    it('should allow member to create loan request for themselves with status pending', async () => {
      const m1Db = getMember1Context();
      const reqRef = doc(m1Db, `groups/${GROUP_ID}/loanRequests/req-001`);
      await assertSucceeds(
        setDoc(reqRef, {
          id: 'req-001',
          groupId: GROUP_ID,
          memberId: MEMBER_1_ID,
          amountPaise: 100000,
          installments: 6,
          status: 'pending',
          createdAt: Date.now()
        })
      );
    });

    it('should deny member from creating a loan request with status approved', async () => {
      const m1Db = getMember1Context();
      const reqRef = doc(m1Db, `groups/${GROUP_ID}/loanRequests/req-hack`);
      await assertFails(
        setDoc(reqRef, {
          id: 'req-hack',
          groupId: GROUP_ID,
          memberId: MEMBER_1_ID,
          amountPaise: 100000,
          installments: 6,
          status: 'approved',
          createdAt: Date.now()
        })
      );
    });

    it('should deny member from creating a loan request for another member', async () => {
      const m1Db = getMember1Context();
      const reqRef = doc(m1Db, `groups/${GROUP_ID}/loanRequests/req-other`);
      await assertFails(
        setDoc(reqRef, {
          id: 'req-other',
          groupId: GROUP_ID,
          memberId: MEMBER_2_ID,
          amountPaise: 100000,
          installments: 6,
          status: 'pending',
          createdAt: Date.now()
        })
      );
    });
  });

  describe('Protected Collections (Settings, Announcements, Conflicts)', () => {
    it('should allow all group members to read announcements and settings, but deny member writes', async () => {
      const adminDb = getAdminContext();
      await setDoc(doc(adminDb, `groups/${GROUP_ID}/settings/global`), {
        monthlyContributionPaise: 50000,
        dueDayOfMonth: 5
      });
      await setDoc(doc(adminDb, `groups/${GROUP_ID}/announcements/ann-1`), {
        title: 'Meeting this Sunday',
        body: 'Please attend at 10 AM'
      });

      const m1Db = getMember1Context();
      // Read allowed
      await assertSucceeds(getDoc(doc(m1Db, `groups/${GROUP_ID}/settings/global`)));
      await assertSucceeds(getDoc(doc(m1Db, `groups/${GROUP_ID}/announcements/ann-1`)));

      // Write denied
      await assertFails(setDoc(doc(m1Db, `groups/${GROUP_ID}/settings/global`), { hacked: true }));
      await assertFails(
        setDoc(doc(m1Db, `groups/${GROUP_ID}/announcements/ann-2`), { title: 'Spam' })
      );
    });

    it('should deny regular members from reading or writing conflicts', async () => {
      const adminDb = getAdminContext();
      await setDoc(doc(adminDb, `groups/${GROUP_ID}/conflicts/conf-1`), {
        type: 'possible_duplicate',
        status: 'open'
      });

      const m1Db = getMember1Context();
      await assertFails(getDoc(doc(m1Db, `groups/${GROUP_ID}/conflicts/conf-1`)));
      await assertFails(
        setDoc(doc(m1Db, `groups/${GROUP_ID}/conflicts/conf-2`), { type: 'negative_balance' })
      );
    });
  });
});
