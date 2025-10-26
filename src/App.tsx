import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useAuthStore } from '@/store/authStore';
import { getCurrentUser } from '@/services/auth';
import { LoginPage } from '@/pages/LoginPage';
import { StaffDashboard } from '@/pages/StaffDashboard';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { DepartmentAdminDashboard } from '@/pages/DepartmentAdminDashboard';
import { HistoryPage } from '@/pages/HistoryPage';
import { CameraPage } from '@/pages/CameraPage';
import { ImageGalleryPage } from '@/pages/ImageGalleryPage';
import { SystemSettingsPage } from '@/pages/SystemSettingsPage';
import { Navbar } from '@/components/layout/Navbar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DeviceBlockModal } from '@/components/DeviceBlockModal';
import { getDeviceType, isDesktopDevice } from '@/utils/deviceDetection';
import { startCleanupService } from '@/utils/cleanupOfflineUsers';
import { startSessionCleanupService } from '@/utils/cleanupStaleSessions';
// import { loadFaceDetectionModels } from '@/utils/faceRecognition';

function App() {
  const { user, loading, setUser, setLoading } = useAuthStore();
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop' | null>(null);

  useEffect(() => {
    // Start cleanup service for offline users (disabled due to permissions)
    // startCleanupService();
    
    // Start session cleanup service (auto checkout stale sessions)
    startSessionCleanupService();
    
    // Check device type on mount
    const currentDeviceType = getDeviceType();
    setDeviceType(currentDeviceType);

    // Listen for window resize to detect device changes
    const handleResize = () => {
      const newDeviceType = getDeviceType();
      setDeviceType(newDeviceType);
    };

    window.addEventListener('resize', handleResize);

    // Load face detection models only when needed
    // loadFaceDetectionModels().catch(console.error);

    // Auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await getCurrentUser(firebaseUser.uid);
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('resize', handleResize);
    };
  }, [setUser, setLoading]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // Block mobile and tablet access
  if (deviceType && deviceType !== 'desktop') {
    return <DeviceBlockModal deviceType={deviceType} />;
  }

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(15, 23, 42, 0.95)',
              color: '#fff',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

        {user && <Navbar />}

        <Routes>
          <Route
            path="/login"
            element={!user ? <LoginPage /> : <Navigate to="/" />}
          />
          <Route
            path="/"
            element={
              user ? (
                user.role === 'admin' ? (
                  <AdminDashboard />
                ) : user.role === 'department_admin' ? (
                  <DepartmentAdminDashboard />
                ) : (
                  <StaffDashboard />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/history"
            element={user ? <HistoryPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/camera"
            element={user ? <CameraPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/images"
            element={user ? <ImageGalleryPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/system-settings"
            element={
              user && (user.role === 'admin' || user.role === 'department_admin') ? (
                <SystemSettingsPage />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

