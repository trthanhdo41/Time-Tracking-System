/**
 * Check if camera permission is granted
 */
export const checkCameraPermission = async (): Promise<boolean> => {
  try {
    // Check if getMediaDevices is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }

    // Try to get camera stream to check permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the stream immediately if permission is granted
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error: any) {
      // If permission is denied or not available
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        return false;
      }
      // Other errors (e.g., device not found)
      return false;
    }
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return false;
  }
};

/**
 * Request camera permission
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera API is not available');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    // Stop the stream immediately after getting permission
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error: any) {
    console.error('Error requesting camera permission:', error);
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      throw new Error('Camera permission denied');
    }
    throw new Error('Unable to access camera: ' + error.message);
  }
};

