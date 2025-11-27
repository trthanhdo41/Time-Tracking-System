import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ImageIcon, EyeIcon, DownloadIcon, SearchIcon, FaceIcon, HistoryIcon } from '@/components/icons';
import { getAllUsers } from '@/services/userService';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuthStore } from '@/store/authStore';
import { getVietnamTimestamp, formatDate, formatTime } from '@/utils/time';
import toast from 'react-hot-toast';

interface ImageData {
  id: string;
  userId: string;
  imageUrl: string;
  type: 'check_in' | 'face_verify' | 'check_out';
  timestamp: number;
  username?: string;
  department?: string;
  position?: string;
}

export const AllImagesManager: React.FC = () => {
  const { getVietnamTimestamp, user } = useAuthStore();
  const [images, setImages] = useState<ImageData[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [filterUser, setFilterUser] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Helper function to convert Firebase Timestamp to number
      const convertTimestamp = (ts: any): number => {
        if (!ts) return getVietnamTimestamp();
        if (typeof ts === 'number') return ts;
        if (ts && typeof ts === 'object' && ts.toMillis) return ts.toMillis();
        if (ts && typeof ts === 'object' && ts.seconds) return ts.seconds * 1000;
        return getVietnamTimestamp();
      };

      // Load users for mapping
      const usersData = await getAllUsers();
      setUsers(usersData);

      // Load all images from sessions
      const allImages: ImageData[] = [];

      try {
        const sessionsQuery = query(collection(db, 'sessions'));
        const sessionsSnapshot = await getDocs(sessionsQuery);

        sessionsSnapshot.docs.forEach(doc => {
          const sessionData = doc.data();
          const userData = usersData.find(u => u.id === sessionData.userId);

          // Add check-in image
          if (sessionData.face1Url || sessionData.face1ImageUrl) {
            allImages.push({
              id: `${doc.id}_checkin`,
              userId: sessionData.userId,
              imageUrl: sessionData.face1Url || sessionData.face1ImageUrl,
              type: 'check_in',
              timestamp: convertTimestamp(sessionData.checkInTime),
              username: userData?.username || sessionData.username || 'Unknown',
              department: userData?.department || sessionData.department || 'Unknown',
              position: userData?.position || sessionData.position || 'Unknown'
            });
          }

          // Add check-out image (if exists)
          if (sessionData.face2Url || sessionData.face2ImageUrl) {
            allImages.push({
              id: `${doc.id}_checkout`,
              userId: sessionData.userId,
              imageUrl: sessionData.face2Url || sessionData.face2ImageUrl,
              type: 'check_out',
              timestamp: convertTimestamp(sessionData.checkOutTime),
              username: userData?.username || sessionData.username || 'Unknown',
              department: userData?.department || sessionData.department || 'Unknown',
              position: userData?.position || sessionData.position || 'Unknown'
            });
          }
        });
      } catch (error) {
        console.log('Cannot access sessions collection:', error);
        // Continue without session images
      }

      // Load face verification images (skip if no permission)
      try {
        const faceVerifyQuery = query(collection(db, 'faceVerifications'));
        const faceVerifySnapshot = await getDocs(faceVerifyQuery);

        faceVerifySnapshot.docs.forEach(doc => {
          const verifyData = doc.data();
          const userData = usersData.find(u => u.id === verifyData.userId);

          if (verifyData.imageUrl) {
            allImages.push({
              id: `${doc.id}_verify`,
              userId: verifyData.userId,
              imageUrl: verifyData.imageUrl,
              type: 'face_verify',
              timestamp: convertTimestamp(verifyData.timestamp),
              username: userData?.username,
              department: userData?.department,
              position: userData?.position
            });
          }
        });
      } catch (error) {
        console.log('Cannot access faceVerifications collection:', error);
        // Continue without face verification images
      }

      // Sort by timestamp descending (newest first)
      allImages.sort((a, b) => b.timestamp - a.timestamp);
      setImages(allImages);
    } catch (error) {
      console.error('Error loading images:', error);
      toast.error('Unable to load image list');
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = images.filter(image => {
    const matchesSearch = !searchQuery || 
      (image.username?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (image.department?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesUser = !filterUser || image.userId === filterUser;
    const matchesType = !filterType || image.type === filterType;
    
    return matchesSearch && matchesUser && matchesType;
  }).sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp descending (newest first)

  const handleImageClick = (image: ImageData) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  const handleDownload = (image: ImageData) => {
    const link = document.createElement('a');
    link.href = image.imageUrl;
    link.download = `${image.username}_${image.type}_${formatDate(image.timestamp)}.jpg`;
    link.click();
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'check_in': return 'Check In';
      case 'face_verify': return 'Face Verify';
      case 'check_out': return 'Check Out';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'check_in': return 'bg-green-500/20 text-green-400';
      case 'face_verify': return 'bg-purple-500/20 text-purple-400';
      case 'check_out': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="All Check-in Images" icon={<ImageIcon />} />
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="All Check-in Images" icon={<ImageIcon />} />
      <div className="p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by name or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="min-w-[150px]">
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="input-field w-full"
            >
              <option value="">All Employees</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>
          </div>
          
          <div className="min-w-[120px]">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-field w-full"
            >
              <option value="">All Types</option>
              <option value="check_in">Check In</option>
              <option value="check_out">Check Out</option>
            </select>
          </div>
        </div>

        {/* Images Grid */}
        {filteredImages.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No images</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredImages.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ getVietnamTimestamp, opacity: 0, y: 20 }}
                animate={{ getVietnamTimestamp, opacity: 1, y: 0 }}
                transition={{ getVietnamTimestamp, delay: index * 0.05 }}
                className="glass rounded-lg overflow-hidden hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => handleImageClick(image)}
              >
                <div className="relative">
                  <img
                    src={image.imageUrl}
                    alt={`${image.username} - ${getTypeLabel(image.type)}`}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(image.type)}`}>
                      {getTypeLabel(image.type)}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<DownloadIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(image);
                      }}
                    />
                  </div>
                </div>
                
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FaceIcon className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-sm">{image.username || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">{image.department || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HistoryIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {formatDate(image.timestamp)} {formatTime(image.timestamp)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      <Modal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        title={`${selectedImage?.username} - ${selectedImage ? getTypeLabel(selectedImage.type) : ''}`}
        size="lg"
      >
        {selectedImage && (
          <div className="p-6">
            <div className="text-center">
              <img
                src={selectedImage.imageUrl}
                alt={`${selectedImage.username} - ${getTypeLabel(selectedImage.type)}`}
                className="max-w-full max-h-[600px] object-contain mx-auto rounded-lg"
              />
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Employee</label>
                <p className="text-white">{selectedImage.username || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Department</label>
                <p className="text-white">{selectedImage.department || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Image Type</label>
                <p className="text-white">{getTypeLabel(selectedImage.type)}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Time</label>
                <p className="text-white">
                  {formatDate(selectedImage.timestamp)} {formatTime(selectedImage.timestamp)}
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button
                variant="primary"
                icon={<DownloadIcon />}
                onClick={() => handleDownload(selectedImage)}
              >
                Download
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
};
