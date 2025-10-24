// Script to clear all test data from Firebase
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc,
  query,
  writeBatch 
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export const clearAllTestData = async () => {
  try {
    console.log('🚀 Starting to clear all test data...');
    
    // Collections to clear
    const collectionsToClear = [
      'activityLogs',
      'sessions', 
      'history',
      'faceVerifications',
      'imageDeleteRequests',
      'notifications',
      'errorReports'
    ];
    
    let totalDeleted = 0;
    
    for (const collectionName of collectionsToClear) {
      try {
        console.log(`📋 Clearing collection: ${collectionName}`);
        
        // Get all documents in the collection
        const snapshot = await getDocs(collection(db, collectionName));
        
        if (snapshot.empty) {
          console.log(`✅ Collection ${collectionName} is already empty`);
          continue;
        }
        
        // Delete in batches to avoid Firebase limits
        const batch = writeBatch(db);
        let batchCount = 0;
        
        snapshot.docs.forEach((docSnapshot) => {
          batch.delete(doc(db, collectionName, docSnapshot.id));
          batchCount++;
          
          // Firebase batch limit is 500 operations
          if (batchCount >= 500) {
            batch.commit();
            batchCount = 0;
          }
        });
        
        // Commit remaining batch
        if (batchCount > 0) {
          await batch.commit();
        }
        
        console.log(`✅ Cleared ${snapshot.docs.length} documents from ${collectionName}`);
        totalDeleted += snapshot.docs.length;
        
      } catch (error) {
        console.error(`❌ Error clearing ${collectionName}:`, error);
      }
    }
    
    console.log(`🎉 Successfully cleared ${totalDeleted} documents from Firebase!`);
    console.log('✨ Your Firebase is now clean and ready for production!');
    
    return totalDeleted;
    
  } catch (error) {
    console.error('❌ Error clearing test data:', error);
    throw error;
  }
};

// Function to clear only activity logs and images
export const clearActivityAndImages = async () => {
  try {
    console.log('🚀 Starting to clear activity logs and images...');
    
    // Collections to clear
    const collectionsToClear = [
      'activityLogs',
      'sessions', 
      'faceVerifications',
      'imageDeleteRequests'
    ];
    
    let totalDeleted = 0;
    
    for (const collectionName of collectionsToClear) {
      try {
        console.log(`📋 Clearing collection: ${collectionName}`);
        
        // Get all documents in the collection
        const snapshot = await getDocs(collection(db, collectionName));
        
        if (snapshot.empty) {
          console.log(`✅ Collection ${collectionName} is already empty`);
          continue;
        }
        
        // Delete in batches
        const batch = writeBatch(db);
        let batchCount = 0;
        
        snapshot.docs.forEach((docSnapshot) => {
          batch.delete(doc(db, collectionName, docSnapshot.id));
          batchCount++;
          
          // Firebase batch limit is 500 operations
          if (batchCount >= 500) {
            batch.commit();
            batchCount = 0;
          }
        });
        
        // Commit remaining batch
        if (batchCount > 0) {
          await batch.commit();
        }
        
        console.log(`✅ Cleared ${snapshot.docs.length} documents from ${collectionName}`);
        totalDeleted += snapshot.docs.length;
        
      } catch (error) {
        console.error(`❌ Error clearing ${collectionName}:`, error);
      }
    }
    
    console.log(`🎉 Successfully cleared ${totalDeleted} documents!`);
    console.log('✨ Activity logs and images are now clean!');
    
    return totalDeleted;
    
  } catch (error) {
    console.error('❌ Error clearing activity and images:', error);
    throw error;
  }
};
