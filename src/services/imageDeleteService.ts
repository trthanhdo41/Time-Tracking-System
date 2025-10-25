import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { ImageDeleteRequest } from '@/types';
import { logActivity } from './activityLog';
import toast from 'react-hot-toast';

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
    const requestData: Omit<ImageDeleteRequest, 'id'> = {
      userId,
      imageUrl,
      reason,
      status: 'pending',
      requestedAt: Date.now(),
    };

    const docRef = await addDoc(collection(db, 'imageDeleteRequests'), requestData);

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

    toast.success('Đã gửi yêu cầu xóa ảnh. Vui lòng chờ phê duyệt.');
    return docRef.id;
  } catch (error) {
    console.error('Error creating image delete request:', error);
    toast.error('Không thể gửi yêu cầu xóa ảnh');
    throw new Error('Không thể tạo yêu cầu xóa ảnh');
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
 * Approve an image delete request
 */
export const approveImageDeleteRequest = async (
  requestId: string,
  adminUser: any
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'imageDeleteRequests', requestId), {
      status: 'approved',
      reviewedAt: Date.now(),
      reviewedBy: adminUser.id,
      reviewerComment: 'Approved by admin'
    });

    // Log activity
    await logActivity(
      adminUser.id,
      adminUser.username,
      adminUser.role,
      adminUser.department,
      adminUser.position,
      'delete_image_request',
      `Approved image delete request: ${requestId}`,
      adminUser.id,
      adminUser.role,
      adminUser.department,
      { requestId, action: 'approved' }
    );

  } catch (error) {
    console.error('Error approving image delete request:', error);
    throw new Error('Không thể phê duyệt yêu cầu xóa ảnh');
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
      reviewedAt: Date.now(),
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

  } catch (error) {
    console.error('Error rejecting image delete request:', error);
    throw new Error('Không thể từ chối yêu cầu xóa ảnh');
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
