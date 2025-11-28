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
  MenuIcon,
  CloseIcon,
} from '@/components/icons';
import { useAuthStore } from '@/store/authStore';
import { useSidebarStore } from '@/store/sidebarStore';
import { 
  getAllUsers, 
  getUserStats, 
  createNewUser, 
  deleteUser,
  listenToUsers 
} from '@/services/userService';
import { User, UserRole } from '@/types';
import { ImageDeleteRequestsManager } from '@/components/admin/ImageDeleteRequestsManager';
import { ForgotPasswordRequestsManager } from '@/components/admin/ForgotPasswordRequestsManager';
import { ReportsManager } from '@/components/admin/ReportsManager';
import { AllImagesManager } from '@/components/admin/AllImagesManager';
import { DataCleanupManager } from '@/components/admin/DataCleanupManager';
import { ErrorReportsManager } from '@/components/admin/ErrorReportsManager';
import { EmployeeDetailModal } from '@/components/admin/EmployeeDetailModal';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { SystemSettingsContent } from '@/components/admin/SystemSettingsContent';
import { HistoryPage } from '@/pages/HistoryPage';
import { TermsAndConditionsManager } from '@/components/admin/TermsAndConditionsManager';
import { formatTime } from '@/utils/time';
import toast from 'react-hot-toast';

