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
import { SettingsIcon, LockIcon, FaceIcon, WarningIcon } from '@/components/icons';

export const SystemSettingsContent: React.FC = () => {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [captchaInterval, setCaptchaInterval] = useState(30);
  const [captchaMaxAttempts, setCaptchaMaxAttempts] = useState(3);
  const [captchaTimeout, setCaptchaTimeout] = useState(180);
  const [faceCheckCount, setFaceCheckCount] = useState(3);
  const [faceSimilarity, setFaceSimilarity] = useState(0.7);
  const [autoLogout, setAutoLogout] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(12);
  
  // Anti-Spoofing state
  const [antiSpoofingEnabled, setAntiSpoofingEnabled] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.55);
  const [sharpnessMin, setSharpnessMin] = useState(150);
  const [contrastMin, setContrastMin] = useState(40);
  const [colorfulnessMin, setColorfulnessMin] = useState(30);
  const [textureScoreMax, setTextureScoreMax] = useState(0.15);
  
  // Motion Detection state
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [motionMin, setMotionMin] = useState(2.0);
  const [motionMax, setMotionMax] = useState(8.0);

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
      
      // Anti-Spoofing settings
      if (newSettings.antiSpoofing) {
        setAntiSpoofingEnabled(newSettings.antiSpoofing.enabled);
        setConfidenceThreshold(newSettings.antiSpoofing.confidenceThreshold);
        setSharpnessMin(newSettings.antiSpoofing.sharpnessMin);
        setContrastMin(newSettings.antiSpoofing.contrastMin);
        setColorfulnessMin(newSettings.antiSpoofing.colorfulnessMin);
        setTextureScoreMax(newSettings.antiSpoofing.textureScoreMax);
      }
      
      // Motion Detection settings
      if (newSettings.motionDetection) {
        setMotionEnabled(newSettings.motionDetection.enabled);
        setMotionMin(newSettings.motionDetection.motionMin);
        setMotionMax(newSettings.motionDetection.motionMax);
      }
      
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
        antiSpoofing: {
          enabled: antiSpoofingEnabled,
          confidenceThreshold,
          sharpnessMin,
          contrastMin,
          colorfulnessMin,
          textureScoreMax,
        },
        motionDetection: {
          enabled: motionEnabled,
          motionMin,
          motionMax,
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
    
    if (settings.antiSpoofing) {
      setAntiSpoofingEnabled(settings.antiSpoofing.enabled);
      setConfidenceThreshold(settings.antiSpoofing.confidenceThreshold);
      setSharpnessMin(settings.antiSpoofing.sharpnessMin);
      setContrastMin(settings.antiSpoofing.contrastMin);
      setColorfulnessMin(settings.antiSpoofing.colorfulnessMin);
      setTextureScoreMax(settings.antiSpoofing.textureScoreMax);
    }
    
    if (settings.motionDetection) {
      setMotionEnabled(settings.motionDetection.enabled);
      setMotionMin(settings.motionDetection.motionMin);
      setMotionMax(settings.motionDetection.motionMax);
    }
    
    toast.success('Restored to default values');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          Adjust system parameters - Changes will be synchronized in realtime to all clients
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

        {/* Anti-Spoofing Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-dark-800 rounded-xl p-6 border border-dark-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <svg className="w-6 h-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Anti-Spoofing
            </h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-gray-400">Enabled</span>
              <input
                type="checkbox"
                checked={antiSpoofingEnabled}
                onChange={(e) => setAntiSpoofingEnabled(e.target.checked)}
                className="w-5 h-5 text-primary-500 bg-dark-700 border-dark-600 rounded focus:ring-primary-500"
              />
            </label>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confidence Threshold (0-1)
              </label>
              <input
                type="number"
                min="0.1"
                max="1"
                step="0.05"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value) || 0.55)}
                disabled={!antiSpoofingEnabled}
                className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              />
              <p className="text-xs text-gray-400 mt-1">
                Overall confidence threshold (recommended: 0.55). Low = easier to pass, High = harder to pass
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Min Sharpness
                </label>
                <input
                  type="number"
                  min="50"
                  max="300"
                  step="10"
                  value={sharpnessMin}
                  onChange={(e) => setSharpnessMin(parseInt(e.target.value) || 150)}
                  disabled={!antiSpoofingEnabled}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                />
                <p className="text-xs text-gray-400 mt-1">Recommended: 150</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Min Contrast
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  step="5"
                  value={contrastMin}
                  onChange={(e) => setContrastMin(parseInt(e.target.value) || 40)}
                  disabled={!antiSpoofingEnabled}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                />
                <p className="text-xs text-gray-400 mt-1">Recommended: 40</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Min Colorfulness
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  step="5"
                  value={colorfulnessMin}
                  onChange={(e) => setColorfulnessMin(parseInt(e.target.value) || 30)}
                  disabled={!antiSpoofingEnabled}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                />
                <p className="text-xs text-gray-400 mt-1">Recommended: 30</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Texture Score
                </label>
                <input
                  type="number"
                  min="0.01"
                  max="0.5"
                  step="0.01"
                  value={textureScoreMax}
                  onChange={(e) => setTextureScoreMax(parseFloat(e.target.value) || 0.15)}
                  disabled={!antiSpoofingEnabled}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                />
                <p className="text-xs text-gray-400 mt-1">Recommended: 0.15</p>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-400">
                <strong>Explanation:</strong> Anti-Spoofing detects fake images from phone/screen by analyzing sharpness, contrast, color, and interference patterns.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Motion Detection Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-dark-800 rounded-xl p-6 border border-dark-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <svg className="w-6 h-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Motion Detection
            </h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-gray-400">Enabled</span>
              <input
                type="checkbox"
                checked={motionEnabled}
                onChange={(e) => setMotionEnabled(e.target.checked)}
                className="w-5 h-5 text-primary-500 bg-dark-700 border-dark-600 rounded focus:ring-primary-500"
              />
            </label>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Motion Min (Natural)
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={motionMin}
                  onChange={(e) => setMotionMin(parseFloat(e.target.value) || 2.0)}
                  disabled={!motionEnabled}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                />
                <p className="text-xs text-gray-400 mt-1">Recommended: 2.0</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Motion Max (Natural)
                </label>
                <input
                  type="number"
                  min="5"
                  max="20"
                  step="0.5"
                  value={motionMax}
                  onChange={(e) => setMotionMax(parseFloat(e.target.value) || 8.0)}
                  disabled={!motionEnabled}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                />
                <p className="text-xs text-gray-400 mt-1">Recommended: 8.0</p>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-400">
                <strong>Explanation:</strong> Motion Detection detects natural motion of real face vs static image/video. Range {motionMin}-{motionMax} is natural motion.
              </p>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <WarningIcon className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-400">
                  <p><strong>Note:</strong></p>
                  <ul className="list-disc ml-4 mt-1 space-y-1">
                    <li>Motion &lt; {motionMin}: Static image/photo on screen</li>
                    <li>Motion &gt; {motionMax}: Too much movement/video playback</li>
                    <li>Adjust carefully to avoid rejecting real people!</li>
                  </ul>
                </div>
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
          loading={saving}
          size="lg"
        >
          Save Settings
        </Button>
      </motion.div>
    </div>
  );
};

