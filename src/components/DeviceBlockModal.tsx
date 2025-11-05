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
        return 'Mobile Phone';
      case 'tablet':
        return 'Tablet';
      default:
        return 'Mobile Device';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
        {getDeviceIcon()}
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Access Restricted
        </h2>
        
        <p className="text-gray-600 mb-6">
          Application only supports access from <strong>desktop computers</strong>.
          <br />
          Current device: <span className="text-red-600 font-semibold">{getDeviceName()}</span>
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <MonitorIcon className="w-8 h-8 text-blue-600 mr-2" />
            <span className="text-blue-800 font-semibold">Requirement:</span>
          </div>
          <p className="text-blue-700 text-sm">
            Please use a desktop computer or laptop to access the application.
          </p>
        </div>
        
        <div className="text-sm text-gray-500">
          <p>If you are using a computer, please:</p>
          <ul className="mt-2 text-left">
            <li>• Disable responsive mode in Developer Tools</li>
            <li>• Ensure screen resolution ≥ 1024px</li>
            <li>• Refresh the web page</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
