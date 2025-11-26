// Session management service with real Firebase operations
import { 
  collection, 
  doc, 
  getDoc,
  setDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Session, User } from '@/types';
import { logActivity } from './activityLog';
import { getVietnamTimestamp } from '@/utils/time';

/**
 * Create a new check-in session
 */
export const createCheckInSession = async (
  user: User,
  faceImageUrl: string
): Promise<Session> => {
  try {
    const vietnamTime = getVietnamTimestamp();
    const sessionId = `${user.id}_${vietnamTime}`;

    // Create session with Vietnam timezone (GMT+7)
    const sessionData: any = {
      id: sessionId,
      userId: user.id,
      username: user.username,
      department: user.department,
      position: user.position,
      checkInTime: vietnamTime, // Use Vietnam timestamp (GMT+7)
      status: 'online',
      faceImageUrl: user.faceImageUrl || faceImageUrl,
      face1Url: faceImageUrl,
      totalOnlineTime: 0,
      totalBackSoonTime: 0,
      backSoonEvents: [],
      captchaAttempts: 0,
      captchaSuccessCount: 0,
      faceVerificationCount: 0,
      lastActivityTime: vietnamTime, // Vietnam timestamp
      lastCaptchaTime: vietnamTime, // Vietnam timestamp
    };

    // Save to Firestore
    await setDoc(doc(db, 'sessions', sessionId), sessionData);

    // Return session with Vietnam timestamps
    const newSession: Session = {
      ...sessionData,
      checkInTime: vietnamTime,
      lastActivityTime: vietnamTime,
      lastCaptchaTime: vietnamTime,
    };

    // Log activity
    await logActivity(
      user.id,
      user.username,
      user.role,
      user.department,
      user.position,
      'check_in',
      'User checked in successfully',
      user.id,
      user.role,
      user.department
    );

    return newSession;
  } catch (error) {
    console.error('Error creating check-in session:', error);
    throw new Error('Unable to create check-in session');
  }
};

/**
 * Update session to Back Soon status
 */
export const updateSessionBackSoon = async (
  sessionId: string,
  reason: string,
  user: User
): Promise<void> => {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    const userRef = doc(db, 'users', user.id);
    const now = getVietnamTimestamp();

    await updateDoc(sessionRef, {
      status: 'back_soon',
      backSoonEvents: [...(await getBackSoonEvents(sessionId)), {
        startTime: now,
        reason,
      }],
      updatedAt: now,
    });

    // Update user status to back_soon
    await updateDoc(userRef, {
      status: 'back_soon',
      lastActivityAt: now,
    });

    // Log activity
    await logActivity(
      user.id,
      user.username,
      user.role,
      user.department,
      user.position,
      'back_soon',
      `User went back soon: ${reason}`,
      user.id,
      user.role,
      user.department
    );
  } catch (error) {
    console.error('Error updating session to back soon:', error);
    throw new Error('Unable to update Back Soon status');
  }
};

/**
 * Update session back to Online from Back Soon
 */
export const updateSessionBackOnline = async (
  sessionId: string,
  user: User
): Promise<void> => {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    const userRef = doc(db, 'users', user.id);
    const now = getVietnamTimestamp();

    const backSoonEvents = await getBackSoonEvents(sessionId);
    if (backSoonEvents.length > 0) {
      const lastEvent = backSoonEvents[backSoonEvents.length - 1];
      if (!lastEvent.endTime) {
        lastEvent.endTime = now;
        lastEvent.duration = now - lastEvent.startTime;
      }
    }

    // Calculate total back soon time (in seconds)
    const totalBackSoonTime = Math.floor(backSoonEvents.reduce((sum, event) => sum + (event.duration || 0), 0) / 1000);

    await updateDoc(sessionRef, {
      status: 'online',
      backSoonEvents,
      totalBackSoonTime,
      updatedAt: now,
    });

    // Update user status back to online
    await updateDoc(userRef, {
      status: 'online',
      lastActivityAt: now,
    });

    // Log activity
    await logActivity(
      user.id,
      user.username,
      user.role,
      user.department,
      user.position,
      'back_online',
      'User returned from back soon',
      user.id,
      user.role,
      user.department
    );
  } catch (error) {
    console.error('Error updating session back online:', error);
    throw new Error('Unable to update Online status');
  }
};

/**
 * Check out and end session
 */
