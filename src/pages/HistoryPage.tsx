import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StaffNavigation } from '@/components/layout/StaffNavigation';
import { useLocation } from 'react-router-dom';
import {
  HistoryIcon,
  FilterIcon,
  SearchIcon,
  CheckInIcon,
  CheckOutIcon,
  BackSoonIcon,
  ChartIcon,
  CalendarIcon
} from '@/components/icons';
import { formatTime, formatDate, formatDuration } from '@/utils/time';
import { useAuthStore } from '@/store/authStore';
import { getUserSessionHistory, getAllSessionsHistory } from '@/services/sessionService';
import { getAllUsers } from '@/services/userService';
import { Session } from '@/types';
import toast from 'react-hot-toast';

interface HistoryPageProps {
  selectedUserId?: string | 'all'; // For admin to view specific user's history or 'all' for all users
  showNavigation?: boolean; // Whether to show StaffNavigation
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ selectedUserId, showNavigation = true }) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('00:00'); // Time for start date
  const [endTime, setEndTime] = useState('23:59'); // Time for end date
  const [userFilter, setUserFilter] = useState(''); // Filter by username/email
  const [showFilters, setShowFilters] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Record<string, { username: string; email: string; department: string }>>({});
  
  // Determine if we're in admin context (no StaffNavigation needed)
  const isInAdminContext = location.pathname === '/' && user?.role === 'admin';
  const displayNavigation = showNavigation && !isInAdminContext;
  
  // Use selectedUserId if provided (for admin), otherwise use current user's ID
  const userIdToLoad = selectedUserId || user?.id;
  const showAllUsers = selectedUserId === 'all';

  // Load users data when showing all users
  useEffect(() => {
    if (showAllUsers) {
      const loadUsers = async () => {
        try {
          const usersData = await getAllUsers();
          const usersMap: Record<string, { username: string; email: string; department: string }> = {};
          usersData.forEach(u => {
            usersMap[u.id] = {
              username: u.username,
              email: u.email,
              department: u.department
            };
          });
          setUsers(usersMap);
        } catch (error) {
          console.error('Error loading users:', error);
        }
      };
      loadUsers();
    }
  }, [showAllUsers]);

  // Load session history
  useEffect(() => {
    const loadHistory = async () => {
      // If showing all users, we don't need userIdToLoad
      // If showing specific user, we need userIdToLoad
      if (!showAllUsers && !userIdToLoad) return;
      
      try {
        setLoading(true);
        // Convert date strings to timestamps (start of day to end of day)
        let startTimestamp: number | undefined;
        let endTimestamp: number | undefined;
        
        if (startDate) {
          const startDateObj = new Date(startDate + 'T' + startTime + ':00');
          startTimestamp = startDateObj.getTime();
          if (isNaN(startTimestamp)) {
            console.error('Invalid start date:', startDate);
            startTimestamp = undefined;
          }
        }

        if (endDate) {
          const endDateObj = new Date(endDate + 'T' + endTime + ':59');
          endTimestamp = endDateObj.getTime();
          if (isNaN(endTimestamp)) {
            console.error('Invalid end date:', endDate);
            endTimestamp = undefined;
          }
        }
        
        console.log('Loading history with filters:', { 
          startDate, 
          endDate, 
          startTimestamp: startTimestamp ? new Date(startTimestamp).toISOString() : undefined, 
          endTimestamp: endTimestamp ? new Date(endTimestamp).toISOString() : undefined, 
          userIdToLoad, 
          showAllUsers 
        });
        
        let history: Session[];
        if (showAllUsers) {
          history = await getAllSessionsHistory(startTimestamp, endTimestamp);
        } else {
          history = await getUserSessionHistory(userIdToLoad as string, startTimestamp, endTimestamp);
        }
        
        console.log('Loaded history:', history.length, 'sessions');
        setSessions(history);
      } catch (error: any) {
        console.error('Error loading history:', error);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [userIdToLoad, startDate, endDate, startTime, endTime, showAllUsers]);

  // Calculate stats
  const stats = {
    totalOnlineTime: sessions.reduce((sum, s) => {
      const time = s.totalOnlineTime || 0;
      // totalOnlineTime is already in seconds
      return sum + time;
    }, 0),
    totalBackSoonTime: sessions.reduce((sum, s) => {
      const time = s.totalBackSoonTime || 0;
      // totalBackSoonTime is already in seconds
      return sum + time;
    }, 0),
    averagePerDay: sessions.length > 0 
      ? sessions.reduce((sum, s) => {
          const time = s.totalOnlineTime || 0;
          return sum + time;
        }, 0) / sessions.length 
      : 0,
    attendanceRate: sessions.length > 0 
      ? (sessions.filter(s => s.checkOutTime).length / sessions.length) * 100 
      : 0,
  };

  // Filter sessions by search query and time filters
  const filteredSessions = sessions.filter(session => {
    // User filter (only when viewing all users)
    if (showAllUsers && userFilter && session.userId && users[session.userId]) {
      const filterLower = userFilter.toLowerCase();
      const userData = users[session.userId];
      const matchesUser = userData.username.toLowerCase().includes(filterLower) ||
                          userData.email.toLowerCase().includes(filterLower) ||
                          userData.department.toLowerCase().includes(filterLower);
      if (!matchesUser) return false;
    }
    
    // Search query filter
    if (searchQuery) {
      const date = formatDate(session.checkInTime);
      const reason = session.checkOutReason || '';
      const backSoonReasons = (session.backSoonEvents || []).map(e => e.reason).join(' ');
      const searchLower = searchQuery.toLowerCase();
      
      // Basic search fields (always available)
      let matches = date.toLowerCase().includes(searchLower) ||
                    reason.toLowerCase().includes(searchLower) ||
                    backSoonReasons.toLowerCase().includes(searchLower);
      
      // Additional search fields when viewing all users
      if (showAllUsers && session.userId && users[session.userId]) {
        matches = matches ||
                  users[session.userId].username.toLowerCase().includes(searchLower) ||
                  users[session.userId].email.toLowerCase().includes(searchLower) ||
                  users[session.userId].department.toLowerCase().includes(searchLower);
      }
      
      if (!matches) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        {displayNavigation && <StaffNavigation />}

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
              <h1 className="text-4xl font-bold gradient-text">History</h1>
              <p className="text-gray-400">View your activity details</p>
            </div>
          </div>

          <Button
            variant="secondary"
            icon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filter
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
              <div className="space-y-4">
                {/* Helper Text */}
                <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-3">
                  <p className="text-sm text-gray-300">
                    💡 Use filters to narrow down sessions by {showAllUsers ? 'user, ' : ''}date and time range
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Example: From 10:00 on 5/11/2025 to 09:59 on 6/11/2025
                  </p>
                </div>

                {/* User Filter - Only show when viewing all users */}
                {showAllUsers && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-3">Filter by Employee</h3>
                    <p className="text-xs text-gray-400 mb-2">Search by username, email, or department</p>
                    <Input
                      type="text"
                      placeholder="e.g., John, john@example.com, IT"
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      icon={<SearchIcon className="w-5 h-5" />}
                    />
                  </div>
                )}

                {/* Date and Time Range Filter */}
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Date and Time Range</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Start Date and Time */}
                    <div className="space-y-2">
                      <Input
                        type="date"
                        label="From Date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                      <Input
                        type="time"
                        label="From Time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>

                    {/* End Date and Time */}
                    <div className="space-y-2">
                      <Input
                        type="date"
                        label="To Date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                      <Input
                        type="time"
                        label="To Time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Clear Filters Button */}
                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setUserFilter('');
                      setStartDate('');
                      setEndDate('');
                      setStartTime('00:00');
                      setEndTime('23:59');
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Search */}
        <Card className="mb-6">
          <Input
            type="text"
            placeholder="Search by date or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<SearchIcon className="w-5 h-5" />}
          />
        </Card>

        {/* Summary Stats */}
        <div className="space-y-6 mb-8">
          {/* Date Range Display - Always show */}
          <Card className="bg-red-500/10 border-red-500/30">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarIcon className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold text-red-400">Date Range Filter</h3>
              </div>
              <div className="text-white space-y-1">
                {startDate ? (
                  <p className="text-sm">
                    <span className="text-gray-400">From:</span>{' '}
                    <span className="font-medium">{formatDate(new Date(startDate + 'T' + startTime).getTime())} {startTime}</span>
                  </p>
                ) : (
                  <p className="text-sm">
                    <span className="text-gray-400">From:</span>{' '}
                    <span className="font-medium text-gray-500">All time</span>
                  </p>
                )}
                {endDate ? (
                  <p className="text-sm">
                    <span className="text-gray-400">To:</span>{' '}
                    <span className="font-medium">{formatDate(new Date(endDate + 'T' + endTime).getTime())} {endTime}</span>
                  </p>
                ) : (
                  <p className="text-sm">
                    <span className="text-gray-400">To:</span>{' '}
                    <span className="font-medium text-gray-500">Now</span>
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card gradient>
              <CardHeader title="Total Work Hours" icon={<ChartIcon />} />
              <div className="text-3xl font-bold text-primary-400">
                {formatDuration(stats.totalOnlineTime)}
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {sessions.length} total sessions
                {filteredSessions.length !== sessions.length && ` • ${filteredSessions.length} filtered`}
              </p>
            </Card>

            <Card gradient>
              <CardHeader title="Back Soon Time" icon={<BackSoonIcon />} />
              <div className="text-3xl font-bold text-yellow-400">
                {formatDuration(stats.totalBackSoonTime)}
              </div>
              <p className="text-sm text-gray-400 mt-2">Total</p>
            </Card>
          </div>

          {/* Employee Name Display */}
          {!showAllUsers && user && (
            <div className="mt-6">
              <Card gradient>
                <div className="text-center">
                  <h2 className="text-2xl font-bold gradient-text">
                    {user.fullName || user.username}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {user.position} - {user.department}
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* History Timeline */}
        <div className="space-y-4">
          {loading ? (
            <Card className="text-center py-12">
              <p className="text-gray-400">Loading...</p>
            </Card>
          ) : filteredSessions.length === 0 ? (
            <Card className="text-center py-12">
              <HistoryIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No history data</p>
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
                      <h3 className="text-lg font-semibold">
                        {formatDate(record.checkInTime)}
                        {showAllUsers && record.userId && users[record.userId] && (
                          <span className="ml-2 text-sm text-primary-400 font-normal">
                            • {users[record.userId].username}
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {(() => {
                          // Convert Firebase Timestamp to number
                          let ts: number | any = record.checkInTime;
                          if (ts && typeof ts === 'object' && ts.toMillis) {
                            ts = ts.toMillis();
                          } else if (ts && typeof ts === 'object' && ts.seconds) {
                            ts = ts.seconds * 1000;
                          }
                          if (!ts) return '';
                          return new Date(ts).toLocaleDateString('en-US', { weekday: 'long' });
                        })()}
                        {showAllUsers && record.userId && users[record.userId] && (
                          <span className="ml-2">• {users[record.userId].department}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Online</p>
                      <p className="text-lg font-mono font-bold text-green-400">
                        {formatDuration(record.totalOnlineTime || 0)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Back Soon</p>
                      <p className="text-lg font-mono font-bold text-yellow-400">
                        {formatDuration(record.totalBackSoonTime || 0)}
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
                  {(record.backSoonEvents || []).map((backSoon, idx) => {
                    let reasonDisplay = 'Unknown';
                    if (backSoon.reason === 'meeting') reasonDisplay = 'Meeting';
                    else if (backSoon.reason === 'toilet') reasonDisplay = 'Toilet';
                    else if (backSoon.reason === 'other') reasonDisplay = backSoon.customReason || 'Other';
                    
                    return (
                      <div key={idx} className="flex items-center gap-3 glass p-3 rounded-lg">
                        <BackSoonIcon className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Back Soon - {reasonDisplay}</p>
                          <p className="text-xs text-gray-400">
                            {formatTime(backSoon.startTime)} • {formatDuration(Math.floor((backSoon.duration || 0) / 1000))}
                          </p>
                        </div>
                      </div>
                    );
                  })}

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

