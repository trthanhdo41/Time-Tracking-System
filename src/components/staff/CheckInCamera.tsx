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
import { verifyMultipleFrames } from '@/utils/antiSpoofing';
import { detectNaturalMotion } from '@/utils/motionDetection';
import { listenToSystemSettings, SystemSettings } from '@/services/systemSettingsService';

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
  const [faceBox, setFaceBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const faceImageRef = useRef<HTMLImageElement | null>(null);
  const MAX_ATTEMPTS = 2;

  // Listen to system settings
  useEffect(() => {
    const unsubscribe = listenToSystemSettings((newSettings) => {
      setSettings(newSettings);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    startCamera();
    preloadFaceImage();
    return () => {
      stopCamera();
      if (detectionIntervalRef.current) {
        cancelAnimationFrame(detectionIntervalRef.current);
      }
    };
  }, []);

  // Show toast when no face detected for 3 seconds
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (!faceDetected && step === 'camera') {
      timeoutId = setTimeout(() => {
        toast('No face detected', {
          icon: '○',
          style: {
            background: 'rgba(59, 130, 246, 0.9)',
            color: '#fff',
          },
        });
      }, 3000);
    } else {
      toast.dismiss();
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [faceDetected, step]);

  const preloadFaceImage = async () => {
    if (!user?.faceImageUrl) return;
    
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = user.faceImageUrl;
      
      await Promise.race([
        new Promise((resolve, reject) => {
          img.onload = () => {
            console.log('Face image preloaded successfully');
            faceImageRef.current = img;
            resolve(null);
          };
          img.onerror = reject;
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Preload timeout')), 10000)
        )
      ]);
    } catch (error) {
      console.warn('Failed to preload face image, will load on-demand:', error);
      // Don't throw - just log warning and continue
      // Image will be loaded on-demand during check-in
    }
  };

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
      // Use requestAnimationFrame for smoother 60fps tracking
      const detectLoop = async () => {
        if (videoRef.current && step === 'camera') {
          const detection = await detectFace(videoRef.current);
          setFaceDetected(!!detection);
          
          // Get bounding box from Face-api.js detection
          if (detection && videoRef.current) {
            // Face-api.js returns detection with box property
            const detectionAny = detection as any;
            const box = detectionAny.detection?.box || detectionAny.box;
            
            if (box && typeof box.x === 'number' && typeof box.y === 'number' && videoRef.current.videoWidth) {
              const videoWidth = videoRef.current.videoWidth;
              const displayWidth = videoRef.current.clientWidth;
              const videoHeight = videoRef.current.videoHeight;
              const displayHeight = videoRef.current.clientHeight;
              
              const scaleX = displayWidth / videoWidth;
              const scaleY = displayHeight / videoHeight;
              
              // Scale detection box 1.2x to make it more visible
              const boxScale = 1.2;
              const scaledX = box.x * scaleX - (box.width * scaleX * (boxScale - 1)) / 2;
              const scaledY = box.y * scaleY - (box.height * scaleY * (boxScale - 1)) / 2;
              const scaledWidth = box.width * scaleX * boxScale;
              const scaledHeight = box.height * scaleY * boxScale;
              
              // Flip horizontally (video is mirrored)
              const flippedX = displayWidth - scaledX - scaledWidth;
              
              setFaceBox({
                x: flippedX,
                y: scaledY,
                width: scaledWidth,
                height: scaledHeight
              });
            } else {
              setFaceBox(null);
            }
          } else {
            setFaceBox(null);
          }
        }
        // Continue loop
        detectionIntervalRef.current = window.requestAnimationFrame(detectLoop) as any;
      };
      
      // Start the detection loop
      detectLoop();
        };
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Unable to access camera. Please check permissions.');
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
      // STEP 1: Anti-Spoofing Check - Motion Detection
      const motionEnabled = settings?.motionDetection?.enabled ?? true;
      if (motionEnabled) {
        const motionMin = settings?.motionDetection?.motionMin ?? 2.0;
        const motionMax = settings?.motionDetection?.motionMax ?? 8.0;
        
        toast.loading('Checking natural motion...', { id: 'motion-check' });
        const motionResult = await detectNaturalMotion(videoRef.current, 2000, 200, motionMin, motionMax);
        toast.dismiss('motion-check');
        
        if (!motionResult.hasMotion) {
          toast.error(`Fake image detected: ${motionResult.reason}`);
          soundManager.playError();
          
          await logActivity(
            user.id,
            user.username,
            user.role,
            user.department,
            user.position,
            'face_verification_failed',
            `Anti-spoofing: ${motionResult.reason}`,
            user.id,
            user.role,
            user.department,
            { spoofingType: 'motion', motionScore: motionResult.motionScore }
          );
          
          setLoading(false);
          setStep('camera');
          return;
        }
      }
      
      // STEP 2: Multi-frame Image Quality Check
      const antiSpoofingEnabled = settings?.antiSpoofing?.enabled ?? true;
      if (antiSpoofingEnabled) {
        const sharpnessMin = settings?.antiSpoofing?.sharpnessMin ?? 150;
        const contrastMin = settings?.antiSpoofing?.contrastMin ?? 40;
        const colorfulnessMin = settings?.antiSpoofing?.colorfulnessMin ?? 30;
        const textureScoreMax = settings?.antiSpoofing?.textureScoreMax ?? 0.15;
        const confidenceThreshold = settings?.antiSpoofing?.confidenceThreshold ?? 0.55;
        
        toast.loading('Checking image quality...', { id: 'quality-check' });
        const qualityResult = await verifyMultipleFrames(
          videoRef.current, 
          3, 
          300,
          sharpnessMin,
          contrastMin,
          colorfulnessMin,
          textureScoreMax,
          confidenceThreshold
        );
        toast.dismiss('quality-check');
        
        if (!qualityResult.isReal) {
          toast.error(`Fake image detected: ${qualityResult.reason}`);
          soundManager.playError();
          
          await logActivity(
            user.id,
            user.username,
            user.role,
            user.department,
            user.position,
            'face_verification_failed',
            `Anti-spoofing: ${qualityResult.reason}`,
            user.id,
            user.role,
            user.department,
            { 
              spoofingType: 'quality', 
              confidence: qualityResult.confidence
            }
          );
          
          setLoading(false);
          setStep('camera');
          return;
        }
      }
      
      // STEP 3: Capture image after passing anti-spoofing
      const imageBlob = await captureImageFromVideo(videoRef.current);
      
      // STEP 4: Detect face from video
      toast.loading('Detecting face...', { id: 'face-detect' });
      const detection = await detectFace(videoRef.current);
      toast.dismiss('face-detect');
      
      if (!detection) {
        toast.error('No face detected. Please try again.');
        setLoading(false);
        setStep('camera');
        return;
      }

      // Verify with Face0 if exists
      if (user.faceImageUrl) {
        // Use preloaded image if available, otherwise load it now
        let baseFaceImg: HTMLImageElement;
        
        if (faceImageRef.current) {
          console.log('Using preloaded face image');
          baseFaceImg = faceImageRef.current;
        } else {
          console.log('Loading face image on-demand...');
          baseFaceImg = new Image();
          baseFaceImg.crossOrigin = 'anonymous'; // Fix CORS issue
          baseFaceImg.src = user.faceImageUrl;
          
          // Add timeout to prevent infinite waiting
          await Promise.race([
            new Promise((resolve, reject) => {
              baseFaceImg.onload = () => {
                console.log('Face image loaded successfully');
                resolve(null);
              };
              baseFaceImg.onerror = (error) => {
                console.error('Face image load error:', error);
                reject(new Error('Failed to load face image'));
              };
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Face image load timeout')), 15000)
            )
          ]);
        }

        const baseFaceDetection = await detectFace(baseFaceImg);
        if (baseFaceDetection) {
          const similarity = compareFaces(detection.descriptor, baseFaceDetection.descriptor);
          const threshold = settings?.faceVerification.similarityThreshold || 0.7;
          
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
            setErrorMessage(`Face mismatch! (Attempt ${newAttempts}/${MAX_ATTEMPTS})`);
            toast.error(`Please try again. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
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
          toast.error('Unable to upload image. Please try again.');
          setLoading(false);
          setStep('camera');
          return;
        }
      }

      // Create session (this already logs the activity in sessionService)
      const session = await createCheckInSession(user, face1Url);
      setSession(session);
      setStatus('online');

      // Update user's face1Url if not set
      if (!user.face1Url && face1Url) {
        // TODO: Update user's face1Url in Firestore
      }

      soundManager.playSuccess();
      setStep('success');
      toast.success('Check in successful!');

      // Close after 2 seconds
      setTimeout(() => {
        stopCamera();
        onSuccess();
      }, 2000);

    } catch (error) {
      console.error('Check in error:', error);
      toast.error('An error occurred. Please try again.');
      setLoading(false);
      setStep('camera');
    }
  };

  const handleMaxAttemptsReached = async (imageBlob: Blob) => {
    if (!user) return;
    
    try {
      setStep('failed');
      setErrorMessage('Verification failed 2 times! Sending report...');
      toast.error('Verification failed! Report sent to Admin.');

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
      toast.error('Unable to send error report');
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
    <div className="fixed inset-0 z-50 bg-dark-900 flex items-center justify-center overflow-hidden">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-accent-500/10" />
      
      <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
        {/* Camera Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-dark-800 shadow-2xl w-full h-full max-h-[calc(100vh-180px)]"
        >
          {/* Video */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain"
            style={{ transform: 'scaleX(-1)' }}
          />

          {/* Header Text Overlay - Inside Camera */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-0 right-0 flex items-center justify-center pointer-events-none z-10"
          >
            <div className="text-center bg-dark-900/80 backdrop-blur-md px-6 py-3 rounded-xl border border-white/10">
              <h1 className="text-2xl font-bold text-white mb-1">
                Check In - Face Verification
              </h1>
              <p className="text-gray-300 text-sm">
                Please position your face in the frame
              </p>
            </div>
          </motion.div>

          {/* Face Detection Overlay */}
          <AnimatePresence>
            {step === 'camera' && (
              <>
                {/* Real Face Detection Box from Face-api.js */}
                {faceBox && (
                  <div
                    className="absolute pointer-events-none transition-none"
                    style={{
                      left: `${faceBox.x}px`,
                      top: `${faceBox.y}px`,
                      width: `${faceBox.width}px`,
                      height: `${faceBox.height}px`,
                      willChange: 'left, top, width, height',
                    }}
                  >
                    <div className="absolute inset-0 border-4 border-green-500 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                    
                    {/* User name badge at top of box */}
                    <div className="absolute -top-8 left-0 bg-green-500 px-3 py-1 rounded-lg shadow-lg">
                      <p className="text-white text-sm font-semibold">{user?.username || 'User'}</p>
                    </div>
                    
                    {/* Status text inside box */}
                    <div className="absolute -bottom-8 left-0 bg-green-500 px-3 py-1 rounded-lg shadow-lg">
                      <p className="text-white text-sm font-semibold">✓ Face Detected</p>
                    </div>
                  </div>
                )}
              </>
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
                    Processing...
                  </p>
                  <p className="text-gray-400 mt-2">
                    Please wait a moment
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
                    Check In Successful!
                  </h2>
                  <p className="text-xl text-white/90">
                    Have a productive day
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
                    Verification Failed!
                  </h2>
                  <p className="text-xl text-white/90 mb-2">
                    Maximum attempts exceeded
                  </p>
                  <p className="text-lg text-white/80">
                    Report sent to Admin
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons - Inside Camera */}
          {step === 'camera' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-8 left-0 right-0 flex justify-center gap-4 z-[60] px-4"
            >
              <Button
                onClick={handleCheckIn}
                disabled={loading || !faceDetected}
                size="lg"
                variant="primary"
                className="gap-2 px-8 py-4 text-lg font-semibold"
              >
                <CheckInIcon className="w-6 h-6" />
                {loading ? 'Processing...' : 'Check In'}
              </Button>
              <Button
                onClick={handleCancel}
                variant="secondary"
                size="lg"
                className="gap-2 px-8 py-4 text-lg font-semibold"
                disabled={loading}
              >
                <XIcon className="w-5 h-5" />
                Cancel
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Retry Button - Show when failed */}
        {step === 'failed' && attempts < MAX_ATTEMPTS && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex flex-col items-center gap-4"
          >
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 max-w-md">
                <p className="text-red-400 text-center font-medium text-sm">{errorMessage}</p>
              </div>
            )}
            <Button
              onClick={handleRetry}
              size="md"
              variant="primary"
              className="gap-2"
            >
              <CameraIcon className="w-5 h-5" />
              Retry ({MAX_ATTEMPTS - attempts} attempts left)
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

