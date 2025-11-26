import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BackSoonIcon } from '@/components/icons';
import toast from 'react-hot-toast';

interface BackSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: 'meeting' | 'toilet' | 'other', customReason?: string) => void;
}

export const BackSoonModal: React.FC<BackSoonModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [selectedReason, setSelectedReason] = useState<'meeting' | 'toilet' | 'other'>('meeting');
  const [customReason, setCustomReason] = useState('');

  const reasons = [
    { 
      value: 'meeting' as const, 
      label: 'Meeting', 
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'blue'
    },
    { 
      value: 'toilet' as const, 
      label: 'Toilet', 
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v10M8 7a2 2 0 110-4 2 2 0 010 4zm0 10a2 2 0 110 4 2 2 0 010-4zm8-10v10m0-10a2 2 0 100-4 2 2 0 000 4zm0 10a2 2 0 100 4 2 2 0 000-4z" />
          <circle cx="8" cy="5" r="1.5" fill="currentColor"/>
          <circle cx="16" cy="5" r="1.5" fill="currentColor"/>
        </svg>
      ),
      color: 'purple'
    },
    { 
      value: 'other' as const, 
      label: 'Other', 
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      color: 'green'
    },
  ];

  const handleSubmit = () => {
    if (selectedReason === 'other' && !customReason.trim()) {
      toast.error('Please enter a reason');
      return;
    }

    onSubmit(selectedReason, selectedReason === 'other' ? customReason : undefined);
    onClose();
    setCustomReason('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Back Soon"
      size="md"
    >
      <div className="space-y-6">
        <p className="text-gray-400 text-center">
          Select reason for temporary leave
        </p>

        {/* Reason Selection */}
        <div className="grid grid-cols-3 gap-4">
          {reasons.map((reason) => (
            <motion.button
              key={reason.value}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedReason(reason.value)}
              className={`
                p-6 rounded-xl transition-all duration-300
                ${selectedReason === reason.value
                  ? 'glass-strong ring-2 ring-primary-500'
                  : 'glass hover:bg-white/10'
                }
              `}
            >
              <div className="mb-3 text-primary-400">{reason.icon}</div>
              <div className="text-sm font-medium text-white">{reason.label}</div>
            </motion.button>
          ))}
        </div>

        {/* Custom Reason Input */}
        {selectedReason === 'other' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Input
              label="Specific Reason"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Enter your reason..."
              autoFocus
            />
          </motion.div>
        )}

        {/* Info */}
        <div className="glass p-4 rounded-xl">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth={2}/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-4m0-4h.01"/>
            </svg>
            <span>Back Soon time is tracked separately and does not require CAPTCHA</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={<BackSoonIcon />}
            onClick={handleSubmit}
            className="flex-1"
          >
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
};

