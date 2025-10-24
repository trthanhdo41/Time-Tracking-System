import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { CheckInIcon, CameraIcon, XIcon } from '@/components/icons';
import { useAuthStore } from '@/store/authStore';
import { useSessionStore } from '@/store/sessionStore';
import toast from 'react-hot-toast';
import { detectFace, compareFaces, captureImageFromVideo } from '@/utils/faceRecognition';
import { soundManager } from '@/utils/sound';
import { logActivity } from '@/services/activityLog';
import { uploadImageToImgbb, isImageUploadConfigured } from '@/utils/imageUpload';
import { createCheckInSession } from '@/services/sessionService';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface CheckInCameraProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CheckInCamera: React.FC<CheckInCameraProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuthStore();
  const { setSession, setStatus } = useSessionStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'camera' | 'processing' | 'success' | 'failed'>('camera');
  const [faceDetected, setFaceDetected] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const MAX_ATTEMPTS = 2;

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user'
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Start face detection for visual feedback
        videoRef.current.onloadedmetadata = () => {
          detectionIntervalRef.current = window.setInterval(async () => {
            if (videoRef.current && step === 'camera') {
              const detection = await detectFace(videoRef.current);
              setFaceDetected(!!detection);
            }
          }, 500);
        };
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
      onClose();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleCheckIn = async () => {
    if (!user || !videoRef.current) return;

    setLoading(true);
    setStep('processing');

    try {
      // Capture image first
      const imageBlob = await captureImageFromVideo(videoRef.current);
      
      // Detect face from video
      const detection = await detectFace(videoRef.current);
      
      if (!detection) {
        toast.error('Không phát hiện khuôn mặt. Vui lòng thử lại.');
        setLoading(false);
        setStep('camera');
        return;
      }

      // Verify with Face0 if exists
      if (user.faceImageUrl) {
        const baseFaceImg = new Image();
        baseFaceImg.crossOrigin = 'anonymous'; // Fix CORS issue
        baseFaceImg.src = user.faceImageUrl;
        await new Promise((resolve, reject) => {
          baseFaceImg.onload = resolve;
          baseFaceImg.onerror = reject;
        });

        const baseFaceDetection = await detectFace(baseFaceImg);
        if (baseFaceDetection) {
          const similarity = compareFaces(detection.descriptor, baseFaceDetection.descriptor);
          const threshold = parseFloat(import.meta.env.VITE_FACE_SIMILARITY_THRESHOLD || '0.6');
          
          if (similarity < threshold) {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            
            // Log failed attempt
            await logActivity(
              user.id,
              user.username,
              user.role,
              user.department,
              user.position,
              'check_in',
              `Face verification failed (attempt ${newAttempts}/${MAX_ATTEMPTS}, similarity: ${similarity.toFixed(2)})`,
              user.id,
              user.role,
              user.department,
              { reason: 'Face verification failed', similarity, attempt: newAttempts }
            );
            
            if (newAttempts >= MAX_ATTEMPTS) {
              // MAX ATTEMPTS REACHED - Save error report and close
              await handleMaxAttemptsReached(imageBlob);
              return;
            }
            
            // Allow retry
            setStep('failed');
            setErrorMessage(`Khuôn mặt không khớp! (Lần ${newAttempts}/${MAX_ATTEMPTS})`);
            toast.error(`Vui lòng thử lại. Còn ${MAX_ATTEMPTS - newAttempts} lần.`);
            setLoading(false);
            return;
          }
        }
      }
      
      // Upload to imgbb if configured
      let face1Url = '';
      if (isImageUploadConfigured()) {
        try {
          face1Url = await uploadImageToImgbb(imageBlob, `checkin_${user.id}_${Date.now()}`);
        } catch (error) {
          console.error('Image upload error:', error);
          toast.error('Không thể tải ảnh lên. Vui lòng thử lại.');
          setLoading(false);
          setStep('camera');
          return;
        }
      }

      // Create session
      const session = await createCheckInSession(user, face1Url);
      setSession(session);
      setStatus('online');

      // Update user's face1Url if not set
      if (!user.face1Url && face1Url) {
        // TODO: Update user's face1Url in Firestore
      }

      // Log activity
      await logActivity(
        user.id,
        user.username,
        user.role,
        user.department,
        user.position,
        'check_in',
        `Checked in successfully`,
        user.id,
        user.role,
        user.department,
        { sessionId: session.id, face1Url }
      );

      soundManager.playSuccess();
      setStep('success');
      toast.success('Check in thành công!');

      // Close after 2 seconds
      setTimeout(() => {
        stopCamera();
        onSuccess();
      }, 2000);

    } catch (error) {
      console.error('Check in error:', error);
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
      setLoading(false);
      setStep('camera');
    }
  };

  const handleMaxAttemptsReached = async (imageBlob: Blob) => {
    if (!user) return;
    
    try {
      setStep('failed');
      setErrorMessage('Xác thực thất bại 2 lần! Đang gửi báo cáo...');
      toast.error('Xác thực thất bại! Báo cáo đã được gửi đến Admin.');

      // Upload failed image to Imgbb
      let failedImageUrl = '';
      if (isImageUploadConfigured()) {
        try {
          failedImageUrl = await uploadImageToImgbb(imageBlob, `failed_checkin_${user.id}_${Date.now()}`);
        } catch (error) {
          console.error('Failed to upload error image:', error);
        }
      }

      // Save to error reports collection
      await addDoc(collection(db, 'errorReports'), {
        userId: user.id,
        username: user.username,
        department: user.department,
        position: user.position,
        type: 'face_verification_failed',
        failedImageUrl,
        attempts: MAX_ATTEMPTS,
        timestamp: Date.now(),
        status: 'pending',
        description: `User failed face verification ${MAX_ATTEMPTS} times during check-in`,
      });

      // Log activity
      await logActivity(
        user.id,
        user.username,
        user.role,
        user.department,
        user.position,
        'face_verification_failed',
        `Face verification failed after ${MAX_ATTEMPTS} attempts`,
        user.id,
        user.role,
        user.department
      );

      soundManager.playError();

      // Close after 3 seconds
      setTimeout(() => {
        stopCamera();
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Error reporting failed attempts:', error);
      toast.error('Không thể gửi báo cáo lỗi');
      setTimeout(() => {
        stopCamera();
        onClose();
      }, 2000);
    }
  };

  const handleRetry = () => {
    setStep('camera');
    setErrorMessage('');
    setLoading(false);
  };

  const handleCancel = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-dark-900 flex items-center justify-center">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-accent-500/10" />
      
      <div className="relative w-full h-full max-w-7xl mx-auto p-8 flex flex-col">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Check In - Face Verification
            </h1>
            <p className="text-gray-400 text-lg">
              Vui lòng đặt khuôn mặt vào khung hình và nhấn "Check In"
            </p>
          </div>
          
          <Button
            onClick={handleCancel}
            variant="secondary"
            size="lg"
            className="gap-2"
            disabled={loading}
          >
            <XIcon className="w-5 h-5" />
            Hủy
          </Button>
        </motion.div>

        {/* Camera Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 relative rounded-2xl overflow-hidden bg-dark-800 shadow-2xl"
        >
          {/* Video */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />

          {/* Face Detection Overlay */}
          <AnimatePresence>
            {step === 'camera' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                {/* Face Circle Guide */}
                <motion.div
                  animate={{
                    scale: faceDetected ? [1, 1.05, 1] : 1,
                    borderColor: faceDetected ? '#10b981' : '#60a5fa',
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-80 h-80 rounded-full border-4 relative"
                  style={{
                    borderStyle: 'dashed',
                    boxShadow: faceDetected 
                      ? '0 0 40px rgba(16, 185, 129, 0.5)' 
                      : '0 0 40px rgba(96, 165, 250, 0.3)'
                  }}
                >
                  {/* Status Text */}
                  <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center">
                    <p className={`text-lg font-semibold ${
                      faceDetected ? 'text-green-400' : 'text-blue-400'
                    }`}>
                      {faceDetected ? '✓ Đã phát hiện khuôn mặt' : '○ Đặt khuôn mặt vào khung'}
                    </p>
                  </div>
                </motion.div>

                {/* Corner Guides */}
                {[
                  'top-left', 'top-right', 'bottom-left', 'bottom-right'
                ].map((corner) => (
                  <div
                    key={corner}
                    className={`absolute w-16 h-16 border-4 ${
                      faceDetected ? 'border-green-500' : 'border-blue-500'
                    } ${
                      corner === 'top-left' ? 'top-20 left-20 border-r-0 border-b-0' :
                      corner === 'top-right' ? 'top-20 right-20 border-l-0 border-b-0' :
                      corner === 'bottom-left' ? 'bottom-20 left-20 border-r-0 border-t-0' :
                      'bottom-20 right-20 border-l-0 border-t-0'
                    }`}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Processing Overlay */}
          <AnimatePresence>
            {step === 'processing' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-dark-900/90 backdrop-blur-sm flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 relative">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute inset-0 rounded-full border-4 border-primary-500"
                        animate={{
                          scale: [1, 2, 2],
                          opacity: [0.8, 0, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.6,
                        }}
                      />
                    ))}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <CameraIcon className="w-10 h-10 text-primary-400" />
                    </div>
                  </div>
                  <p className="text-xl font-semibold text-white">
                    Đang xử lý...
                  </p>
                  <p className="text-gray-400 mt-2">
                    Vui lòng đợi trong giây lát
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Overlay */}
          <AnimatePresence>
            {step === 'success' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-br from-green-600/90 to-emerald-600/90 backdrop-blur-sm flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                    className="w-32 h-32 mx-auto mb-6 bg-white rounded-full flex items-center justify-center"
                  >
                    <CheckInIcon className="w-16 h-16 text-green-600" />
                  </motion.div>
                  <h2 className="text-4xl font-bold text-white mb-4">
                    Check In Thành Công!
                  </h2>
                  <p className="text-xl text-white/90">
                    Chúc bạn làm việc hiệu quả
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Failed Overlay - Max attempts reached */}
          <AnimatePresence>
            {step === 'failed' && attempts >= MAX_ATTEMPTS && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-br from-red-600/90 to-rose-600/90 backdrop-blur-sm flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                    className="w-32 h-32 mx-auto mb-6 bg-white rounded-full flex items-center justify-center"
                  >
                    <XIcon className="w-16 h-16 text-red-600" />
                  </motion.div>
                  <h2 className="text-4xl font-bold text-white mb-4">
                    Xác Thực Thất Bại!
                  </h2>
                  <p className="text-xl text-white/90 mb-2">
                    Đã vượt quá số lần thử
                  </p>
                  <p className="text-lg text-white/80">
                    Báo cáo đã được gửi đến Admin
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Action Buttons */}
        {step === 'camera' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex justify-center"
          >
            <Button
              onClick={handleCheckIn}
              disabled={loading || !faceDetected}
              size="lg"
              variant="primary"
              className="gap-3 px-12 py-6 text-xl"
            >
              <CheckInIcon className="w-6 h-6" />
              {loading ? 'Đang xử lý...' : 'Check In'}
            </Button>
          </motion.div>
        )}

        {/* Retry Button - Show when failed */}
        {step === 'failed' && attempts < MAX_ATTEMPTS && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex flex-col items-center gap-4"
          >
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-6 py-4 max-w-md">
                <p className="text-red-400 text-center font-medium">{errorMessage}</p>
              </div>
            )}
            <Button
              onClick={handleRetry}
              size="lg"
              variant="primary"
              className="gap-3 px-12 py-6 text-xl"
            >
              <CameraIcon className="w-6 h-6" />
              Thử Lại ({MAX_ATTEMPTS - attempts} lần còn lại)
            </Button>
          </motion.div>
        )}

        {/* Max attempts reached message */}
        {step === 'failed' && attempts >= MAX_ATTEMPTS && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex flex-col items-center gap-4"
          >
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-6 py-4 max-w-md">
              <p className="text-red-400 text-center font-medium">{errorMessage}</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

