import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CheckInIcon, CameraIcon } from '@/components/icons';
import { useAuthStore } from '@/store/authStore';
import { useSessionStore } from '@/store/sessionStore';
import toast from 'react-hot-toast';
import { detectFace, compareFaces, captureImageFromVideo } from '@/utils/faceRecognition';
import { soundManager } from '@/utils/sound';
import { logActivity } from '@/services/activityLog';
import { uploadImageToImgbb, isImageUploadConfigured } from '@/utils/imageUpload';
import { createCheckInSession } from '@/services/sessionService';
import { Session } from '@/types';

export const CheckInButton: React.FC = () => {
  const { user } = useAuthStore();
  const sessionStore = useSessionStore();
  const { setSession, setStatus } = useSessionStore();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'camera' | 'processing' | 'success'>('camera');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
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
        baseFaceImg.src = user.faceImageUrl;
        await new Promise((resolve) => {
          baseFaceImg.onload = resolve;
        });

        const baseFaceDetection = await detectFace(baseFaceImg);
        if (baseFaceDetection) {
          const similarity = compareFaces(detection.descriptor, baseFaceDetection.descriptor);
          
          if (similarity < 0.6) {
            toast.error('Khuôn mặt không khớp. Vui lòng thử lại.');
            soundManager.playError();
            setLoading(false);
            setStep('camera');
            return;
          }
        }
      }

      // Capture image
      const imageBlob = await captureImageFromVideo(videoRef.current);
      
      // Upload Face1 to imgbb (free unlimited storage)
      const timestamp = Date.now();
      let face1Url = '';
      
      if (isImageUploadConfigured()) {
        try {
          face1Url = await uploadImageToImgbb(
            imageBlob, 
            `${user.username}_checkin_${timestamp}`
          );
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          toast.error('Không thể upload ảnh, nhưng check-in vẫn tiếp tục');
          // Continue with empty face1Url - system still works without image
        }
      } else {
        console.warn('Image upload not configured. Add VITE_IMGBB_API_KEY to .env');
        toast.error('Chưa cấu hình upload ảnh. Check-in không lưu ảnh.');
      }

      // Update user with Face1 URL
      if (face1Url) {
        // Update user document with Face1 URL
        const { updateDoc, doc } = await import('firebase/firestore');
        const { db } = await import('@/config/firebase');
        await updateDoc(doc(db, 'users', user.id), {
          face1Url: face1Url,
          updatedAt: Date.now()
        });
      }

      // Create session using service
      const session = await createCheckInSession(user, face1Url || '');
      setSession(session);
      setStatus('online');

      setStep('success');
      soundManager.playSuccess();
      toast.success('Check-in thành công!');

      setTimeout(() => {
        stopCamera();
        setShowModal(false);
        setStep('camera');
      }, 2000);

    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Lỗi khi check-in. Vui lòng thử lại.');
      soundManager.playError();
      setLoading(false);
      setStep('camera');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setTimeout(startCamera, 100);
  };

  const handleCloseModal = () => {
    stopCamera();
    setShowModal(false);
    setStep('camera');
  };

  return (
    <>
      <Button
        variant="primary"
        size="lg"
        icon={<CheckInIcon />}
        onClick={handleOpenModal}
      >
        Check In
      </Button>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title="Check In - Face Verification"
        size="lg"
      >
        <div className="space-y-6">
          {step === 'camera' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="relative aspect-video bg-dark-800 rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Face detection overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                    className="w-64 h-64 border-4 border-primary-500 rounded-full"
                  />
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-gray-300">
                  Vui lòng đặt khuôn mặt vào trong khung hình
                </p>
                <p className="text-sm text-gray-500">
                  Đảm bảo ánh sáng đủ và nhìn thẳng vào camera
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                icon={<CameraIcon />}
                onClick={handleCheckIn}
                loading={loading}
                className="w-full"
              >
                Xác Nhận Check In
              </Button>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center space-y-4"
            >
              <div className="inline-block w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-lg text-gray-300">Đang xác thực khuôn mặt...</p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.6 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20"
              >
                <CheckInIcon className="w-10 h-10 text-green-500" />
              </motion.div>
              <div>
                <h3 className="text-2xl font-bold text-green-500">Check-in Thành Công!</h3>
                <p className="text-gray-400 mt-2">Chúc bạn làm việc hiệu quả</p>
              </div>
            </motion.div>
          )}
        </div>
      </Modal>
    </>
  );
};

