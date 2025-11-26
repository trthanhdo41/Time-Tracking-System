import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteField
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { ImageDeleteRequest } from '@/types';
import { logActivity } from './activityLog';
import { logAdminActivity } from './adminActivityService';
import toast from 'react-hot-toast';
import { getVietnamTimestamp } from '@/utils/time';

/**
 * Create a new image delete request
 */
export const createImageDeleteRequest = async (
  userId: string,
  imageUrl: string,
  reason: string,
  user: any
): Promise<string> => {
  try {
    // Validate inputs
    if (!userId || !imageUrl || !reason || !user) {
      throw new Error('Missing required information');
    }

    console.log('Creating image delete request:', { userId, imageUrl, reason });

    const requestData: Omit<ImageDeleteRequest, 'id'> = {
      userId,
      imageUrl,
      reason,
      status: 'pending',
      requestedAt: getVietnamTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'imageDeleteRequests'), requestData);
    console.log('Image delete request created:', docRef.id);

    // Log activity
    await logActivity(
      userId,
      user.username,
      user.role,
      user.department,
      user.position,
      'delete_image_request',
      `Requested to delete image: ${reason}`,
      user.id,
      user.role,
      user.department,
      { imageUrl, requestId: docRef.id }
    );

    toast.success('Image deletion request sent. Please wait for approval.');
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating image delete request:', error);
    const errorMessage = error.message || 'Unable to send image deletion request';
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Get image delete requests for a user
 */
export const getUserImageDeleteRequests = async (userId: string): Promise<ImageDeleteRequest[]> => {
  try {
    // Remove orderBy to avoid index requirement - sort on client-side
    const q = query(
      collection(db, 'imageDeleteRequests'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ImageDeleteRequest));
    
    // Sort by requestedAt descending (newest first) on client-side
    return requests.sort((a, b) => b.requestedAt - a.requestedAt);
  } catch (error) {
    console.error('Error getting user image delete requests:', error);
    return [];
  }
};

/**
 * Get all pending image delete requests (for admin)
 */
export const getPendingImageDeleteRequests = async (): Promise<ImageDeleteRequest[]> => {
  try {
    // Remove orderBy to avoid index requirement - sort on client-side
    const q = query(
      collection(db, 'imageDeleteRequests'),
      where('status', '==', 'pending')
    );

    const snapshot = await getDocs(q);
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ImageDeleteRequest));
    
    // Sort by requestedAt descending (newest first) on client-side
    return requests.sort((a, b) => b.requestedAt - a.requestedAt);
  } catch (error) {
    console.error('Error getting pending image delete requests:', error);
    return [];
  }
};

/**
 * Approve an image delete request and actually delete the image from sessions/faceVerifications
 */
