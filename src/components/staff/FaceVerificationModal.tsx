import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CameraIcon, CheckIcon, XIcon } from '@/components/icons';
import { detectFace, compareFaces, loadFaceDetectionModels } from '@/utils/faceRecognition';
import { uploadImageToImgbb, isImageUploadConfigured } from '@/utils/imageUpload';
import { soundManager } from '@/utils/sound';
import { checkCameraPermission, requestCameraPermission } from '@/utils/cameraPermission';
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'camera' | 'processing' | 'success' | 'error'>('camera');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(180); // Default 180 seconds
  const [timeoutSeconds, setTimeoutSeconds] = useState(180);

  useEffect(() => {
    if (isOpen) {
      // Load timeout from system settings
      const loadSettings = async () => {
        try {
          const { getSystemSettings } = await import('@/services/systemSettingsService');
          const settings = await getSystemSettings();
          const timeout = settings.faceVerification.timeoutSeconds || 180;
          setTimeoutSeconds(timeout);
          setTimeLeft(timeout);
        } catch (error) {
          console.error('Error loading settings:', error);
          setTimeoutSeconds(180);
          setTimeLeft(180);
        }
      };

      loadSettings();

      // Reset state when modal opens
      setStep('camera');
      setError('');
      setLoading(false);

      // Check camera permission before starting camera
      checkAndStartCamera();
    } else {
      stopCamera();
      // Clear timeout when modal closes
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    // Handle page unload to trigger failure if modal is open
    const handleBeforeUnload = () => {
      if (isOpen) {
        onFailure();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      stopCamera();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isOpen]);

  // Countdown timer effect
  useEffect(() => {
    if (isOpen && step === 'camera' && !loading) {
      // Start countdown
      timeoutRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timeout reached
            if (timeoutRef.current) {
              clearInterval(timeoutRef.current);
              timeoutRef.current = null;
            }
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isOpen, step, loading]);

  const handleTimeout = async () => {
    setStep('error');
    setError('Face Verification timeout! You will be checked out.');
    soundManager.playError();
    toast.error('Face Verification timeout!');

    // Create error report for timeout
    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/config/firebase');

      await addDoc(collection(db, 'errorReports'), {
        userId: user.id,
        username: user.username,
        department: user.department,
        position: user.position,
        type: 'face_verification_timeout',
        attempts: 0,
        timestamp: serverTimestamp(),
        status: 'pending',
        description: `Face Verification timeout after ${timeoutSeconds} seconds`,
        face0Url: user.faceImageUrl,
        face1Url: user.face1Url
      });
    } catch (error) {
      console.error('Error creating timeout error report:', error);
    }

    setTimeout(() => {
      onFailure();
      onClose();
    }, 2000);
  };

  const checkAndStartCamera = async () => {
    try {
      // Check camera permission first
      const hasPermission = await checkCameraPermission();

      if (!hasPermission) {
        // Request permission
        try {
          await requestCameraPermission();
          toast.success('Camera permission granted');
        } catch (error: any) {
          console.error('Error requesting camera permission:', error);
          toast.error('Camera permission is required for Face ID verification');
          setError('Camera permission denied');
          setStep('error');
          return;
        }
      }

      // Start camera after permission is granted
      await startCamera();
    } catch (error: any) {
      console.error('Error checking/starting camera:', error);
      toast.error('Unable to access camera');
      setError('Camera unavailable');
      setStep('error');
    }
  };

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
      toast.error('Unable to access camera');
      setError('Camera unavailable');
      setStep('error');
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

  const handleSkip = async () => {
    // Create error report when user skips Face Verification
    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/config/firebase');

      await addDoc(collection(db, 'errorReports'), {
        userId: user.id,
        username: user.username,
        department: user.department,
        position: user.position,
        type: 'face_verification_skipped',
        attempts: 0,
        timestamp: serverTimestamp(),
        status: 'pending',
        description: 'User skipped Face Verification and was checked out',
        face0Url: user.faceImageUrl,
        face1Url: user.face1Url
      });

      // Log activity
      const { logActivity } = await import('@/services/activityLog');
      await logActivity(
        user.id,
        user.username,
        user.role,
        user.department,
        user.position,
        'error_report',
        'Face Verification skipped - Error report created',
        user.id,
        user.role,
        user.department
      );
    } catch (error) {
      console.error('Error creating skip error report:', error);
    }

    // Call onFailure to trigger checkout
    onFailure();
  };

  const handleVerify = async () => {
    if (!user || !videoRef.current) return;

    setLoading(true);
    setStep('processing');

    try {
      // Detect face from video
      const detection = await detectFace(videoRef.current);
      
      if (!detection) {
        throw new Error('No face detected. Please try again.');
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
            throw new Error('Face does not match Face0.');
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
            throw new Error('Face does not match Face1.');
          }
        }
      }

      // Capture Face2 image
      const imageBlob = await captureImageFromVideo(videoRef.current);

      // Only upload Face2 if user doesn't have it yet (first captcha verification)
      // Face2 is used for captcha verification tracking
      let face2Url = user.face2Url || '';

      if (!user.face2Url && isImageUploadConfigured()) {
        // First captcha verification - upload and save Face2
        try {
          toast.loading('Saving verification image...', { id: 'upload-face2' });
          const timestamp = getVietnamTimestamp();
          face2Url = await uploadImageToImgbb(
            imageBlob,
            `${user.username}_face2_${timestamp}`
          );
          toast.dismiss('upload-face2');

          // Save Face2 to user document
          const { updateDoc, doc } = await import('firebase/firestore');
          const { db } = await import('@/config/firebase');
          const { getVietnamTimestamp } = await import('@/utils/time');

          await updateDoc(doc(db, 'users', user.id), {
            face2Url: face2Url,
            updatedAt: getVietnamTimestamp()
          });

          console.log('✅ Face2 saved for first captcha verification');
        } catch (uploadError) {
          console.error('Face2 upload error:', uploadError);
          // Don't block captcha verification if upload fails
        }
      } else if (user.face2Url) {
        console.log('✅ Using existing Face2 - No upload needed');
      }

      // Continue with captcha verification
      const { updateDoc, doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/config/firebase');
      const { logActivity } = await import('@/services/activityLog');

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
          updatedAt: getVietnamTimestamp()
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
      // Toast notification is handled in parent component
      
      setTimeout(() => {
        onSuccess(); // onSuccess will close the modal and show toast
      }, 1500);

    } catch (error: any) {
      console.error('Face verification error:', error);
      setError(error.message);
      setStep('error');
      soundManager.playError();
      toast.error(error.message);
      
      // Create error report for admin
      try {
        const imageBlob = await captureImageFromVideo(videoRef.current!);
        const timestamp = getVietnamTimestamp();
        let failedImageUrl = '';
        
        // Upload failed image
        if (isImageUploadConfigured()) {
          try {
            failedImageUrl = await uploadImageToImgbb(
              imageBlob, 
              `${user.username}_face2_failed_${timestamp}`
            );
          } catch (uploadError) {
            console.error('Failed image upload error:', uploadError);
          }
        }
        
        // Create error report in Firestore
        const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('@/config/firebase');
        
        await addDoc(collection(db, 'errorReports'), {
          userId: user.id,
          username: user.username,
          department: user.department,
          position: user.position,
          type: 'face_verification_failed',
          failedImageUrl: failedImageUrl,
          attempts: 1,
          timestamp: serverTimestamp(),
          status: 'pending',
          description: `Face2 verification failed: ${error.message}`,
          face0Url: user.faceImageUrl,
          face1Url: user.face1Url
        });
        
        // Log activity
        const { logActivity } = await import('@/services/activityLog');
        await logActivity(
          user.id,
          user.username,
          user.role,
          user.department,
          user.position,
          'error_report',
          `Face verification failed - Error report created`,
          user.id,
          user.role,
          user.department
        );
      } catch (reportError) {
        console.error('Error creating error report:', reportError);
      }
      
      setTimeout(() => {
        onFailure();
        onClose();
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Face Verification (Face2)">
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-gray-300 mb-4">
            Please look at the camera to verify your face
          </p>
          <p className="text-sm text-gray-400">
            System will compare with saved Face0 and Face1
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="flex items-center justify-between bg-dark-700 rounded-lg p-3 mb-4">
          <span className="text-sm text-gray-300">Time Remaining:</span>
          <span className={`text-lg font-bold ${timeLeft <= 30 ? 'text-red-400' : 'text-primary-400'}`}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>

        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 object-contain"
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
                  <p className="text-white mt-4">Processing...</p>
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
                <p className="text-xl font-semibold">Verification Successful!</p>
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
                <p className="text-xl font-semibold">Verification Failed!</p>
                <p className="text-sm mt-2">{error}</p>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="danger"
            onClick={handleSkip}
            className="flex-1"
            disabled={loading}
          >
            Skip Verification (Check Out)
          </Button>
          <Button
            onClick={handleVerify}
            disabled={loading || step === 'processing'}
            className="flex-1"
          >
            <CameraIcon className="w-4 h-4 mr-2" />
            Verify Face2
          </Button>
        </div>
      </div>
    </Modal>
  );
};
