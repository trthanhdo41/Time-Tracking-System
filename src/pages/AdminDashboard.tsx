import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  UsersIcon,
  ReportIcon,
  ShieldIcon,
  SearchIcon,
  TrashIcon,
  LockIcon,
  ChartIcon,
  SettingsIcon,
  CameraIcon,
  ImageIcon,
  HistoryIcon,
  NotificationIcon,
  BackSoonIcon,
  EditIcon,
  EyeIcon,
} from '@/components/icons';
import { useAuthStore } from '@/store/authStore';
import { 
  getAllUsers, 
  getUserStats, 
  createNewUser, 
  deleteUser,
  listenToUsers 
} from '@/services/userService';
import { User, UserRole } from '@/types';
import { ImageDeleteRequestsManager } from '@/components/admin/ImageDeleteRequestsManager';
import { ActivityLogsManager } from '@/components/admin/ActivityLogsManager';
import { ReportsManager } from '@/components/admin/ReportsManager';
import { BackSoonManager } from '@/components/admin/BackSoonManager';
import { AllImagesManager } from '@/components/admin/AllImagesManager';
import { DataCleanupManager } from '@/components/admin/DataCleanupManager';
import { ErrorReportsManager } from '@/components/admin/ErrorReportsManager';
import { EmployeeDetailModal } from '@/components/admin/EmployeeDetailModal';
import toast from 'react-hot-toast';

