import { collection, getDocs, updateDoc, doc, query, where, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Session } from '@/types';
import { logActivity } from '@/services/activityLog';
import { getVietnamTimestamp } from '@/utils/time';

// Clean up sessions that have been inactive for more than X minutes
const SESSION_INACTIVITY_THRESHOLD = 2 * 60 * 1000; // 2 minutes in milliseconds

export const cleanupStaleSessions = async () => {
  try {
    const now = getVietnamTimestamp();
    const sessionsRef = collection(db, 'sessions');
    
    // Get all active sessions (online or back_soon)
    const activeSessionsQuery = query(
      sessionsRef, 
      where('status', 'in', ['online', 'back_soon'])
    );
    const snapshot = await getDocs(activeSessionsQuery);
    
    const cleanupPromises: Promise<void>[] = [];
    
    snapshot.forEach(async (sessionDoc) => {
      const sessionData = sessionDoc.data() as any;

      // Check if session is marked for immediate cleanup (e.g., user closed tab)
      const needsCleanup = sessionData.needsCleanup === true;

      // Get last activity time
      let lastActivityTime: number;
      if (sessionData.lastActivityTime && typeof sessionData.lastActivityTime === 'object' && 'seconds' in sessionData.lastActivityTime) {
        // Firebase Timestamp
        lastActivityTime = sessionData.lastActivityTime.seconds * 1000;
      } else if (typeof sessionData.lastActivityTime === 'number') {
        lastActivityTime = sessionData.lastActivityTime;
      } else {
        // Fallback to checkInTime
        lastActivityTime = sessionData.checkInTime?.seconds
          ? sessionData.checkInTime.seconds * 1000
          : sessionData.checkInTime || now;
      }

      const timeSinceLastActivity = now - lastActivityTime;

      // If session has been inactive for more than threshold OR marked for cleanup, auto checkout
      if (needsCleanup || timeSinceLastActivity > SESSION_INACTIVITY_THRESHOLD) {
        const updatePromise = autoCheckoutSession(sessionDoc.id, sessionData, timeSinceLastActivity);
        cleanupPromises.push(updatePromise);

        if (needsCleanup) {
          console.log(`Auto checkout session ${sessionDoc.id} due to tab close (needsCleanup flag)`);
        } else {
          console.log(`Auto checkout session ${sessionDoc.id} due to inactivity (${Math.floor(timeSinceLastActivity / 1000 / 60)} minutes)`);
        }
      }
    });
    
    if (cleanupPromises.length > 0) {
      await Promise.all(cleanupPromises);
      console.log(`Auto checked out ${cleanupPromises.length} stale sessions`);
    }
    
  } catch (error) {
    // Silently ignore permission errors - this is expected for client-side cleanup
    // The actual cleanup should be done server-side (Cloud Functions) for proper permissions
    if (error instanceof Error && error.message.includes('permission')) {
      // Expected error - client doesn't have permission to update other users' sessions
      return;
    }
    console.error('Error cleaning up stale sessions:', error);
  }
};

const autoCheckoutSession = async (sessionId: string, sessionData: any, timeSinceLastActivity: number): Promise<void> => {
  try {
    // IMPORTANT: Check if already checked out to prevent duplicate checkouts
    if (sessionData.status === 'offline') {
      console.log(`Session ${sessionId} is already checked out. Skipping duplicate cleanup.`);
      return;
    }

    const now = getVietnamTimestamp();
    
    // Handle checkInTime conversion
    let checkInTime: number;
    if (sessionData.checkInTime && typeof sessionData.checkInTime === 'object' && 'seconds' in sessionData.checkInTime) {
      checkInTime = sessionData.checkInTime.seconds * 1000;
    } else if (typeof sessionData.checkInTime === 'number') {
      checkInTime = sessionData.checkInTime;
    } else {
      checkInTime = now;
    }
    
    // Get lastActivityTime
    let lastActivityTime: number;
    if (sessionData.lastActivityTime && typeof sessionData.lastActivityTime === 'object' && 'seconds' in sessionData.lastActivityTime) {
      lastActivityTime = sessionData.lastActivityTime.seconds * 1000;
    } else if (typeof sessionData.lastActivityTime === 'number') {
      lastActivityTime = sessionData.lastActivityTime;
    } else {
      lastActivityTime = checkInTime; // Fallback to checkInTime if no lastActivityTime
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
    const totalBackSoonTime = Math.floor(
      backSoonEvents.reduce((sum: number, event: any) => sum + (event.duration || 0), 0) / 1000
    );
    
    // Calculate total online time (DO NOT count inactive time)
    // Only count from checkInTime to lastActivityTime
    const activeTime = lastActivityTime - checkInTime;
    const totalOnlineTime = Math.max(0, Math.floor((activeTime) / 1000) - totalBackSoonTime);

    const inactiveMinutes = Math.floor(timeSinceLastActivity / 1000 / 60);
    
    // Determine checkout reason
    const checkOutReason = sessionData.needsCleanup
      ? 'User closed tab/browser'
      : `Auto checkout - Inactive for ${inactiveMinutes} minutes (Auto cleanup)`;

    await updateDoc(doc(db, 'sessions', sessionId), {
      status: 'offline',
      checkOutTime: now,
      checkOutReason,
      totalOnlineTime,
      totalBackSoonTime,
      backSoonEvents,
      needsCleanup: false, // Clear the flag
      updatedAt: now,
    });
    
    // Log activity
    const activityMessage = sessionData.needsCleanup
      ? 'User closed tab/browser'
      : `Auto checkout - Inactive for ${inactiveMinutes} minutes`;

    await logActivity(
      sessionData.userId,
      sessionData.username,
      'staff', // userRole
      sessionData.department,
      sessionData.position,
      'check_out',
      activityMessage
    );

    // Create error report for abnormal checkouts
    try {
      await addDoc(collection(db, 'errorReports'), {
        userId: sessionData.userId,
        username: sessionData.username,
        department: sessionData.department,
        position: sessionData.position,
        type: sessionData.needsCleanup ? 'checkout_tab_closed' : 'checkout_auto_inactive',
        attempts: 1,
        timestamp: now,
        status: 'pending',
        description: sessionData.needsCleanup
          ? 'User closed tab/browser without proper checkout'
          : `User was inactive for ${inactiveMinutes} minutes and auto checked out`,
        checkInTime: checkInTime,
        checkOutTime: now,
        totalOnlineTime: totalOnlineTime,
        inactiveMinutes: inactiveMinutes
      });
    } catch (error) {
      console.error(`Error creating error report for session ${sessionId}:`, error);
      // Don't throw - error report creation failure shouldn't block checkout
    }

    console.log(`Session ${sessionId} auto checked out successfully`);
  } catch (error) {
    console.error(`Error auto checking out session ${sessionId}:`, error);
  }
};

// Run cleanup every 30 seconds for faster response
export const startSessionCleanupService = () => {
  console.log('Starting session cleanup service (every 30s)...');
  
  // Run immediately
  cleanupStaleSessions();
  
  // Then run every 30 seconds for faster detection
  setInterval(cleanupStaleSessions, 30 * 1000);
};
