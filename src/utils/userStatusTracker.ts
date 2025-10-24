import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

let heartbeatInterval: NodeJS.Timeout | null = null;
let currentUserId: string | null = null;

export const startUserStatusTracking = (userId: string) => {
  // Clear any existing interval
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  
  currentUserId = userId;
  
  // Update status to online immediately
  updateUserStatus(userId, 'online');
  
  // Set up heartbeat every 10 seconds (reduced frequency)
  heartbeatInterval = setInterval(async () => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        lastActivityAt: Date.now(),
        status: 'online'
      });
      console.log(`Heartbeat updated for user ${userId}`);
    } catch (error) {
      console.error('Error updating user heartbeat:', error);
    }
  }, 10000); // 10 seconds

  // Add beforeunload listener
  const handleBeforeUnload = async () => {
    if (currentUserId) {
      try {
        await updateDoc(doc(db, 'users', currentUserId), {
          status: 'offline',
          lastLogoutAt: Date.now()
        });
      } catch (error) {
        console.error('Error updating status on browser close:', error);
      }
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  // Add visibility change listener
  const handleVisibilityChange = async () => {
    if (!currentUserId) return;
    
    if (document.visibilityState === 'hidden') {
      try {
        await updateDoc(doc(db, 'users', currentUserId), {
          status: 'offline',
          lastLogoutAt: Date.now()
        });
      } catch (error) {
        console.error('Error updating status on tab hide:', error);
      }
    } else if (document.visibilityState === 'visible') {
      try {
        await updateDoc(doc(db, 'users', currentUserId), {
          status: 'online',
          lastActivityAt: Date.now()
        });
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
  
  currentUserId = null;
  
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
