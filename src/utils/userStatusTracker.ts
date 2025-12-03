import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { getVietnamTimestamp } from '@/utils/time';

let heartbeatInterval: NodeJS.Timeout | null = null;
let currentUserId: string | null = null;
let currentSessionId: string | null = null;

// Heartbeat intervals
const HEARTBEAT_INTERVAL_VISIBLE = 15000; // 15 seconds when tab is visible
const HEARTBEAT_INTERVAL_HIDDEN = 60000; // 60 seconds when tab is hidden (keep alive)

export const startUserStatusTracking = (userId: string, sessionId?: string) => {
  // Clear any existing interval
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  currentUserId = userId;
  currentSessionId = sessionId || null;

  // Only update status to online if user has an active session (checked in)
  if (sessionId) {
    updateUserStatus(userId, 'online');
  }
  
  // Start heartbeat - works for both visible and hidden tabs
  const startHeartbeat = (isVisible: boolean = true) => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }

    // Use different intervals based on visibility
    const interval = isVisible ? HEARTBEAT_INTERVAL_VISIBLE : HEARTBEAT_INTERVAL_HIDDEN;

    heartbeatInterval = setInterval(async () => {
      // Heartbeat runs even when tab is hidden to prevent auto checkout
      if (currentUserId && currentSessionId) {
        try {
          const now = getVietnamTimestamp();
          await updateDoc(doc(db, 'users', currentUserId), {
            lastActivityAt: now,
            status: 'online'
          });

          // Also update session lastActivityTime
          await updateDoc(doc(db, 'sessions', currentSessionId), {
            lastActivityTime: now
          });

          const visibility = document.visibilityState === 'visible' ? 'visible' : 'hidden';
          console.log(`Heartbeat updated for user ${currentUserId} (tab ${visibility})`);
        } catch (error) {
          console.error('Error updating user heartbeat:', error);
        }
      }
    }, interval);
  };
  
  // Stop heartbeat when tab is hidden
  const stopHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  };
  
  // Start heartbeat based on current visibility state
  const isVisible = document.visibilityState === 'visible';
  startHeartbeat(isVisible);

  // Add beforeunload listener - IMMEDIATE checkout on tab close/refresh
  const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
    if (currentUserId && currentSessionId) {
      try {
        const now = getVietnamTimestamp();

        // IMMEDIATE CHECKOUT - Use synchronous Firestore write
        // This ensures checkout happens before page closes
        const { checkOutSession } = await import('@/services/sessionService');
        const { getDoc } = await import('firebase/firestore');

        // Get user data for checkout
        const userDoc = await getDoc(doc(db, 'users', currentUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data();

          // Perform immediate checkout
          await checkOutSession(
            currentSessionId,
            'Browser closed/refreshed - Auto checkout',
            userData as any
          );
        }

        // Fallback: Use sendBeacon for reliability
        navigator.sendBeacon && navigator.sendBeacon('/api/logout', JSON.stringify({
          userId: currentUserId,
          sessionId: currentSessionId,
          timestamp: now
        }));

      } catch (error) {
        console.error('Error in beforeunload checkout:', error);

        // Fallback: Mark for cleanup if immediate checkout fails
        if (currentSessionId) {
          updateDoc(doc(db, 'sessions', currentSessionId), {
            lastActivityTime: getVietnamTimestamp(),
            needsCleanup: true,
            status: 'offline'
          }).catch(() => {});
        }
      }
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  // Add visibility change listener - adjust heartbeat interval based on visibility
  const handleVisibilityChange = async () => {
    if (!currentUserId) return;

    if (document.visibilityState === 'hidden') {
      // Tab is hidden - switch to slower heartbeat (60s) to keep session alive
      // DO NOT stop heartbeat completely - this prevents auto checkout
      console.log('Tab hidden - switching to slower heartbeat (60s)');
      startHeartbeat(false); // false = hidden mode with 60s interval

    } else if (document.visibilityState === 'visible') {
      // Tab is visible again - switch to faster heartbeat (15s)
      console.log('Tab visible - switching to faster heartbeat (15s)');
      startHeartbeat(true); // true = visible mode with 15s interval

      // Update lastActivityTime immediately when tab becomes visible again
      if (currentSessionId) {
        try {
          const now = getVietnamTimestamp();

          // Update user activity
          await updateDoc(doc(db, 'users', currentUserId), {
            lastActivityAt: now,
            status: 'online'
          });

          // Update session activity
          await updateDoc(doc(db, 'sessions', currentSessionId), {
            lastActivityTime: now
          });
        } catch (error) {
          console.error('Error updating activity on tab show:', error);
        }
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
};

export const stopUserStatusTracking = async (userId: string) => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  currentUserId = null;
  currentSessionId = null;

  // Update status to offline
  await updateUserStatus(userId, 'offline');
};

export const updateUserStatus = async (userId: string, status: 'online' | 'offline' | 'back_soon') => {
  try {
    const now = getVietnamTimestamp();
    await updateDoc(doc(db, 'users', userId), {
      status,
      lastActivityAt: now,
      ...(status === 'offline' && { lastLogoutAt: now })
    });
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};
