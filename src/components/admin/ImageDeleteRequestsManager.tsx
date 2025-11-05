import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ImageIcon, EyeIcon, TrashIcon, CheckIcon, XIcon } from '@/components/icons';
import { 
  getPendingImageDeleteRequests, 
  approveImageDeleteRequest, 
  rejectImageDeleteRequest,
  listenToPendingImageDeleteRequests 
} from '@/services/imageDeleteService';
import { ImageDeleteRequest } from '@/types';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export const ImageDeleteRequestsManager: React.FC = () => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<ImageDeleteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ImageDeleteRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!user) return;

    // Listen to real-time updates
    const unsubscribe = listenToPendingImageDeleteRequests((updatedRequests) => {
      setRequests(updatedRequests);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleApprove = async (request: ImageDeleteRequest) => {
    if (!user) return;

    try {
      await approveImageDeleteRequest(request.id, user);
      toast.success('Image deletion request approved');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !user) return;

    try {
      await rejectImageDeleteRequest(selectedRequest.id, rejectReason, user);
      toast.success('Image deletion request rejected');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedRequest(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="Review Requests" icon={<ImageIcon />} />
        <div className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Review Requests" icon={<ImageIcon />} />
      <div className="p-6">
        {requests.length === 0 ? (
          <div className="text-center py-8">
            <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No image deletion requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass p-4 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={request.imageUrl} 
                      alt="Image to delete"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge status="pending" />
                      <span className="text-sm text-gray-400">
                        {formatDate(request.requestedAt)}
                      </span>
                    </div>
                    <p className="font-medium text-white mb-1">Image Deletion Request</p>
                    <p className="text-sm text-gray-400 mb-2">
                      <strong>Reason:</strong> {request.reason}
                    </p>
                    <p className="text-xs text-gray-500">
                      ID: {request.id}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<CheckIcon />}
                      onClick={() => handleApprove(request)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<XIcon />}
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowRejectModal(true);
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectReason('');
          setSelectedRequest(null);
        }}
        title="Reject Image Deletion Request"
      >
        <div className="p-6">
          <p className="text-gray-400 mb-4">
            Please enter reason for rejection:
          </p>
          
          <Input
            type="text"
            placeholder="Reason for rejection..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="mb-6"
          />

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowRejectModal(false);
                setRejectReason('');
                setSelectedRequest(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={!rejectReason.trim()}
              className="flex-1"
            >
              Reject
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};