export const checkOutSession = async (
  sessionId: string,
  reason: string,
  user: User
): Promise<void> => {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    const now = getVietnamTimestamp();
    
    // Get current session data to calculate times
    const sessionDoc = await getDocs(query(collection(db, 'sessions'), where('id', '==', sessionId), limit(1)));
    if (sessionDoc.empty) {
      throw new Error('Session not found');
    }
    
    const sessionData = sessionDoc.docs[0].data() as any;
    
    // IMPORTANT: Check if already checked out to prevent duplicate checkouts
    if (sessionData.status === 'offline') {
      console.log(`Session ${sessionId} is already checked out. Skipping duplicate checkout.`);
      return;
    }
    
    // Handle checkInTime conversion (Timestamp or number)
    let checkInTime: number;
    if (sessionData.checkInTime && typeof sessionData.checkInTime === 'object' && 'seconds' in sessionData.checkInTime) {
      // Firebase Timestamp
      checkInTime = sessionData.checkInTime.seconds * 1000;
    } else if (typeof sessionData.checkInTime === 'number') {
      checkInTime = sessionData.checkInTime;
    } else {
      throw new Error('Invalid checkInTime format');
    }
    
    // Close any open back soon event
    const backSoonEvents = sessionData.backSoonEvents || [];
    if (backSoonEvents.length > 0) {
      const lastEvent = backSoonEvents[backSoonEvents.length - 1];
      if (!lastEvent.endTime) {
        lastEvent.endTime = now;
        lastEvent.duration = now - lastEvent.startTime;
      }
    }
    
    // Calculate total back soon time (in seconds)
    const totalBackSoonTime = Math.floor(backSoonEvents.reduce((sum, event) => sum + (event.duration || 0), 0) / 1000);
    
    // Calculate total online time
    const totalOnlineTime = Math.floor((now - checkInTime - totalBackSoonTime) / 1000); // in seconds

    await updateDoc(sessionRef, {
      status: 'offline',
      checkOutTime: now,
      checkOutReason: reason,
      totalOnlineTime,
      totalBackSoonTime,
      backSoonEvents,
      updatedAt: now,
    });

    // Log activity
    await logActivity(
      user.id,
      user.username,
      user.role,
      user.department,
      user.position,
      'check_out',
      `User checked out: ${reason}`,
      user.id,
      user.role,
      user.department
    );
  } catch (error) {
    console.error('Error checking out session:', error);
    throw new Error('Unable to check out');
  }
};

/**
 * Admin force logout user (checkout their active session)
 */
export const adminForceLogoutUser = async (
  userId: string,
  adminUser: User,
  reason: string = 'Forced logout by admin'
): Promise<void> => {
  try {
    // Get current active session for user
    const activeSession = await getCurrentSession(userId);
    
    if (!activeSession || activeSession.status !== 'online') {
      // User doesn't have an active session, just update their status
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: 'offline',
        lastLogoutAt: Date.now()
      });
      return;
    }
    
    // Checkout the active session
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const targetUser = userDoc.data() as User;
    await checkOutSession(activeSession.id, reason, targetUser);
    
    // Log admin action
    await logActivity(
      adminUser.id,
      adminUser.username,
      adminUser.role,
      adminUser.department,
      adminUser.position,
      'admin_action',
      `Admin forced logout for user: ${targetUser.username} - Reason: ${reason}`,
      adminUser.id,
      adminUser.role,
      adminUser.department
    );
  } catch (error) {
    console.error('Error forcing user logout:', error);
    throw new Error('Unable to force logout user');
  }
};

/**
 * Get current active session for user
 */
export const getCurrentSession = async (userId: string): Promise<Session | null> => {
  try {
    const sessionsRef = collection(db, 'sessions');
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      where('status', 'in', ['online', 'back_soon']),
      orderBy('checkInTime', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    return snapshot.docs[0].data() as Session;
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
};

/**
 * Get user's session history
 */
export const getUserSessionHistory = async (
  userId: string,
  startDate?: number,
  endDate?: number
): Promise<Session[]> => {
  try {
    const sessionsRef = collection(db, 'sessions');
    // Remove orderBy to avoid index requirement - sort on client-side
    let q = query(
      sessionsRef,
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    let sessions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        checkInTime: data.checkInTime instanceof Timestamp ? data.checkInTime.toMillis() : (typeof data.checkInTime === 'number' ? data.checkInTime : Date.now()),
        checkOutTime: data.checkOutTime instanceof Timestamp ? data.checkOutTime?.toMillis() : (typeof data.checkOutTime === 'number' ? data.checkOutTime : undefined),
        lastActivityTime: data.lastActivityTime instanceof Timestamp ? data.lastActivityTime.toMillis() : (typeof data.lastActivityTime === 'number' ? data.lastActivityTime : Date.now()),
        lastCaptchaTime: data.lastCaptchaTime instanceof Timestamp ? data.lastCaptchaTime?.toMillis() : (typeof data.lastCaptchaTime === 'number' ? data.lastCaptchaTime : undefined),
      } as Session;
    });
    
    // Filter by date range if provided
    if (startDate || endDate) {
      const beforeFilter = sessions.length;
      sessions = sessions.filter(session => {
        // checkInTime is already converted to number above
        const checkInTime = typeof session.checkInTime === 'number' ? session.checkInTime : Date.now();
        
        // Filter: startDate <= checkInTime <= endDate
        if (startDate && checkInTime < startDate) {
          return false;
        }
        if (endDate && checkInTime > endDate) {
          return false;
        }
        return true;
      });
      console.log(`Filtered sessions in getAllSessionsHistory: ${beforeFilter} -> ${sessions.length} (startDate: ${startDate ? new Date(startDate).toISOString() : 'none'}, endDate: ${endDate ? new Date(endDate).toISOString() : 'none'})`);
    }
    
    // Sort by checkInTime descending (newest first) on client-side
    sessions.sort((a, b) => b.checkInTime - a.checkInTime);
    
    return sessions;
  } catch (error) {
    console.error('Error getting session history:', error);
    throw new Error('Unable to load history');
  }
};

