import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LockIcon, CheckIcon, XIcon } from '@/components/icons';
import { 
  getAllForgotPasswordRequests, 
  approveForgotPasswordRequest, 
  rejectForgotPasswordRequest
} from '@/services/forgotPasswordService';
import { ForgotPasswordRequest } from '@/services/forgotPasswordService';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export const ForgotPasswordRequestsManager: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [requests, setRequests] = useState<ForgotPasswordRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ForgotPasswordRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!currentUser) return;

    const loadRequests = async () => {
      try {
        setLoading(true);
        const allRequests = await getAllForgotPasswordRequests();
        // Sort by requestedAt descending (newest first)
        allRequests.sort((a, b) => b.requestedAt - a.requestedAt);
        setRequests(allRequests);
      } catch (error: any) {
        toast.error(error.message || 'Unable to load password reset requests');
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadRequests, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleApprove = async () => {
    if (!selectedRequest || !currentUser) return;

    try {
      await approveForgotPasswordRequest(
        selectedRequest.id!,
        {
          id: currentUser.id,
          username: currentUser.username,
          role: currentUser.role
        }
      );
      
      // Open Firebase Console Authentication Users page in new tab
      const firebaseProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'enterprise-time-trackin';
      const consoleUrl = `https://console.firebase.google.com/u/2/project/${firebaseProjectId}/authentication/users`;
      window.open(consoleUrl, '_blank');
      
      toast.success('Request approved. Opening Firebase Console...', {
        duration: 4000,
      });
      
      // Reload requests
      const allRequests = await getAllForgotPasswordRequests();
      allRequests.sort((a, b) => b.requestedAt - a.requestedAt);
      setRequests(allRequests);
      
      setShowApproveModal(false);
      setSelectedRequest(null);
    } catch (error: any) {
      toast.error(error.message || 'Unable to approve password reset request');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !currentUser) return;

    if (!rejectReason.trim()) {
      toast.error('Please enter a reason for rejection');
      return;
    }

    try {
      await rejectForgotPasswordRequest(
        selectedRequest.id!,
        rejectReason,
        {
          id: currentUser.id,
          username: currentUser.username,
          role: currentUser.role
        }
      );
      
      toast.success('Password reset request rejected');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedRequest(null);
      
      // Reload requests
      const allRequests = await getAllForgotPasswordRequests();
      allRequests.sort((a, b) => b.requestedAt - a.requestedAt);
      setRequests(allRequests);
    } catch (error: any) {
      toast.error(error.message || 'Unable to reject password reset request');
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  if (loading) {
    return (
      <Card>
        <CardHeader title="Forgot Password Requests" icon={<LockIcon />} />
        <div className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Pending" />
          <div className="text-3xl font-bold text-yellow-400">{pendingRequests.length}</div>
        </Card>
        <Card>
          <CardHeader title="Approved" />
          <div className="text-3xl font-bold text-green-400">{approvedRequests.length}</div>
        </Card>
        <Card>
          <CardHeader title="Rejected" />
          <div className="text-3xl font-bold text-red-400">{rejectedRequests.length}</div>
        </Card>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader title="Password Reset Requests" icon={<LockIcon />} />
        <div className="p-6">
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No password reset requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-dark-700 rounded-lg border border-dark-600"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{request.username}</h3>
                        <StatusBadge
                          status={request.status === 'pending' ? 'pending' : request.status === 'approved' ? 'success' : 'error'}
                        >
                          {request.status}
                        </StatusBadge>
                      </div>
                      <p className="text-sm text-gray-400 mb-1">Email: {request.email}</p>
                      <p className="text-sm text-gray-400">
                        Requested: {formatDate(request.requestedAt)}
                      </p>
                      {request.processedAt && (
                        <p className="text-sm text-gray-400">
                          Processed: {formatDate(request.processedAt)}
                        </p>
                      )}
                      {request.processedBy && (
                        <p className="text-sm text-gray-400">
                          By: {request.processedBy}
                        </p>
                      )}
                      {request.status === 'approved' && (
                        <div className="mt-2 p-2 bg-blue-500/10 rounded border border-blue-500/20">
                          <p className="text-xs text-blue-400">
                            Password should be reset manually in Firebase Console.
                          </p>
                        </div>
                      )}
                      {request.status === 'rejected' && (request as any).rejectionReason && (
                        <p className="text-sm text-red-400 mt-1">
                          Reason: {(request as any).rejectionReason}
                        </p>
                      )}
                    </div>
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowApproveModal(true);
                          }}
                        >
                          <CheckIcon className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRejectModal(true);
                          }}
                        >
                          <XIcon className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Approve Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setSelectedRequest(null);
        }}
        title="Approve Password Reset Request"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Approve password reset for <strong>{selectedRequest?.username}</strong> ({selectedRequest?.email})?
          </p>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-400 font-semibold mb-1">Next Steps:</p>
            <p className="text-xs text-gray-400">
              After clicking "Approve", Firebase Console will open in a new tab. 
              Go to the user's account and manually reset the password there.
            </p>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowApproveModal(false);
                setSelectedRequest(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleApprove}
              className="flex-1"
            >
              Approve & Open Firebase Console
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectReason('');
          setSelectedRequest(null);
        }}
        title="Reject Password Reset Request"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Reject password reset request for <strong>{selectedRequest?.username}</strong> ({selectedRequest?.email})?
          </p>
          
          <Input
            label="Reason for Rejection"
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter reason for rejection..."
            required
          />
          
          <div className="flex gap-3 pt-4">
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
              className="flex-1"
            >
              Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

