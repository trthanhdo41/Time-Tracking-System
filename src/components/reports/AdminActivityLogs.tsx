import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SearchIcon, ShieldIcon } from '@/components/icons';
import { 
  getAdminActivityLogs, 
  getAdminActivityStats,
  AdminActivityLog,
  AdminActionType 
} from '@/services/adminActivityService';
import toast from 'react-hot-toast';

export const AdminActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<AdminActionType | 'all'>('all');
  const [stats, setStats] = useState({
    totalActions: 0,
    actionsByType: {} as Record<AdminActionType, number>,
    actionsByAdmin: {} as Record<string, number>,
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchQuery, selectedActionType, startDate, endDate]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const [logsData, statsData] = await Promise.all([
        getAdminActivityLogs({ limitCount: 500 }),
        getAdminActivityStats()
      ]);
      setLogs(logsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading admin logs:', error);
      toast.error('Failed to load admin activity logs');
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.adminUsername.toLowerCase().includes(query) ||
        log.actionDescription.toLowerCase().includes(query) ||
        log.targetUser?.toLowerCase().includes(query)
      );
    }
    if (selectedActionType !== 'all') {
      filtered = filtered.filter(log => log.actionType === selectedActionType);
    }
    if (startDate) {
      const start = new Date(startDate).getTime();
      filtered = filtered.filter(log => log.timestamp >= start);
    }
    if (endDate) {
      const end = new Date(endDate).getTime() + 86400000;
      filtered = filtered.filter(log => log.timestamp < end);
    }
    setFilteredLogs(filtered);
  };

  const getActionColor = (actionType: AdminActionType): string => {
    const colorMap: Partial<Record<AdminActionType, string>> = {
      approve_image_delete: 'text-green-400',
      reject_image_delete: 'text-red-400',
      delete_image: 'text-red-500',
      change_password: 'text-yellow-400',
      create_user: 'text-green-500',
      delete_user: 'text-red-500',
      update_user: 'text-blue-400',
      update_system_settings: 'text-purple-400',
      approve_forgot_password: 'text-green-400',
      reject_forgot_password: 'text-red-400',
      force_checkout: 'text-orange-400',
      view_reports: 'text-gray-400',
      export_data: 'text-blue-500',
    };
    return colorMap[actionType] || 'text-gray-400';
  };

  const getActionIcon = (actionType: AdminActionType): string => {
    if (actionType === 'approve_image_delete') return 'CHECK';
    if (actionType === 'reject_image_delete') return 'X';
    if (actionType === 'delete_image') return 'TRASH';
    if (actionType === 'change_password') return 'KEY';
    if (actionType === 'create_user') return 'PLUS';
    if (actionType === 'delete_user') return 'TRASH';
    if (actionType === 'update_user') return 'EDIT';
    if (actionType === 'update_system_settings') return 'SETTINGS';
    if (actionType === 'approve_forgot_password') return 'CHECK';
    if (actionType === 'reject_forgot_password') return 'X';
    if (actionType === 'force_checkout') return 'STOP';
    if (actionType === 'view_reports') return 'CHART';
    if (actionType === 'export_data') return 'DOWNLOAD';
    return 'DOC';
  };

  const formatActionType = (actionType: AdminActionType): string => {
    return actionType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldIcon className="w-8 h-8 text-primary-500" />
        <div>
          <h2 className="text-2xl font-bold">Admin Activity Logs</h2>
          <p className="text-gray-400">Track all administrative actions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-dark-800 border-dark-700">
          <div className="p-4">
            <p className="text-gray-400 text-sm">Total Actions</p>
            <p className="text-3xl font-bold text-primary-500">{stats.totalActions}</p>
          </div>
        </Card>
        <Card className="bg-dark-800 border-dark-700">
          <div className="p-4">
            <p className="text-gray-400 text-sm">Active Admins</p>
            <p className="text-3xl font-bold text-green-500">{Object.keys(stats.actionsByAdmin).length}</p>
          </div>
        </Card>
        <Card className="bg-dark-800 border-dark-700">
          <div className="p-4">
            <p className="text-gray-400 text-sm">Filtered Results</p>
            <p className="text-3xl font-bold text-blue-500">{filteredLogs.length}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-800 rounded-xl p-6 border border-dark-700 space-y-4"
      >
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Admin, user, action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Action Type</label>
            <select
              value={selectedActionType}
              onChange={(e) => setSelectedActionType(e.target.value as AdminActionType | 'all')}
              className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Actions</option>
              <option value="approve_image_delete">Approve Image Delete</option>
              <option value="reject_image_delete">Reject Image Delete</option>
              <option value="delete_image">Delete Image</option>
              <option value="change_password">Change Password</option>
              <option value="create_user">Create User</option>
              <option value="delete_user">Delete User</option>
              <option value="update_user">Update User</option>
              <option value="update_system_settings">Update Settings</option>
              <option value="force_checkout">Force Checkout</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </motion.div>

      {/* Logs Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-700 border-b border-dark-600">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Admin</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Action</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Target User</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Description</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-dark-700/50 transition-colors">
                    <td className="px-6 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="font-medium">{log.adminUsername}</span>
                        <span className="text-xs text-gray-500">({log.adminRole})</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`font-semibold ${getActionColor(log.actionType)}`}>
                        {formatActionType(log.actionType)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-400">
                      {log.targetUser || '-'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-300">
                      {log.actionDescription}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-400">
                      {new Date(log.timestamp).toLocaleString('en-US')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No admin activities found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};
