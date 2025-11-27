import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useSessionStore } from '@/store/sessionStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
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
import { formatDuration, calculateDuration, getVietnamTimeString, getVietnamTimestamp } from '@/utils/time';
import { soundManager } from '@/utils/sound';
import { 
  checkOutSession, 
  updateSessionBackSoon, 
  updateSessionBackOnline,
  listenToCurrentSession
} from '@/services/sessionService';
import { listenToSystemSettings, SystemSettings } from '@/services/systemSettingsService';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { startActivityTracking } from '@/utils/activityTracker';
import { startUserStatusTracking, stopUserStatusTracking } from '@/utils/userStatusTracker';
import toast from 'react-hot-toast';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { currentSession, status } = useSessionStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [showBackSoonModal, setShowBackSoonModal] = useState(false);
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [showCheckOutConfirm, setShowCheckOutConfirm] = useState(false);
  const [currentTime, setCurrentTime] = useState(getVietnamTimeString());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'images'>('dashboard');
  const [showCheckInCamera, setShowCheckInCamera] = useState(false);
  const [todayActivities, setTodayActivities] = useState<any[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [currentOnlineTime, setCurrentOnlineTime] = useState(0);
  const [currentBackSoonTime, setCurrentBackSoonTime] = useState(0);
  const [captchaPassed, setCaptchaPassed] = useState(false); // Track if CAPTCHA has been passed in this session
  const lastSessionIdRef = useRef<string | null>(null); // Track last session ID to detect new sessions
  const captchaTimersRef = useRef<{ warning?: NodeJS.Timeout; sound?: NodeJS.Timeout; main?: NodeJS.Timeout } | null>(null);

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

  // Activity tracking cleanup ref
  const activityCleanupRef = useRef<(() => void) | null>(null);

  // Listen to current session and check for inactivity
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = listenToCurrentSession(user.id, (session) => {
      useSessionStore.getState().setSession(session);
      useSessionStore.getState().setStatus(session?.status || 'offline');
      
      // Start/stop activity tracking based on session
      if (session && session.status === 'online') {
        // Start activity tracking when session is online
        if (activityCleanupRef.current) {
          activityCleanupRef.current(); // Cleanup previous tracking
        }
        activityCleanupRef.current = startActivityTracking(user.id, session.id);
        
        // Update user status tracking with sessionId
        startUserStatusTracking(user.id, session.id);
        
        // Check if session is stale (inactive > 5 minutes)
        const lastActivityTime = session.lastActivityTime;
        if (lastActivityTime) {
          const now = getVietnamTimestamp();
          const lastActivity = typeof lastActivityTime === 'number' 
            ? lastActivityTime 
            : (lastActivityTime as any).seconds * 1000;
          
          const timeSinceLastActivity = now - lastActivity;
          
          // If inactive for more than 5 minutes, auto checkout
          if (timeSinceLastActivity > 5 * 60 * 1000) {
            console.log('Session inactive, auto checking out...');
            checkOutSession(session.id, 'Auto cleanup - Inactive 5+ minutes', user);
            useSessionStore.getState().setSession(null);
            useSessionStore.getState().setStatus('offline');
            
            // Stop activity tracking
            if (activityCleanupRef.current) {
              activityCleanupRef.current();
              activityCleanupRef.current = null;
            }
            
            toast.error('Automatically checked out due to 5 minutes of inactivity');
          }
        }
      } else {
        // Stop activity tracking when session is offline
        if (activityCleanupRef.current) {
          activityCleanupRef.current();
          activityCleanupRef.current = null;
        }

        // Ensure user status is offline when no active session
        stopUserStatusTracking(user.id);
      }
    });
    
    return () => {
      unsubscribe();
      // Cleanup activity tracking on unmount
      if (activityCleanupRef.current) {
        activityCleanupRef.current();
        activityCleanupRef.current = null;
      }
    };
  }, [user]);

  // Listen to today's activity logs (realtime)
  useEffect(() => {
    if (!user) return;

    // Get all activities for this user (no timestamp filter to avoid index requirement)
    const activitiesQuery = query(
      collection(db, 'activityLogs'),
      where('userId', '==', user.id)
    );

    const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
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
    }, (error) => {
      console.error('Error listening to activities:', error);
      setTodayActivities([]);
    });

    return () => unsubscribe();
  }, [user]); // Only depend on user, not currentSession


  // Update current time and calculate times
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getVietnamTimeString());
      
      // Check for session inactivity and auto checkout
      if (currentSession && status === 'online' && user) {
        const lastActivityTime = currentSession.lastActivityTime;
        if (lastActivityTime) {
          const now = getVietnamTimestamp();
          const lastActivity = typeof lastActivityTime === 'number' 
            ? lastActivityTime 
            : (lastActivityTime as any).seconds * 1000;
          
          const timeSinceLastActivity = now - lastActivity;
          
          // If inactive for more than 5 minutes, auto checkout
          if (timeSinceLastActivity > 5 * 60 * 1000) {
            console.log('Session inactive, auto checking out...');
            checkOutSession(currentSession.id, 'Auto cleanup - Inactive 5+ minutes', user);
            useSessionStore.getState().setSession(null);
            useSessionStore.getState().setStatus('offline');
            toast.error('Automatically checked out due to 5 minutes of inactivity');
          }
        }
      }
      
      // Calculate online time and back soon time from session
      if (currentSession && status !== 'offline') {
        const sessionCheckInTime = currentSession.checkInTime;
        if (!sessionCheckInTime) return;
        
        // Convert checkInTime to number
        let checkInTime: number;
        if (sessionCheckInTime && typeof sessionCheckInTime === 'object' && 'seconds' in sessionCheckInTime) {
          checkInTime = sessionCheckInTime.seconds * 1000;
        } else if (sessionCheckInTime && typeof sessionCheckInTime === 'number') {
          checkInTime = sessionCheckInTime;
        } else {
          return;
        }

        const now = getVietnamTimestamp();
        const totalElapsed = Math.floor((now - checkInTime) / 1000);
        
        // Calculate back soon time
        let backSoonTime = 0;
        
        if (status === 'back_soon') {
          // Currently in back soon - calculate from events
          if (currentSession.backSoonEvents && currentSession.backSoonEvents.length > 0) {
            currentSession.backSoonEvents.forEach((event: any) => {
              if (event.endTime) {
                // Completed event - already in seconds
                backSoonTime += Math.floor((event.endTime - event.startTime) / 1000);
              } else {
                // Current ongoing event
                backSoonTime += Math.floor((now - event.startTime) / 1000);
              }
            });
          }
        } else {
          // Online state - use stored totalBackSoonTime from session (already in seconds)
          backSoonTime = currentSession.totalBackSoonTime || 0;
        }
        
        // Online time = total elapsed - back soon time
        const onlineTime = Math.max(0, totalElapsed - backSoonTime);
        
        setCurrentOnlineTime(onlineTime);
        setCurrentBackSoonTime(backSoonTime);
      } else {
        setCurrentOnlineTime(0);
        setCurrentBackSoonTime(0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [currentSession, status]);

  // Reset captchaPassed when a new session starts (check-in) or when session ends
  useEffect(() => {
    const currentSessionId = currentSession?.id || null;
    
    // Reset when session ends (check-out)
    if (status === 'offline' || !currentSession) {
      setCaptchaPassed(false);
      lastSessionIdRef.current = null;
    } else if (status === 'online' && currentSession && currentSessionId !== lastSessionIdRef.current) {
      // Reset when starting a new session (sessionId changed means new check-in)
      setCaptchaPassed(false);
      lastSessionIdRef.current = currentSessionId;
    }
  }, [status, currentSession?.id]); // Watch sessionId to detect new sessions

  // Function to schedule CAPTCHA
  const scheduleCaptcha = useRef(() => {
    if (!settings || status !== 'online') return;
    
    // Clear existing timers
    if (captchaTimersRef.current) {
      if (captchaTimersRef.current.warning) clearTimeout(captchaTimersRef.current.warning);
      if (captchaTimersRef.current.sound) clearTimeout(captchaTimersRef.current.sound);
      if (captchaTimersRef.current.main) clearTimeout(captchaTimersRef.current.main);
    }
    
    const intervalMs = settings.captcha.intervalMinutes * 60 * 1000;
    const warningSeconds = settings.captcha.warningBeforeSeconds || 15;
    const warningMs = warningSeconds * 1000;

    // Show notification + sound before CAPTCHA (based on settings)
    const warningTimer = setTimeout(() => {
      if (status === 'online') {
        toast(`CAPTCHA will appear in ${warningSeconds} seconds. Please prepare.`, {
          icon: '🔐',
          duration: 4000,
        });
        soundManager.playCaptchaNotification();
      }
    }, intervalMs - warningMs);

    // Play notification sound 5 seconds before (if warning time > 5 seconds)
    let soundTimer: NodeJS.Timeout | null = null;
    if (warningSeconds > 5) {
      soundTimer = setTimeout(() => {
        if (status === 'online') {
          soundManager.playCaptchaNotification();
        }
      }, intervalMs - 5000);
    }

    // Show CAPTCHA modal
    const captchaTimer = setTimeout(() => {
      if (status === 'online') {
        setShowCaptcha(true);
      }
    }, intervalMs);

    captchaTimersRef.current = {
      warning: warningTimer,
      sound: soundTimer,
      main: captchaTimer
    };
  });

  // Update scheduleCaptcha ref when settings/status change
  useEffect(() => {
    scheduleCaptcha.current = () => {
      if (!settings || status !== 'online') return;
      
      // Clear existing timers
      if (captchaTimersRef.current) {
        if (captchaTimersRef.current.warning) clearTimeout(captchaTimersRef.current.warning);
        if (captchaTimersRef.current.sound) clearTimeout(captchaTimersRef.current.sound);
        if (captchaTimersRef.current.main) clearTimeout(captchaTimersRef.current.main);
      }
      
      const intervalMs = settings.captcha.intervalMinutes * 60 * 1000;
      
      // Show notification + sound 15 seconds before CAPTCHA
      const warningTimer = setTimeout(() => {
        if (status === 'online') {
          toast('CAPTCHA will appear in 15 seconds. Please prepare.', {
            icon: '🔐',
            duration: 4000,
          });
          soundManager.playCaptchaNotification();
        }
      }, intervalMs - 15000);
      
      // Play notification sound 5 seconds before
      const soundTimer = setTimeout(() => {
        if (status === 'online') {
          soundManager.playCaptchaNotification();
        }
      }, intervalMs - 5000);
      
      // Show CAPTCHA modal
      const captchaTimer = setTimeout(() => {
        if (status === 'online') {
          setShowCaptcha(true);
        }
      }, intervalMs);
      
      captchaTimersRef.current = {
        warning: warningTimer,
        sound: soundTimer,
        main: captchaTimer
      };
    };
  }, [settings, status]);

  // CAPTCHA trigger - schedule on check-in
  useEffect(() => {
    if (status === 'online' && settings) {
      scheduleCaptcha.current();
    }
    
    return () => {
      // Cleanup timers on unmount or status change
      if (captchaTimersRef.current) {
        if (captchaTimersRef.current.warning) clearTimeout(captchaTimersRef.current.warning);
        if (captchaTimersRef.current.sound) clearTimeout(captchaTimersRef.current.sound);
        if (captchaTimersRef.current.main) clearTimeout(captchaTimersRef.current.main);
      }
    };
  }, [status, currentSession?.id, settings]); // Trigger on new session

  const handleCaptchaSuccess = async () => {
    setShowCaptcha(false);
    setCaptchaPassed(true); // Temporarily mark as passed
    toast.success('Verification successful!');
    
    // Check if we need to trigger Face Verification
    if (currentSession && settings) {
      const requiredCaptchas = settings.faceVerification.captchaCountBeforeFace;
      const currentCount = currentSession.captchaSuccessCount || 0;


      // Trigger face verification after N successful CAPTCHAs
      if ((currentCount + 1) >= requiredCaptchas) {
        // Reduce warning time to 10 seconds for faster verification
        const warningSeconds = 10;

        // Show warning notification
        toast(`⚠️ Face Verification will appear in ${warningSeconds} seconds. Please prepare your face!`, {
          icon: '👤',
          duration: 4000,
        });
        soundManager.playCaptchaNotification();

        // Play sound again 5 seconds before
        setTimeout(() => {
          soundManager.playCaptchaNotification();
        }, 5000);

        // Show Face Verification modal after warning time
        setTimeout(() => {
          setShowFaceVerification(true);
        }, warningSeconds * 1000);
      }
    }

    // Schedule next CAPTCHA
    setTimeout(() => {
      setCaptchaPassed(false);
      scheduleCaptcha.current();
    }, 2000);
  };

  const handleCaptchaFail = async () => {
    setShowCaptcha(false);
    setCaptchaPassed(false); // Reset flag on fail (will checkout anyway)
    useSessionStore.getState().setSession(null);
    useSessionStore.getState().setStatus('offline');
  };

  const handleFaceVerificationSuccess = () => {
    setShowFaceVerification(false);
    toast.success('Face verification successful!');
    // Reset face verification count after successful verification
    // This will be handled in the session update
  };

  const handleFaceVerificationFail = async () => {
    setShowFaceVerification(false);

    // Checkout immediately when Face Verification fails or is skipped
    if (user && currentSession) {
      try {
        await checkOutSession(currentSession.id, 'Face Verification failed/skipped', user);
        useSessionStore.getState().setSession(null);
        useSessionStore.getState().setStatus('offline');
        toast.error('Face verification failed. You have been checked out.');
      } catch (error: any) {
        console.error('Error checking out after face verification fail:', error);
        toast.error('Error during checkout. Please try again.');
      }
    }
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
      toast.success('Check Out successful!');
      setShowCheckOutConfirm(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleBackSoon = async (reason?: 'meeting' | 'toilet' | 'other', customReason?: string) => {
    if (!user || !currentSession) return;
    
    try {
      if (status === 'back_soon') {
        // Return to online
        await updateSessionBackOnline(currentSession.id, user);
        toast.success('Back to work!');
      } else if (reason) {
        // Go back soon - construct the reason text
        let reasonText = reason;
        if (reason === 'other' && customReason) {
          reasonText = customReason as any;
        }
        await updateSessionBackSoon(currentSession.id, reasonText, user);
        toast.success(`Back Soon: ${reasonText}`);
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
                  Welcome, <span className="gradient-text">{user?.fullName || user?.username}</span>
                </h1>
                <p className="text-gray-400 text-lg mt-1">
                  {user?.position} - {user?.department}
                </p>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {currentTime} (GMT+7)
              </p>
            </motion.div>


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
                  onClick={() => setShowCheckOutConfirm(true)}
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
                      handleBackSoon();
                    } else {
                      setShowBackSoonModal(true);
                    }
                  }}
                  className="flex-1 min-w-[150px]"
                >
                  {status === 'back_soon' ? 'Return to Work' : 'Back Soon'}
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
              History
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
              Image Gallery
            </Button>
            
            </div>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        {status !== 'offline' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card gradient>
              <CardHeader 
                title="Online Time" 
                icon={<ChartIcon className="w-6 h-6" />}
              />
              <div className="text-3xl font-bold text-primary-400 font-mono">
                {formatDuration(currentOnlineTime)}
              </div>
              <p className="text-sm text-gray-400 mt-2">Actual work time</p>
            </Card>

            <Card gradient>
              <CardHeader 
                title="Back Soon Time" 
                icon={<BackSoonIcon className="w-6 h-6" />}
              />
              <div className="text-3xl font-bold text-yellow-400 font-mono">
                {formatDuration(currentBackSoonTime)}
              </div>
              <p className="text-sm text-gray-400 mt-2">Temporary away time</p>
            </Card>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'images' ? (
          user && <ImageGallery userId={user.id} />
        ) : (
          <>
            {/* Today's Activity */}
            <Card>
              <CardHeader 
                title="Today's Activity" 
                subtitle="Track your activities"
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
                            {new Date(activity.timestamp).toLocaleTimeString('en-US')}
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
                    <p>No activity today</p>
                    <p className="text-sm mt-2">Press Check In to start</p>
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

      {/* Check Out Confirmation Modal */}
      <Modal
        isOpen={showCheckOutConfirm}
        onClose={() => setShowCheckOutConfirm(false)}
        title="Confirm Check Out"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <CheckOutIcon className="w-10 h-10 text-red-500" />
            </div>
            <p className="text-lg text-gray-300 mb-2">
              Are you sure you want to Check Out?
            </p>
            <p className="text-sm text-gray-400">
              Work time: <span className="text-primary-400 font-mono font-semibold">{formatDuration(currentOnlineTime)}</span>
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowCheckOutConfirm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleCheckOut}
              className="flex-1"
            >
              Confirm Check Out
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

