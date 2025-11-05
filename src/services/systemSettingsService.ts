import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface SystemSettings {
  captcha: {
    intervalMinutes: number;
    maxAttempts: number;
    timeoutSeconds: number;
  };
  faceVerification: {
    captchaCountBeforeFace: number;
    similarityThreshold: number;
  };
  antiSpoofing: {
    enabled: boolean;
    confidenceThreshold: number; // 0-1, default 0.55
    sharpnessMin: number; // default 150
    contrastMin: number; // default 40
    colorfulnessMin: number; // default 30
    textureScoreMax: number; // default 0.15
  };
  motionDetection: {
    enabled: boolean;
    motionMin: number; // default 2.0
    motionMax: number; // default 8.0
  };
  general: {
    autoLogoutEnabled: boolean;
    sessionTimeoutHours: number;
  };
  updatedAt: number;
  updatedBy?: string;
}

const SETTINGS_DOC_ID = 'main';

// Default settings (fallback to .env)
export const getDefaultSettings = (): SystemSettings => ({
  captcha: {
    intervalMinutes: parseInt(import.meta.env.VITE_CAPTCHA_INTERVAL_MINUTES || '30'),
    maxAttempts: parseInt(import.meta.env.VITE_CAPTCHA_MAX_ATTEMPTS || '3'),
    timeoutSeconds: parseInt(import.meta.env.VITE_CAPTCHA_TIMEOUT_SECONDS || '180'),
  },
  faceVerification: {
    captchaCountBeforeFace: parseInt(import.meta.env.VITE_CAPTCHA_COUNT_BEFORE_FACE || '3'),
    similarityThreshold: parseFloat(import.meta.env.VITE_FACE_VERIFICATION_SIMILARITY_THRESHOLD || '0.7'),
  },
  antiSpoofing: {
    enabled: true,
    confidenceThreshold: 0.55,
    sharpnessMin: 150,
    contrastMin: 40,
    colorfulnessMin: 30,
    textureScoreMax: 0.15,
  },
  motionDetection: {
    enabled: true,
    motionMin: 2.0,
    motionMax: 8.0,
  },
  general: {
    autoLogoutEnabled: true,
    sessionTimeoutHours: 12,
  },
  updatedAt: Date.now(),
});

// Get current settings
export const getSystemSettings = async (): Promise<SystemSettings> => {
  try {
    const settingsRef = doc(db, 'systemSettings', SETTINGS_DOC_ID);
    const settingsSnap = await getDoc(settingsRef);
    
    if (settingsSnap.exists()) {
      return settingsSnap.data() as SystemSettings;
    } else {
      // Initialize with defaults if not exists
      const defaults = getDefaultSettings();
      await setDoc(settingsRef, defaults);
      return defaults;
    }
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return getDefaultSettings();
  }
};

// Update settings (Admin only)
export const updateSystemSettings = async (
  settings: Partial<SystemSettings>,
  updatedBy: string
): Promise<void> => {
  try {
    const settingsRef = doc(db, 'systemSettings', SETTINGS_DOC_ID);
    
    await setDoc(settingsRef, {
      ...settings,
      updatedAt: Date.now(),
      updatedBy,
    }, { merge: true });
    
  } catch (error) {
    console.error('Error updating system settings:', error);
    throw error;
  }
};

// Listen to settings changes (Realtime)
export const listenToSystemSettings = (
  callback: (settings: SystemSettings) => void
): (() => void) => {
  const settingsRef = doc(db, 'systemSettings', SETTINGS_DOC_ID);
  
  const unsubscribe = onSnapshot(
    settingsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const settings = snapshot.data() as SystemSettings;
        callback(settings);
      } else {
        // Initialize with defaults
        const defaults = getDefaultSettings();
        setDoc(settingsRef, defaults).catch(console.error);
        callback(defaults);
      }
    },
    (error) => {
      console.error('Error listening to system settings:', error);
      callback(getDefaultSettings());
    }
  );
  
  return unsubscribe;
};

