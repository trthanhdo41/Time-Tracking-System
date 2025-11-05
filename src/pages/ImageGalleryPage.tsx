import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader } from '@/components/ui/Card';
import { StaffNavigation } from '@/components/layout/StaffNavigation';
import { ImageGallery } from '@/components/staff/ImageGallery';
import { ImageIcon } from '@/components/icons';
import { useAuthStore } from '@/store/authStore';

export const ImageGalleryPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <StaffNavigation />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="p-3 rounded-xl bg-primary-500/20">
            <ImageIcon className="w-8 h-8 text-primary-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold gradient-text">Image Gallery</h1>
            <p className="text-gray-400">View and manage your images</p>
          </div>
        </motion.div>

        {/* Image Gallery */}
        {user && <ImageGallery userId={user.id} />}
      </div>
    </div>
  );
};
