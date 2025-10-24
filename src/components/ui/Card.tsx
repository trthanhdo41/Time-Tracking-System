import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = true,
  gradient = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -5, transition: { duration: 0.2 } } : {}}
      className={`
        ${gradient 
          ? 'bg-gradient-to-br from-white/10 to-white/5' 
          : 'glass'
        }
        rounded-2xl p-6 transition-all duration-300
        ${hover ? 'hover:shadow-xl hover:bg-white/10' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
}) => {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

