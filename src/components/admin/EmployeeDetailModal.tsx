import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { User, Session, UserRole } from '@/types';
import { getUserSessions, updateUser, deleteUser } from '@/services/userService';
import { adminForceLogoutUser } from '@/services/sessionService';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { ClockIcon, EditIcon, XIcon, TrashIcon, LogoutIcon } from '@/components/icons';
import { getVietnamTimestamp } from '@/utils/time';

interface EmployeeDetailModalProps {
  user: User | null;
  onClose: () => void;
  onUpdate: () => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  user,
  onClose,
  onUpdate
}) => {
  const { user: currentUser } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isForcingLogout, setIsForcingLogout] = useState(false);
  const [editData, setEditData] = useState({
    username: '',
    fullName: '',
    email: '',
    department: '',
    position: '',
    role: 'staff' as UserRole
  });

  useEffect(() => {
    if (user) {
      // Reset all form states when user changes
      setEditing(false);
      setIsUpdating(false);
      
      // Set editData to the new user's actual data
      setEditData({
        username: user.username,
        fullName: user.fullName || '',
        email: user.email,
        department: user.department,
        position: user.position,
        role: user.role
      });
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const userSessions = await getUserSessions(user.id);
      setSessions(userSessions);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!user || !currentUser || isUpdating) return;
    
    setIsUpdating(true);
    try {
      await updateUser(user.id, editData, currentUser);
      toast.success('Information updated successfully!');
      setEditing(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUpdating(false);
    }
  };


  const formatTime = (milliseconds?: number) => {
    if (!milliseconds) return 'N/A';
    const date = new Date(milliseconds);
    return date.toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0s';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    
    // Always show seconds if less than 1 hour
    if (hours === 0) {
      if (minutes === 0) {
        // Show only seconds if less than 1 minute
        parts.push(`${secs}s`);
      } else {
        // Show minutes and seconds
        parts.push(`${secs}s`);
      }
    } else {
      // If hours > 0, also show seconds
      parts.push(`${secs}s`);
    }
    
    return parts.length > 0 ? parts.join(' ') : '0s';
  };

  const handleDelete = async () => {
    if (!user || !currentUser || isDeleting) return;
    
    setIsDeleting(true);
    try {
      await deleteUser(user.id, currentUser);
      toast.success('Employee deleted successfully!');
      setShowDeleteConfirm(false);
      onUpdate();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleForceLogout = async () => {
    if (!user || !currentUser || isForcingLogout) return;
    
    setIsForcingLogout(true);
    try {
      await adminForceLogoutUser(user.id, currentUser, 'Forced logout by admin');
      toast.success('User logged out successfully!');
      onUpdate();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsForcingLogout(false);
    }
  };

  if (!user) return null;

  return (
    <Modal isOpen={!!user} onClose={onClose} size="lg">
      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Employee Details</h2>
        </div>

        {/* Employee Info */}
        <div className="bg-dark-800 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            {user.faceImageUrl ? (
              <img
                src={user.faceImageUrl}
                alt={user.fullName || user.username}
                className="w-16 h-16 rounded-full object-cover border border-primary-500/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-xl border border-primary-500/30">
                {(user.fullName || user.username)?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div className="flex-1">
              <div className="mb-2">
                <label className="block text-xs text-gray-400 mb-1">Full Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={editData.fullName}
                    onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm"
                    placeholder="Enter full name"
                  />
                ) : (
                  <h3 className="text-lg font-bold">{user.fullName || user.username}</h3>
                )}
              </div>
              <div className="mb-2">
                <label className="block text-xs text-gray-400 mb-1">Username</label>
                {editing ? (
                  <input
                    type="text"
                    value={editData.username}
                    onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm"
                    placeholder="Enter username"
                  />
                ) : (
                  <p className="text-gray-400 text-sm">{user.username}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Email</label>
                {editing ? (
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm"
                  />
                ) : (
                  <p className="text-gray-400 text-sm">{user.email}</p>
                )}
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => editing ? handleUpdate() : setEditing(true)}
              size="sm"
              loading={isUpdating}
            >
              <EditIcon className="w-5 h-5 mr-2" />
              {editing ? 'Save' : 'Edit'}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Department</label>
              {editing ? (
                <input
                  type="text"
                  value={editData.department}
                  onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                />
              ) : (
                <p className="text-white">{user.department}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Position</label>
              {editing ? (
                <input
                  type="text"
                  value={editData.position}
                  onChange={(e) => setEditData({ ...editData, position: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                />
              ) : (
                <p className="text-white">{user.position}</p>
              )}
            </div>
          </div>

        </div>

        {/* Work History */}
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <ClockIcon className="w-5 h-5" />
            Work History
          </h3>
          
          {loading ? (
            <div className="text-center py-6 text-gray-400">Loading...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-6 text-gray-400">No work history</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sessions.map((session) => {
                // Get Back Soon reasons
                const backSoonReasons = session.backSoonEvents?.map((event: any) => {
                  if (event.reason === 'meeting') return 'Meeting';
                  if (event.reason === 'toilet') return 'Toilet';
                  if (event.reason === 'other') return event.customReason || 'Other';
                  return 'Unknown';
                }).join(', ') || '';

                // Calculate real-time values if session is still active (no checkout yet)
                let displayOnlineTime = session.totalOnlineTime || 0;
                let displayBackSoonTime = session.totalBackSoonTime || 0;

                if (!session.checkOutTime && session.checkInTime) {
                  // Active session - calculate current values
                  const now = getVietnamTimestamp();
                  const checkInTime = typeof session.checkInTime === 'number' ? session.checkInTime : getVietnamTimestamp();
                  const totalElapsed = Math.floor((now - checkInTime) / 1000);
                  
                  // Calculate back soon time from events
                  if (session.backSoonEvents && session.backSoonEvents.length > 0) {
                    displayBackSoonTime = session.backSoonEvents.reduce((sum: number, event: any) => {
                      if (event.endTime) {
                        return sum + Math.floor((event.endTime - event.startTime) / 1000);
                      } else {
                        return sum + Math.floor((now - event.startTime) / 1000);
                      }
                    }, 0);
                  }
                  
                  displayOnlineTime = Math.max(0, totalElapsed - displayBackSoonTime);
                }

                return (
                  <div key={session.id} className="bg-dark-800 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-3 text-sm mb-2">
                      <div>
                        <p className="text-gray-400">Check In</p>
                        <p className="text-white">{formatTime(session.checkInTime)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Check Out</p>
                        <p className="text-white">{formatTime(session.checkOutTime)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Online Time</p>
                        <p className="text-green-400">{formatDuration(displayOnlineTime)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Back Soon</p>
                        <p className="text-yellow-400">{formatDuration(displayBackSoonTime)}</p>
                      </div>
                    </div>
                    {backSoonReasons && (
                      <div className="mt-2 pt-2 border-t border-dark-700">
                        <p className="text-xs text-gray-400">Back Soon Reason:</p>
                        <p className="text-xs text-yellow-400">{backSoonReasons}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Force Logout Button */}
        {!editing && user.status === 'online' && (
          <div className="mt-4 pt-4 border-t border-dark-700 flex justify-center">
            <Button
              variant="danger"
              size="sm"
              icon={<LogoutIcon />}
              onClick={handleForceLogout}
              loading={isForcingLogout}
            >
              Force Logout
            </Button>
          </div>
        )}

        {/* Delete User Button */}
        {editing && (
          <div className="mt-4 pt-4 border-t border-dark-700 flex justify-center">
            <Button
              variant="danger"
              size="sm"
              icon={<TrashIcon />}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Employee
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Confirm Employee Deletion"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <TrashIcon className="w-10 h-10 text-red-500" />
            </div>
            <p className="text-lg text-gray-300 mb-2">
              Are you sure you want to delete this employee?
            </p>
            <p className="text-sm text-gray-400 mb-1">
              <span className="font-semibold text-white">{user?.username}</span>
            </p>
            <p className="text-sm text-gray-400">
              ({user?.email})
            </p>
            <p className="text-xs text-red-400 mt-3">
              ⚠️ This action cannot be undone!
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              className="flex-1"
              loading={isDeleting}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
};
