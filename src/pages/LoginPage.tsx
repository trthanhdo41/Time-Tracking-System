import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { LockIcon } from '@/components/icons';
import { signIn } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';
import { getTermsAndConditions } from '@/services/termsService';
import toast from 'react-hot-toast';

const REMEMBER_USERNAME_KEY = 'remembered_username';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [termsContent, setTermsContent] = useState<string>('');
  const { setUser } = useAuthStore();

  // Load remembered username on mount
  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBER_USERNAME_KEY);
    if (remembered) {
      setUsername(remembered);
      setRememberMe(true);
    }
  }, []);

  // Load Terms and Conditions on mount
  useEffect(() => {
    const loadTerms = async () => {
      try {
        const terms = await getTermsAndConditions();
        if (terms) {
          setTermsContent(terms.content);
        } else {
          // Fallback if service returns null
          setTermsContent('Welcome to Enterprise Time Tracking System. By using this system, you agree to comply with all company policies and guidelines.');
        }
      } catch (error) {
        console.error('Error loading Terms and Conditions:', error);
        // Fallback content
        setTermsContent('Welcome to Enterprise Time Tracking System. By using this system, you agree to comply with all company policies and guidelines.');
      }
    };
    loadTerms();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!termsAccepted) {
      toast.error('Please accept the Terms and Conditions to continue');
      return;
    }

    setLoading(true);

    try {
      const user = await signIn(username, password);
      setUser(user);
      
      // Save username if Remember me is checked
      if (rememberMe) {
        localStorage.setItem(REMEMBER_USERNAME_KEY, username);
      } else {
        localStorage.removeItem(REMEMBER_USERNAME_KEY);
      }
      
      // Auto-save admin password for re-login after creating users
      if (user.role === 'admin' || user.role === 'department_admin') {
        sessionStorage.setItem('admin_password_for_relogin', password);
        sessionStorage.setItem('admin_email_for_relogin', user.email);
      }
      
      toast.success('Login successful!');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
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
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username or email"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-dark-700 text-primary-500 focus:ring-primary-500 focus:ring-2"
                />
                <span className="text-sm text-gray-400">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            {/* Terms and Conditions Checkbox */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-600 bg-dark-700 text-primary-500 focus:ring-primary-500 focus:ring-2 flex-shrink-0"
                required
              />
              <label className="text-sm text-gray-400 cursor-pointer flex-1">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-primary-400 hover:text-primary-300 underline transition-colors"
                >
                  Terms and Conditions
                </button>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
              disabled={!termsAccepted}
            >
              Login
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-6">
            © 2025 Enterprise Time Tracking. All rights reserved.
          </p>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />

      {/* Terms and Conditions Modal */}
      <Modal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms and Conditions"
        size="lg"
      >
        <div className="max-h-96 overflow-y-auto">
          <div className="prose prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans">
              {termsContent || 'Loading Terms and Conditions...'}
            </pre>
          </div>
        </div>
        <div className="flex justify-end pt-4 mt-4 border-t border-dark-600">
          <Button
            variant="primary"
            onClick={() => {
              setShowTermsModal(false);
              setTermsAccepted(true);
            }}
          >
            I Agree
          </Button>
        </div>
      </Modal>
    </div>
  );
};

// Forgot Password Modal Component
interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [forgotUsername, setForgotUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotUsername) {
      toast.error('Please enter your username');
      return;
    }

    setLoading(true);
    try {
      // Import forgot password service
      const { submitForgotPasswordRequest } = await import('@/services/forgotPasswordService');
      await submitForgotPasswordRequest(forgotUsername);
      
      toast.success('Password reset request submitted. Admin will process it shortly.');
      setForgotUsername('');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Unable to submit password reset request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Forgot Password"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-400 mb-4">
          Please enter your Username. Your request will be sent to Admin for password reset.
        </p>


        <Input
          label="Username"
          type="text"
          value={forgotUsername}
          onChange={(e) => setForgotUsername(e.target.value)}
          placeholder="Enter your username"
          required
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="flex-1"
          >
            Submit Request
          </Button>
        </div>
      </form>
    </Modal>
  );
};

