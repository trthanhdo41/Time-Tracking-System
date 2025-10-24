import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EyeIcon, EyeOffIcon } from '@/components/icons';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  type = 'text',
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <motion.input
          type={inputType}
          className={`
            input-field w-full
            ${icon ? 'pl-12' : 'pl-4'}
            ${type === 'password' ? 'pr-12' : 'pr-4'}
            ${error ? 'ring-2 ring-red-500' : ''}
            ${focused ? 'ring-2 ring-primary-500' : ''}
          `}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
          >
            {showPassword ? (
              <EyeOffIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

