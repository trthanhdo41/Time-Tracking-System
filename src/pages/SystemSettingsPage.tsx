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
import { SettingsIcon } from '@/components/icons';

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
  const [faceSimilarity, setFaceSimilarity] = useState(0.6);
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
      toast.success('Cài đặt đã được lưu và đồng bộ đến tất cả client!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Không thể lưu cài đặt');
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
    
    toast.info('Đã khôi phục giá trị ban đầu');
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
            <h1 className="text-4xl font-bold">Cài Đặt Hệ Thống</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Điều chỉnh các thông số hệ thống - Thay đổi sẽ được đồng bộ realtime đến tất cả client
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
                Cập nhật lần cuối: {new Date(settings.updatedAt).toLocaleString('vi-VN')}
              </span>
              {settings.updatedBy && (
                <span>Bởi: {settings.updatedBy}</span>
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
              🔐 CAPTCHA Settings
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CAPTCHA Interval (phút)
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
                  Khoảng thời gian giữa các lần yêu cầu CAPTCHA (khuyến nghị: 30 phút, test: 1 phút)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Attempts (lần)
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
                  Số lần nhập sai tối đa trước khi auto check out
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Timeout (giây)
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
                  Thời gian tối đa để hoàn thành CAPTCHA (khuyến nghị: 180s = 3 phút)
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
              👤 Face Verification Settings
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
                  Sau bao nhiêu lần CAPTCHA thành công thì yêu cầu Face Verification (khuyến nghị: 3-5)
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
                  Ngưỡng tương đồng khuôn mặt (0-1). Thấp = dễ pass, Cao = khó pass (khuyến nghị: 0.6)
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-sm text-yellow-400">
                  ⚠️ <strong>Lưu ý:</strong> Threshold quá cao có thể gây false negative (từ chối người đúng). 
                  Nên test kỹ trước khi áp dụng.
                </p>
              </div>
            </div>
          </motion.div>

          {/* General Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-800 rounded-xl p-6 border border-dark-700 lg:col-span-2"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              ⚙️ General Settings
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoLogout}
                    onChange={(e) => setAutoLogout(e.target.checked)}
                    className="w-5 h-5 text-primary-500 bg-dark-700 border-dark-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Tự động logout khi hết session
                  </span>
                </label>
                <p className="text-xs text-gray-400 mt-2 ml-8">
                  Tự động check out nhân viên khi vượt quá thời gian session
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Session Timeout (giờ)
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={!autoLogout}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Thời gian tối đa của 1 session làm việc (khuyến nghị: 12 giờ)
                </p>
              </div>
            </div>
          </motion.div>
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
            Khôi Phục
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
                Đang lưu...
              </>
            ) : (
              '💾 Lưu & Đồng Bộ'
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
          <h3 className="text-lg font-semibold text-blue-400 mb-3">
            ℹ️ Về Realtime Sync
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• Mọi thay đổi sẽ được lưu vào Firebase và đồng bộ realtime đến tất cả client</li>
            <li>• Nhân viên đang online sẽ nhận được cài đặt mới ngay lập tức</li>
            <li>• Không cần restart server hay refresh browser</li>
            <li>• Lịch sử thay đổi được ghi nhận (người thay đổi + thời gian)</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