export const approveImageDeleteRequest = async (
  requestId: string,
  adminUser: any
): Promise<void> => {
  try {
    // Get the request to find the imageUrl
    const requestDoc = await getDoc(doc(db, 'imageDeleteRequests', requestId));
    if (!requestDoc.exists()) {
      throw new Error('Image delete request not found');
    }
    
    const requestData = requestDoc.data() as ImageDeleteRequest;
    const imageUrl = requestData.imageUrl;

    // Find and delete image from sessions collection
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('userId', '==', requestData.userId)
    );
    const sessionsSnapshot = await getDocs(sessionsQuery);
    
    let deletedCount = 0;
    const sessionUpdatePromises: Promise<void>[] = [];
    
    sessionsSnapshot.forEach((sessionDoc) => {
      const sessionData = sessionDoc.data();
      const updates: any = {};
      
      // Check and delete faceImageUrl if matches
      if (sessionData.faceImageUrl === imageUrl) {
        updates.faceImageUrl = deleteField();
        deletedCount++;
      }
      
      // Check and delete face1Url if matches
      if (sessionData.face1Url === imageUrl) {
        updates.face1Url = deleteField();
        deletedCount++;
      }
      
      // Check and delete face2Url if matches
      if (sessionData.face2Url === imageUrl) {
        updates.face2Url = deleteField();
        deletedCount++;
      }
      
      // Update session if any fields need to be deleted
      if (Object.keys(updates).length > 0) {
        sessionUpdatePromises.push(
          updateDoc(doc(db, 'sessions', sessionDoc.id), updates)
        );
      }
    });
    
    // Wait for all session updates to complete
    await Promise.all(sessionUpdatePromises);
    
    // Find and delete image from faceVerifications collection
    const faceVerifyQuery = query(
      collection(db, 'faceVerifications'),
      where('userId', '==', requestData.userId),
      where('imageUrl', '==', imageUrl)
    );
    const faceVerifySnapshot = await getDocs(faceVerifyQuery);
    
    const faceVerifyUpdatePromises: Promise<void>[] = [];
    faceVerifySnapshot.forEach((verifyDoc) => {
      faceVerifyUpdatePromises.push(
        updateDoc(doc(db, 'faceVerifications', verifyDoc.id), {
          imageUrl: deleteField()
        })
      );
      deletedCount++;
    });
    
    // Wait for all faceVerification updates to complete
    await Promise.all(faceVerifyUpdatePromises);
    
    // Update request status to approved
    await updateDoc(doc(db, 'imageDeleteRequests', requestId), {
      status: 'approved',
      reviewedAt: getVietnamTimestamp(),
      reviewedBy: adminUser.id,
      reviewerComment: 'Approved by admin - Image deleted'
    });

    // Log activity
    await logActivity(
      adminUser.id,
      adminUser.username,
      adminUser.role,
      adminUser.department,
      adminUser.position,
      'delete_image_request',
      `Approved and deleted image from ${deletedCount} location(s): ${requestId}`,
      adminUser.id,
      adminUser.role,
      adminUser.department,
      { requestId, imageUrl, deletedCount, action: 'approved_and_deleted' }
    );

    // Log admin activity
    await logAdminActivity({
      adminUsername: adminUser.username,
      adminRole: adminUser.role === 'admin' ? 'admin' : 'department_admin',
      actionType: 'approve_image_delete',
      actionDescription: `Approved image deletion request and deleted image from ${deletedCount} location(s)`,
      targetUser: requestData.userId,
      targetResource: requestId,
      metadata: { imageUrl, deletedCount }
    });

  } catch (error) {
    console.error('Error approving image delete request:', error);
    throw new Error('Unable to approve image deletion request');
  }
};

/**
 * Reject an image delete request
 */
export const rejectImageDeleteRequest = async (
  requestId: string,
  reason: string,
  adminUser: any
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'imageDeleteRequests', requestId), {
      status: 'rejected',
      reviewedAt: getVietnamTimestamp(),
      reviewedBy: adminUser.id,
      reviewerComment: reason
    });

    // Log activity
    await logActivity(
      adminUser.id,
      adminUser.username,
      adminUser.role,
      adminUser.department,
      adminUser.position,
      'delete_image_request',
      `Rejected image delete request: ${requestId} - Reason: ${reason}`,
      adminUser.id,
      adminUser.role,
      adminUser.department,
      { requestId, action: 'rejected', reason }
    );

    // Log admin activity
    const requestDoc = await getDoc(doc(db, 'imageDeleteRequests', requestId));
    const requestData = requestDoc.data() as ImageDeleteRequest;

    await logAdminActivity({
      adminUsername: adminUser.username,
      adminRole: adminUser.role === 'admin' ? 'admin' : 'department_admin',
      actionType: 'reject_image_delete',
      actionDescription: `Rejected image deletion request - Reason: ${reason}`,
      targetUser: requestData?.userId,
      targetResource: requestId,
      metadata: { reason }
    });

  } catch (error) {
    console.error('Error rejecting image delete request:', error);
    throw new Error('Unable to reject image deletion request');
  }
};

/**
 * Listen to image delete requests for a user
 */
export const listenToUserImageDeleteRequests = (
  userId: string,
  callback: (requests: ImageDeleteRequest[]) => void
) => {
  const q = query(
    collection(db, 'imageDeleteRequests'),
    where('userId', '==', userId),
    orderBy('requestedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ImageDeleteRequest));
    callback(requests);
  });
};

/**
 * Listen to all pending image delete requests (for admin)
 */
export const listenToPendingImageDeleteRequests = (
  callback: (requests: ImageDeleteRequest[]) => void
) => {
  const q = query(
    collection(db, 'imageDeleteRequests'),
    where('status', '==', 'pending')
  );

  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ImageDeleteRequest));
    
    // Sort by requestedAt descending (newest first) on client-side
    const sortedRequests = requests.sort((a, b) => b.requestedAt - a.requestedAt);
    callback(sortedRequests);
  });
};
