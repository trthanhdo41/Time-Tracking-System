import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { checkOutSession } from '@/services/sessionService';
import { getVietnamTimestamp } from '@/utils/time';

// Throttle activity updates to avoid lag (only update every 30 seconds max)
const ACTIVITY_UPDATE_THROTTLE = 30000; // 30 seconds
let lastActivityUpdate = 0;
let activityPending = false;

// Track if user is actively interacting (mouse/keyboard events)
let lastActivityTime = getVietnamTimestamp(); // Use Vietnam timestamp for consistency
let currentActivityTracking: (() => void) | null = null;

/**
 * Update last activity time when user interacts (throttled to avoid lag)
 */
const updateActivityThrottled = async (userId: string, sessionId?: string) => {
  const now = getVietnamTimestamp(); // Use Vietnam timestamp for consistency

  // Update local lastActivityTime immediately (no lag)
  lastActivityTime = now;

  // Only update Firestore if throttle period has passed
  if (now - lastActivityUpdate < ACTIVITY_UPDATE_THROTTLE) {
    return; // Skip update if within throttle period
  }

  // Prevent concurrent updates
  if (activityPending) {
    return;
  }

  activityPending = true;
  lastActivityUpdate = now;

  try {
    // Update user lastActivityAt with Vietnam timestamp
    await updateDoc(doc(db, 'users', userId), {
      lastActivityAt: now
    });

    // Update session lastActivityTime if session exists
    if (sessionId) {
      await updateDoc(doc(db, 'sessions', sessionId), {
        lastActivityTime: now
      });
    }
  } catch (error) {
    console.error('Error updating activity:', error);
  } finally {
    activityPending = false;
  }
};

/**
 * Handle activity events (mouse, keyboard, touch)
 */
const handleActivity = (userId: string, sessionId?: string) => {
  // Update immediately (no lag - just local variable)
  updateActivityThrottled(userId, sessionId);
};

/**
 * Detect if user is active on the system (even in other apps)
 * This uses Page Visibility API + focus events to detect system-level activity
 */
const detectSystemActivity = (userId: string, sessionId?: string) => {
  // When page becomes visible again, it means user returned to this tab
  // This indicates they were active on the system (even if in other apps)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // User returned to this tab - they were active on system
      updateActivityThrottled(userId, sessionId);
    }
  };

  // When window gains focus, user is active
  const handleFocus = () => {
    updateActivityThrottled(userId, sessionId);
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleFocus);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleFocus);
  };
};

/**
 * Start tracking user activity (mouse/keyboard/touch events)
 * This uses throttling to prevent lag - only updates Firestore every 30 seconds max
 */
export const startActivityTracking = (userId: string, sessionId?: string) => {
  // Stop existing tracking if any
  if (currentActivityTracking) {
    currentActivityTracking();
    currentActivityTracking = null;
  }

  lastActivityTime = getVietnamTimestamp();
  lastActivityUpdate = getVietnamTimestamp();

  // Track mouse movements (throttled internally)
  const handleMouseMove = () => handleActivity(userId, sessionId);
  const handleClick = () => handleActivity(userId, sessionId);
  const handleKeyPress = () => handleActivity(userId, sessionId);
  const handleTouchStart = () => handleActivity(userId, sessionId);
  const handleScroll = () => handleActivity(userId, sessionId);

  // Attach listeners with passive: true for better performance
  window.addEventListener('mousemove', handleMouseMove, { passive: true });
  window.addEventListener('click', handleClick, { passive: true });
  window.addEventListener('keydown', handleKeyPress, { passive: true });
  window.addEventListener('touchstart', handleTouchStart, { passive: true });
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Also track system-level activity (when user returns to tab)
  const cleanupSystemActivity = detectSystemActivity(userId, sessionId);

  // Store cleanup function
  const cleanup = () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('click', handleClick);
    window.removeEventListener('keydown', handleKeyPress);
    window.removeEventListener('touchstart', handleTouchStart);
    window.removeEventListener('scroll', handleScroll);
    cleanupSystemActivity(); // Clean up system activity listeners

    if (currentActivityTracking === cleanup) {
      currentActivityTracking = null;
    }
  };

  currentActivityTracking = cleanup;
  return cleanup;
};

/**
 * Get last activity time (for checking inactivity)
 */
export const getLastActivityTime = (): number => {
  return lastActivityTime;
};

