import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useSessionStore } from '@/store/sessionStore';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { 
  LogoutIcon, 
  BellIcon, 
  MenuIcon, 
  CloseIcon,
  SettingsIcon 
} from '@/components/icons';
import { signOut } from '@/services/auth';
import toast from 'react-hot-toast';
import { formatTime } from '@/utils/time';

export const Navbar: React.FC = () => {
  const { user } = useAuthStore();
  const { status, currentSession } = useSessionStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  // Update time every second
  React.useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Đăng xuất thành công');
    } catch (error) {
      toast.error('Lỗi khi đăng xuất');
    }
  };

  if (!user) return null;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="glass-strong border-b border-white/10 sticky top-0 z-40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center"
            >
              <span className="text-white font-bold text-xl">T</span>
            </motion.div>
            <div className="hidden md:block">
              <h1 className="text-xl font-bold gradient-text">
                Time Tracking System
              </h1>
              <p className="text-xs text-gray-400">Enterprise Edition</p>
            </div>
          </div>

          {/* Center - Time & Status */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-primary-400">
                {formatTime(time.getTime())}
              </div>
              <div className="text-xs text-gray-500">
                {time.toLocaleDateString('vi-VN')}
              </div>
            </div>
            <StatusBadge status={status} />
          </div>

          {/* Right - User Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <BellIcon className="w-6 h-6" />
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
              />
            </motion.button>

            {/* Settings */}
            <motion.button
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              className="hidden md:block p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <SettingsIcon className="w-6 h-6" />
            </motion.button>

            {/* User Info */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2 glass rounded-xl">
              <div className="text-right">
                <p className="text-sm font-medium">{user.username}</p>
                <p className="text-xs text-gray-400">{user.position}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <span className="text-white font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              icon={<LogoutIcon />}
              onClick={handleLogout}
              className="hidden md:flex"
            >
              Đăng xuất
            </Button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10"
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 space-y-3 border-t border-white/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-sm text-gray-400">{user.position}</p>
                <p className="text-xs text-gray-500">{user.department}</p>
              </div>
              <StatusBadge status={status} />
            </div>
            <Button
              variant="danger"
              size="sm"
              icon={<LogoutIcon />}
              onClick={handleLogout}
              className="w-full"
            >
              Đăng xuất
            </Button>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

