import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { db } from '../config.js';
import { safeLogger } from '../logger.js';
export const onReceiptCreated = onDocumentCreated('groups/{groupId}/receipts/{receiptId}', async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const receipt = snap.data();
    const { groupId, receiptId } = event.params;
    safeLogger.info('Verifying receipt against transaction', { groupId, receiptId, txId: receipt.txId });
    const groupRef = db.collection('groups').doc(groupId);
    const txSnap = await groupRef.collection('transactions').doc(receipt.txId).get();
    if (!txSnap.exists) {
        safeLogger.warn('Receipt created for non-existent transaction', { groupId, receiptId, txId: receipt.txId });
        const conflictRef = groupRef.collection('conflicts').doc();
        await conflictRef.set({
            id: conflictRef.id,
            groupId,
            type: 'receipt_mismatch',
            refIds: [receiptId],
            detectedAt: Date.now(),
            status: 'open',
            reason: `Receipt references non-existent transaction ${receipt.txId}`
        });
        return;
    }
    const tx = txSnap.data();
    const mismatches = [];
    if (tx.memberId !== receipt.memberId) {
        mismatches.push(`Member mismatch (tx: ${tx.memberId}, receipt: ${receipt.memberId})`);
    }
    if (tx.amountPaise !== receipt.amountPaise) {
        mismatches.push(`Amount mismatch (tx: ${tx.amountPaise}, receipt: ${receipt.amountPaise})`);
    }
    if (mismatches.length > 0) {
        safeLogger.warn('Receipt data does not match transaction', {
            groupId,
            receiptId,
            txId: receipt.txId,
            mismatches
        });
        const conflictRef = groupRef.collection('conflicts').doc();
        await conflictRef.set({
            id: conflictRef.id,
            groupId,
            type: 'receipt_mismatch',
            refIds: [receiptId, tx.txId],
            detectedAt: Date.now(),
            status: 'open',
            reason: mismatches.join('; ')
        });
    }
});
//# sourceMappingURL=onReceiptCreated.js.map