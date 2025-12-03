import React, { useState, useEffect } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { useAuthStore } from '@/store/authStore';
import { getVietnamTimestamp } from '@/utils/time';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export const SessionDebugPanel: React.FC = () => {
  const { currentSession } = useSessionStore();
  const { user } = useAuthStore();
  const [visibility, setVisibility] = useState(document.visibilityState);
  const [lastActivity, setLastActivity] = useState<number | null>(null);
  const [timeSinceActivity, setTimeSinceActivity] = useState<number>(0);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Track visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      setVisibility(document.visibilityState);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Fetch latest session data from Firestore
  useEffect(() => {
    if (!currentSession || !autoRefresh) return;

    const fetchSessionData = async () => {
      try {
        const sessionDoc = await getDoc(doc(db, 'sessions', currentSession.id));
        if (sessionDoc.exists()) {
          const data = sessionDoc.data();
          const lastActivityTime = typeof data.lastActivityTime === 'number'
            ? data.lastActivityTime
            : data.lastActivityTime?.seconds * 1000;
          
          setLastActivity(lastActivityTime);
          
          const now = getVietnamTimestamp();
          const timeDiff = now - lastActivityTime;
          setTimeSinceActivity(timeDiff);
        }
      } catch (error) {
        console.error('Error fetching session data:', error);
      }
    };

    fetchSessionData();
    const interval = setInterval(fetchSessionData, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [currentSession, autoRefresh]);

  if (!currentSession || !user) {
    return null;
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  const isInDanger = timeSinceActivity > 4 * 60 * 1000; // > 4 minutes
  const isWarning = timeSinceActivity > 3 * 60 * 1000; // > 3 minutes

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-xl max-w-md z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Session Debug Panel</h3>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`text-xs px-2 py-1 rounded ${
            autoRefresh ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
          }`}
        >
          {autoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}
        </button>
      </div>

      <div className="space-y-2 text-xs">
        {/* Visibility Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Tab Visibility:</span>
          <span className={`font-semibold ${
            visibility === 'visible' ? 'text-green-400' : 'text-yellow-400'
          }`}>
            {visibility === 'visible' ? '👁️ Visible' : '🙈 Hidden'}
          </span>
        </div>

        {/* Session Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Session Status:</span>
          <span className={`font-semibold ${
            currentSession.status === 'online' ? 'text-green-400' : 'text-gray-400'
          }`}>
            {currentSession.status === 'online' ? '🟢 Online' : '⚫ Offline'}
          </span>
        </div>

        {/* Last Activity Time */}
        {lastActivity && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Last Activity:</span>
              <span className="text-white font-mono text-xs">
                {formatTimestamp(lastActivity)}
              </span>
            </div>

            {/* Time Since Last Activity */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Time Since Activity:</span>
              <span className={`font-semibold ${
                isInDanger ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {formatTime(timeSinceActivity)}
              </span>
            </div>

            {/* Warning Messages */}
            {isInDanger && (
              <div className="bg-red-900/30 border border-red-500 rounded p-2 mt-2">
                <p className="text-red-400 text-xs font-semibold">
                  ⚠️ DANGER: Auto checkout in {formatTime(5 * 60 * 1000 - timeSinceActivity)}
                </p>
              </div>
            )}

            {isWarning && !isInDanger && (
              <div className="bg-yellow-900/30 border border-yellow-500 rounded p-2 mt-2">
                <p className="text-yellow-400 text-xs font-semibold">
                  ⚠️ WARNING: Approaching auto checkout threshold
                </p>
              </div>
            )}
          </>
        )}

        {/* Heartbeat Info */}
        <div className="border-t border-gray-700 pt-2 mt-2">
          <p className="text-gray-500 text-xs">
            Heartbeat: {visibility === 'visible' ? '15s' : '60s'} interval
          </p>
          <p className="text-gray-500 text-xs">
            Auto checkout: After 5 minutes of inactivity
          </p>
        </div>
      </div>
    </div>
  );
};

