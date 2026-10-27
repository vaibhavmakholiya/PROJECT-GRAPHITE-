import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { db } from '../config.js';
import { safeLogger } from '../logger.js';
import { computeMemberBalance } from '@sanchay/core';
export const onTransactionCreated = onDocumentCreated('groups/{groupId}/transactions/{txId}', async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const tx = snap.data();
    const { groupId, txId } = event.params;
    safeLogger.info('Processing onTransactionCreated', { groupId, txId, type: tx.type });
    const groupRef = db.collection('groups').doc(groupId);
    // 1. Stamp receivedAt if missing
    if (!tx.receivedAt) {
        await snap.ref.update({ receivedAt: Date.now() });
    }
    // 2. Possible Duplicate Detection:
    // Same member, same type, same amount, within 24h, different deviceId
    const dayMs = 24 * 60 * 60 * 1000;
    const sameTxQuery = await groupRef
        .collection('transactions')
        .where('memberId', '==', tx.memberId)
        .where('type', '==', tx.type)
        .where('amountPaise', '==', tx.amountPaise)
        .get();
    for (const doc of sameTxQuery.docs) {
        if (doc.id === txId)
            continue;
        const other = doc.data();
        const timeDiff = Math.abs(other.clientTimestamp - tx.clientTimestamp);
        if (timeDiff <= dayMs && other.deviceId !== tx.deviceId) {
            safeLogger.warn('Possible duplicate transaction detected across devices', {
                groupId,
                txId1: txId,
                txId2: other.txId
            });
            const conflictRef = groupRef.collection('conflicts').doc();
            await conflictRef.set({
                id: conflictRef.id,
                groupId,
                type: 'possible_duplicate',
                refIds: [txId, other.txId],
                detectedAt: Date.now(),
                status: 'open'
            });
            break; // Conflict logged once
        }
    }
    // 3. Negative Balance Detection on Withdrawals
    if (tx.type === 'withdrawal') {
        const memberTxsSnap = await groupRef
            .collection('transactions')
            .where('memberId', '==', tx.memberId)
            .get();
        const memberTxs = memberTxsSnap.docs.map((d) => d.data());
        const balance = computeMemberBalance(tx.memberId, memberTxs);
        if (balance.netSavingsPaise < 0) {
            safeLogger.warn('Withdrawal resulted in negative savings balance', {
                groupId,
                memberId: tx.memberId,
                netSavingsPaise: balance.netSavingsPaise
            });
            const conflictRef = groupRef.collection('conflicts').doc();
            await conflictRef.set({
                id: conflictRef.id,
                groupId,
                type: 'negative_balance',
                refIds: [txId],
                detectedAt: Date.now(),
                status: 'open'
            });
        }
    }
});
//# sourceMappingURL=onTransactionCreated.js.map