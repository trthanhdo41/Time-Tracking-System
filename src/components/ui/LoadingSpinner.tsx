import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const spinner = (
    <div className={`${sizeClasses[size]} relative`}>
      {/* Professional pulse rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border-2 border-blue-500"
          initial={{ scale: 0.8, opacity: 1 }}
          animate={{
            scale: [0.8, 1.3, 0.8],
            opacity: [0.8, 0, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.4,
            ease: [0.43, 0.13, 0.23, 0.96]
          }}
        />
      ))}
      
      {/* Center glow */}
      <motion.div
        className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"
        animate={{
          scale: [1, 1.5, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-dark-950/80 backdrop-blur-sm z-50">
        <div className="text-center">
          {spinner}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-gray-400"
          >
            Loading...
          </motion.p>
        </div>
      </div>
    );
  }

  return spinner;
};

