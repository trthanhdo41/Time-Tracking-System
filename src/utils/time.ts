export const formatTime = (timestamp: number | any): string => {
  if (!timestamp) return 'Invalid Time';
  
  // Handle Firebase Timestamp
  let ts = timestamp;
  if (timestamp && typeof timestamp === 'object' && timestamp.toMillis) {
    ts = timestamp.toMillis();
  } else if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
    ts = timestamp.seconds * 1000;
  }
  
  if (!ts || isNaN(ts)) return 'Invalid Time';
  
  const date = new Date(ts);
  if (isNaN(date.getTime())) return 'Invalid Time';
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatDate = (timestamp: number | any): string => {
  if (!timestamp) return 'Invalid Date';
  
  // Handle Firebase Timestamp
  let ts = timestamp;
  if (timestamp && typeof timestamp === 'object' && timestamp.toMillis) {
    ts = timestamp.toMillis();
  } else if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
    ts = timestamp.seconds * 1000;
  }
  
  if (!ts || isNaN(ts)) return 'Invalid Date';
  
  const date = new Date(ts);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  // Always show seconds if less than 1 hour
  if (hours === 0) {
    if (minutes === 0) {
      // Show only seconds if less than 1 minute
      parts.push(`${secs}s`);
    } else {
      // Show minutes and seconds
      parts.push(`${secs}s`);
    }
  } else {
    // If hours > 0, also show seconds
    parts.push(`${secs}s`);
  }
  
  return parts.length > 0 ? parts.join(' ') : '0s';
};

/**
 * Get current timestamp in GMT+7 (Vietnam timezone)
 * This ensures all timestamps are consistent regardless of user's local timezone
 */
export const getVietnamTimestamp = (): number => {
  // Get current UTC time
  const now = new Date();

  // Convert to Vietnam timezone (GMT+7)
  // Create a date string in Vietnam timezone
  const vietnamTimeString = now.toLocaleString('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  // Parse the Vietnam time string back to timestamp
  const vietnamDate = new Date(vietnamTimeString);
  return vietnamDate.getTime();
};

/**
 * @deprecated Use getVietnamTimestamp() instead for consistent GMT+7 timestamps
 */
export const getServerTimestamp = (): number => {
  return getVietnamTimestamp();
};

export const getVietnamTimeString = (timestamp?: number): string => {
  const time = timestamp ? new Date(timestamp) : new Date();
  return time.toLocaleString('en-US', {
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

