import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BackSoonIcon, UsersIcon, HistoryIcon } from '@/components/icons';
import { getAllUsers } from '@/services/userService';
import { useAuthStore } from '@/store/authStore';
import { formatDuration } from '@/utils/time';

export const BackSoonManager: React.FC = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadUsers = async () => {
      try {
        setLoading(true);
        const usersData = await getAllUsers();
        setUsers(usersData);
      } catch (error: any) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [user]);

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

  const backSoonUsers = users.filter(user => user.status === 'back_soon');
  const onlineUsers = users.filter(user => user.status === 'online');
  const offlineUsers = users.filter(user => user.status === 'offline');

  if (loading) {
    return (
      <Card>
        <CardHeader title="Back Soon Monitoring" icon={<BackSoonIcon />} />
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
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader title="Back Soon" icon={<BackSoonIcon />} />
          <div className="p-6">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {backSoonUsers.length}
            </div>
            <p className="text-sm text-gray-400">Employees Back Soon</p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Online" icon={<UsersIcon />} />
          <div className="p-6">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {onlineUsers.length}
            </div>
            <p className="text-sm text-gray-400">Employees Online</p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Offline" icon={<HistoryIcon />} />
          <div className="p-6">
            <div className="text-3xl font-bold text-gray-400 mb-2">
              {offlineUsers.length}
            </div>
            <p className="text-sm text-gray-400">Employees Offline</p>
          </div>
        </Card>
      </div>

      {/* Back Soon Users */}
      <Card>
        <CardHeader title="Back Soon Employees" icon={<BackSoonIcon />} />
        <div className="p-6">
          {backSoonUsers.length === 0 ? (
            <div className="text-center py-8">
              <BackSoonIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No employees on Back Soon</p>
            </div>
          ) : (
            <div className="space-y-4">
              {backSoonUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass p-4 rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {user.faceImageUrl ? (
                        <img 
                          src={user.faceImageUrl} 
                          alt={user.fullName || user.username}
                          className="w-12 h-12 rounded-full object-cover border border-primary-500/30"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = 'none';
                            img.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-12 h-12 rounded-full ${user.faceImageUrl ? 'hidden' : 'bg-yellow-500/20'} flex items-center justify-center ${!user.faceImageUrl ? 'border border-primary-500/30' : ''}`}>
                        {user.faceImageUrl ? null : (
                          <>
                            {(user.fullName || user.username)?.[0]?.toUpperCase() || (
                              <BackSoonIcon className="w-6 h-6 text-yellow-400" />
                            )}
                          </>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{user.fullName || user.username}</p>
                        <p className="text-sm text-gray-400">
                          {user.department} • {user.position}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status="back_soon" />
                      <p className="text-sm text-gray-400 mt-1">
                        {user.lastBackSoonTime ? formatDate(user.lastBackSoonTime) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* All Users Status */}
      <Card>
        <CardHeader title="All Employees Status" icon={<UsersIcon />} />
        <div className="p-6">
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {users.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass p-3 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {user.faceImageUrl ? (
                      <img 
                        src={user.faceImageUrl} 
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover border border-primary-500/30"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                          img.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-10 h-10 rounded-full ${user.faceImageUrl ? 'hidden' : 'bg-primary-500/20'} flex items-center justify-center text-primary-400 font-bold text-sm ${!user.faceImageUrl ? 'border border-primary-500/30' : ''}`}>
                      {user.faceImageUrl ? null : user.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white">{user.username}</p>
                      <p className="text-sm text-gray-400">
                        {user.department} • {user.position}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={user.status} />
                    {user.lastActivityTime && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(user.lastActivityTime)}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
