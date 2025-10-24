import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'relative overflow-hidden font-medium transition-all duration-300 rounded-xl flex items-center justify-center gap-2';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:shadow-lg hover:shadow-primary-500/50 hover:scale-105 active:scale-95',
    secondary: 'glass hover:bg-white/10 hover:scale-105 active:scale-95',
    danger: 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:shadow-lg hover:shadow-red-500/50 hover:scale-105 active:scale-95',
    ghost: 'bg-transparent hover:bg-white/5 hover:scale-105 active:scale-95',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-xl">
          <div className="relative w-5 h-5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border border-white"
                initial={{ scale: 0.6, opacity: 1 }}
                animate={{
                  scale: [0.6, 1, 0.6],
                  opacity: [0.8, 0, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: [0.43, 0.13, 0.23, 0.96]
                }}
              />
            ))}
          </div>
        </div>
      )}
      
      {!loading && (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
        </>
      )}
      
      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
        whileHover={{ translateX: '200%' }}
        transition={{ duration: 0.6 }}
      />
    </motion.button>
  );
};

