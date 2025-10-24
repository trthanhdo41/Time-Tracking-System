import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TrashIcon } from '@/components/icons';
import { createImageDeleteRequest } from '@/services/imageDeleteService';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface ImageDeleteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageType: string;
}

export const ImageDeleteRequestModal: React.FC<ImageDeleteRequestModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  imageType
}) => {
  const { user } = useAuthStore();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || !reason.trim()) {
      toast.error('Vui lòng nhập lý do xóa ảnh');
      return;
    }

    setLoading(true);
    try {
      await createImageDeleteRequest(user.id, imageUrl, reason, user);
      setReason('');
      onClose();
    } catch (error) {
      console.error('Error creating delete request:', error);
    } finally {
      setLoading(false);
    }
  };

  const predefinedReasons = [
    'Ảnh bị mờ, không rõ nét',
    'Ảnh bị lỗi kỹ thuật',
    'Ảnh không phù hợp',
    'Ảnh bị trùng lặp',
    'Lý do khác'
  ];

  const handlePredefinedReason = (selectedReason: string) => {
    if (selectedReason === 'Lý do khác') {
      setReason('');
    } else {
      setReason(selectedReason);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yêu Cầu Xóa Ảnh" size="lg">
      <div className="grid grid-cols-2 gap-6">
        {/* Cột trái - Ảnh */}
        <div className="flex flex-col items-center">
          <div className="w-full aspect-square bg-gray-800 rounded-lg overflow-hidden mb-4">
            <img
              src={imageUrl}
              alt="Image to delete"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-gray-300 text-sm mb-2">
            Loại ảnh: <span className="font-semibold text-primary-400">{imageType}</span>
          </p>
          
          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 w-full mt-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L1 21h22L12 2zm0 4l8 15H4l8-15zm-1 6h2v5h-2v-5zm0 6h2v2h-2v-2z"/>
              </svg>
              <div>
                <h4 className="text-yellow-400 font-semibold text-sm mb-1">
                  Lưu ý quan trọng
                </h4>
                <ul className="text-yellow-200 text-xs space-y-1">
                  <li>• Yêu cầu xóa ảnh sẽ được gửi đến Admin để phê duyệt</li>
                  <li>• Ảnh chỉ được xóa sau khi Admin đồng ý</li>
                  <li>• Không thể hủy yêu cầu sau khi đã gửi</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải - Form */}
        <div className="flex flex-col">
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-4">
              Vui lòng chọn lý do để yêu cầu xóa ảnh này
            </p>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Lý do xóa ảnh:
            </label>
            
            <div className="space-y-2 mb-4">
              {predefinedReasons.map((predefinedReason, index) => (
                <button
                  key={index}
                  onClick={() => handlePredefinedReason(predefinedReason)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors text-sm ${
                    reason === predefinedReason
                      ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                      : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {predefinedReason}
                </button>
              ))}
            </div>

            <Input
              placeholder="Hoặc nhập lý do tùy chỉnh..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div className="mt-6">

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !reason.trim()}
            className="flex-1"
          >
            <TrashIcon className="w-4 h-4 mr-2" />
            {loading ? 'Đang gửi...' : 'Gửi Yêu Cầu'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
