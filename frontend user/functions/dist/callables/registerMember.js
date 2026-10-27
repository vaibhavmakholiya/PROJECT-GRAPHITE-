import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as crypto from 'crypto';
import { db, getAadhaarHmacSecret } from '../config.js';
import { safeLogger } from '../logger.js';
import { verhoeffValid } from '@sanchay/core';
export const registerMember = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated to register.');
    }
    const data = request.data;
    const { groupId, name, phone, dob, address, deviceId } = data;
    let aadhaarNumber = data.aadhaarNumber;
    if (!groupId || !name || !phone || !dob || !address || !aadhaarNumber) {
        throw new HttpsError('invalid-argument', 'Missing required registration fields.');
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
    // Query for duplicate hash
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
        createdAt: new Date().toISOString(),
        deviceId: deviceId || 'unknown'
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
//# sourceMappingURL=registerMember.js.map