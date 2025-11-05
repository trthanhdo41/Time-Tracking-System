import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useSessionStore } from '@/store/sessionStore';
import { useSidebarStore } from '@/store/sidebarStore';
import { Button } from '@/components/ui/Button';
import { 
  LogoutIcon, 
  MenuIcon, 
  CloseIcon,
  TimeTrackingIcon,
  UsersIcon
} from '@/components/icons';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { signOut } from '@/services/auth';
import toast from 'react-hot-toast';
import { formatTime } from '@/utils/time';

export const Navbar: React.FC = () => {
  const { user } = useAuthStore();
  const { status, currentSession } = useSessionStore();
  const { isCollapsed: sidebarCollapsed } = useSidebarStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Update time every second
  React.useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast.success('Logout successful');
    } catch (error) {
      toast.error('Error logging out');
      setIsLoggingOut(false);
    }
  };

  if (!user) return null;

  // Only apply sidebar margin for Admin and Department Admin
  const isAdminUser = user.role === 'admin' || user.role === 'department_admin';
  const navbarMargin = isAdminUser
    ? sidebarCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[280px]'
    : '';

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`glass-strong border-b border-white/10 sticky top-0 z-40 transition-all duration-300 ${navbarMargin}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left - Logo/Brand for Staff, Empty for Admin */}
          <div className="flex items-center gap-4">
            {!isAdminUser && (
              <div className="flex items-center gap-2">
                <TimeTrackingIcon className="w-8 h-8 text-primary-400" />
                <div className="hidden md:block">
                  <h2 className="text-sm font-bold text-white">Time Tracking</h2>
                  <p className="text-xs text-gray-400">Staff Portal</p>
                </div>
              </div>
            )}
          </div>

          {/* Center - Time */}
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-primary-400">
                {formatTime(time.getTime())}
              </div>
              <div className="text-xs text-gray-500">
                {time.toLocaleDateString('en-US')}
              </div>
            </div>
          </div>

          {/* Right - User Actions */}
          <div className="flex items-center gap-3">
            {/* Status Badge - Only for Staff */}
            {!isAdminUser && (
              <StatusBadge status={status} />
            )}

            {/* User Info */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2 glass rounded-xl">
              <div className="text-right">
                <p className="text-sm font-medium">{user.fullName || user.username}</p>
                <p className="text-xs text-gray-400">{user.position}</p>
              </div>
              {user.faceImageUrl ? (
                <img
                  src={user.faceImageUrl}
                  alt="Avatar"
                  className="w-10 h-10 rounded-lg object-cover border-2 border-primary-500/50"
                  onError={(e) => {
                    // Fallback to icon/initial if image fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center ${user.faceImageUrl ? 'hidden' : ''}`}>
                {user.role === 'admin' ? (
                  <UsersIcon className="w-5 h-5 text-white" />
                ) : (
                  <span className="text-white font-bold">
                    {(user.fullName || user.username).charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              icon={<LogoutIcon />}
              onClick={handleLogout}
              loading={isLoggingOut}
              className="hidden md:flex"
            >
              Logout
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
              loading={isLoggingOut}
              className="w-full"
            >
              Logout
            </Button>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

