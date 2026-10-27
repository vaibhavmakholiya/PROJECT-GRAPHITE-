import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { db, messaging } from '../config.js';
import { safeLogger } from '../logger.js';

interface AnnouncementData {
  title: string;
  body: string;
  createdBy: string;
  createdAt: number;
}

export const onAnnouncementCreated = onDocumentCreated(
  'groups/{groupId}/announcements/{announcementId}',
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const announcement = snap.data() as AnnouncementData;
    const { groupId, announcementId } = event.params;

    safeLogger.info('Fanning out announcement to active members', { groupId, announcementId });

    const groupRef = db.collection('groups').doc(groupId);
    const activeMembersSnap = await groupRef
      .collection('members')
      .where('status', '==', 'active')
      .get();

    if (activeMembersSnap.empty) {
      safeLogger.info('No active members to notify', { groupId });
      return;
    }

    const batch = db.batch();
    const allTokens: string[] = [];

    for (const memberDoc of activeMembersSnap.docs) {
      const memberId = memberDoc.id;

      // 1. Fan out in-app notification document
      const notifRef = groupRef.collection('notifications').doc();
      batch.set(notifRef, {
        id: notifRef.id,
        memberId,
        title: announcement.title,
        body: announcement.body,
        read: false,
        createdAt: Date.now(),
        refId: announcementId
      });

      // 2. Query device tokens for FCM push
      const tokenDoc = await groupRef.collection('deviceTokens').doc(memberId).get();
      if (tokenDoc.exists) {
        const tokenData = tokenDoc.data();
        if (tokenData?.tokens && Array.isArray(tokenData.tokens)) {
          allTokens.push(...tokenData.tokens);
        }
      }
    }

    await batch.commit();

    // 3. Send FCM push notifications if device tokens are present
    if (allTokens.length > 0) {
      try {
        await messaging.sendEachForMulticast({
          tokens: allTokens,
          notification: {
            title: announcement.title,
            body: announcement.body
          },
          data: {
            groupId,
            announcementId
          }
        });
        safeLogger.info('FCM push sent successfully', { tokenCount: allTokens.length });
      } catch (err: any) {
        safeLogger.warn('Failed to send FCM push multicast', { error: err.message });
      }
    }
  }
);
