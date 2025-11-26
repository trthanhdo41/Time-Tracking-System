import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ReportIcon, DownloadIcon, HistoryIcon, UsersIcon, ChartIcon, ShieldIcon } from '@/components/icons';
import { getAllUsers, getUserStats } from '@/services/userService';
import { getAllActivityLogs } from '@/services/activityLog';
import { useAuthStore } from '@/store/authStore';
import { formatDuration } from '@/utils/time';
import { db } from '@/config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { AdminActivityLogs } from '@/components/reports/AdminActivityLogs';

export const ReportsManager: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'system' | 'admin'>('system');
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>(''); // Filter by performer
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});

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
        
        // Fetch user avatars
        const userIds = Array.from(new Set(logsData.map((log: any) => log.userId).filter(Boolean)));
        const avatars: Record<string, string> = {};
        
        await Promise.all(userIds.map(async (userId: string) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              if (userData.faceImageUrl) {
                avatars[userId] = userData.faceImageUrl;
              }
            }
          } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
          }
        }));
        
        setUserAvatars(avatars);
      } catch (error: any) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [user]);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      alert('Please select start and end dates');
      return;
    }

    setLoading(true);
    try {
      // Generate report data
      const startTimestamp = new Date(startDate).getTime();
      const endTimestamp = new Date(endDate).getTime();

      let filteredLogs = activityLogs.filter(log => 
        log.timestamp >= startTimestamp && log.timestamp <= endTimestamp
      );

      // Filter by performer if selected
      if (selectedUserId) {
        filteredLogs = filteredLogs.filter(log => 
          log.userId === selectedUserId || log.performedBy === selectedUserId
        );
      }

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

      // Get selected user info for report header
      const selectedUser = selectedUserId ? users.find(u => u.id === selectedUserId) : null;
      const performerFilterText = selectedUser ? `\nFiltered by Performer: ${selectedUser.username} (${selectedUser.department})` : '';

      // Generate CSV content
      const csvContent = [
        ['System Activity Report'],
        [`Period: ${reportData.period}${performerFilterText}`],
        [`Total Employees: ${reportData.totalUsers}`],
        [`Total Activities: ${reportData.totalActivities}`],
        [`Check In: ${reportData.checkIns}`],
        [`Check Out: ${reportData.checkOuts}`],
        [`Back Soon: ${reportData.backSoon}`],
        [`Face Verification: ${reportData.faceVerifications}`],
        [`CAPTCHA: ${reportData.captchas}`],
        [`Image Deletion Requests: ${reportData.imageDeleteRequests}`],
        [''],
        ['Activity Details:'],
        ['Timestamp', 'User', 'Department', 'Action', 'Description'],
        ...filteredLogs.map(log => {
          // Try to get user info from log first, fallback to users array if needed
          let userName = log.userName || log.username;
          let department = log.userDepartment || log.department;
          
          // If still missing, try to find user from users array
          if (log.userId && (!userName || !department)) {
            const user = users.find(u => u.id === log.userId);
            if (user) {
              userName = userName || user.username || 'N/A';
              department = department || user.department || 'N/A';
            }
          }
          
          return [
            new Date(log.timestamp).toLocaleString('en-US'),
            userName || 'N/A',
            department || 'N/A',
            log.actionType || 'N/A',
            log.actionDetails || log.description || 'N/A'
          ];
        })
      ].map(row => row.join(',')).join('\n');

      // Download CSV with English filename
      const reportTypeNames: Record<string, string> = {
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly'
      };
      const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const filename = `${reportTypeNames[reportType]}_Report_${dateStr}.csv`;

      // Add BOM for UTF-8 encoding (helps Excel recognize special characters)
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

    } catch (error: any) {
      console.error('Error generating report:', error);
      alert('Unable to generate report');
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'system' ? 'default' : 'outline'}
          onClick={() => setActiveTab('system')}
        >
          <ChartIcon className="w-4 h-4 mr-2" />
          System Reports
        </Button>
        <Button
          variant={activeTab === 'admin' ? 'default' : 'outline'}
          onClick={() => setActiveTab('admin')}
        >
          <ShieldIcon className="w-4 h-4 mr-2" />
          Admin Activity Logs
        </Button>
      </div>

      {/* System Reports Tab */}
      {activeTab === 'system' && (
        <>
          {/* Report Configuration */}
          <Card>
            <CardHeader title="Create Report" icon={<ReportIcon />} />
            <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="input-field w-full"
              >
                <option value="daily" style={{ backgroundColor: '#0f172a', color: '#f1f5f9' }}>Daily Report</option>
                <option value="weekly" style={{ backgroundColor: '#0f172a', color: '#f1f5f9' }}>Weekly Report</option>
                <option value="monthly" style={{ backgroundColor: '#0f172a', color: '#f1f5f9' }}>Monthly Report</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Filter by Performer</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="input-field w-full"
              >
                <option value="" style={{ backgroundColor: '#0f172a', color: '#f1f5f9' }}>All Users</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id} style={{ backgroundColor: '#0f172a', color: '#f1f5f9' }}>
                    {user.username} ({user.department})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            variant="primary"
            icon={<DownloadIcon />}
            onClick={generateReport}
            loading={loading}
            className="w-full"
          >
            Generate CSV Report
          </Button>
        </div>
      </Card>

      {/* Current Stats */}
      <Card>
        <CardHeader title="Current Statistics" icon={<ChartIcon />} />
        <div className="p-6">
          {stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-400">{stats.total}</div>
                <div className="text-sm text-gray-400">Total Employees</div>
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
              <p className="text-gray-400">Loading statistics...</p>
            </div>
          )}
        </div>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader title="Recent Activities" icon={<HistoryIcon />} />
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
                    {userAvatars[log.userId] ? (
                      <img 
                        src={userAvatars[log.userId]} 
                        alt={log.username || log.userName}
                        className="w-10 h-10 rounded-full object-cover border border-primary-500/30 flex-shrink-0"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                          img.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-sm border border-primary-500/30 flex-shrink-0 ${userAvatars[log.userId] ? 'hidden' : ''}`}>
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
        </>
      )}

      {/* Admin Activity Logs Tab */}
      {activeTab === 'admin' && (
        <AdminActivityLogs />
      )}
    </div>
  );
};