export const AdminDashboard: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { isCollapsed: sidebarCollapsed, toggle: toggleSidebar } = useSidebarStore();
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
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'history' | 'images' | 'reports' | 'allimages' | 'cleanup' | 'errors' | 'settings' | 'terms'>('users');
  const [selectedHistoryUserId, setSelectedHistoryUserId] = useState<string>('all'); // For viewing specific user's history, default to 'all'
  
  // Form states
  const [newUserData, setNewUserData] = useState({
    fullName: '',
    email: '',
    password: '',
    position: '',
    department: '',
    role: 'staff' as UserRole
  });
  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [faceImagePreview, setFaceImagePreview] = useState<string>('');
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  // Generate strong password
  const generateStrongPassword = () => {
    const length = 12;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = uppercase + lowercase + numbers + symbols;
    
    let password = '';
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setNewUserData({ ...newUserData, password });
    validatePasswordStrength(password);
  };

  // Validate password strength
  const validatePasswordStrength = (password: string) => {
    if (password.length < 8) {
      setPasswordStrength('weak');
      return false;
    }
    
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
    
    const strength = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
    
    if (strength >= 4 && password.length >= 12) {
      setPasswordStrength('strong');
      return true;
    } else if (strength >= 3 && password.length >= 8) {
      setPasswordStrength('medium');
      return true;
    } else {
      setPasswordStrength('weak');
      return false;
    }
  };

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
    if (!currentUser || isAddingUser) return;
    
    // Validate form
    if (!newUserData.fullName || !newUserData.email || !newUserData.password) {
      toast.error('Please fill in all required fields (Full Name, Email, Password)');
      return;
    }
    
    // Auto-generate username from email (part before @)
    const username = newUserData.email.split('@')[0];
    if (!username) {
      toast.error('Invalid email format');
      return;
    }
    
    // Validate password strength
    if (newUserData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    const hasUpper = /[A-Z]/.test(newUserData.password);
    const hasLower = /[a-z]/.test(newUserData.password);
    const hasNumber = /[0-9]/.test(newUserData.password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(newUserData.password);
    
    if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
      toast.error('Password must contain uppercase, lowercase, number, and special character');
      return;
    }
    
    if (!faceImage) {
      toast.error('Please select Face0 image');
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
    
    setIsAddingUser(true);

    try {
      // Upload face image
      const formData = new FormData();
      formData.append('image', faceImage);

      const uploadResponse = await fetch('https://api.imgbb.com/1/upload?key=ae21ac039240a7d40788bcda9a822d8e', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error(`Image upload failed: ${uploadResponse.statusText}`);
      }

      const uploadData = await uploadResponse.json();

      if (!uploadData.success || !uploadData.data || !uploadData.data.url) {
        throw new Error('Image upload failed: Invalid response from server');
      }

      const face0Url = uploadData.data.url;

      // Auto-generate username from email (part before @)
      const username = newUserData.email.split('@')[0];
      
      // Get saved admin password (auto-saved when admin logged in)
      const adminPassword = sessionStorage.getItem('admin_password_for_relogin');
      
      // Create user
      await createNewUser(
        newUserData.email,
        newUserData.password,
        username, // Auto-generated username from email
        newUserData.role,
        newUserData.department,
        newUserData.position,
        currentUser,
        face0Url,
        newUserData.fullName, // Full name for display
        adminPassword || undefined // Admin password to re-login (auto-saved when admin logged in)
      );
      
      toast.success('Employee added successfully!');
      
      setShowAddUser(false);
      setNewUserData({
        fullName: '',
        email: '',
        password: '',
        position: '',
        department: '',
        role: 'staff'
      });
      setFaceImage(null);
      setFaceImagePreview('');
      setPasswordStrength('weak');
      
      // Admin will be auto-redirected to login by auth listener
      // This is a Firebase client-side limitation
    } catch (error: any) {
      toast.error(error.message);
      setIsAddingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!currentUser || deletingUserId) return;
    
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    setDeletingUserId(userId);
    try {
      await deleteUser(userId, currentUser);
      toast.success('User deleted successfully!');
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeletingUserId(null);
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
    (user.fullName || user.username).toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statsDisplay = [
    { label: 'Total Employees', value: stats.total.toString(), icon: <UsersIcon />, color: 'primary' },
    { label: 'Currently Online', value: stats.online.toString(), icon: <ShieldIcon />, color: 'green' },
    { label: 'Back Soon', value: stats.backSoon.toString(), icon: <ChartIcon />, color: 'yellow' },
    { label: 'Offline', value: stats.offline.toString(), icon: <ReportIcon />, color: 'gray' },
  ];

  return (
    <>
      {/* Fixed Sidebar */}
      <AdminSidebar 
        activeTab={activeTab} 
        onTabChange={(tab) => setActiveTab(tab as any)}
        isCollapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        isAdmin={currentUser?.role === 'admin'}
      />

      {/* Main Content with margin for sidebar */}
      <div className={`min-h-screen pb-8 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[280px]'}`}>
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
              <p className="text-gray-400">System and employee management</p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
            <Button
              variant="primary"
              icon={<UsersIcon />}
              onClick={() => setShowAddUser(true)}
            >
              Add Employee
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

        {/* Tab Content */}
        {activeTab === 'users' && (
          <Card>
            <CardHeader 
              title="Employee Management"
              action={
                <div className="relative w-64">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400">Name</th>
                    <th className="text-left py-3 px-4 text-gray-400">Username</th>
                    <th className="text-left py-3 px-4 text-gray-400">Email</th>
                    <th className="text-left py-3 px-4 text-gray-400">Department</th>
                    <th className="text-left py-3 px-4 text-gray-400">Role</th>
                    <th className="text-left py-3 px-4 text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-gray-400">Last Activity</th>
                    <th className="text-left py-3 px-4 text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-400">
                        No employees found
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
                                alt={user.fullName || user.username}
                                className="w-10 h-10 rounded-full object-cover border border-primary-500/30"
                                onError={(e) => {
                                  // Fallback to icon/initial if image fails
                                  const img = e.target as HTMLImageElement;
                                  img.style.display = 'none';
                                  img.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-sm border border-primary-500/30">
                                {user.role === 'admin' ? (
                                  <UsersIcon className="w-5 h-5" />
                                ) : (
                                  (user.fullName || user.username)?.[0]?.toUpperCase() || '?'
                                )}
                              </div>
                            )}
                            <span className="font-medium">{user.fullName || user.username}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          <span className="text-sm font-mono">{user.username}</span>
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
                        <td className="py-3 px-4 text-gray-400 text-sm">
                          {user.lastActivityAt 
                            ? formatTime(user.lastActivityAt)
                            : user.status === 'online' 
                              ? 'Just now' 
                              : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<EyeIcon />}
                            onClick={() => setSelectedUser(user)}
                            title="Details"
                          >
                            Details
                          </Button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <Card>
              <CardHeader 
                title="History"
                action={
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-400">Select User:</label>
                    <select
                      value={selectedHistoryUserId}
                      onChange={(e) => setSelectedHistoryUserId(e.target.value)}
                      className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500 min-w-[200px]"
                      style={{ backgroundColor: '#1f2937', color: '#f1f5f9' }}
                    >
                      <option value="all" style={{ backgroundColor: '#0f172a', color: '#f1f5f9' }}>
                        All Users
                      </option>
                      <option value="" style={{ backgroundColor: '#0f172a', color: '#f1f5f9' }}>
                        {currentUser?.username || 'Admin'}
                      </option>
                      {users
                        .filter(u => u.id !== currentUser?.id)
                        .map((u) => (
                          <option 
                            key={u.id} 
                            value={u.id}
                            style={{ backgroundColor: '#0f172a', color: '#f1f5f9' }}
                          >
                            {u.username} ({u.email})
                          </option>
                        ))}
                    </select>
                  </div>
                }
              />
            </Card>
            <div className="-mt-6">
              <HistoryPage 
                selectedUserId={
                  selectedHistoryUserId === 'all' 
                    ? 'all' 
                    : selectedHistoryUserId === '' 
                      ? (currentUser?.id || undefined)
                      : selectedHistoryUserId
                } 
                showNavigation={false}
              />
            </div>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'images' && (
          <ImageDeleteRequestsManager />
        )}

        {/* Forgot Password Tab */}
        {activeTab === 'forgotpassword' && (
          <ForgotPasswordRequestsManager />
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <ReportsManager />
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

        {/* System Settings Tab */}
        {activeTab === 'settings' && (
          <SystemSettingsContent />
        )}
        {activeTab === 'terms' && currentUser?.role === 'admin' && (
          <TermsAndConditionsManager />
        )}
      </div>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddUser}
        onClose={() => {
          setShowAddUser(false);
          setNewUserData({
            username: '',
            fullName: '',
            email: '',
            password: '',
            position: '',
            department: '',
            role: 'staff'
          });
          setFaceImage(null);
          setFaceImagePreview('');
          setPasswordStrength('weak');
        }}
        title="Add New Employee"
        size="xl"
      >
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                <Input
                  type="text"
                  placeholder="Enter full name"
                  value={newUserData.fullName}
                  onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <Input
                  type="email"
                  placeholder="Enter email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Username will be automatically generated from email (part before @)
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm text-gray-400">Password</label>
                  <button
                    type="button"
                    onClick={generateStrongPassword}
                    className="text-xs text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1"
                  >
                    <LockIcon className="w-3 h-3" />
                    Generate Strong Password
                  </button>
                </div>
                <Input
                  type="password"
                  placeholder="Enter password (min 8 chars, include A-Z, a-z, 0-9, special)"
                  value={newUserData.password}
                  onChange={(e) => {
                    const newPassword = e.target.value;
                    setNewUserData({ ...newUserData, password: newPassword });
                    validatePasswordStrength(newPassword);
                  }}
                />
                {newUserData.password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-1.5 flex-1 bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${
                          passwordStrength === 'weak' ? 'bg-red-500 w-1/3' :
                          passwordStrength === 'medium' ? 'bg-yellow-500 w-2/3' :
                          'bg-green-500 w-full'
                        }`} />
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength === 'weak' ? 'text-red-400' :
                        passwordStrength === 'medium' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {passwordStrength === 'weak' ? 'Weak' :
                         passwordStrength === 'medium' ? 'Medium' :
                         'Strong'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Password must contain: uppercase, lowercase, number, and special character
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Position</label>
                <Input
                  type="text"
                  placeholder="Enter position"
                  value={newUserData.position}
                  onChange={(e) => setNewUserData({ ...newUserData, position: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Department</label>
                <Input
                  type="text"
                  placeholder="Enter department"
                  value={newUserData.department}
                  onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Role</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as UserRole })}
                  className="input-field w-full"
                >
                  <option value="staff" style={{ backgroundColor: '#0f172a', color: '#f1f5f9' }}>Staff</option>
                  <option value="department_admin" style={{ backgroundColor: '#0f172a', color: '#f1f5f9' }}>Department Admin</option>
                  <option value="admin" style={{ backgroundColor: '#0f172a', color: '#f1f5f9' }}>Administrator</option>
                </select>
              </div>
            </div>

            {/* Right Column - Face Image Upload */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Face0 Image (Required)</label>
              <input
                id="face-upload-input"
                type="file"
                accept="image/*"
                onChange={handleFaceImageChange}
                className="hidden"
              />
              <label
                htmlFor="face-upload-input"
                className="block w-full text-center py-3 px-4 rounded-lg border-2 border-dashed border-primary-500/50 
                  bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 hover:border-primary-500
                  transition-all cursor-pointer font-medium"
              >
                <CameraIcon className="w-5 h-5 inline-block mr-2" />
                Choose Image File
              </label>
              {faceImagePreview ? (
                <div className="mt-4">
                  <p className="text-xs text-gray-400 mb-3">✓ Face0 image uploaded</p>
                  <div className="relative w-full h-64 bg-gray-900 rounded-lg overflow-hidden border-2 border-primary-500/50">
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
                  <p className="text-xs text-gray-500 mb-3">No image selected</p>
                  <div className="relative w-full h-64 bg-gray-900 rounded-lg overflow-hidden border-2 border-dashed border-gray-600 flex items-center justify-center">
                    <div className="text-center">
                      <CameraIcon className="w-16 h-16 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Select image to preview</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-700">
          <div className="flex gap-3">
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
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={handleAddUser}
              loading={isAddingUser}
              className="flex-1"
            >
              Add Employee
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
    </>
  );
};
