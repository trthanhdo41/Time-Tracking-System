import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UsersIcon,
  ImageIcon,
  ReportIcon,
  TrashIcon,
  NotificationIcon,
  MenuIcon,
  CloseIcon,
  SettingsIcon,
  HistoryIcon,
  LockIcon,
  DocumentIcon,
} from '@/components/icons';

interface MenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
}

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  isAdmin?: boolean; // Only admin can see Terms and Conditions
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, onTabChange, isCollapsed, onToggle, isAdmin = false }) => {

  const menuItems: MenuItem[] = [
    { id: 'users', icon: <UsersIcon className="w-5 h-5" />, label: 'User Management' },
    { id: 'history', icon: <HistoryIcon className="w-5 h-5" />, label: 'History' },
    { id: 'images', icon: <ImageIcon className="w-5 h-5" />, label: 'Requests' },
    { id: 'forgotpassword', icon: <LockIcon className="w-5 h-5" />, label: 'Password Reset' },
    { id: 'reports', icon: <ReportIcon className="w-5 h-5" />, label: 'Reports' },
    { id: 'allimages', icon: <ImageIcon className="w-5 h-5" />, label: 'All Images' },
    { id: 'cleanup', icon: <TrashIcon className="w-5 h-5" />, label: 'Data Cleanup' },
    { id: 'errors', icon: <NotificationIcon className="w-5 h-5" />, label: 'Error Reports' },
    { id: 'settings', icon: <SettingsIcon className="w-5 h-5" />, label: 'System Settings' },
    ...(isAdmin ? [{ id: 'terms', icon: <DocumentIcon className="w-5 h-5" />, label: 'Terms & Conditions' }] : []),
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ 
          x: 0, 
          opacity: 1,
          width: isCollapsed ? '80px' : '280px'
        }}
        transition={{ duration: 0.3 }}
        className="hidden lg:flex fixed left-0 top-0 h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 border-r border-white/10 flex-col z-50"
      >
        {/* Logo & Toggle */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 relative">
          <motion.div
            initial={false}
            animate={{ 
              scale: isCollapsed ? 0.9 : 1,
              opacity: isCollapsed ? 0.7 : 1
            }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 flex-1"
          >
            {/* Icon only - no background */}
            <motion.div 
              animate={{ rotate: isCollapsed ? 360 : 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="flex-shrink-0"
            >
              <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>
            
            {/* Text - slide in animation when expanded */}
            <motion.div
              initial={false}
              animate={{ 
                opacity: isCollapsed ? 0 : 1,
                x: isCollapsed ? -20 : 0,
                width: isCollapsed ? 0 : 'auto'
              }}
              transition={{ 
                duration: 0.3,
                ease: "easeOut"
              }}
              className="flex-1 min-w-0 overflow-hidden"
            >
              <motion.h1 
                className="text-base font-bold text-white truncate"
                initial={false}
                animate={{ 
                  opacity: isCollapsed ? 0 : 1,
                  x: isCollapsed ? -10 : 0
                }}
                transition={{ 
                  duration: 0.3,
                  delay: isCollapsed ? 0 : 0.1,
                  ease: "easeOut"
                }}
              >
                Time Tracking System
              </motion.h1>
              <motion.p 
                className="text-xs text-gray-400 truncate"
                initial={false}
                animate={{ 
                  opacity: isCollapsed ? 0 : 1,
                  x: isCollapsed ? -10 : 0
                }}
                transition={{ 
                  duration: 0.3,
                  delay: isCollapsed ? 0 : 0.15,
                  ease: "easeOut"
                }}
              >
                Enterprise Edition
              </motion.p>
            </motion.div>
          </motion.div>
          
          {/* Toggle Button - Positioned on Navbar */}
          <button
            onClick={onToggle}
            className={`
              absolute top-4 p-2 rounded-lg glass-morphism hover:bg-white/10 transition-all duration-300
              ${isCollapsed ? 'left-full ml-4' : 'left-full ml-8'}
            `}
            style={{ zIndex: 60 }}
          >
            {isCollapsed ? <MenuIcon className="w-5 h-5 text-white" /> : <CloseIcon className="w-5 h-5 text-white" />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200 relative group
                  ${activeTab === item.id
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }
                  ${isCollapsed ? 'justify-center' : 'justify-start'}
                `}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                
                <motion.span
                  initial={false}
                  animate={{ 
                    opacity: isCollapsed ? 0 : 1,
                    x: isCollapsed ? -10 : 0,
                    width: isCollapsed ? 0 : 'auto'
                  }}
                  transition={{ 
                    duration: 0.25,
                    ease: "easeOut"
                  }}
                  className="font-medium truncate overflow-hidden"
                >
                  {item.label}
                </motion.span>

                {/* Tooltip when collapsed */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                    {item.label}
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          {!isCollapsed ? (
            <div className="text-xs text-gray-500 text-center">
              Version 1.0.0
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Mobile Dropdown */}
      <div className="lg:hidden mb-6">
        <select
          value={activeTab}
          onChange={(e) => onTabChange(e.target.value)}
          className="w-full bg-gray-900 text-white p-3 rounded-lg border border-white/10 focus:border-primary-500 outline-none"
        >
          {menuItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
};

