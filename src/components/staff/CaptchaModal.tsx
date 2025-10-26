import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { generateCaptcha, getCaptchaImageUrl } from '@/utils/captcha';
import { soundManager } from '@/utils/sound';
import { useAuthStore } from '@/store/authStore';
import { useSessionStore } from '@/store/sessionStore';
import { updateCaptchaAttempt, checkOutSession } from '@/services/sessionService';
import { listenToSystemSettings, SystemSettings } from '@/services/systemSettingsService';
import toast from 'react-hot-toast';

interface CaptchaModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onFail: () => void;
}

export const CaptchaModal: React.FC<CaptchaModalProps> = ({
  isOpen,
  onSuccess,
  onFail,
}) => {
  const { user } = useAuthStore();
  const { currentSession } = useSessionStore();
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [userInput, setUserInput] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [timeLeft, setTimeLeft] = useState(180);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  // Listen to system settings
  useEffect(() => {
    const unsubscribe = listenToSystemSettings((newSettings) => {
      setSettings(newSettings);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen && settings) {
      generateNewCaptcha();
      setAttempts(0);
      setTimeLeft(settings.captcha.timeoutSeconds);
      soundManager.playCaptchaNotification();

      // Start countdown
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Backend timeout check is handled via session timeout
    // No need for client-side detection as it's unreliable

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isOpen, settings]);

  const generateNewCaptcha = () => {
    const code = generateCaptcha(6);
    setCaptchaCode(code);
    setCaptchaImage(getCaptchaImageUrl(code));
    setUserInput('');
  };

  const handleTimeout = async () => {
    if (user && currentSession) {
      try {
        await checkOutSession(currentSession.id, 'CAPTCHA timeout', user);
        useSessionStore.getState().setSession(null);
    useSessionStore.getState().setStatus('offline');
      } catch (error) {
        console.error('Auto checkout error:', error);
      }
    }
    toast.error('Hết thời gian! Bạn đã bị Check Out.');
    soundManager.playError();
    onFail();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentSession) return;
    
    setLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    if (userInput.toLowerCase() === captchaCode.toLowerCase()) {
      // Success
      await updateCaptchaAttempt(currentSession.id, true, user);
      // Toast notification is handled in parent component
      soundManager.playSuccess();
      setLoading(false);
      onSuccess();
    } else {
      // Failed
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      await updateCaptchaAttempt(currentSession.id, false, user);

      const maxAttempts = settings?.captcha.maxAttempts || 3;
      if (newAttempts >= maxAttempts) {
        // Auto checkout
        await checkOutSession(currentSession.id, 'Failed CAPTCHA verification', user);
        useSessionStore.getState().setSession(null);
    useSessionStore.getState().setStatus('offline');
        
        toast.error(`Sai ${maxAttempts} lần! Bạn đã bị Check Out.`);
        soundManager.playError();
        setLoading(false);
        onFail();
      } else {
        toast.error(`Sai! Còn ${maxAttempts - newAttempts} lần thử.`);
        soundManager.playWarning();
        generateNewCaptcha();
        setLoading(false);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Xác Thực CAPTCHA"
      showClose={false}
      size="md"
    >
      <div className="space-y-6">
        {/* Timer */}
        <div className="text-center">
          <motion.div
            animate={{
              scale: timeLeft <= 10 ? [1, 1.1, 1] : 1,
            }}
            transition={{ duration: 0.5, repeat: timeLeft <= 10 ? Infinity : 0 }}
            className={`text-4xl font-bold ${
              timeLeft <= 10 ? 'text-red-500' : 'text-primary-500'
            }`}
          >
            {formatTime(timeLeft)}
          </motion.div>
          <p className="text-sm text-gray-400 mt-2">Thời gian còn lại</p>
        </div>

        {/* Captcha Image */}
        <motion.div
          key={captchaImage}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-4 rounded-xl"
        >
          <img
            src={captchaImage}
            alt="CAPTCHA"
            className="w-full h-auto rounded-lg"
          />
        </motion.div>

        {/* Attempts Counter */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: settings?.captcha.maxAttempts || 3 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`w-3 h-3 rounded-full ${
                i < attempts ? 'bg-red-500' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value.toUpperCase())}
            placeholder="Nhập mã CAPTCHA"
            autoFocus
            className="text-center text-2xl tracking-widest uppercase"
            disabled={loading}
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={generateNewCaptcha}
              disabled={loading}
              className="flex-1"
            >
              Tạo Mới
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="flex-1"
            >
              Xác Nhận
            </Button>
          </div>
        </form>

        {/* Warning */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong p-4 rounded-xl text-center"
        >
          <p className="text-sm text-yellow-400">
            ⚠️ Nhập sai {settings?.captcha.maxAttempts || 3} lần hoặc hết thời gian sẽ tự động Check Out
          </p>
        </motion.div>
      </div>
    </Modal>
  );
};

