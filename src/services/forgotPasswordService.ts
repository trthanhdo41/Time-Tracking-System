// Forgot password service
import { collection, addDoc, query, where, getDocs, updateDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface ForgotPasswordRequest {
  id?: string;
  username: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: number;
  processedAt?: number;
  processedBy?: string;
  newPassword?: string;
}

/**
 * Submit forgot password request
 */
export const submitForgotPasswordRequest = async (
  username: string
): Promise<void> => {
  try {
    // Verify that username exists
    const usersRef = collection(db, 'users');
    const userQuery = query(
      usersRef,
      where('username', '==', username)
    );
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      throw new Error('Username does not exist. Please check your username.');
    }
    
    const userData = userSnapshot.docs[0].data();
    const email = userData.email || '';

    // Check if there's already a pending request for this user
    const forgotPasswordRef = collection(db, 'forgotPasswordRequests');
    const existingRequestQuery = query(
      forgotPasswordRef,
      where('username', '==', username),
      where('status', '==', 'pending')
    );
    const existingRequestSnapshot = await getDocs(existingRequestQuery);

    if (!existingRequestSnapshot.empty) {
      throw new Error('You already have a pending password reset request');
    }

    // Create forgot password request
    await addDoc(forgotPasswordRef, {
      username,
      email,
      status: 'pending',
      requestedAt: serverTimestamp(),
    });

    // Toast is handled by the component calling this function
  } catch (error: any) {
    console.error('Error submitting forgot password request:', error);
    throw new Error(error.message || 'Unable to submit password reset request');
  }
};

/**
 * Get all forgot password requests (for admin)
 */
export const getAllForgotPasswordRequests = async (): Promise<ForgotPasswordRequest[]> => {
  try {
    const forgotPasswordRef = collection(db, 'forgotPasswordRequests');
    const snapshot = await getDocs(forgotPasswordRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      requestedAt: doc.data().requestedAt?.toMillis() || Date.now(),
      processedAt: doc.data().processedAt?.toMillis(),
    } as ForgotPasswordRequest));
  } catch (error) {
    console.error('Error getting forgot password requests:', error);
    throw new Error('Unable to load password reset requests');
  }
};

/**
 * Get pending forgot password requests (for admin)
 */
export const getPendingForgotPasswordRequests = async (): Promise<ForgotPasswordRequest[]> => {
  try {
    const forgotPasswordRef = collection(db, 'forgotPasswordRequests');
    const pendingQuery = query(forgotPasswordRef, where('status', '==', 'pending'));
    const snapshot = await getDocs(pendingQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      requestedAt: doc.data().requestedAt?.toMillis() || Date.now(),
    } as ForgotPasswordRequest));
  } catch (error) {
    console.error('Error getting pending forgot password requests:', error);
    throw new Error('Unable to load pending password reset requests');
  }
};

/**
 * Approve forgot password request (for admin)
 * Note: Admin will reset password manually in Firebase Console
 */
export const approveForgotPasswordRequest = async (
  requestId: string,
  processedBy: { id: string; username: string; role: string }
): Promise<void> => {
  try {
    const requestDoc = doc(db, 'forgotPasswordRequests', requestId);
    const requestSnapshot = await getDoc(requestDoc);
    
    if (!requestSnapshot.exists()) {
      throw new Error('Request not found');
    }
    
    const requestData = requestSnapshot.data();

    // Update request status (no password generation - admin will reset in Firebase Console)
    await updateDoc(requestDoc, {
      status: 'approved',
      processedAt: serverTimestamp(),
      processedBy: processedBy.username,
      processedByUserId: processedBy.id,
    });

    // Log activity
    const { logActivity } = await import('@/services/activityLog');
    const usersRef = collection(db, 'users');
    const userQuery = query(usersRef, where('username', '==', requestData.username));
    const userSnapshot = await getDocs(userQuery);
    
    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      await logActivity(
        userSnapshot.docs[0].id,
        requestData.username,
        userData.role,
        userData.department,
        userData.position,
        'password_reset',
        `Password reset approved by ${processedBy.username} - Admin will reset in Firebase Console`,
        processedBy.id,
        processedBy.role as any,
        userData.department
      );
    }

    // Toast is handled by the component calling this function
  } catch (error: any) {
    console.error('Error approving forgot password request:', error);
    throw new Error(error.message || 'Unable to approve password reset request');
  }
};

/**
 * Reject forgot password request (for admin)
 */
export const rejectForgotPasswordRequest = async (
  requestId: string,
  reason: string,
  processedBy: { id: string; username: string; role: string }
): Promise<void> => {
  try {
    const requestDoc = doc(db, 'forgotPasswordRequests', requestId);
    
    await updateDoc(requestDoc, {
      status: 'rejected',
      processedAt: serverTimestamp(),
      processedBy: processedBy.username,
      processedByUserId: processedBy.id,
      rejectionReason: reason,
    });

    // Toast is handled by the component calling this function
  } catch (error: any) {
    console.error('Error rejecting forgot password request:', error);
    throw new Error(error.message || 'Unable to reject password reset request');
  }
};

