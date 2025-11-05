// Script to clear all test data from Firebase
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc,
  query,
  writeBatch,
  getDoc
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
      'errorReports',
      'forgotPasswordRequests'
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
        const docs = snapshot.docs;
        const batchSize = 500; // Firebase batch limit
        let processedCount = 0;
        
        for (let i = 0; i < docs.length; i += batchSize) {
          const batch = writeBatch(db);
          const batchDocs = docs.slice(i, Math.min(i + batchSize, docs.length));
          
          batchDocs.forEach((docSnapshot) => {
            batch.delete(doc(db, collectionName, docSnapshot.id));
          });
          
          await batch.commit();
          processedCount += batchDocs.length;
        }
        
        console.log(`✅ Cleared ${snapshot.docs.length} documents from ${collectionName}`);
        totalDeleted += snapshot.docs.length;
        
      } catch (error) {
        console.error(`❌ Error clearing ${collectionName}:`, error);
      }
    }
    
    // Delete Terms and Conditions document from systemSettings
    try {
      console.log('📋 Clearing Terms and Conditions...');
      const termsDocRef = doc(db, 'systemSettings', 'termsAndConditions');
      const termsDocSnap = await getDoc(termsDocRef);
      
      if (termsDocSnap.exists()) {
        await deleteDoc(termsDocRef);
        console.log('✅ Cleared Terms and Conditions document');
        totalDeleted++;
      } else {
        console.log('✅ Terms and Conditions document does not exist');
      }
    } catch (error) {
      console.error('❌ Error clearing Terms and Conditions:', error);
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
        const docs = snapshot.docs;
        const batchSize = 500; // Firebase batch limit
        let processedCount = 0;
        
        for (let i = 0; i < docs.length; i += batchSize) {
          const batch = writeBatch(db);
          const batchDocs = docs.slice(i, Math.min(i + batchSize, docs.length));
          
          batchDocs.forEach((docSnapshot) => {
            batch.delete(doc(db, collectionName, docSnapshot.id));
          });
          
          await batch.commit();
          processedCount += batchDocs.length;
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
