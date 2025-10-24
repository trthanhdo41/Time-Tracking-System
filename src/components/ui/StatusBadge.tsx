import React from 'react';
import { motion } from 'framer-motion';
import { UserStatus } from '@/types';

interface StatusBadgeProps {
  status: UserStatus;
  showDot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showDot = true,
  className = '',
}) => {
  const statusConfig = {
    online: {
      label: 'Online',
      color: 'bg-green-500',
      textColor: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    offline: {
      label: 'Offline',
      color: 'bg-gray-500',
      textColor: 'text-gray-400',
      bgColor: 'bg-gray-500/20',
    },
    back_soon: {
      label: 'Back Soon',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
    },
  };

  const config = statusConfig[status] || statusConfig.offline;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} ${className}`}>
      {showDot && (
        <motion.div
          className={`w-2 h-2 rounded-full ${config.color}`}
          animate={{
            scale: status === 'online' ? [1, 1.2, 1] : 1,
            opacity: status === 'online' ? [1, 0.6, 1] : 1,
          }}
          transition={{
            duration: 2,
            repeat: status === 'online' ? Infinity : 0,
          }}
        />
      )}
      <span className={`text-sm font-medium ${config.textColor}`}>
        {config.label}
      </span>
    </div>
  );
};

