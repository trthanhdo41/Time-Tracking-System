import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ReportIcon, DownloadIcon, HistoryIcon, UsersIcon, ChartIcon } from '@/components/icons';
import { getAllUsers, getUserStats } from '@/services/userService';
import { getAllActivityLogs } from '@/services/activityLog';
import { useAuthStore } from '@/store/authStore';
import { formatDuration } from '@/utils/time';

export const ReportsManager: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [usersData, statsData, logsData] = await Promise.all([
          getAllUsers(),
          getUserStats(),
          getAllActivityLogs()
        ]);
        setUsers(usersData);
        setStats(statsData);
        setActivityLogs(logsData);
      } catch (error: any) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [user]);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      alert('Vui lòng chọn ngày bắt đầu và kết thúc');
      return;
    }

    setLoading(true);
    try {
      // Generate report data
      const startTimestamp = new Date(startDate).getTime();
      const endTimestamp = new Date(endDate).getTime();

      const filteredLogs = activityLogs.filter(log => 
        log.timestamp >= startTimestamp && log.timestamp <= endTimestamp
      );

      const reportData = {
        period: `${startDate} - ${endDate}`,
        totalUsers: users.length,
        totalActivities: filteredLogs.length,
        checkIns: filteredLogs.filter(log => log.actionType === 'check_in').length,
        checkOuts: filteredLogs.filter(log => log.actionType === 'check_out').length,
        backSoon: filteredLogs.filter(log => log.actionType === 'back_soon').length,
        faceVerifications: filteredLogs.filter(log => log.actionType === 'face_verification').length,
        captchas: filteredLogs.filter(log => log.actionType === 'captcha').length,
        imageDeleteRequests: filteredLogs.filter(log => log.actionType === 'delete_image_request').length,
        users: users.map(user => ({
          id: user.id,
          username: user.username,
          department: user.department,
          position: user.position,
          role: user.role
        }))
      };

      // Generate CSV content
      const csvContent = [
        ['Báo Cáo Hoạt Động Hệ Thống'],
        [`Khoảng thời gian: ${reportData.period}`],
        [`Tổng số nhân viên: ${reportData.totalUsers}`],
        [`Tổng số hoạt động: ${reportData.totalActivities}`],
        [`Check In: ${reportData.checkIns}`],
        [`Check Out: ${reportData.checkOuts}`],
        [`Back Soon: ${reportData.backSoon}`],
        [`Face Verification: ${reportData.faceVerifications}`],
        [`CAPTCHA: ${reportData.captchas}`],
        [`Yêu cầu xóa ảnh: ${reportData.imageDeleteRequests}`],
        [''],
        ['Chi tiết hoạt động:'],
        ['Timestamp', 'User', 'Department', 'Action', 'Description'],
        ...filteredLogs.map(log => [
          new Date(log.timestamp).toLocaleString('vi-VN'),
          log.username,
          log.department,
          log.actionType,
          log.description
        ])
      ].map(row => row.join(',')).join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bao_cao_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

    } catch (error: any) {
      console.error('Error generating report:', error);
      alert('Không thể tạo báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <Card>
        <CardHeader title="Tạo Báo Cáo" icon={<ReportIcon />} />
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Loại báo cáo</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="input-field w-full"
              >
                <option value="daily">Báo cáo ngày</option>
                <option value="weekly">Báo cáo tuần</option>
                <option value="monthly">Báo cáo tháng</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Ngày bắt đầu</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Ngày kết thúc</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <Button
            variant="primary"
            icon={<DownloadIcon />}
            onClick={generateReport}
            loading={loading}
            className="w-full"
          >
            Tạo Báo Cáo CSV
          </Button>
        </div>
      </Card>

      {/* Current Stats */}
      <Card>
        <CardHeader title="Thống Kê Hiện Tại" icon={<ChartIcon />} />
        <div className="p-6">
          {stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-400">{stats.total}</div>
                <div className="text-sm text-gray-400">Tổng nhân viên</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.online}</div>
                <div className="text-sm text-gray-400">Online</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.backSoon}</div>
                <div className="text-sm text-gray-400">Back Soon</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">{stats.offline}</div>
                <div className="text-sm text-gray-400">Offline</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Đang tải thống kê...</p>
            </div>
          )}
        </div>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader title="Hoạt Động Gần Đây" icon={<HistoryIcon />} />
        <div className="p-6">
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {activityLogs.slice(0, 10).map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass p-3 rounded-lg"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-sm border border-primary-500/30 flex-shrink-0">
                      {(log.username || log.userName)?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{log.description || log.actionDetails || 'Activity'}</p>
                      <p className="text-sm text-gray-400">
                        {log.username || log.userName || 'N/A'} • {log.department || log.userDepartment || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(log.timestamp)}
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
