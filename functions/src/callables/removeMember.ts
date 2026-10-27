import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, auth } from '../config.js';
import { safeLogger } from '../logger.js';

interface MemberActionData {
  groupId: string;
  memberId: string;
}

export const removeMember = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { groupId, memberId } = request.data as MemberActionData;
  if (!groupId || !memberId) {
    throw new HttpsError('invalid-argument', 'groupId and memberId are required.');
  }

  const token = request.auth.token;
  if (token.groupId !== groupId || token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only group admins can remove members.');
  }

  const memberRef = db.collection('groups').doc(groupId).collection('members').doc(memberId);
  const memberSnap = await memberRef.get();

  if (!memberSnap.exists) {
    throw new HttpsError('not-found', 'Member not found.');
  }

  const memberData = memberSnap.data()!;
  await memberRef.update({ status: 'removed' });

  if (memberData.authUid) {
    // Revoke claims by removing groupId/role
    await auth.setCustomUserClaims(memberData.authUid, null);
  }

  safeLogger.info('Member removed and claims revoked', { groupId, memberId });

  return {
    success: true,
    memberId,
    status: 'removed'
  };
});
