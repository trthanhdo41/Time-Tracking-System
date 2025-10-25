import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useSessionStore } from '@/store/sessionStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckInCamera } from '@/components/staff/CheckInCamera';
import { CaptchaModal } from '@/components/staff/CaptchaModal';
import { BackSoonModal } from '@/components/staff/BackSoonModal';
import { FaceVerificationModal } from '@/components/staff/FaceVerificationModal';
import { ImageGallery } from '@/components/staff/ImageGallery';
import { 
  CheckOutIcon, 
  BackSoonIcon, 
  HistoryIcon, 
  CameraIcon,
  ChartIcon 
} from '@/components/icons';
import { formatDuration, calculateDuration, getVietnamTimeString } from '@/utils/time';
import { soundManager } from '@/utils/sound';
import { 
  checkOutSession, 
  updateSessionBackSoon, 
  updateSessionBackOnline,
  listenToCurrentSession
} from '@/services/sessionService';
import { listenToSystemSettings, SystemSettings } from '@/services/systemSettingsService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import toast from 'react-hot-toast';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { currentSession, status } = useSessionStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [showBackSoonModal, setShowBackSoonModal] = useState(false);
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [currentTime, setCurrentTime] = useState(getVietnamTimeString());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'images'>('dashboard');
  const [showCheckInCamera, setShowCheckInCamera] = useState(false);
  const [todayActivities, setTodayActivities] = useState<any[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Handle URL parameters for tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'images') {
      setActiveTab('images');
    } else {
      setActiveTab('dashboard');
    }
  }, [searchParams]);

  // Listen to system settings
  useEffect(() => {
    const unsubscribe = listenToSystemSettings((newSettings) => {
      setSettings(newSettings);
    });

    return () => unsubscribe();
  }, []);

  // Listen to current session
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = listenToCurrentSession(user.id, (session) => {
      useSessionStore.getState().setSession(session);
      useSessionStore.getState().setStatus(session?.status || 'offline');
    });
    
    return () => unsubscribe();
  }, [user]);

  // Fetch today's activity logs
  useEffect(() => {
    if (!user) return;

    const fetchTodayActivities = async () => {
      try {
        // Get all activities for this user (no timestamp filter to avoid index requirement)
        const activitiesQuery = query(
          collection(db, 'activityLogs'),
          where('userId', '==', user.id)
        );

        const snapshot = await getDocs(activitiesQuery);
        const activities = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Filter today's activities client-side
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.getTime();
        
        const todayActivities = activities.filter((activity: any) => 
          activity.timestamp >= todayStart
        );

        // Sort by timestamp descending (client-side)
        todayActivities.sort((a: any, b: any) => b.timestamp - a.timestamp);

        // Take only latest 10
        setTodayActivities(todayActivities.slice(0, 10));
      } catch (error) {
        console.error('Error fetching activities:', error);
        setTodayActivities([]);
      }
    };

    fetchTodayActivities();
  }, [user, currentSession]); // Refetch when session changes


  // Update current time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getVietnamTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // CAPTCHA periodic trigger
  useEffect(() => {
    if (status === 'online' && settings) {
      const intervalMs = settings.captcha.intervalMinutes * 60 * 1000;
      
      const timer = setTimeout(() => {
        // Play notification sound 5 seconds before
        setTimeout(() => {
          soundManager.playSuccess();
        }, intervalMs - 5000);
        
        setShowCaptcha(true);
      }, intervalMs);
      
      return () => clearTimeout(timer);
    }
  }, [status, currentSession, settings]);

  const handleCaptchaSuccess = async () => {
    setShowCaptcha(false);
    toast.success('Xác thực thành công!');
    
    // Check if we need to trigger Face Verification
    if (currentSession && settings) {
      const requiredCaptchas = settings.faceVerification.captchaCountBeforeFace;
      const currentCount = currentSession.captchaSuccessCount || 0;
      
      
      // Trigger face verification after N successful CAPTCHAs
      if ((currentCount + 1) >= requiredCaptchas) {
        setTimeout(() => {
          setShowFaceVerification(true);
        }, 1000); // Small delay for UX
      }
    }
  };

  const handleCaptchaFail = async () => {
    setShowCaptcha(false);
    useSessionStore.getState().setSession(null);
    useSessionStore.getState().setStatus('offline');
  };

  const handleFaceVerificationSuccess = () => {
    setShowFaceVerification(false);
    toast.success('Xác thực khuôn mặt thành công!');
  };

  const handleFaceVerificationFail = () => {
    setShowFaceVerification(false);
    useSessionStore.getState().setSession(null);
    useSessionStore.getState().setStatus('offline');
    toast.error('Xác thực khuôn mặt thất bại. Đã tự động check-out.');
  };

  const handleCaptchaTrigger = () => {
    setShowCaptcha(true);
  };

  const handleFaceVerifyTrigger = () => {
    setShowFaceVerification(true);
  };

  const handleCheckOut = async () => {
    if (!user || !currentSession) return;
    
    try {
      await checkOutSession(currentSession.id, 'User checkout', user);
      useSessionStore.getState().setSession(null);
    useSessionStore.getState().setStatus('offline');
      toast.success('Check Out thành công!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleBackSoon = async (reason: string) => {
    if (!user || !currentSession) return;
    
    try {
      if (status === 'back_soon') {
        // Return to online
        await updateSessionBackOnline(currentSession.id, user);
        toast.success('Đã trở lại làm việc!');
      } else {
        // Go back soon
        await updateSessionBackSoon(currentSession.id, reason, user);
        toast.success(`Back Soon: ${reason}`);
      }
      setShowBackSoonModal(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section - Only show when not in images tab */}
        {activeTab !== 'images' && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold">
                  Xin chào, <span className="gradient-text">{user?.username}</span>
                </h1>
                <p className="text-gray-400 text-lg mt-1">
                  {user?.position} - {user?.department}
                </p>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {currentTime} (GMT+7)
              </p>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card gradient>
                <CardHeader 
                  title="Thời Gian Online" 
                  icon={<ChartIcon className="w-6 h-6" />}
                />
                <div className="text-3xl font-bold text-primary-400 font-mono">
                  {currentSession?.totalOnlineTime 
                    ? formatDuration(currentSession.totalOnlineTime) 
                    : '0s'}
                </div>
                <p className="text-sm text-gray-400 mt-2">Hôm nay</p>
              </Card>

              <Card gradient>
                <CardHeader 
                  title="Back Soon Time" 
                  icon={<BackSoonIcon className="w-6 h-6" />}
                />
                <div className="text-3xl font-bold text-yellow-400 font-mono">
                  {currentSession?.totalBackSoonTime 
                    ? formatDuration(currentSession.totalBackSoonTime) 
                    : '0s'}
                </div>
                <p className="text-sm text-gray-400 mt-2">Tổng hôm nay</p>
              </Card>
            </div>
          </>
        )}


        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card>
            <div className="flex gap-2 flex-wrap">
            {status === 'offline' ? (
              <Button
                variant="primary"
                size="lg"
                icon={<CameraIcon />}
                onClick={() => setShowCheckInCamera(true)}
                className="flex-1 min-w-[150px]"
              >
                Check In
              </Button>
            ) : (
              <>
                <Button
                  variant="danger"
                  size="lg"
                  icon={<CheckOutIcon />}
                  onClick={handleCheckOut}
                  className="flex-1 min-w-[150px]"
                >
                  Check Out
                </Button>
                <Button
                  variant={status === 'back_soon' ? 'primary' : 'secondary'}
                  size="lg"
                  icon={<BackSoonIcon />}
                  onClick={() => {
                    if (status === 'back_soon') {
                      handleBackSoon('Return to work');
                    } else {
                      setShowBackSoonModal(true);
                    }
                  }}
                  className="flex-1 min-w-[150px]"
                >
                  {status === 'back_soon' ? 'Trở Lại Làm Việc' : 'Back Soon'}
                </Button>
              </>
            )}
            
            <Button
              variant="secondary"
              size="lg"
              icon={<HistoryIcon />}
              onClick={() => navigate('/history')}
              className="flex-1 min-w-[150px]"
            >
              Lịch Sử
            </Button>
            
            <Button
              variant="secondary"
              size="lg"
              icon={<CameraIcon />}
              onClick={() => navigate('/camera')}
              className="flex-1 min-w-[150px]"
            >
              Camera
            </Button>
            
            <Button
              variant="secondary"
              size="lg"
              icon={<CameraIcon />}
              onClick={() => navigate('/images')}
              className="flex-1 min-w-[150px]"
            >
              Thư Viện Ảnh
            </Button>
            
            </div>
          </Card>
        </motion.div>

        {/* Content based on active tab */}
        {activeTab === 'images' ? (
          user && <ImageGallery userId={user.id} />
        ) : (
          <>
            {/* Today's Activity */}
            <Card>
              <CardHeader 
                title="Hoạt Động Hôm Nay" 
                subtitle="Theo dõi các hoạt động của bạn"
              />
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {todayActivities.length > 0 ? (
                  todayActivities.map((activity: any, index: number) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          activity.actionType === 'check_in' ? 'bg-green-500/20' :
                          activity.actionType === 'check_out' ? 'bg-red-500/20' :
                          activity.actionType === 'back_soon' ? 'bg-yellow-500/20' :
                          activity.actionType === 'back_online' ? 'bg-blue-500/20' :
                          activity.actionType === 'captcha_verify' ? 'bg-purple-500/20' :
                          activity.actionType === 'face_verify' ? 'bg-pink-500/20' :
                          'bg-gray-500/20'
                        }`}>
                          <CheckOutIcon className={`w-6 h-6 ${
                            activity.actionType === 'check_in' ? 'text-green-500' :
                            activity.actionType === 'check_out' ? 'text-red-500' :
                            activity.actionType === 'back_soon' ? 'text-yellow-500' :
                            activity.actionType === 'back_online' ? 'text-blue-500' :
                            activity.actionType === 'captcha_verify' ? 'text-purple-500' :
                            activity.actionType === 'face_verify' ? 'text-pink-500' :
                            'text-gray-500'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium capitalize">
                            {activity.actionType?.replace(/_/g, ' ') || 'Activity'}
                          </p>
                          <p className="text-sm text-gray-400">
                            {new Date(activity.timestamp).toLocaleTimeString('vi-VN')}
                          </p>
                          {activity.description && (
                            <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-green-500 font-medium text-sm">✓</div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>Chưa có hoạt động hôm nay</p>
                    <p className="text-sm mt-2">Nhấn Check In để bắt đầu</p>
                  </div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Captcha Modal */}
      <CaptchaModal
        isOpen={showCaptcha}
        onSuccess={handleCaptchaSuccess}
        onFail={handleCaptchaFail}
      />

      {/* Back Soon Modal */}
      <BackSoonModal
        isOpen={showBackSoonModal}
        onClose={() => setShowBackSoonModal(false)}
        onSubmit={handleBackSoon}
      />

      {/* Face Verification Modal */}
      <FaceVerificationModal
        isOpen={showFaceVerification}
        onClose={() => setShowFaceVerification(false)}
        onSuccess={handleFaceVerificationSuccess}
        onFailure={handleFaceVerificationFail}
        user={user!}
      />


      {/* Check In Camera - Fullscreen Inline */}
      {showCheckInCamera && (
        <CheckInCamera
          onClose={() => setShowCheckInCamera(false)}
          onSuccess={() => {
            setShowCheckInCamera(false);
          }}
        />
      )}

    </div>
  );
};

