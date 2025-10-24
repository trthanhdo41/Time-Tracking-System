import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BellIcon, XIcon } from '@/components/icons';
import { soundManager } from '@/utils/sound';
import { User } from '@/types';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'captcha' | 'face_verify' | 'check_out_warning';
  title: string;
  message: string;
  timestamp: number;
  acknowledged: boolean;
  actionRequired?: boolean;
}

interface NotificationManagerProps {
  user: User;
  onCaptchaTrigger?: () => void;
  onFaceVerifyTrigger?: () => void;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  user,
  onCaptchaTrigger,
  onFaceVerifyTrigger
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isEnabled, setIsEnabled] = useState(user.notificationsEnabled);

  useEffect(() => {
    if (!isEnabled) return;

    // CAPTCHA notification - 5 seconds before
    const captchaInterval = setInterval(() => {
      if (user.notificationsEnabled) {
        showNotification({
          id: 'captcha_warning',
          type: 'captcha',
          title: 'CAPTCHA Sắp Xuất Hiện',
          message: 'CAPTCHA sẽ xuất hiện sau 5 giây nữa. Vui lòng chuẩn bị.',
          timestamp: Date.now(),
          acknowledged: false,
          actionRequired: false
        });

        // Play sound
        soundManager.playNotification();
        
        // Trigger CAPTCHA after 5 seconds
        setTimeout(() => {
          onCaptchaTrigger?.();
        }, 5000);
      }
    }, 25 * 60 * 1000); // 25 minutes (5 seconds before 30-minute interval)

    // Face verification notification - 5 minutes before
    const faceVerifyInterval = setInterval(() => {
      if (user.notificationsEnabled) {
        showNotification({
          id: 'face_verify_warning',
          type: 'face_verify',
          title: 'Xác Thực Khuôn Mặt Sắp Diễn Ra',
          message: 'Hệ thống sẽ yêu cầu xác thực khuôn mặt sau 5 phút. Vui lòng chuẩn bị.',
          timestamp: Date.now(),
          acknowledged: false,
          actionRequired: true
        });

        // Play sound
        soundManager.playNotification();
        
        // Trigger face verification after 5 minutes
        setTimeout(() => {
          onFaceVerifyTrigger?.();
        }, 5 * 60 * 1000);
      }
    }, 25 * 60 * 1000); // 25 minutes (5 minutes before 30-minute interval)

    return () => {
      clearInterval(captchaInterval);
      clearInterval(faceVerifyInterval);
    };
  }, [user.notificationsEnabled, onCaptchaTrigger, onFaceVerifyTrigger]);

  const showNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    
    // Auto-dismiss after 10 seconds if not acknowledged
    setTimeout(() => {
      setNotifications(prev => 
        prev.filter(n => n.id !== notification.id)
      );
    }, 10000);
  };

  const acknowledgeNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, acknowledged: true } : n)
    );
    
    // Remove after acknowledgment
    setTimeout(() => {
      setNotifications(prev => 
        prev.filter(n => n.id !== id)
      );
    }, 1000);
  };

  const toggleNotifications = async () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    
    // Update user notification preference
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      const { db } = await import('@/config/firebase');
      await updateDoc(doc(db, 'users', user.id), {
        notificationsEnabled: newEnabled,
        updatedAt: Date.now()
      });
      
      toast.success(
        newEnabled ? 'Đã bật thông báo' : 'Đã tắt thông báo'
      );
    } catch (error) {
      console.error('Error updating notification preference:', error);
      toast.error('Không thể cập nhật cài đặt thông báo');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'captcha':
        return '🔐';
      case 'face_verify':
        return '👤';
      case 'check_out_warning':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'captcha':
        return 'border-blue-500 bg-blue-500/10';
      case 'face_verify':
        return 'border-purple-500 bg-purple-500/10';
      case 'check_out_warning':
        return 'border-orange-500 bg-orange-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-40 space-y-3">
      {/* Notification Toggle */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleNotifications}
          className={`${isEnabled ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-gray-500/20 border-gray-500 text-gray-400'} shadow-lg`}
        >
          <BellIcon className="w-4 h-4 mr-2" />
          {isEnabled ? 'Tắt Thông Báo' : 'Bật Thông Báo'}
        </Button>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={`max-w-sm ${getNotificationColor(notification.type)}`}>
              <div className="flex items-start gap-3">
                <div className="text-2xl">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">
                    {notification.title}
                  </h4>
                  <p className="text-sm text-gray-300 mb-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {new Date(notification.timestamp).toLocaleTimeString('vi-VN')}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => acknowledgeNotification(notification.id)}
                      className="text-xs"
                    >
                      <XIcon className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
