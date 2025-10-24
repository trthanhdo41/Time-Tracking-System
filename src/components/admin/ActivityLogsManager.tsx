import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { HistoryIcon, SearchIcon, FilterIcon, DownloadIcon } from '@/components/icons';
import { getAllActivityLogs } from '@/services/activityLog';
import { useAuthStore } from '@/store/authStore';
import { formatDuration } from '@/utils/time';

interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  userRole: string;
  department: string;
  position: string;
  actionType: string;
  description: string;
  timestamp: number;
  metadata?: any;
}

export const ActivityLogsManager: React.FC = () => {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterActionType, setFilterActionType] = useState('');

  useEffect(() => {
    if (!user) return;

    const loadLogs = async () => {
      try {
        setLoading(true);
        const activityLogs = await getAllActivityLogs();
        setLogs(activityLogs);
      } catch (error: any) {
        console.error('Error loading activity logs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [user]);

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionTypeColor = (actionType: string): string => {
    switch (actionType) {
      case 'check_in': return 'text-green-400';
      case 'check_out': return 'text-red-400';
      case 'back_soon': return 'text-yellow-400';
      case 'face_verification': return 'text-blue-400';
      case 'captcha': return 'text-purple-400';
      case 'delete_image_request': return 'text-orange-400';
      case 'account_created': return 'text-green-400';
      case 'account_deleted': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getActionTypeLabel = (actionType: string): string => {
    switch (actionType) {
      case 'check_in': return 'Check In';
      case 'check_out': return 'Check Out';
      case 'back_soon': return 'Back Soon';
      case 'face_verification': return 'Face Verification';
      case 'captcha': return 'CAPTCHA';
      case 'delete_image_request': return 'Delete Image Request';
      case 'account_created': return 'Account Created';
      case 'account_deleted': return 'Account Deleted';
      default: return actionType;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = (log.username || log.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (log.description || log.actionDetails || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = !filterDepartment || (log.department || log.userDepartment) === filterDepartment;
    const matchesActionType = !filterActionType || log.actionType === filterActionType;
    
    return matchesSearch && matchesDepartment && matchesActionType;
  }).sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp descending (newest first)

  const departments = Array.from(new Set(logs.map(log => log.department || log.userDepartment).filter(Boolean)));
  const actionTypes = Array.from(new Set(logs.map(log => log.actionType).filter(Boolean)));

  if (loading) {
    return (
      <Card>
        <CardHeader title="Hoạt Động Hệ Thống" icon={<HistoryIcon />} />
        <div className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Đang tải...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Hoạt Động Hệ Thống" icon={<HistoryIcon />} />
      <div className="p-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <Input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<SearchIcon />}
            />
          </div>
          <div>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="input-field w-full"
            >
              <option value="">Tất cả phòng ban</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterActionType}
              onChange={(e) => setFilterActionType(e.target.value)}
              className="input-field w-full"
            >
              <option value="">Tất cả hành động</option>
              {actionTypes.map(action => (
                <option key={action} value={action}>{getActionTypeLabel(action)}</option>
              ))}
            </select>
          </div>
          <div>
            <Button
              variant="secondary"
              icon={<DownloadIcon />}
              onClick={() => {
                // Export to CSV functionality
                const csvContent = [
                  ['Timestamp', 'User', 'Department', 'Action', 'Description'],
                  ...filteredLogs.map(log => [
                    formatDate(log.timestamp),
                    log.username || log.userName || 'N/A',
                    log.department || log.userDepartment || 'N/A',
                    getActionTypeLabel(log.actionType),
                    log.description || log.actionDetails || 'N/A'
                  ])
                ].map(row => row.join(',')).join('\n');
                
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
              }}
            >
              Export CSV
            </Button>
          </div>
        </div>

        {/* Logs List */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8">
            <HistoryIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Không có hoạt động nào</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {filteredLogs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass p-4 rounded-xl"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`font-medium ${getActionTypeColor(log.actionType)}`}>
                        {getActionTypeLabel(log.actionType)}
                      </span>
                      <span className="text-sm text-gray-400">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-white mb-2">{log.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span><strong>User:</strong> {log.username || log.userName || 'N/A'}</span>
                      <span><strong>Role:</strong> {log.userRole || 'N/A'}</span>
                      <span><strong>Department:</strong> {log.department || log.userDepartment || 'N/A'}</span>
                      <span><strong>Position:</strong> {log.position || log.userPosition || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
