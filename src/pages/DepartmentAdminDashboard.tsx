import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  UsersIcon,
  ReportIcon,
  SearchIcon,
  TrashIcon,
  LockIcon,
  ChartIcon,
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
import toast from 'react-hot-toast';

export const DepartmentAdminDashboard: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [showAddUser, setShowAddUser] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    backSoon: 0,
    offline: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [newUserData, setNewUserData] = useState({
    username: '',
    email: '',
    password: '',
    position: '',
    department: currentUser?.department || '',
    role: 'staff' as UserRole
  });

  // Load users and stats (filtered by department)
  useEffect(() => {
    loadData();
    
    // Listen to real-time updates
    const unsubscribe = listenToUsers((updatedUsers) => {
      // Filter by department
      const departmentUsers = updatedUsers.filter(user => 
        user.department === currentUser?.department
      );
      setUsers(departmentUsers);
    });
    
    return () => unsubscribe();
  }, [currentUser?.department]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, statsData] = await Promise.all([
        getAllUsers(),
        getUserStats()
      ]);
      
      // Filter by department
      const departmentUsers = usersData.filter(user => 
        user.department === currentUser?.department
      );
      setUsers(departmentUsers);
      
      // Calculate department-specific stats
      const departmentStats = {
        total: departmentUsers.length,
        online: departmentUsers.filter(u => u.status === 'online').length,
        backSoon: departmentUsers.filter(u => u.status === 'back_soon').length,
        offline: departmentUsers.filter(u => u.status === 'offline').length
      };
      setStats(departmentStats);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!currentUser) return;

    try {
      await createNewUser({
        ...newUserData,
        department: currentUser.department, // Force department to match admin's department
        role: 'staff' // Department admin can only create staff
      });
      
      toast.success('Thêm nhân viên thành công!');
      setShowAddUser(false);
      setNewUserData({
        username: '',
        email: '',
        password: '',
        position: '',
        department: currentUser.department,
        role: 'staff'
      });
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Bạn có chắc muốn xóa nhân viên ${username}?`)) return;

    try {
      await deleteUser(userId);
      toast.success('Xóa nhân viên thành công!');
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Quản Lý Phòng Ban: {currentUser?.department}
          </h1>
          <p className="text-gray-400">
            Quản lý nhân viên trong phòng ban của bạn
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-sm">Tổng Nhân Viên</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                  </div>
                  <UsersIcon className="w-8 h-8 text-blue-400" />
                </div>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-200 text-sm">Đang Online</p>
                    <p className="text-2xl font-bold text-white">{stats.online}</p>
                  </div>
                  <ChartIcon className="w-8 h-8 text-green-400" />
                </div>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-200 text-sm">Back Soon</p>
                    <p className="text-2xl font-bold text-white">{stats.backSoon}</p>
                  </div>
                  <ChartIcon className="w-8 h-8 text-yellow-400" />
                </div>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-gray-500/20 to-gray-600/20 border-gray-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-200 text-sm">Offline</p>
                    <p className="text-2xl font-bold text-white">{stats.offline}</p>
                  </div>
                  <ChartIcon className="w-8 h-8 text-gray-400" />
                </div>
              </CardHeader>
            </Card>
          </motion.div>
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <div className="flex-1">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Tìm kiếm nhân viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button onClick={() => setShowAddUser(true)}>
            <UsersIcon className="w-4 h-4 mr-2" />
            Thêm Nhân Viên
          </Button>
        </motion.div>

        {/* Users List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold text-white">Danh Sách Nhân Viên</h3>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-4 text-gray-300">Tên</th>
                    <th className="text-left p-4 text-gray-300">Email</th>
                    <th className="text-left p-4 text-gray-300">Chức Vụ</th>
                    <th className="text-left p-4 text-gray-300">Trạng Thái</th>
                    <th className="text-left p-4 text-gray-300">Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-b border-gray-800 hover:bg-gray-800/30"
                    >
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium">{user.username}</p>
                          <p className="text-sm text-gray-400">{user.department}</p>
                        </div>
                      </td>
                      <td className="p-4 text-gray-300">{user.email}</td>
                      <td className="p-4 text-gray-300">{user.position}</td>
                      <td className="p-4">
                        <StatusBadge status={user.status || 'offline'} />
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            className="text-red-400 border-red-400 hover:bg-red-400/10"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400">Không tìm thấy nhân viên nào</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Add User Modal */}
        <Modal isOpen={showAddUser} onClose={() => setShowAddUser(false)} title="Thêm Nhân Viên Mới">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tên nhân viên
              </label>
              <Input
                value={newUserData.username}
                onChange={(e) => setNewUserData({...newUserData, username: e.target.value})}
                placeholder="Nhập tên nhân viên"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <Input
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                placeholder="Nhập email"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mật khẩu
              </label>
              <Input
                type="password"
                value={newUserData.password}
                onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                placeholder="Nhập mật khẩu"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Chức vụ
              </label>
              <Input
                value={newUserData.position}
                onChange={(e) => setNewUserData({...newUserData, position: e.target.value})}
                placeholder="Nhập chức vụ"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phòng ban
              </label>
              <Input
                value={newUserData.department}
                disabled
                className="bg-gray-700"
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddUser(false)}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                onClick={handleAddUser}
                className="flex-1"
                disabled={!newUserData.username || !newUserData.email || !newUserData.password}
              >
                Thêm Nhân Viên
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};
