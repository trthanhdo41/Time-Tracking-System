export const formatTime = (timestamp: number): string => {
  if (!timestamp || isNaN(timestamp)) return 'Invalid Time';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid Time';
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatDate = (timestamp: number): string => {
  if (!timestamp || isNaN(timestamp)) return 'Invalid Date';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
};

export const getServerTimestamp = (): number => {
  // Use Date.now() for immediate operations
  // For critical operations (check-in/out), use Firebase serverTimestamp() 
  // which will be set in the service layer
  return Date.now();
};

export const getVietnamTimeString = (timestamp?: number): string => {
  const time = timestamp ? new Date(timestamp) : new Date();
  return time.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const calculateDuration = (start: number, end?: number): number => {
  const endTime = end || getServerTimestamp();
  return Math.floor((endTime - start) / 1000);
};

export const isToday = (timestamp: number): boolean => {
  const date = new Date(timestamp);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const getDateString = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toISOString().split('T')[0];
};

