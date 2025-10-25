import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { User, Session } from '@/types';
import { getUserSessions, updateUser, UserRole } from '@/services/userService';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { ClockIcon, EditIcon, XIcon } from '@/components/icons';

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
  const [editData, setEditData] = useState({
    username: '',
    department: '',
    position: '',
    role: 'staff' as UserRole
  });

  useEffect(() => {
    if (user) {
      setEditData({
        username: user.username,
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
    if (!user || !currentUser) return;
    
    try {
      await updateUser(user.id, editData, currentUser);
      toast.success('Cập nhật thông tin thành công!');
      setEditing(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const formatTime = (milliseconds?: number) => {
    if (!milliseconds) return 'N/A';
    const date = new Date(milliseconds);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (!user) return null;

  return (
    <Modal isOpen={!!user} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Chi Tiết Nhân Viên</h2>
          <Button
            variant="secondary"
            onClick={onClose}
            size="sm"
          >
            <XIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Employee Info */}
        <div className="bg-dark-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4 mb-4">
            {user.faceImageUrl ? (
              <img
                src={user.faceImageUrl}
                alt={user.username}
                className="w-20 h-20 rounded-full object-cover border border-primary-500/30"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-2xl border border-primary-500/30">
                {user.username?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div className="flex-1">
              {editing ? (
                <input
                  type="text"
                  value={editData.username}
                  onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                />
              ) : (
                <h3 className="text-xl font-bold">{user.username}</h3>
              )}
              <p className="text-gray-400">{user.email}</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => editing ? handleUpdate() : setEditing(true)}
              size="sm"
            >
              <EditIcon className="w-5 h-5 mr-2" />
              {editing ? 'Lưu' : 'Sửa'}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Phòng Ban</label>
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
              <label className="block text-sm text-gray-400 mb-1">Chức Vụ</label>
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
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <ClockIcon className="w-5 h-5" />
            Lịch Sử Làm Việc
          </h3>
          
          {loading ? (
            <div className="text-center py-8 text-gray-400">Đang tải...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Chưa có lịch sử làm việc</div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sessions.map((session) => (
                <div key={session.id} className="bg-dark-800 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Check In</p>
                      <p className="text-white">{formatTime(session.checkInTime)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Check Out</p>
                      <p className="text-white">{formatTime(session.checkOutTime)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Thời Gian Online</p>
                      <p className="text-green-400">{formatDuration(session.totalOnlineTime)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Back Soon</p>
                      <p className="text-yellow-400">{formatDuration(session.totalBackSoonTime)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
