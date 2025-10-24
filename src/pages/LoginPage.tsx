import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LockIcon } from '@/components/icons';
import { RainEffect } from '@/components/effects/RainEffect';
import { signIn } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await signIn(email, password);
      setUser(user);
      toast.success('Đăng nhập thành công!');
    } catch (error: any) {
      toast.error(error.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* 10D Rain Effect với background */}
      <RainEffect />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-strong rounded-3xl p-8 md:p-12 shadow-2xl">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            {/* Beautiful SVG Icon - No Background */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="inline-block mb-6"
            >
              <svg
                width="80"
                height="80"
                viewBox="0 0 80 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-2xl"
              >
                {/* Outer glow ring */}
                <motion.circle
                  cx="40"
                  cy="40"
                  r="38"
                  stroke="url(#gradient1)"
                  strokeWidth="2"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.6 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
                
                {/* Clock face */}
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="url(#gradient2)"
                  opacity="0.1"
                />
                
                {/* Clock ticks */}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
                  const isQuarter = angle % 90 === 0;
                  const length = isQuarter ? 6 : 4;
                  const width = isQuarter ? 2 : 1;
                  const radius = 28;
                  const x1 = 40 + radius * Math.cos((angle - 90) * Math.PI / 180);
                  const y1 = 40 + radius * Math.sin((angle - 90) * Math.PI / 180);
                  const x2 = 40 + (radius - length) * Math.cos((angle - 90) * Math.PI / 180);
                  const y2 = 40 + (radius - length) * Math.sin((angle - 90) * Math.PI / 180);
                  
                  return (
                    <motion.line
                      key={angle}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="url(#gradient3)"
                      strokeWidth={width}
                      strokeLinecap="round"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.8 }}
                      transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                    />
                  );
                })}
                
                {/* Hour hand */}
                <motion.line
                  x1="40"
                  y1="40"
                  x2="40"
                  y2="22"
                  stroke="url(#gradient4)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ rotate: 0, originX: "40px", originY: "40px" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Minute hand */}
                <motion.line
                  x1="40"
                  y1="40"
                  x2="40"
                  y2="16"
                  stroke="url(#gradient5)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ rotate: 0, originX: "40px", originY: "40px" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Center dot */}
                <motion.circle
                  cx="40"
                  cy="40"
                  r="3"
                  fill="url(#gradient6)"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                />
                
                {/* Gradients */}
                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="50%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                  <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                  <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60A5FA" />
                    <stop offset="100%" stopColor="#22D3EE" />
                  </linearGradient>
                  <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                  <linearGradient id="gradient5" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60A5FA" />
                    <stop offset="100%" stopColor="#22D3EE" />
                  </linearGradient>
                  <linearGradient id="gradient6" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-3xl font-bold mb-2 tracking-tight"
            >
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Time Tracking System
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-gray-400 font-medium tracking-wide"
            >
              Enterprise Edition
            </motion.p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />

            <Input
              label="Mật Khẩu"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<LockIcon className="w-5 h-5" />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Đăng Nhập
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-6">
            © 2025 Enterprise Time Tracking. All rights reserved.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

