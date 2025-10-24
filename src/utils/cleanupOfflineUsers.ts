import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';

// Clean up users who haven't been active for more than 30 seconds
const INACTIVITY_THRESHOLD = 30 * 1000; // 30 seconds in milliseconds

export const cleanupOfflineUsers = async () => {
  try {
    const now = Date.now();
    const usersRef = collection(db, 'users');
    
    // Get all users who are currently online
    const onlineUsersQuery = query(usersRef, where('status', '==', 'online'));
    const snapshot = await getDocs(onlineUsersQuery);
    
    const cleanupPromises: Promise<void>[] = [];
    
    snapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      const lastActivityAt = userData.lastActivityAt || userData.lastLoginAt;
      
      // If user hasn't been active for more than threshold, set to offline
      if (lastActivityAt && (now - lastActivityAt) > INACTIVITY_THRESHOLD) {
        const updatePromise = updateDoc(doc(db, 'users', userDoc.id), {
          status: 'offline',
          lastLogoutAt: now
        });
        cleanupPromises.push(updatePromise);
        
        console.log(`Setting user ${userData.username} to offline due to inactivity`);
      }
    });
    
    if (cleanupPromises.length > 0) {
      await Promise.all(cleanupPromises);
      console.log(`Cleaned up ${cleanupPromises.length} inactive users`);
    }
    
  } catch (error) {
    console.error('Error cleaning up offline users:', error);
  }
};

// Run cleanup every 10 seconds
export const startCleanupService = () => {
  // Run immediately
  cleanupOfflineUsers();
  
  // Then run every 10 seconds
  setInterval(cleanupOfflineUsers, 10 * 1000);
};