export const AdminDashboard: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    backSoon: 0,
    offline: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'images' | 'activity' | 'reports' | 'backsoon' | 'allimages' | 'cleanup' | 'errors'>('users');
  
  // Form states
  const [newUserData, setNewUserData] = useState({
    username: '',
    email: '',
    password: '',
    position: '',
    department: '',
    role: 'staff' as UserRole
  });
  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [faceImagePreview, setFaceImagePreview] = useState<string>('');

  // Load users and stats
  useEffect(() => {
    loadData();
    
    // Listen to real-time updates
    const unsubscribe = listenToUsers((updatedUsers) => {
      setUsers(updatedUsers);
    });
    
    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, statsData] = await Promise.all([
        getAllUsers(),
        getUserStats()
      ]);
      setUsers(usersData);
      setStats(statsData);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!currentUser) return;
    
    // Validate form
    if (!newUserData.username || !newUserData.email || !newUserData.password) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (!faceImage) {
      toast.error('Vui lòng chọn ảnh Face0');
      return;
    }

    try {
      // Upload face image
      const formData = new FormData();
      formData.append('image', faceImage);
      
      const uploadResponse = await fetch('https://api.imgbb.com/1/upload?key=ae21ac039240a7d40788bcda9a822d8e', {
        method: 'POST',
        body: formData
      });
      
      const uploadData = await uploadResponse.json();
      const face0Url = uploadData.data.url;

      // Create user
      await createNewUser(
        newUserData.email,
        newUserData.password,
        newUserData.username, // Use full name as username
        newUserData.role,
        newUserData.department,
        newUserData.position,
        currentUser,
        face0Url
      );
      
      toast.success('Thêm nhân viên thành công! Vui lòng đăng nhập lại.', {
        duration: 5000
      });
      setShowAddUser(false);
      setNewUserData({
        username: '',
        email: '',
        password: '',
        position: '',
        department: '',
        role: 'staff'
      });
      setFaceImage(null);
      setFaceImagePreview('');
      
      // Note: Admin will be logged out due to Firebase limitation
      // The auth listener in App.tsx will handle redirect to login
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!currentUser) return;
    
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      return;
    }

    try {
      await deleteUser(userId, currentUser);
      toast.success('Xóa người dùng thành công!');
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleFaceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFaceImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setFaceImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statsDisplay = [
    { label: 'Tổng Nhân Viên', value: stats.total.toString(), icon: <UsersIcon />, color: 'primary' },
    { label: 'Online Hiện Tại', value: stats.online.toString(), icon: <ShieldIcon />, color: 'green' },
    { label: 'Back Soon', value: stats.backSoon.toString(), icon: <ChartIcon />, color: 'yellow' },
    { label: 'Offline', value: stats.offline.toString(), icon: <ReportIcon />, color: 'gray' },
  ];

  return (
    <div className="min-h-screen pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="gradient-text">Admin Dashboard</span>
            </h1>
            <p className="text-gray-400">Quản lý hệ thống và nhân viên</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              icon={<SettingsIcon />}
              onClick={() => navigate('/system-settings')}
            >
              Cài Đặt Hệ Thống
            </Button>
            <Button
              variant="primary"
              icon={<UsersIcon />}
              onClick={() => setShowAddUser(true)}
            >
              Thêm Nhân Viên
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsDisplay.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card gradient hover>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-primary-500/20 text-primary-400">
                    {stat.icon}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={activeTab === 'users' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('users')}
            icon={<UsersIcon />}
          >
            Quản Lý Nhân Viên
          </Button>
          <Button
            variant={activeTab === 'images' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('images')}
            icon={<ImageIcon />}
          >
            Duyệt Xóa Ảnh
          </Button>
          <Button
            variant={activeTab === 'activity' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('activity')}
            icon={<HistoryIcon />}
          >
            Hoạt Động
          </Button>
          <Button
            variant={activeTab === 'reports' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('reports')}
            icon={<ReportIcon />}
          >
            Báo Cáo
          </Button>
          <Button
            variant={activeTab === 'backsoon' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('backsoon')}
            icon={<BackSoonIcon />}
          >
            Back Soon
          </Button>
          <Button
            variant={activeTab === 'allimages' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('allimages')}
            icon={<ImageIcon />}
          >
            Tất Cả Ảnh
          </Button>
          <Button
            variant={activeTab === 'cleanup' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('cleanup')}
            icon={<TrashIcon />}
          >
            Dọn Dẹp
          </Button>
          <Button
            variant={activeTab === 'errors' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('errors')}
            icon={<NotificationIcon />}
          >
            Báo Cáo Lỗi
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && (
          <Card>
            <CardHeader 
              title="Quản Lý Nhân Viên"
              action={
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Tìm kiếm nhân viên..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400">Tên</th>
                    <th className="text-left py-3 px-4 text-gray-400">Email</th>
                    <th className="text-left py-3 px-4 text-gray-400">Phòng ban</th>
                    <th className="text-left py-3 px-4 text-gray-400">Vai trò</th>
                    <th className="text-left py-3 px-4 text-gray-400">Trạng thái</th>
                    <th className="text-left py-3 px-4 text-gray-400">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">
                        Không tìm thấy nhân viên nào
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {user.faceImageUrl ? (
                              <img 
                                src={user.faceImageUrl} 
                                alt={user.username}
                                className="w-10 h-10 rounded-full object-cover border border-primary-500/30"
                                onError={(e) => {
                                  // Fallback to initial if image fails
                                  const img = e.target as HTMLImageElement;
                                  img.style.display = 'none';
                                  img.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-sm border border-primary-500/30">
                                {user.username?.[0]?.toUpperCase() || '?'}
                              </div>
                            )}
                            <span className="font-medium">{user.username}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-400">{user.email}</td>
                        <td className="py-3 px-4 text-gray-400">{user.department}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                            user.role === 'department_admin' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {user.role === 'admin' ? 'Admin' :
                             user.role === 'department_admin' ? 'Dept Admin' :
                             'Staff'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={user.status || 'offline'} />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<EyeIcon />}
                              onClick={() => setSelectedUser(user)}
                              title="Chi tiết"
                            >
                              Chi tiết
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              icon={<TrashIcon />}
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              Xóa
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* System Settings Tab */}
        {/* Image Delete Requests Tab */}
        {activeTab === 'images' && (
          <ImageDeleteRequestsManager />
        )}

        {/* Activity Logs Tab */}
        {activeTab === 'activity' && (
          <ActivityLogsManager />
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <ReportsManager />
        )}

        {/* Back Soon Tab */}
        {activeTab === 'backsoon' && (
          <BackSoonManager />
        )}

        {/* All Images Tab */}
        {activeTab === 'allimages' && (
          <AllImagesManager />
        )}

        {/* Data Cleanup Tab */}
        {activeTab === 'cleanup' && (
          <DataCleanupManager />
        )}

        {/* Error Reports Tab */}
        {activeTab === 'errors' && (
          <ErrorReportsManager />
        )}
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddUser}
        onClose={() => {
          setShowAddUser(false);
          setNewUserData({
            username: '',
            email: '',
            password: '',
            position: '',
            department: '',
            role: 'staff'
          });
          setFaceImage(null);
          setFaceImagePreview('');
        }}
        title="Thêm Nhân Viên Mới"
        size="lg"
      >
        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column - Form Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Họ và tên</label>
                <Input
                  type="text"
                  placeholder="Nhập họ và tên"
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Email (Tên đăng nhập)</label>
                <Input
                  type="email"
                  placeholder="Nhập email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Mật khẩu</label>
                <Input
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Chức vụ</label>
                <Input
                  type="text"
                  placeholder="Nhập chức vụ"
                  value={newUserData.position}
                  onChange={(e) => setNewUserData({ ...newUserData, position: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Phòng ban</label>
                <Input
                  type="text"
                  placeholder="Nhập phòng ban"
                  value={newUserData.department}
                  onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Vai trò</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as UserRole })}
                  className="input-field w-full"
                >
                  <option value="staff">Nhân viên</option>
                  <option value="department_admin">Quản lý phòng ban</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>
            </div>

            {/* Right Column - Face Image Upload */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Ảnh Face0 (Bắt buộc)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFaceImageChange}
                className="block w-full text-sm text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary-500/20 file:text-primary-400
                  hover:file:bg-primary-500/30
                  transition-colors cursor-pointer"
              />
              {faceImagePreview ? (
                <div className="mt-4">
                  <p className="text-xs text-gray-400 mb-2">✓ Đã tải ảnh Face0</p>
                  <div className="relative w-full h-48 bg-gray-900 rounded-lg overflow-hidden border-2 border-primary-500/50">
                    <img
                      src={faceImagePreview}
                      alt="Face0 Preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                      onLoad={() => console.log('✓ Image rendered')}
                      onError={(e) => console.error('✗ Image error:', e)}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">Chưa chọn ảnh</p>
                  <div className="relative w-full h-48 bg-gray-900 rounded-lg overflow-hidden border-2 border-dashed border-gray-600 flex items-center justify-center">
                    <div className="text-center">
                      <CameraIcon className="w-16 h-16 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Chọn ảnh để xem preview</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex gap-3 pt-2">
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowAddUser(false);
                setNewUserData({
                  username: '',
                  email: '',
                  password: '',
                  position: '',
                  department: '',
                  role: 'staff'
                });
                setFaceImage(null);
                setFaceImagePreview('');
              }}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button 
              variant="primary"
              onClick={handleAddUser}
              className="flex-1"
            >
              Thêm Nhân Viên
            </Button>
          </div>
        </div>
      </Modal>

      {/* Employee Detail Modal */}
      <EmployeeDetailModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onUpdate={loadData}
      />
    </div>
  );
};
