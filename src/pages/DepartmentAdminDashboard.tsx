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
  CameraIcon,
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
  const [isAddingUser, setIsAddingUser] = useState(false);
  
  // Form states
  const [newUserData, setNewUserData] = useState({
    fullName: '',
    email: '',
    password: '',
    position: '',
    department: currentUser?.department || '',
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

  // Handle face image change
  const handleFaceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFaceImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFaceImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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

    setIsAddingUser(true);

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

      // Auto-generate username from email (part before @)
      const username = newUserData.email.split('@')[0];
      
      // Create user
      await createNewUser(
        newUserData.email,
        newUserData.password,
        username, // Auto-generated username from email
        newUserData.role,
        currentUser.department, // Force department to match admin's department
        newUserData.position,
        currentUser,
        face0Url,
        newUserData.fullName // Full name for display
      );
      
      toast.success('Employee added successfully!');
      setShowAddUser(false);
      setNewUserData({
        fullName: '',
        email: '',
        password: '',
        position: '',
        department: currentUser.department,
        role: 'staff'
      });
      setFaceImage(null);
      setFaceImagePreview('');
      setPasswordStrength('weak');
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsAddingUser(false);
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
    (user.fullName || user.username).toLowerCase().includes(searchQuery.toLowerCase()) ||
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
            Department Management: {currentUser?.department}
          </h1>
          <p className="text-gray-400">
            Manage employees in your department
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
          transition={{ delay: 0.6 }}
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
                          <p className="text-white font-medium">{user.fullName || user.username}</p>
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
                  <p className="text-gray-400">No employees found</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Add User Modal */}
        <Modal 
          isOpen={showAddUser} 
          onClose={() => {
            setShowAddUser(false);
            setNewUserData({
              fullName: '',
              email: '',
              password: '',
              position: '',
              department: currentUser?.department || '',
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
                    value={newUserData.department}
                    disabled
                    className="bg-gray-700"
                  />
                </div>
              </div>

              {/* Right Column - Face Image Upload */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Face0 Image (Required)</label>
                <input
                  id="face-upload-input-dept"
                  type="file"
                  accept="image/*"
                  onChange={handleFaceImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="face-upload-input-dept"
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
                    fullName: '',
                    email: '',
                    password: '',
                    position: '',
                    department: currentUser?.department || '',
                    role: 'staff'
                  });
                  setFaceImage(null);
                  setFaceImagePreview('');
                  setPasswordStrength('weak');
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
      </div>
    </div>
  );
};
