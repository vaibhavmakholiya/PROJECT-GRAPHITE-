/**
 * Provision Real Admin User into Sanchay Database & Auth
 *
 * Usage:
 *   npm run db:admin -- <phone_number> <admin_name>
 * Example:
 *   npm run db:admin -- 9876543210 "Suman Devi"
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8085';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';

if (getApps().length === 0) {
  initializeApp({ projectId: 'demo-sanchay' });
}

const db = getFirestore();
const auth = getAuth();

const GROUP_ID = 'group-pragati-001';
const GROUP_CODE = 'PRAG24';

async function createAdminUser() {
  const args = process.argv.slice(2);
  const rawPhone = args[0] || '9876543210';
  const adminName = args[1] || 'SHG Admin Leader';

  const clean = rawPhone.replace(/\D/g, '');
  if (clean.length < 10) {
    console.error('Error: Please provide a valid 10-digit mobile number.');
    process.exit(1);
  }
  const formattedPhone = clean.startsWith('91') ? `+${clean}` : `+91${clean.slice(-10)}`;
  const memberId = `admin-${clean.slice(-10)}`;

  console.log(`\n--- Provisioning Group Admin for ${GROUP_CODE} (${GROUP_ID}) ---`);
  console.log(`Phone: ${formattedPhone}`);
  console.log(`Name:  ${adminName}`);
  console.log(`Firestore Emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  console.log(`Auth Emulator:      ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);

  // 1. Find or create Firebase Auth user
  let userRecord;
  try {
    userRecord = await auth.getUserByPhoneNumber(formattedPhone);
    console.log(`✓ Found existing Auth user: ${userRecord.uid}`);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      userRecord = await auth.createUser({
        phoneNumber: formattedPhone,
        displayName: adminName,
      });
      console.log(`✓ Created new Firebase Auth user: ${userRecord.uid}`);
    } else {
      throw err;
    }
  }

  // 2. Set custom claims for admin permissions
  await auth.setCustomUserClaims(userRecord.uid, {
    role: 'admin',
    roles: ['admin', 'member'],
    groupId: GROUP_ID,
    memberId: memberId,
    status: 'active',
  });
  console.log(`✓ Assigned custom claims: role='admin', groupId='${GROUP_ID}', memberId='${memberId}'`);

  // 3. Upsert into groups/{groupId}/members/{memberId}
  const memberRef = db.collection('groups').doc(GROUP_ID).collection('members').doc(memberId);
  const memberDoc = {
    memberId,
    groupId: GROUP_ID,
    authUid: userRecord.uid,
    name: adminName,
    phone: formattedPhone,
    dob: '1985-01-01',
    address: 'Pragati Community Center',
    aadhaarHash: '',
    aadhaarLast4: '0001',
    status: 'active',
    role: 'admin',
    createdAt: new Date().toISOString(),
    deviceId: 'admin-portal',
  };

  await memberRef.set(memberDoc, { merge: true });
  console.log(`✓ Saved member profile in Firestore: groups/${GROUP_ID}/members/${memberId}`);

  console.log('\n--- Admin provisioning complete! ---');
  console.log(`You can now sign in at http://localhost:5173/login?role=admin using ${formattedPhone}`);
}

createAdminUser()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Provisioning error:', err);
    process.exit(1);
  });
