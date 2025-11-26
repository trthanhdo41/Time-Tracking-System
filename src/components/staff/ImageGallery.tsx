import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TrashIcon, EyeIcon, DownloadIcon } from '@/components/icons';
import { ImageDeleteRequestModal } from './ImageDeleteRequestModal';
import { getUserImageDeleteRequests } from '@/services/imageDeleteService';
import { ImageDeleteRequest } from '@/types';
import { formatDate, formatTime } from '@/utils/time';
import toast from 'react-hot-toast';

interface ImageItem {
  id: string;
  url: string;
  type: 'face0' | 'face1' | 'face2' | 'face_verify' | 'check_out';
  timestamp: number;
  sessionId?: string;
}

interface ImageGalleryProps {
  userId: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ userId }) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [deleteRequests, setDeleteRequests] = useState<ImageDeleteRequest[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImages();
    loadDeleteRequests();
  }, [userId]);

  const loadImages = async () => {
    try {
      setLoading(true);
      // Fetch real images from Firebase sessions
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/config/firebase');
      
      // Remove orderBy to avoid index requirement - sort on client-side instead
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(sessionsQuery);
      const fetchedImages: ImageItem[] = [];
      
      snapshot.forEach((doc) => {
        const session = doc.data();

        // Add Face0 (base image from user profile) if exists
        if (session.faceImageUrl) {
          fetchedImages.push({
            id: `${doc.id}_face0`,
            url: session.faceImageUrl,
            type: 'face0',
            timestamp: session.checkInTime,
            sessionId: doc.id
          });
        }

        // Add Face1 (check-in image) if exists and different from Face0
        if (session.face1Url && session.face1Url !== session.faceImageUrl) {
          fetchedImages.push({
            id: `${doc.id}_face1`,
            url: session.face1Url,
            type: 'face1',
            timestamp: session.checkInTime,
            sessionId: doc.id
          });
        }

        // Add Face2 (periodic verification image) if exists
        if (session.face2Url) {
          fetchedImages.push({
            id: `${doc.id}_face2`,
            url: session.face2Url,
            type: 'face2',
            timestamp: session.checkInTime,
            sessionId: doc.id
          });
        }
      });
      
      // Sort by timestamp descending (newest first) on client-side
      fetchedImages.sort((a, b) => b.timestamp - a.timestamp);
      
      setImages(fetchedImages);
    } catch (error) {
      console.error('Error loading images:', error);
      toast.error('Unable to load image list');
      setImages([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadDeleteRequests = async () => {
    try {
      const requests = await getUserImageDeleteRequests(userId);
      setDeleteRequests(requests);
    } catch (error) {
      console.error('Error loading delete requests:', error);
    }
  };

  const handleDeleteRequest = (image: ImageItem) => {
    setSelectedImage(image);
    setShowDeleteModal(true);
  };

  const getImageTypeLabel = (type: string) => {
    switch (type) {
      case 'face0':
        return 'Face0 (Base Image)';
      case 'face1':
        return 'Face1 (Check-in)';
      case 'face2':
        return 'Face2 (Verification)';
      case 'face_verify':
        return 'Verification Image';
      case 'check_out':
        return 'Check Out Image';
      default:
        return 'Other Image';
    }
  };

  const getImageTypeColor = (type: string) => {
    switch (type) {
      case 'face0':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'face1':
        return 'border-green-500 bg-green-500/10';
      case 'face2':
        return 'border-blue-500 bg-blue-500/10';
      case 'face_verify':
        return 'border-blue-500 bg-blue-500/10';
      case 'check_out':
        return 'border-purple-500 bg-purple-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getDeleteRequestStatus = (imageUrl: string) => {
    const request = deleteRequests.find(req => req.imageUrl === imageUrl);
    if (!request) return null;
    
    switch (request.status) {
      case 'pending':
        return { status: 'pending', text: 'Pending Approval', color: 'text-yellow-400' };
      case 'approved':
        return { status: 'approved', text: 'Approved', color: 'text-green-400' };
      case 'rejected':
        return { status: 'rejected', text: 'Rejected', color: 'text-red-400' };
      default:
        return null;
    }
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Image downloaded');
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading images...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold text-white">Image Gallery</h3>
          <p className="text-gray-400">
            Total {images.length} images captured
          </p>
        </CardHeader>
        
        <div className="p-6">
          {images.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">📷</div>
              <p className="text-gray-400">No images captured yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image, index) => {
                const deleteStatus = getDeleteRequestStatus(image.url);
                
                return (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative rounded-lg overflow-hidden border ${getImageTypeColor(image.type)}`}
                  >
                    <div className="aspect-video bg-gray-800">
                      <img
                        src={image.url}
                        alt={getImageTypeLabel(image.type)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">
                          {getImageTypeLabel(image.type)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(image.timestamp)}
                        </span>
                      </div>
                      
                      {deleteStatus && (
                        <div className={`text-xs mb-2 ${deleteStatus.color}`}>
                          {deleteStatus.text}
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedImage(image)}
                          className="flex-1"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadImage(image.url, `image_${image.id}.jpg`)}
                          className="flex-1"
                        >
                          <DownloadIcon className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRequest(image)}
                          disabled={deleteStatus?.status === 'pending'}
                          className="flex-1 text-red-400 border-red-400 hover:bg-red-400/10"
                        >
                          <TrashIcon className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Image Preview Modal */}
      <Modal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        title={selectedImage ? getImageTypeLabel(selectedImage.type) : ''}
      >
        {selectedImage && (
          <div className="space-y-4">
            <div className="text-center">
              <img
                src={selectedImage.url}
                alt="Preview"
                className="max-w-full max-h-96 mx-auto rounded-lg"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Image Type:</span>
                <span className="text-white ml-2">{getImageTypeLabel(selectedImage.type)}</span>
              </div>
              <div>
                <span className="text-gray-400">Time:</span>
                <span className="text-white ml-2">
                  {formatDate(selectedImage.timestamp)} {formatTime(selectedImage.timestamp)}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setSelectedImage(null)}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  downloadImage(selectedImage.url, `image_${selectedImage.id}.jpg`);
                  setSelectedImage(null);
                }}
                className="flex-1"
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Request Modal */}
      <ImageDeleteRequestModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedImage(null);
        }}
        imageUrl={selectedImage?.url || ''}
        imageType={selectedImage ? getImageTypeLabel(selectedImage.type) : ''}
      />
    </div>
  );
};
