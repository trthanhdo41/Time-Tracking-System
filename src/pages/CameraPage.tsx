import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StaffNavigation } from '@/components/layout/StaffNavigation';
import { 
  CameraIcon, 
  ImageIcon,
  TrashIcon,
  EyeIcon,
  MonitorIcon
} from '@/components/icons';
import { useAuthStore } from '@/store/authStore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { createImageDeleteRequest } from '@/services/imageDeleteService';
import { formatDate, formatTime } from '@/utils/time';
import toast from 'react-hot-toast';

interface CapturedImage {
  id: string | number;
  url: string;
  timestamp: number;
  type: string;
  sessionId?: string;
}

export const CameraPage: React.FC = () => {
  const { user } = useAuthStore();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showDeleteRequest, setShowDeleteRequest] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load real captured images from Firebase
  useEffect(() => {
    if (user) {
      loadCapturedImages();
    }
  }, [user]);

  const loadCapturedImages = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('🔍 Loading images for user:', user.id);
      
      // Temporarily remove orderBy to avoid index requirement
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('userId', '==', user.id)
      );
      
      const snapshot = await getDocs(sessionsQuery);
      const images: CapturedImage[] = [];
      
      snapshot.forEach((doc) => {
        const session = doc.data();
        
        // Add check-in image
        if (session.faceImageUrl) {
          images.push({
            id: `${doc.id}_checkin`,
            url: session.faceImageUrl,
            timestamp: session.checkInTime || Date.now(),
            type: 'Check In',
            sessionId: doc.id
          });
        }
        
        // Add face1 image if different
        if (session.face1Url && session.face1Url !== session.faceImageUrl) {
          images.push({
            id: `${doc.id}_face1`,
            url: session.face1Url,
            timestamp: session.checkInTime || Date.now(),
            type: 'Check In',
            sessionId: doc.id
          });
        }
      });
      
      // Sort by timestamp descending (newest first) on client-side
      images.sort((a, b) => b.timestamp - a.timestamp);
      
      console.log('✅ Loaded images:', images.length);
      setCapturedImages(images);
    } catch (error) {
      console.error('Error loading images:', error);
      toast.error('Unable to load image list');
      setCapturedImages([]); // Set empty on error
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      console.log('🎥 Starting camera...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      
      console.log('📹 Stream obtained:', stream);
      
      if (videoRef.current) {
        console.log('🎬 Video ref exists, setting srcObject');
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for metadata to load
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve;
          }
        });
        
        // Ensure video plays
        await videoRef.current.play();
        
        setIsCameraActive(true);
        console.log('✅ Camera started successfully, isCameraActive set to true');
        toast.success('Camera activated');
      } else {
        console.error('❌ Video ref is null');
        toast.error('Error: Video element does not exist');
      }
    } catch (error) {
      console.error('❌ Camera error:', error);
      toast.error('Unable to access camera: ' + (error as Error).message);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsCameraActive(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (!deleteReason.trim()) {
      toast.error('Please enter reason for deletion');
      return;
    }

    if (!user || !selectedImage) return;

    try {
      await createImageDeleteRequest(user.id, selectedImage, deleteReason, user);
      toast.success('Image deletion request sent to Admin');
      setShowDeleteRequest(false);
      setSelectedImage(null);
      setDeleteReason('');
    } catch (error: any) {
      toast.error(error.message || 'Unable to send request');
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <StaffNavigation />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="p-3 rounded-xl bg-primary-500/20">
            <CameraIcon className="w-8 h-8 text-primary-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold gradient-text">Camera & Images</h1>
            <p className="text-gray-400">Monitor and manage your images</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Camera Feed */}
          <Card>
            <CardHeader 
              title="Live Camera" 
              icon={<MonitorIcon />}
              action={
                <div className="flex gap-2">
                  {isCameraActive && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        stopCamera();
                        setTimeout(() => startCamera(), 500);
                      }}
                    >
                      Reconnect
                    </Button>
                  )}
                  <Button
                    variant={isCameraActive ? 'danger' : 'primary'}
                    size="sm"
                    onClick={isCameraActive ? stopCamera : startCamera}
                  >
                    {isCameraActive ? 'Turn Off' : 'Turn On'} Camera
                  </Button>
                </div>
              }
            />

            <div className="relative aspect-video bg-dark-800 rounded-xl overflow-hidden">
              {/* Video element - always rendered */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-contain ${!isCameraActive ? 'hidden' : ''}`}
                style={{ transform: 'scaleX(-1)' }}
              />
              
              {/* Recording Indicator */}
              {isCameraActive && (
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-4 right-4 flex items-center gap-2 glass px-3 py-2 rounded-lg"
                >
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="text-sm font-medium">LIVE</span>
                </motion.div>
              )}
              
              {/* Placeholder when camera is off */}
              {!isCameraActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <CameraIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Camera is not active</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 glass p-4 rounded-xl">
              <p className="text-sm text-gray-400">
                📹 Camera is used for face verification and monitoring
              </p>
            </div>
          </Card>

          {/* Captured Images */}
          <Card>
            <CardHeader 
              title="Captured Images" 
              icon={<ImageIcon />}
              subtitle="View only, cannot delete directly"
            />

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">Loading...</p>
                </div>
              ) : capturedImages.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No images yet</p>
                  <p className="text-sm text-gray-500 mt-2">Images will be automatically captured during check-in</p>
                </div>
              ) : capturedImages.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass p-3 rounded-xl hover:bg-white/10 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={image.url} 
                        alt={`Capture ${image.id}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                        <EyeIcon className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{image.type}</p>
                      <p className="text-sm text-gray-400">
                        {formatDate(image.timestamp)} {formatTime(image.timestamp)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSelectedImage(image.url)}
                        className="p-2 rounded-lg hover:bg-primary-500/20 text-primary-400 transition-colors"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setSelectedImage(image.url);
                          setShowDeleteRequest(true);
                        }}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Image Preview Modal */}
      <Modal
        isOpen={!!selectedImage && !showDeleteRequest}
        onClose={() => setSelectedImage(null)}
        title="View Image"
        size="md"
      >
        {selectedImage && (
          <div className="space-y-4">
            <img 
              src={selectedImage} 
              alt="Preview"
              className="w-full rounded-xl"
            />
            <Button
              variant="danger"
              icon={<TrashIcon />}
              onClick={() => setShowDeleteRequest(true)}
              className="w-full"
            >
              Request Deletion
            </Button>
          </div>
        )}
      </Modal>

      {/* Delete Request Modal */}
      <Modal
        isOpen={showDeleteRequest}
        onClose={() => {
          setShowDeleteRequest(false);
          setDeleteReason('');
        }}
        title="Request Image Deletion"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-400">
            Please enter reason for deleting this image. Request will be sent to Admin for approval.
          </p>

          <textarea
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder="Enter reason for deletion..."
            className="input-field w-full h-32 resize-none"
          />

          <div className="glass p-4 rounded-xl">
            <p className="text-sm text-yellow-400">
              ⚠️ Images will only be deleted after Admin approval
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteRequest(false);
                setDeleteReason('');
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteRequest}
              className="flex-1"
            >
              Send Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

