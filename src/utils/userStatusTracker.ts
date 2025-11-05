import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { checkOutSession } from '@/services/sessionService';

let heartbeatInterval: NodeJS.Timeout | null = null;
let currentUserId: string | null = null;
let currentSessionId: string | null = null;
let visibilityHiddenTime: number | null = null;
let tabHiddenCheckoutTimer: NodeJS.Timeout | null = null;

// Heartbeat only runs when tab is visible
const HEARTBEAT_INTERVAL = 15000; // 15 seconds when visible
const TAB_HIDDEN_CHECKOUT_TIMEOUT = 30000; // Auto checkout after 30 seconds of tab hidden

export const startUserStatusTracking = (userId: string, sessionId?: string) => {
  // Clear any existing interval
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  
  if (tabHiddenCheckoutTimer) {
    clearTimeout(tabHiddenCheckoutTimer);
  }
  
  currentUserId = userId;
  currentSessionId = sessionId || null;
  
  // Update status to online immediately
  updateUserStatus(userId, 'online');
  
  // Start heartbeat only if tab is visible
  const startHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
    
    heartbeatInterval = setInterval(async () => {
      // Only heartbeat if tab is visible
      if (document.visibilityState === 'visible' && currentUserId) {
        try {
          const now = Date.now();
          await updateDoc(doc(db, 'users', currentUserId), {
            lastActivityAt: now,
            status: 'online'
          });
          
          // Also update session lastActivityTime
          if (currentSessionId) {
            await updateDoc(doc(db, 'sessions', currentSessionId), {
              lastActivityTime: now
            });
          }
          
          console.log(`Heartbeat updated for user ${currentUserId}`);
        } catch (error) {
          console.error('Error updating user heartbeat:', error);
        }
      }
    }, HEARTBEAT_INTERVAL);
  };
  
  // Stop heartbeat when tab is hidden
  const stopHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  };
  
  // Start heartbeat if currently visible
  if (document.visibilityState === 'visible') {
    startHeartbeat();
  }

  // Add beforeunload listener - mark session for cleanup
  const handleBeforeUnload = () => {
    if (currentUserId) {
      try {
        // Mark last activity as very old so cleanup service picks it up immediately
        const veryOldTime = Date.now() - (10 * 60 * 1000); // 10 minutes ago
        
        // Use synchronous operation to ensure it runs before page closes
        navigator.sendBeacon && navigator.sendBeacon('/api/logout', JSON.stringify({ 
          userId: currentUserId, 
          sessionId: currentSessionId 
        }));
        
        // Also try direct update (may not complete but worth trying)
        if (currentSessionId) {
          updateDoc(doc(db, 'sessions', currentSessionId), {
            lastActivityTime: veryOldTime
          }).catch(() => {
            // Ignore errors - cleanup service will handle it
          });
        }
        
        updateDoc(doc(db, 'users', currentUserId), {
          status: 'offline',
          lastActivityAt: veryOldTime,
          lastLogoutAt: Date.now()
        }).catch(() => {
          // Ignore errors - cleanup service will handle it
        });
      } catch (error) {
        console.error('Error in beforeunload:', error);
      }
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  // Add visibility change listener - improved handling
  const handleVisibilityChange = async () => {
    if (!currentUserId) return;
    
    if (document.visibilityState === 'hidden') {
      // Tab is hidden - stop heartbeat and set offline after timeout
      stopHeartbeat();
      visibilityHiddenTime = Date.now();
      
      // Set user status to offline immediately when tab is hidden
      try {
        await updateDoc(doc(db, 'users', currentUserId), {
          status: 'offline',
          lastLogoutAt: Date.now()
        });
      } catch (error) {
        console.error('Error updating status on tab hide:', error);
      }
      
      // Auto checkout session after timeout if tab stays hidden
      if (tabHiddenCheckoutTimer) {
        clearTimeout(tabHiddenCheckoutTimer);
      }
      
      tabHiddenCheckoutTimer = setTimeout(async () => {
        if (currentSessionId && currentUserId && document.visibilityState === 'hidden') {
          try {
            // Check if session is still active before checking out
            const { getDoc } = await import('firebase/firestore');
            const sessionDoc = await getDoc(doc(db, 'sessions', currentSessionId));
            
            if (sessionDoc.exists() && sessionDoc.data()?.status !== 'offline') {
              const { getCurrentUser } = await import('@/services/auth');
              const user = await getCurrentUser(currentUserId);
              if (user) {
                await checkOutSession(currentSessionId, 'Tab hidden for 30+ seconds', user);
                console.log('Auto checked out session due to tab hidden for 30+ seconds');
              }
            } else {
              console.log(`Session ${currentSessionId} already checked out. Skipping tab hidden checkout.`);
            }
          } catch (error) {
            console.error('Error auto checking out session:', error);
          }
        }
      }, TAB_HIDDEN_CHECKOUT_TIMEOUT);
      
    } else if (document.visibilityState === 'visible') {
      // Tab is visible again - resume heartbeat and set online
      if (tabHiddenCheckoutTimer) {
        clearTimeout(tabHiddenCheckoutTimer);
        tabHiddenCheckoutTimer = null;
      }
      
      visibilityHiddenTime = null;
      startHeartbeat();
      
      try {
        await updateDoc(doc(db, 'users', currentUserId), {
          status: 'online',
          lastActivityAt: Date.now()
        });
        
        // Also update session lastActivityTime
        if (currentSessionId) {
          await updateDoc(doc(db, 'sessions', currentSessionId), {
            lastActivityTime: Date.now()
          });
        }
      } catch (error) {
        console.error('Error updating status on tab show:', error);
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
  
  if (tabHiddenCheckoutTimer) {
    clearTimeout(tabHiddenCheckoutTimer);
    tabHiddenCheckoutTimer = null;
  }
  
  currentUserId = null;
  currentSessionId = null;
  visibilityHiddenTime = null;
  
  // Update status to offline
  await updateUserStatus(userId, 'offline');
};

export const updateUserStatus = async (userId: string, status: 'online' | 'offline' | 'back_soon') => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      status,
      lastActivityAt: Date.now(),
      ...(status === 'offline' && { lastLogoutAt: Date.now() })
    });
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};
