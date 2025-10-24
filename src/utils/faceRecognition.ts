import * as faceapi from 'face-api.js';

let modelsLoaded = false;

export const loadFaceDetectionModels = async () => {
  if (modelsLoaded) return;
  
  try {
    const MODEL_URL = '/models';
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
  } catch (error) {
    console.warn('Face detection models not available, face recognition will be disabled:', error);
    // Don't throw error, just log warning - app can still work without face recognition
    modelsLoaded = false;
  }
};

export const detectFace = async (imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) => {
  try {
    // Auto-load models if not loaded yet
    if (!modelsLoaded) {
      await loadFaceDetectionModels();
    }
    
    // Check again after loading
    if (!modelsLoaded) {
      console.error('Models failed to load');
      return null;
    }
    
    const detection = await faceapi
      .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    return detection;
  } catch (error) {
    console.error('Error detecting face:', error);
    return null;
  }
};

export const compareFaces = (descriptor1: Float32Array, descriptor2: Float32Array): number => {
  const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
  // Convert distance to similarity score (0-1, where 1 is perfect match)
  const similarity = 1 - Math.min(distance, 1);
  return similarity;
};

export const captureImageFromVideo = (videoElement: HTMLVideoElement): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(videoElement, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Could not create blob from canvas'));
        }
      }, 'image/jpeg', 0.95);
    } catch (error) {
      reject(error);
    }
  });
};

export const validateFaceImage = async (imageUrl: string): Promise<boolean> => {
  try {
    const img = await faceapi.fetchImage(imageUrl);
    const detection = await detectFace(img);
    return !!detection;
  } catch (error) {
    console.error('Error validating face image:', error);
    return false;
  }
};

