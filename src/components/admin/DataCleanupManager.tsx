import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TrashIcon, XIcon, CheckIcon } from '@/components/icons';
import { clearAllTestData, clearActivityAndImages } from '@/utils/clearTestData';
import toast from 'react-hot-toast';

export const DataCleanupManager: React.FC = () => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cleanupType, setCleanupType] = useState<'all' | 'activity'>('all');
  const [isClearing, setIsClearing] = useState(false);

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      let deletedCount = 0;
      
      if (cleanupType === 'all') {
        deletedCount = await clearAllTestData();
        toast.success(`Đã xóa ${deletedCount} documents từ tất cả collections!`);
      } else {
        deletedCount = await clearActivityAndImages();
        toast.success(`Đã xóa ${deletedCount} documents từ activity logs và images!`);
      }
      
      setShowConfirmModal(false);
      
      // Reload page to refresh data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error: any) {
      console.error('Error clearing data:', error);
      toast.error(`Lỗi khi xóa dữ liệu: ${error.message}`);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Dọn Dẹp Dữ Liệu Test" icon={<TrashIcon />} />
      <div className="p-6">
        <div className="space-y-6">
          {/* Warning */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <XIcon className="w-6 h-6 text-red-400" />
              <div>
                <h3 className="text-red-400 font-medium">Cảnh báo!</h3>
                <p className="text-red-300 text-sm mt-1">
                  Hành động này sẽ xóa VĨNH VIỄN tất cả dữ liệu test. Không thể hoàn tác!
                </p>
              </div>
            </div>
          </div>

          {/* Clear Options */}
          <div className="space-y-4">
            <h3 className="text-white font-medium">Chọn loại dữ liệu cần xóa:</h3>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="cleanupType"
                  value="activity"
                  checked={cleanupType === 'activity'}
                  onChange={(e) => setCleanupType(e.target.value as 'activity')}
                  className="text-primary-500"
                />
                <div>
                  <p className="text-white font-medium">Xóa Activity Logs & Images</p>
                  <p className="text-gray-400 text-sm">
                    Xóa: Activity logs, Sessions, Face verifications, Image delete requests
                  </p>
                </div>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="cleanupType"
                  value="all"
                  checked={cleanupType === 'all'}
                  onChange={(e) => setCleanupType(e.target.value as 'all')}
                  className="text-primary-500"
                />
                <div>
                  <p className="text-white font-medium">Xóa Tất Cả Dữ Liệu Test</p>
                  <p className="text-gray-400 text-sm">
                    Xóa: Activity logs, Sessions, History, Face verifications, Image delete requests, Notifications, Error reports
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Clear Button */}
          <div className="flex justify-end">
            <Button
              variant="danger"
              icon={<TrashIcon />}
              onClick={() => setShowConfirmModal(true)}
              disabled={isClearing}
            >
              {isClearing ? 'Đang xóa...' : 'Xóa Dữ Liệu'}
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Xác Nhận Xóa Dữ Liệu"
        size="md"
      >
        <div className="p-6">
          <div className="text-center">
            <XIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              Bạn có chắc chắn muốn xóa?
            </h3>
            <p className="text-gray-400 mb-6">
              Hành động này sẽ xóa <strong>VĨNH VIỄN</strong> tất cả dữ liệu test và không thể hoàn tác!
            </p>
            
            <div className="flex gap-3 justify-center">
              <Button
                variant="secondary"
                onClick={() => setShowConfirmModal(false)}
                disabled={isClearing}
              >
                Hủy
              </Button>
              <Button
                variant="danger"
                icon={<TrashIcon />}
                onClick={handleClearData}
                disabled={isClearing}
              >
                {isClearing ? 'Đang xóa...' : 'Xóa Vĩnh Viễn'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </Card>
  );
};
