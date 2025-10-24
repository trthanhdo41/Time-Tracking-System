import React from 'react';
import { MonitorIcon, SmartphoneIcon, TabletIcon } from '@/components/icons';

interface DeviceBlockModalProps {
  deviceType: 'mobile' | 'tablet';
}

export const DeviceBlockModal: React.FC<DeviceBlockModalProps> = ({ deviceType }) => {
  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile':
        return <SmartphoneIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />;
      case 'tablet':
        return <TabletIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />;
      default:
        return <SmartphoneIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />;
    }
  };

  const getDeviceName = () => {
    switch (deviceType) {
      case 'mobile':
        return 'Điện thoại di động';
      case 'tablet':
        return 'Máy tính bảng';
      default:
        return 'Thiết bị di động';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
        {getDeviceIcon()}
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Truy cập bị hạn chế
        </h2>
        
        <p className="text-gray-600 mb-6">
          Ứng dụng chỉ hỗ trợ truy cập từ <strong>máy tính để bàn</strong>.
          <br />
          Thiết bị hiện tại: <span className="text-red-600 font-semibold">{getDeviceName()}</span>
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <MonitorIcon className="w-8 h-8 text-blue-600 mr-2" />
            <span className="text-blue-800 font-semibold">Yêu cầu:</span>
          </div>
          <p className="text-blue-700 text-sm">
            Vui lòng sử dụng máy tính để bàn hoặc laptop để truy cập ứng dụng.
          </p>
        </div>
        
        <div className="text-sm text-gray-500">
          <p>Nếu bạn đang sử dụng máy tính, vui lòng:</p>
          <ul className="mt-2 text-left">
            <li>• Tắt chế độ responsive trong Developer Tools</li>
            <li>• Đảm bảo màn hình có độ phân giải ≥ 1024px</li>
            <li>• Refresh trang web</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