/**
 * Get all sessions history (for admin)
 */
export const getAllSessionsHistory = async (
  startDate?: number,
  endDate?: number
): Promise<Session[]> => {
  try {
    const sessionsRef = collection(db, 'sessions');
    // Query all sessions without userId filter
    const q = query(sessionsRef);
    
    const snapshot = await getDocs(q);
    let sessions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        checkInTime: data.checkInTime instanceof Timestamp ? data.checkInTime.toMillis() : data.checkInTime,
        checkOutTime: data.checkOutTime instanceof Timestamp ? data.checkOutTime?.toMillis() : data.checkOutTime,
        lastActivityTime: data.lastActivityTime instanceof Timestamp ? data.lastActivityTime.toMillis() : data.lastActivityTime,
        lastCaptchaTime: data.lastCaptchaTime instanceof Timestamp ? data.lastCaptchaTime?.toMillis() : data.lastCaptchaTime,
      } as Session;
    });
    
    // Filter by date range if provided
    if (startDate || endDate) {
      const beforeFilter = sessions.length;
      sessions = sessions.filter(session => {
        // checkInTime is already converted to number above
        const checkInTime = typeof session.checkInTime === 'number' ? session.checkInTime : Date.now();
        
        // Filter: startDate <= checkInTime <= endDate
        if (startDate && checkInTime < startDate) {
          return false;
        }
        if (endDate && checkInTime > endDate) {
          return false;
        }
        return true;
      });
      console.log(`Filtered sessions in getAllSessionsHistory: ${beforeFilter} -> ${sessions.length} (startDate: ${startDate ? new Date(startDate).toISOString() : 'none'}, endDate: ${endDate ? new Date(endDate).toISOString() : 'none'})`);
    }
    
    // Sort by checkInTime descending (newest first) on client-side
    sessions.sort((a, b) => b.checkInTime - a.checkInTime);
    
    return sessions;
  } catch (error) {
    console.error('Error getting all sessions history:', error);
    throw new Error('Unable to load all history');
  }
};

/**
 * Listen to current session real-time
 */
export const listenToCurrentSession = (
  userId: string,
  callback: (session: Session | null) => void
): (() => void) => {
  try {
    const sessionsRef = collection(db, 'sessions');
    // Remove orderBy to avoid index requirement
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      where('status', 'in', ['online', 'back_soon']),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        callback(null);
      } else {
        callback(snapshot.docs[0].data() as Session);
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error listening to current session:', error);
    return () => {};
  }
};

/**
 * Update CAPTCHA attempt
 */
export const updateCaptchaAttempt = async (
  sessionId: string,
  success: boolean,
  user: User
): Promise<void> => {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    const now = Date.now();

    if (success) {
      // Get current captchaSuccessCount to increment
      const sessionSnap = await getDoc(sessionRef);
      const currentCount = sessionSnap.exists() ? (sessionSnap.data().captchaSuccessCount || 0) : 0;
      
      await updateDoc(sessionRef, {
        lastCaptchaTime: now,
        captchaAttempts: 0,
        captchaSuccessCount: currentCount + 1, // Increment success counter
        updatedAt: now,
      });

      await logActivity(
        user.id,
        user.username,
        user.role,
        user.department,
        user.position,
        'captcha_verify',
        `CAPTCHA verification successful (${currentCount + 1} times)`,
        user.id,
        user.role,
        user.department
      );
    } else {
      // Get current attempts
      const sessionDoc = await getDocs(query(collection(db, 'sessions'), where('id', '==', sessionId), limit(1)));
      const currentAttempts = sessionDoc.empty ? 0 : (sessionDoc.docs[0].data().captchaAttempts || 0);
      
      await updateDoc(sessionRef, {
        captchaAttempts: currentAttempts + 1,
        updatedAt: now,
      });

      await logActivity(
        user.id,
        user.username,
        user.role,
        user.department,
        user.position,
        'captcha_failed',
        `CAPTCHA verification failed (attempt ${currentAttempts + 1})`,
        user.id,
        user.role,
        user.department
      );
    }
  } catch (error) {
    console.error('Error updating CAPTCHA attempt:', error);
    throw new Error('Unable to update CAPTCHA');
  }
};

/**
 * Helper function to get back soon events
 */
async function getBackSoonEvents(sessionId: string): Promise<any[]> {
  const sessionDoc = await getDocs(query(collection(db, 'sessions'), where('id', '==', sessionId), limit(1)));
  if (sessionDoc.empty) return [];
  return sessionDoc.docs[0].data().backSoonEvents || [];
}


