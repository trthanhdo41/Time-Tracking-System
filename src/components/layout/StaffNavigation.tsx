import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  CheckInIcon,
  HistoryIcon, 
  CameraIcon,
} from '@/components/icons';

export const StaffNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      icon: <CheckInIcon className="w-5 h-5" />,
      label: 'Dashboard',
      path: '/dashboard',
      active: location.pathname === '/dashboard'
    },
    {
      icon: <HistoryIcon className="w-5 h-5" />,
      label: 'History',
      path: '/history',
      active: location.pathname === '/history'
    },
    {
      icon: <CameraIcon className="w-5 h-5" />,
      label: 'Camera',
      path: '/camera',
      active: location.pathname === '/camera'
    },
    {
      icon: <CameraIcon className="w-5 h-5" />,
      label: 'Image Gallery',
      path: '/images',
      active: location.pathname === '/images'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card>
        <div className="flex gap-2 flex-wrap">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={item.active ? 'primary' : 'secondary'}
              size="lg"
              onClick={() => navigate(item.path)}
              className="flex-1 min-w-[150px]"
            >
              {item.icon}
              <span className="ml-2">{item.label}</span>
            </Button>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};

