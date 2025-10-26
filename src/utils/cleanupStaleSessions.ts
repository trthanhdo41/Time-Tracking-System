import { collection, getDocs, updateDoc, doc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Session } from '@/types';
import { logActivity } from '@/services/activityLog';

// Clean up sessions that have been inactive for more than X minutes
const SESSION_INACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

export const cleanupStaleSessions = async () => {
  try {
    const now = Date.now();
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
      
      // If session has been inactive for more than threshold, auto checkout
      if (timeSinceLastActivity > SESSION_INACTIVITY_THRESHOLD) {
        const updatePromise = autoCheckoutSession(sessionDoc.id, sessionData, timeSinceLastActivity);
        cleanupPromises.push(updatePromise);
        
        console.log(`Auto checkout session ${sessionDoc.id} due to inactivity (${Math.floor(timeSinceLastActivity / 1000 / 60)} minutes)`);
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
    const now = Date.now();
    
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
    
    await updateDoc(doc(db, 'sessions', sessionId), {
      status: 'offline',
      checkOutTime: now,
      checkOutReason: `Tự động checkout - Không hoạt động ${inactiveMinutes} phút (Auto cleanup)`,
      totalOnlineTime,
      totalBackSoonTime,
      backSoonEvents,
      updatedAt: now,
    });
    
    // Log activity
    await logActivity(
      sessionData.userId,
      sessionData.username,
      'staff', // userRole
      sessionData.department,
      sessionData.position,
      'check_out',
      `Tự động checkout - Không hoạt động ${inactiveMinutes} phút`
    );

    console.log(`Session ${sessionId} auto checked out successfully`);
  } catch (error) {
    console.error(`Error auto checking out session ${sessionId}:`, error);
  }
};

// Run cleanup every 2 minutes for faster response
export const startSessionCleanupService = () => {
  console.log('Starting session cleanup service...');
  
  // Run immediately
  cleanupStaleSessions();
  
  // Then run every 2 minutes for faster detection
  setInterval(cleanupStaleSessions, 2 * 60 * 1000);
};
