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

/**
 * Create a new check-in session
 */
export const createCheckInSession = async (
  user: User,
  faceImageUrl: string
): Promise<Session> => {
  try {
    const sessionId = `${user.id}_${Date.now()}`;
    
    // Create session with server timestamp
    const sessionData: any = {
      id: sessionId,
      userId: user.id,
      username: user.username,
      department: user.department,
      position: user.position,
      checkInTime: serverTimestamp(), // Use Firebase server timestamp
      status: 'online',
      faceImageUrl: user.faceImageUrl || faceImageUrl,
      face1Url: faceImageUrl,
      totalOnlineTime: 0,
      totalBackSoonTime: 0,
      backSoonEvents: [],
      captchaAttempts: 0,
      captchaSuccessCount: 0,
      faceVerificationCount: 0,
      lastActivityTime: serverTimestamp(), // Server timestamp
      lastCaptchaTime: serverTimestamp(), // Server timestamp
    };

    // Save to Firestore with server timestamp
    await setDoc(doc(db, 'sessions', sessionId), sessionData);
    
    // Read back to get actual timestamp from server
    const sessionSnap = await getDoc(doc(db, 'sessions', sessionId));
    const savedSession = sessionSnap.data() as any;
    
    // Convert Timestamp objects to numbers
    const newSession: Session = {
      ...savedSession,
      checkInTime: savedSession.checkInTime instanceof Timestamp 
        ? savedSession.checkInTime.toMillis() 
        : Date.now(),
      lastActivityTime: savedSession.lastActivityTime instanceof Timestamp
        ? savedSession.lastActivityTime.toMillis()
        : Date.now(),
      lastCaptchaTime: savedSession.lastCaptchaTime instanceof Timestamp
        ? savedSession.lastCaptchaTime.toMillis()
        : Date.now(),
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
    throw new Error('Không thể tạo phiên check-in');
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
    const now = Date.now();

    await updateDoc(sessionRef, {
      status: 'back_soon',
      backSoonEvents: [...(await getBackSoonEvents(sessionId)), {
        startTime: now,
        reason,
      }],
      updatedAt: now,
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
    throw new Error('Không thể cập nhật trạng thái Back Soon');
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
    const now = Date.now();
    
    const backSoonEvents = await getBackSoonEvents(sessionId);
    if (backSoonEvents.length > 0) {
      const lastEvent = backSoonEvents[backSoonEvents.length - 1];
      if (!lastEvent.endTime) {
        lastEvent.endTime = now;
        lastEvent.duration = now - lastEvent.startTime;
      }
    }

    await updateDoc(sessionRef, {
      status: 'online',
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
      'back_online',
      'User returned from back soon',
      user.id,
      user.role,
      user.department
    );
  } catch (error) {
    console.error('Error updating session back online:', error);
    throw new Error('Không thể cập nhật trạng thái Online');
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
    const now = Date.now();
    
    // Get current session data to calculate times
    const sessionDoc = await getDocs(query(collection(db, 'sessions'), where('id', '==', sessionId), limit(1)));
    if (sessionDoc.empty) {
      throw new Error('Session not found');
    }
    
    const sessionData = sessionDoc.docs[0].data() as Session;
    const totalOnlineTime = now - sessionData.checkInTime - (sessionData.totalBackSoonTime || 0);
    
    // Close any open back soon event
    const backSoonEvents = sessionData.backSoonEvents || [];
    if (backSoonEvents.length > 0) {
      const lastEvent = backSoonEvents[backSoonEvents.length - 1];
      if (!lastEvent.endTime) {
        lastEvent.endTime = now;
        lastEvent.duration = now - lastEvent.startTime;
      }
    }
    
    // Calculate total back soon time
    const totalBackSoonTime = backSoonEvents.reduce((sum, event) => sum + (event.duration || 0), 0);

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
    throw new Error('Không thể check out');
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
    let sessions = snapshot.docs.map(doc => doc.data() as Session);
    
    // Filter by date range if provided
    if (startDate || endDate) {
      sessions = sessions.filter(session => {
        if (startDate && session.checkInTime < startDate) return false;
        if (endDate && session.checkInTime > endDate) return false;
        return true;
      });
    }
    
    // Sort by checkInTime descending (newest first) on client-side
    sessions.sort((a, b) => b.checkInTime - a.checkInTime);
    
    return sessions;
  } catch (error) {
    console.error('Error getting session history:', error);
    throw new Error('Không thể tải lịch sử');
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
    throw new Error('Không thể cập nhật CAPTCHA');
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


