import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config.js';
import { safeLogger } from '../logger.js';
export const resolveConflict = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { groupId, conflictId, resolution, note } = request.data;
    if (!groupId || !conflictId || !resolution) {
        throw new HttpsError('invalid-argument', 'groupId, conflictId, and resolution are required.');
    }
    const token = request.auth.token;
    if (token.groupId !== groupId || token.role !== 'admin') {
        throw new HttpsError('permission-denied', 'Only group admins can resolve conflicts.');
    }
    const conflictRef = db.collection('groups').doc(groupId).collection('conflicts').doc(conflictId);
    const conflictSnap = await conflictRef.get();
    if (!conflictSnap.exists) {
        throw new HttpsError('not-found', 'Conflict record not found.');
    }
    const resolvedBy = token.memberId || request.auth.uid;
    await conflictRef.update({
        status: 'resolved',
        resolution,
        note: note || '',
        resolvedBy,
        resolvedAt: Date.now()
    });
    safeLogger.info('Conflict resolved by admin', { groupId, conflictId, resolution });
    return {
        success: true,
        conflictId,
        status: 'resolved'
    };
});
//# sourceMappingURL=resolveConflict.js.map