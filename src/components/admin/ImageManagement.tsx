import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { 
  TrashIcon, 
  EyeIcon, 
  CheckIcon, 
  XIcon, 
  ClockIcon,
  UserIcon 
} from '@/components/icons';
import { 
  getPendingImageDeleteRequests,
  approveImageDeleteRequest,
  rejectImageDeleteRequest,
  listenToPendingImageDeleteRequests
} from '@/services/imageDeleteService';
import { useAuthStore } from '@/store/authStore';
import { ImageDeleteRequest } from '@/types';
import toast from 'react-hot-toast';

export const ImageManagement: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [requests, setRequests] = useState<ImageDeleteRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ImageDeleteRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingRequests();
    
    // Listen to real-time updates
    const unsubscribe = listenToPendingImageDeleteRequests((updatedRequests) => {
      setRequests(updatedRequests);
    });
    
    return () => unsubscribe();
  }, []);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const pendingRequests = await getPendingImageDeleteRequests();
      setRequests(pendingRequests);
    } catch (error) {
      console.error('Error loading pending requests:', error);
      toast.error('Không thể tải danh sách yêu cầu xóa ảnh');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: ImageDeleteRequest) => {
    if (!currentUser) return;
    
    try {
      await approveImageDeleteRequest(request.id, currentUser);
      // The real-time listener will update the list automatically
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !currentUser || !rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    
    try {
      await rejectImageDeleteRequest(selectedRequest.id, rejectReason, currentUser);
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'approved':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'rejected':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Đang tải danh sách yêu cầu xóa ảnh...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold text-white">Quản Lý Yêu Cầu Xóa Ảnh</h3>
          <p className="text-gray-400">
            Có {requests.length} yêu cầu đang chờ phê duyệt
          </p>
        </CardHeader>
        
        <div className="p-6">
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">📷</div>
              <p className="text-gray-400">Không có yêu cầu xóa ảnh nào đang chờ</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Image Preview */}
                    <div className="lg:col-span-1">
                      <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={request.imageUrl}
                          alt="Requested image"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    
                    {/* Request Details */}
                    <div className="lg:col-span-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-300">
                          Yêu cầu từ: {request.userId}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status === 'pending' ? 'Đang chờ' : 
                           request.status === 'approved' ? 'Đã phê duyệt' : 'Đã từ chối'}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-400">Lý do yêu cầu:</span>
                        <p className="text-white mt-1">{request.reason}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>{formatTimestamp(request.requestedAt)}</span>
                        </div>
                      </div>
                      
                      {request.status === 'pending' && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => handleApprove(request)}
                            className="flex-1 bg-green-500/20 border-green-500 text-green-400 hover:bg-green-500/30"
                          >
                            <CheckIcon className="w-4 h-4 mr-2" />
                            Phê Duyệt
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRejectModal(true);
                            }}
                            variant="outline"
                            className="flex-1 text-red-400 border-red-400 hover:bg-red-400/10"
                          >
                            <XIcon className="w-4 h-4 mr-2" />
                            Từ Chối
                          </Button>
                        </div>
                      )}
                      
                      {request.status === 'rejected' && request.reviewerComment && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                          <span className="text-sm text-red-400 font-medium">Lý do từ chối:</span>
                          <p className="text-red-300 mt-1">{request.reviewerComment}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedRequest(null);
          setRejectReason('');
        }}
        title="Từ Chối Yêu Cầu Xóa Ảnh"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Lý do từ chối:
            </label>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối yêu cầu xóa ảnh..."
              className="w-full"
            />
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setSelectedRequest(null);
                setRejectReason('');
              }}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              onClick={handleReject}
              disabled={!rejectReason.trim()}
              className="flex-1 bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30"
            >
              <XIcon className="w-4 h-4 mr-2" />
              Từ Chối
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
