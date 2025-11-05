import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import { 
  getSystemSettings, 
  updateSystemSettings, 
  listenToSystemSettings,
  SystemSettings 
} from '@/services/systemSettingsService';
import toast from 'react-hot-toast';
import { SettingsIcon, LockIcon, FaceIcon, InfoIcon, WarningIcon } from '@/components/icons';

export const SystemSettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [captchaInterval, setCaptchaInterval] = useState(30);
  const [captchaMaxAttempts, setCaptchaMaxAttempts] = useState(3);
  const [captchaTimeout, setCaptchaTimeout] = useState(180);
  const [faceCheckCount, setFaceCheckCount] = useState(3);
  const [faceSimilarity, setFaceSimilarity] = useState(0.7); // Increased from 0.6 to 0.7
  const [autoLogout, setAutoLogout] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(12);

  // Listen to realtime settings
  useEffect(() => {
    const unsubscribe = listenToSystemSettings((newSettings) => {
      setSettings(newSettings);
      
      // Update form state
      setCaptchaInterval(newSettings.captcha.intervalMinutes);
      setCaptchaMaxAttempts(newSettings.captcha.maxAttempts);
      setCaptchaTimeout(newSettings.captcha.timeoutSeconds);
      setFaceCheckCount(newSettings.faceVerification.captchaCountBeforeFace);
      setFaceSimilarity(newSettings.faceVerification.similarityThreshold);
      setAutoLogout(newSettings.general.autoLogoutEnabled);
      setSessionTimeout(newSettings.general.sessionTimeoutHours);
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const newSettings: Partial<SystemSettings> = {
        captcha: {
          intervalMinutes: captchaInterval,
          maxAttempts: captchaMaxAttempts,
          timeoutSeconds: captchaTimeout,
        },
        faceVerification: {
          captchaCountBeforeFace: faceCheckCount,
          similarityThreshold: faceSimilarity,
        },
        general: {
          autoLogoutEnabled: autoLogout,
          sessionTimeoutHours: sessionTimeout,
        },
      };

      await updateSystemSettings(newSettings, user.username);
      toast.success('Settings saved and synced to all clients!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Unable to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!settings) return;
    
    setCaptchaInterval(settings.captcha.intervalMinutes);
    setCaptchaMaxAttempts(settings.captcha.maxAttempts);
    setCaptchaTimeout(settings.captcha.timeoutSeconds);
    setFaceCheckCount(settings.faceVerification.captchaCountBeforeFace);
    setFaceSimilarity(settings.faceVerification.similarityThreshold);
    setAutoLogout(settings.general.autoLogoutEnabled);
    setSessionTimeout(settings.general.sessionTimeoutHours);
    
    toast.success('Restored to default values');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white">
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-8 h-8 text-primary-500" />
            <h1 className="text-4xl font-bold">System Settings</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Adjust system parameters - Changes will be synced in realtime to all clients
          </p>
        </motion.div>

        {settings && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-800 rounded-xl p-6 mb-6"
          >
            <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
              <span>
                Last updated: {new Date(settings.updatedAt).toLocaleString('en-US')}
              </span>
              {settings.updatedBy && (
                <span>By: {settings.updatedBy}</span>
              )}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CAPTCHA Settings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-dark-800 rounded-xl p-6 border border-dark-700"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <LockIcon className="w-6 h-6 text-primary-500" />
              CAPTCHA Settings
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CAPTCHA Interval (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={captchaInterval}
                  onChange={(e) => setCaptchaInterval(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Interval between CAPTCHA requests (recommended: 30 minutes, test: 1 minute)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Attempts
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={captchaMaxAttempts}
                  onChange={(e) => setCaptchaMaxAttempts(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Maximum incorrect attempts before auto check out
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Timeout (seconds)
                </label>
                <input
                  type="number"
                  min="30"
                  max="600"
                  value={captchaTimeout}
                  onChange={(e) => setCaptchaTimeout(parseInt(e.target.value) || 30)}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Maximum time to complete CAPTCHA (recommended: 180s = 3 minutes)
                </p>
              </div>
            </div>
          </motion.div>

          {/* Face Verification Settings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-dark-800 rounded-xl p-6 border border-dark-700"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FaceIcon className="w-6 h-6 text-primary-500" />
              Face Verification Settings
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CAPTCHA Count Before Face Check
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={faceCheckCount}
                  onChange={(e) => setFaceCheckCount(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  After how many successful CAPTCHAs to require Face Verification (recommended: 3-5)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Face Similarity Threshold
                </label>
                <input
                  type="number"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={faceSimilarity}
                  onChange={(e) => setFaceSimilarity(parseFloat(e.target.value) || 0.6)}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Face similarity threshold (0-1). Low = easier to pass, High = harder to pass (recommended: 0.7)
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <WarningIcon className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-400">
                    <strong>Note:</strong> Too high threshold may cause false negatives (rejecting correct person). 
                    Test thoroughly before applying.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* General Settings - Hidden section with state management */}
          <div className="hidden">
            <input
              type="checkbox"
              checked={autoLogout}
              onChange={(e) => setAutoLogout(e.target.checked)}
            />
            <input
              type="number"
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex gap-4 justify-end"
        >
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={saving}
            size="lg"
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="min-w-[200px]"
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              'Save & Sync'
            )}
          </Button>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
            <InfoIcon className="w-5 h-5" />
            About Realtime Sync
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• All changes will be saved to Firebase and synced in realtime to all clients</li>
            <li>• Online employees will receive new settings immediately</li>
            <li>• No need to restart server or refresh browser</li>
            <li>• Change history is recorded (who changed + when)</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

