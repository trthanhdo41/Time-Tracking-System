import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StaffNavigation } from '@/components/layout/StaffNavigation';
import { 
  HistoryIcon, 
  FilterIcon, 
  SearchIcon,
  CheckInIcon,
  CheckOutIcon,
  BackSoonIcon,
  ChartIcon
} from '@/components/icons';
import { formatTime, formatDate, formatDuration } from '@/utils/time';
import { useAuthStore } from '@/store/authStore';
import { getUserSessionHistory } from '@/services/sessionService';
import { Session } from '@/types';
import toast from 'react-hot-toast';

export const HistoryPage: React.FC = () => {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  // Load session history
  useEffect(() => {
    if (!user) return;
    
    loadHistory();
  }, [user, startDate, endDate]);

  const loadHistory = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const startTimestamp = startDate ? new Date(startDate).getTime() : undefined;
      const endTimestamp = endDate ? new Date(endDate).getTime() + 86400000 : undefined; // Add 1 day
      
      const history = await getUserSessionHistory(user.id, startTimestamp, endTimestamp);
      setSessions(history);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    totalOnlineTime: sessions.reduce((sum, s) => {
      const time = s.totalOnlineTime || 0;
      // If time is too large (likely a timestamp), skip it
      if (time > 86400000) return sum; // Skip if > 24 hours
      return sum + time;
    }, 0),
    totalBackSoonTime: sessions.reduce((sum, s) => {
      const time = s.totalBackSoonTime || 0;
      // If time is too large (likely a timestamp), skip it
      if (time > 86400000) return sum; // Skip if > 24 hours
      return sum + time;
    }, 0),
    averagePerDay: sessions.length > 0 
      ? sessions.reduce((sum, s) => {
          const time = s.totalOnlineTime || 0;
          // If time is too large (likely a timestamp), skip it
          if (time > 86400000) return sum; // Skip if > 24 hours
          return sum + time;
        }, 0) / sessions.length 
      : 0,
    attendanceRate: sessions.length > 0 
      ? (sessions.filter(s => s.checkOutTime).length / sessions.length) * 100 
      : 0,
  };

  // Filter sessions by search query
  const filteredSessions = sessions.filter(session => {
    if (!searchQuery) return true;
    
    const date = formatDate(session.checkInTime);
    const reason = session.checkOutReason || '';
    const backSoonReasons = (session.backSoonEvents || []).map(e => e.reason).join(' ');
    
    return date.toLowerCase().includes(searchQuery.toLowerCase()) ||
           reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
           backSoonReasons.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <StaffNavigation />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
        >
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="p-3 rounded-xl bg-primary-500/20">
              <HistoryIcon className="w-8 h-8 text-primary-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text">Lịch Sử</h1>
              <p className="text-gray-400">Xem chi tiết hoạt động của bạn</p>
            </div>
          </div>

          <Button
            variant="secondary"
            icon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Lọc
          </Button>
        </motion.div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Từ ngày"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  type="date"
                  label="Đến ngày"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </Card>
          </motion.div>
        )}

        {/* Search */}
        <Card className="mb-6">
          <Input
            type="text"
            placeholder="Tìm kiếm theo ngày hoặc lý do..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<SearchIcon className="w-5 h-5" />}
          />
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card gradient>
            <CardHeader title="Tổng Giờ Làm" icon={<ChartIcon />} />
            <div className="text-3xl font-bold text-primary-400">
              {formatDuration(Math.floor(stats.totalOnlineTime / 1000))}
            </div>
            <p className="text-sm text-gray-400 mt-2">{sessions.length} phiên</p>
          </Card>

          <Card gradient>
            <CardHeader title="Trung Bình/Ngày" icon={<ChartIcon />} />
            <div className="text-3xl font-bold text-green-400">
              {formatDuration(Math.floor(stats.averagePerDay / 1000))}
            </div>
            <p className="text-sm text-gray-400 mt-2">Mỗi phiên</p>
          </Card>

          <Card gradient>
            <CardHeader title="Back Soon Time" icon={<BackSoonIcon />} />
            <div className="text-3xl font-bold text-yellow-400">
              {formatDuration(Math.floor(stats.totalBackSoonTime / 1000))}
            </div>
            <p className="text-sm text-gray-400 mt-2">Tổng cộng</p>
          </Card>
        </div>

        {/* History Timeline */}
        <div className="space-y-4">
          {loading ? (
            <Card className="text-center py-12">
              <p className="text-gray-400">Đang tải...</p>
            </Card>
          ) : filteredSessions.length === 0 ? (
            <Card className="text-center py-12">
              <HistoryIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Không có dữ liệu lịch sử</p>
            </Card>
          ) : (
            filteredSessions.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                      <HistoryIcon className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{formatDate(record.checkInTime)}</h3>
                      <p className="text-sm text-gray-400">
                        {new Date(record.checkInTime).toLocaleDateString('vi-VN', { weekday: 'long' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Online</p>
                      <p className="text-lg font-mono font-bold text-green-400">
                        {(() => {
                          const time = record.totalOnlineTime || 0;
                          if (time > 86400000) return '0s'; // Skip if > 24 hours
                          return formatDuration(Math.floor(time / 1000));
                        })()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Back Soon</p>
                      <p className="text-lg font-mono font-bold text-yellow-400">
                        {(() => {
                          const time = record.totalBackSoonTime || 0;
                          if (time > 86400000) return '0s'; // Skip if > 24 hours
                          return formatDuration(Math.floor(time / 1000));
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-3 ml-0 md:ml-16">
                  {/* Check In */}
                  <div className="flex items-center gap-3 glass p-3 rounded-lg">
                    <CheckInIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Check In</p>
                      <p className="text-xs text-gray-400">{formatTime(record.checkInTime)}</p>
                    </div>
                  </div>

                  {/* Back Soon Records */}
                  {(record.backSoonEvents || []).map((backSoon, idx) => (
                    <div key={idx} className="flex items-center gap-3 glass p-3 rounded-lg">
                      <BackSoonIcon className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Back Soon - {backSoon.reason}</p>
                        <p className="text-xs text-gray-400">
                          {formatTime(backSoon.startTime)} • {formatDuration(Math.floor((backSoon.duration || 0) / 1000))}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Check Out */}
                  {record.checkOutTime && (
                    <div className="flex items-center gap-3 glass p-3 rounded-lg">
                      <CheckOutIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Check Out</p>
                        <p className="text-xs text-gray-400">
                          {formatTime(record.checkOutTime)}
                          {record.checkOutReason && ` • ${record.checkOutReason}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

