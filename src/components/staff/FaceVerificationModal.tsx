import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CameraIcon, CheckIcon, XIcon } from '@/components/icons';
import { detectFace, compareFaces, loadFaceDetectionModels } from '@/utils/faceRecognition';
import { uploadImageToImgbb, isImageUploadConfigured } from '@/utils/imageUpload';
import { soundManager } from '@/utils/sound';
import { User } from '@/types';
import toast from 'react-hot-toast';

interface FaceVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onFailure: () => void;
  user: User;
}

export const FaceVerificationModal: React.FC<FaceVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onFailure,
  user
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'camera' | 'processing' | 'success' | 'error'>('camera');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      await loadFaceDetectionModels();
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Không thể truy cập camera');
      setError('Camera không khả dụng');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureImageFromVideo = (video: HTMLVideoElement): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
  };

  const handleVerify = async () => {
    if (!user || !videoRef.current) return;

    setLoading(true);
    setStep('processing');

    try {
      // Detect face from video
      const detection = await detectFace(videoRef.current);
      
      if (!detection) {
        throw new Error('Không phát hiện khuôn mặt. Vui lòng thử lại.');
      }

      // Compare with Face0 (base face)
      if (user.faceImageUrl) {
        const baseFaceImg = new Image();
        baseFaceImg.crossOrigin = 'anonymous'; // Fix CORS
        baseFaceImg.src = user.faceImageUrl;
        await new Promise((resolve, reject) => {
          baseFaceImg.onload = resolve;
          baseFaceImg.onerror = reject;
        });

        const baseFaceDetection = await detectFace(baseFaceImg);
        if (baseFaceDetection) {
          const similarity = compareFaces(detection.descriptor, baseFaceDetection.descriptor);
          
          if (similarity < 0.6) {
            throw new Error('Khuôn mặt không khớp với Face0.');
          }
        }
      }

      // Compare with Face1 (first check-in)
      if (user.face1Url) {
        const face1Img = new Image();
        face1Img.crossOrigin = 'anonymous'; // Fix CORS
        face1Img.src = user.face1Url;
        await new Promise((resolve, reject) => {
          face1Img.onload = resolve;
          face1Img.onerror = reject;
        });

        const face1Detection = await detectFace(face1Img);
        if (face1Detection) {
          const similarity = compareFaces(detection.descriptor, face1Detection.descriptor);
          
          if (similarity < 0.6) {
            throw new Error('Khuôn mặt không khớp với Face1.');
          }
        }
      }

      // Capture Face2 image
      const imageBlob = await captureImageFromVideo(videoRef.current);
      
      // Upload Face2 to imgbb
      const timestamp = Date.now();
      let face2Url = '';
      
      if (isImageUploadConfigured()) {
        try {
          face2Url = await uploadImageToImgbb(
            imageBlob, 
            `${user.username}_face2_${timestamp}`
          );
        } catch (uploadError) {
          console.error('Face2 upload error:', uploadError);
          toast.error('Không thể upload ảnh Face2');
        }
      }

      // Update user with Face2 URL
      const { updateDoc, doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/config/firebase');
      const { logActivity } = await import('@/services/activityLog');
      
      if (face2Url) {
        await updateDoc(doc(db, 'users', user.id), {
          face2Url: face2Url,
          updatedAt: Date.now()
        });
      }

      // Find and reset captchaSuccessCount in current session
      const sessionsQuery = await import('firebase/firestore').then(m => m.query);
      const collection = await import('firebase/firestore').then(m => m.collection);
      const where = await import('firebase/firestore').then(m => m.where);
      const getDocs = await import('firebase/firestore').then(m => m.getDocs);
      
      const q = sessionsQuery(collection(db, 'sessions'), where('userId', '==', user.id), where('status', '==', 'online'));
      const sessionsSnap = await getDocs(q);
      
      if (!sessionsSnap.empty) {
        const sessionDoc = sessionsSnap.docs[0];
        const currentCount = sessionDoc.data().faceVerificationCount || 0;
        
        await updateDoc(doc(db, 'sessions', sessionDoc.id), {
          captchaSuccessCount: 0, // Reset counter after face verification
          faceVerificationCount: currentCount + 1,
          face2Url: face2Url,
          updatedAt: Date.now()
        });

        // Log activity
        await logActivity(
          user.id,
          user.username,
          user.role,
          user.department,
          user.position,
          'face_verify',
          `Face verification successful (${currentCount + 1} times)`,
          user.id,
          user.role,
          user.department
        );
      }

      setStep('success');
      soundManager.playSuccess();
      toast.success('Xác thực khuôn mặt thành công!');
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (error: any) {
      console.error('Face verification error:', error);
      setError(error.message);
      setStep('error');
      soundManager.playError();
      toast.error(error.message);
      
      setTimeout(() => {
        onFailure();
        onClose();
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xác Thực Khuôn Mặt (Face2)">
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-gray-300 mb-4">
            Vui lòng nhìn vào funnel để xác thực khuôn mặt
          </p>
          <p className="text-sm text-gray-400">
            Hệ thống sẽ so sánh với Face0 và Face1 đã lưu
          </p>
        </div>

        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 object-cover"
          />
          
          <AnimatePresence>
            {step === 'processing' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
              >
                <div className="text-center">
                  <LoadingSpinner size="lg" />
                  <p className="text-white mt-4">Đang xử lý...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {step === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center"
            >
              <div className="text-center text-green-400">
                <CheckIcon className="w-16 h-16 mx-auto mb-4" />
                <p className="text-xl font-semibold">Xác thực thành công!</p>
              </div>
            </motion.div>
          )}

          {step === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center"
            >
              <div className="text-center text-red-400">
                <XIcon className="w-16 h-16 mx-auto mb-4" />
                <p className="text-xl font-semibold">Xác thực thất bại!</p>
                <p className="text-sm mt-2">{error}</p>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleVerify}
            disabled={loading || step === 'processing'}
            className="flex-1"
          >
            <CameraIcon className="w-4 h-4 mr-2" />
            Xác Thực Face2
          </Button>
        </div>
      </div>
    </Modal>
  );
};
