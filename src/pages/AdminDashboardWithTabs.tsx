import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ImageManagement } from '@/components/admin/ImageManagement';
import {
  UsersIcon,
  ReportIcon,
  ShieldIcon,
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

export const AdminDashboard: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [showAddUser, setShowAddUser] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'images'>('users');
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
    department: '',
    role: 'staff' as UserRole
  });

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
      toast.error('Please fill in all information');
      return;
    }

    // Validate department_admin requirements
    if (newUserData.role === 'department_admin') {
      if (!newUserData.department || newUserData.department.trim() === '') {
        toast.error('Department is required for Department Admin role');
        return;
      }
      
      // Check if department already has a department_admin
      const existingDeptAdmin = users.find(
        user => user.role === 'department_admin' && user.department === newUserData.department && user.isActive !== false
      );
      
      if (existingDeptAdmin) {
        toast.error(`Department "${newUserData.department}" already has a Department Admin`);
        return;
      }
    }

    try {
      await createNewUser(
        newUserData.email,
        newUserData.password,
        newUserData.username,
        newUserData.role,
        newUserData.department,
        newUserData.position,
        currentUser
      );
      
      toast.success('Employee added successfully!');
      setShowAddUser(false);
      setNewUserData({
        username: '',
        email: '',
        password: '',
        position: '',
        department: '',
        role: 'staff'
      });
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete employee ${username}?`)) return;

    try {
      await deleteUser(userId);
      toast.success('Employee deleted successfully!');
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
          <p className="text-gray-400">Loading data...</p>
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
            Admin Dashboard
          </h1>
          <p className="text-gray-400">
            System and employee management
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
                    <p className="text-blue-200 text-sm">Total Employees</p>
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
                    <p className="text-green-200 text-sm">Currently Online</p>
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

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-2 mb-6"
        >
          <Button
            variant={activeTab === 'users' ? 'default' : 'outline'}
            onClick={() => setActiveTab('users')}
          >
            <UsersIcon className="w-4 h-4 mr-2" />
            User Management
          </Button>
          <Button
            variant={activeTab === 'images' ? 'default' : 'outline'}
            onClick={() => setActiveTab('images')}
          >
            <ShieldIcon className="w-4 h-4 mr-2" />
            Image Management
          </Button>
        </motion.div>

        {/* Content based on active tab */}
        {activeTab === 'users' ? (
          <>
            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 mb-6"
            >
              <div className="flex-1">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button onClick={() => setShowAddUser(true)}>
                <UsersIcon className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </motion.div>

            {/* Users List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold text-white">Employee List</h3>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-4 text-gray-300">Name</th>
                        <th className="text-left p-4 text-gray-300">Email</th>
                        <th className="text-left p-4 text-gray-300">Position</th>
                        <th className="text-left p-4 text-gray-300">Department</th>
                        <th className="text-left p-4 text-gray-300">Role</th>
                        <th className="text-left p-4 text-gray-300">Status</th>
                        <th className="text-left p-4 text-gray-300">Actions</th>
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
                          <td className="p-4 text-gray-300">{user.department}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                              user.role === 'department_admin' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {user.role === 'admin' ? 'Admin' :
                               user.role === 'department_admin' ? 'Department Admin' :
                               'Staff'}
                            </span>
                          </td>
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
                      <p className="text-gray-400">No employees found</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <ImageManagement />
          </motion.div>
        )}

        {/* Add User Modal */}
        <Modal isOpen={showAddUser} onClose={() => setShowAddUser(false)} title="Add New Employee">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Employee Name
              </label>
              <Input
                value={newUserData.username}
                onChange={(e) => setNewUserData({...newUserData, username: e.target.value})}
                placeholder="Enter employee name"
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
                placeholder="Enter email"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <Input
                type="password"
                value={newUserData.password}
                onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                placeholder="Enter password"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Position
              </label>
              <Input
                value={newUserData.position}
                onChange={(e) => setNewUserData({...newUserData, position: e.target.value})}
                placeholder="Enter position"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Department
              </label>
              <Input
                value={newUserData.department}
                onChange={(e) => setNewUserData({...newUserData, department: e.target.value})}
                placeholder="Enter department"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Role
              </label>
              <select
                value={newUserData.role}
                onChange={(e) => setNewUserData({...newUserData, role: e.target.value as UserRole})}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="staff" style={{ backgroundColor: '#0f172a', color: '#f1f5f9' }}>Staff</option>
                <option value="department_admin" style={{ backgroundColor: '#0f172a', color: '#f1f5f9' }}>Department Admin</option>
                <option value="admin" style={{ backgroundColor: '#0f172a', color: '#f1f5f9' }}>Admin</option>
              </select>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddUser(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                className="flex-1"
                disabled={!newUserData.username || !newUserData.email || !newUserData.password}
              >
                Add Employee
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};
