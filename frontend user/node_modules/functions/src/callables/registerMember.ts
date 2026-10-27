import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as crypto from 'crypto';
import { db, getAadhaarHmacSecret } from '../config.js';
import { safeLogger } from '../logger.js';
import { verhoeffValid } from '@sanchay/core';

interface RegisterMemberData {
  groupId?: string;
  groupCode?: string;
  name: string;
  phone: string;
  dob: string;
  address: string;
  aadhaarNumber: string;
  deviceId?: string;
}

export const registerMember = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to register.');
  }

  const data = request.data as RegisterMemberData;
  const { name, phone, dob, address, deviceId } = data;
  let aadhaarNumber = data.aadhaarNumber;

  if ((!data.groupId && !data.groupCode) || !name || !phone || !dob || !address || !aadhaarNumber) {
    throw new HttpsError('invalid-argument', 'Missing required registration fields.');
  }

  // Resolve groupCode -> groupId server-side via groupCodeIndex or groups collection
  let groupId = data.groupId;
  if (!groupId && data.groupCode) {
    const code = data.groupCode.trim().toUpperCase();
    const indexDoc = await db.collection('groupCodeIndex').doc(code).get();
    if (indexDoc.exists && indexDoc.data()?.groupId) {
      groupId = indexDoc.data()!.groupId;
    } else {
      const groupQuery = await db.collection('groups').where('groupCode', '==', code).limit(1).get();
      if (!groupQuery.empty) {
        groupId = groupQuery.docs[0].id;
      } else {
        const docDirect = await db.collection('groups').doc(code).get();
        if (docDirect.exists) {
          groupId = docDirect.id;
        } else {
          throw new HttpsError('not-found', `No savings group found with code "${code}".`);
        }
      }
    }
  }

  if (!groupId) {
    throw new HttpsError('not-found', 'Could not resolve group.');
  }

  // Enforce Rule 5: Verhoeff checksum validation
  if (!verhoeffValid(aadhaarNumber)) {
    throw new HttpsError('invalid-argument', 'Invalid Aadhaar number checksum.');
  }

  // Derive last 4 digits
  const aadhaarLast4 = aadhaarNumber.slice(-4);

  // Compute HMAC-SHA256 hash using secret
  const hmacSecret = await getAadhaarHmacSecret();
  const aadhaarHash = crypto
    .createHmac('sha256', hmacSecret)
    .update(aadhaarNumber)
    .digest('hex');

  // Immediately discard raw Aadhaar from variable
  aadhaarNumber = '';

  const groupRef = db.collection('groups').doc(groupId);
  const membersRef = groupRef.collection('members');

  // Query aadhaarIndex for fast O(1) duplicate prevention
  const aadhaarIndexRef = groupRef.collection('aadhaarIndex').doc(aadhaarHash);
  const aadhaarIndexDoc = await aadhaarIndexRef.get();

  if (aadhaarIndexDoc.exists) {
    const existingMemberId = aadhaarIndexDoc.data()?.memberId;
    safeLogger.warn('Duplicate Aadhaar registration attempt detected in aadhaarIndex', {
      groupId,
      matchedMemberId: existingMemberId
    });

    const conflictRef = groupRef.collection('conflicts').doc();
    await conflictRef.set({
      id: conflictRef.id,
      groupId,
      type: 'duplicate_member',
      refIds: [existingMemberId || 'unknown'],
      detectedAt: Date.now(),
      status: 'open'
    });

    throw new HttpsError('already-exists', 'A member with this Aadhaar is already registered in the group.');
  }

  // Fallback query for existing member by hash
  const existingSnapshot = await membersRef.where('aadhaarHash', '==', aadhaarHash).get();

  if (!existingSnapshot.empty) {
    const existingMember = existingSnapshot.docs[0];
    safeLogger.warn('Duplicate Aadhaar registration attempt detected', {
      groupId,
      matchedMemberId: existingMember.id
    });

    // Write conflict record
    const conflictRef = groupRef.collection('conflicts').doc();
    await conflictRef.set({
      id: conflictRef.id,
      groupId,
      type: 'duplicate_member',
      refIds: [existingMember.id],
      detectedAt: Date.now(),
      status: 'open'
    });

    throw new HttpsError('already-exists', 'A member with this Aadhaar is already registered in the group.');
  }

  // Generate member document
  const memberDoc = membersRef.doc();
  const memberId = memberDoc.id;
  const nowIso = new Date().toISOString();

  await memberDoc.set({
    memberId,
    groupId,
    authUid: request.auth.uid,
    name,
    phone,
    dob,
    address,
    aadhaarHash,
    aadhaarLast4,
    status: 'pending',
    role: 'member',
    joinedAt: nowIso,
    createdAt: nowIso,
    deviceId: deviceId || 'unknown'
  });

  // Maintain aadhaarIndex for O(1) duplicate checks
  await aadhaarIndexRef.set({
    memberId,
    createdAt: Date.now()
  });

  // Write immutable audit log
  await groupRef.collection('auditLog').doc().set({
    actor: request.auth.uid,
    action: 'REGISTER_MEMBER',
    targetId: memberId,
    time: Date.now()
  });

  safeLogger.info('New member registered with pending status', {
    groupId,
    memberId
  });

  return {
    success: true,
    memberId,
    status: 'pending'
  };
});
