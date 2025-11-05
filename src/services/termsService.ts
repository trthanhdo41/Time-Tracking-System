// Terms and Conditions service
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

const TERMS_DOC_ID = 'termsAndConditions';

export interface TermsAndConditions {
  id: string;
  content: string;
  version: number;
  updatedAt: number;
  updatedBy: string;
}

/**
 * Get current Terms and Conditions
 */
export const getTermsAndConditions = async (): Promise<TermsAndConditions | null> => {
  try {
    const termsRef = doc(db, 'systemSettings', TERMS_DOC_ID);
    const termsSnap = await getDoc(termsRef);
    
    if (termsSnap.exists()) {
      const data = termsSnap.data();
      return {
        id: termsSnap.id,
        content: data.content || '',
        version: data.version || 1,
        updatedAt: data.updatedAt?.toMillis() || Date.now(),
        updatedBy: data.updatedBy || 'system',
      };
    }
    
    // Return default if not exists
    return {
      id: TERMS_DOC_ID,
      content: 'Welcome to Enterprise Time Tracking System. By using this system, you agree to comply with all company policies and guidelines.',
      version: 1,
      updatedAt: Date.now(),
      updatedBy: 'system',
    };
  } catch (error) {
    console.error('Error fetching Terms and Conditions:', error);
    return null;
  }
};

/**
 * Update Terms and Conditions (Admin only)
 */
export const updateTermsAndConditions = async (
  content: string,
  updatedBy: string
): Promise<void> => {
  try {
    const termsRef = doc(db, 'systemSettings', TERMS_DOC_ID);
    const termsSnap = await getDoc(termsRef);
    
    const currentVersion = termsSnap.exists() ? (termsSnap.data().version || 1) : 1;
    
    await setDoc(termsRef, {
      content,
      version: currentVersion + 1,
      updatedAt: serverTimestamp(),
      updatedBy,
    }, { merge: true });
  } catch (error: any) {
    console.error('Error updating Terms and Conditions:', error);
    throw new Error(error.message || 'Unable to update Terms and Conditions');
  }
};

