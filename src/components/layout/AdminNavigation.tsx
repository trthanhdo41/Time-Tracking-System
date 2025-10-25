import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import {
  UsersIcon,
  ImageIcon,
  HistoryIcon,
  ReportIcon,
  BackSoonIcon,
  TrashIcon,
  NotificationIcon,
  SettingsIcon
} from '@/components/icons';

interface AdminNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const AdminNavigation: React.FC<AdminNavigationProps> = ({
  activeTab,
  onTabChange
}) => {
  const navigationItems = [
    {
      id: 'users',
      label: 'Quản Lý Nhân Viên',
      icon: <UsersIcon />,
      description: 'Quản lý thông tin nhân viên'
    },
    {
      id: 'images',
      label: 'Duyệt Xóa Ảnh',
      icon: <ImageIcon />,
      description: 'Duyệt yêu cầu xóa ảnh'
    },
    {
      id: 'activity',
      label: 'Hoạt Động',
      icon: <HistoryIcon />,
      description: 'Lịch sử hoạt động hệ thống'
    },
    {
      id: 'reports',
      label: 'Báo Cáo',
      icon: <ReportIcon />,
      description: 'Báo cáo thống kê'
    },
    {
      id: 'backsoon',
      label: 'Back Soon',
      icon: <BackSoonIcon />,
      description: 'Quản lý trạng thái Back Soon'
    },
    {
      id: 'allimages',
      label: 'Tất Cả Ảnh',
      icon: <ImageIcon />,
      description: 'Quản lý tất cả ảnh'
    },
    {
      id: 'cleanup',
      label: 'Dọn Dẹp',
      icon: <TrashIcon />,
      description: 'Dọn dẹp dữ liệu'
    },
    {
      id: 'errors',
      label: 'Báo Cáo Lỗi',
      icon: <NotificationIcon />,
      description: 'Quản lý báo cáo lỗi'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      {/* Desktop Navigation */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {navigationItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                variant={activeTab === item.id ? 'primary' : 'secondary'}
                onClick={() => onTabChange(item.id)}
                className={`w-full h-auto p-4 flex flex-col items-center gap-3 text-center transition-all duration-300 ${
                  activeTab === item.id 
                    ? 'bg-primary-500/20 border-primary-500/50 shadow-lg shadow-primary-500/20' 
                    : 'hover:bg-white/5 hover:border-white/20'
                }`}
              >
                <div className={`p-3 rounded-xl ${
                  activeTab === item.id 
                    ? 'bg-primary-500/30 text-primary-400' 
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {item.icon}
                </div>
                <div>
                  <div className="font-medium text-sm mb-1">{item.label}</div>
                  <div className="text-xs text-gray-400">{item.description}</div>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tablet Navigation */}
      <div className="hidden md:block lg:hidden">
        <div className="grid grid-cols-2 gap-3">
          {navigationItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                variant={activeTab === item.id ? 'primary' : 'secondary'}
                onClick={() => onTabChange(item.id)}
                className={`w-full h-auto p-3 flex items-center gap-3 transition-all duration-300 ${
                  activeTab === item.id 
                    ? 'bg-primary-500/20 border-primary-500/50' 
                    : 'hover:bg-white/5'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  activeTab === item.id 
                    ? 'bg-primary-500/30 text-primary-400' 
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {item.icon}
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-xs text-gray-400">{item.description}</div>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="grid grid-cols-1 gap-2">
          {navigationItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                variant={activeTab === item.id ? 'primary' : 'secondary'}
                onClick={() => onTabChange(item.id)}
                className={`w-full h-auto p-3 flex items-center gap-3 transition-all duration-300 ${
                  activeTab === item.id 
                    ? 'bg-primary-500/20 border-primary-500/50' 
                    : 'hover:bg-white/5'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  activeTab === item.id 
                    ? 'bg-primary-500/30 text-primary-400' 
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {item.icon}
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-xs text-gray-400">{item.description}</div>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
