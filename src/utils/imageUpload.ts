// Image upload utility using imgbb API (free unlimited storage)

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

/**
 * Resize image to reduce upload time
 */
const resizeImage = (blob: Blob, maxWidth: number = 800, maxHeight: number = 600): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((resizedBlob) => {
        if (resizedBlob) {
          resolve(resizedBlob);
        } else {
          reject(new Error('Could not resize image'));
        }
      }, 'image/jpeg', 0.85); // 85% quality
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
};

/**
 * Upload image to imgbb
 * @param imageBlob - Image blob to upload
 * @param imageName - Optional image name
 * @returns Image URL from imgbb
 */
export const uploadImageToImgbb = async (
  imageBlob: Blob,
  imageName?: string
): Promise<string> => {
  try {
    if (!IMGBB_API_KEY) {
      throw new Error('IMGBB API Key not configured. Add VITE_IMGBB_API_KEY to .env');
    }

    // Resize image to reduce upload time (max 800x600)
    const resizedBlob = await resizeImage(imageBlob);

    // Convert blob to base64
    const base64 = await blobToBase64(resizedBlob);
    
    // Remove data:image/jpeg;base64, prefix
    const base64Data = base64.split(',')[1];

    // Create form data
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64Data);
    if (imageName) {
      formData.append('name', imageName);
    }

    // Upload to imgbb with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

    try {
      const response = await fetch(IMGBB_UPLOAD_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`imgbb upload failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('imgbb upload failed');
      }

      // Return the image URL
      return data.data.url;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Upload timeout. Please try again.');
      }
      throw error;
    }
  } catch (error) {
    console.error('Error uploading to imgbb:', error);
    throw error;
  }
};

/**
 * Convert Blob to Base64
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Validate if imgbb API key is configured
 */
export const isImageUploadConfigured = (): boolean => {
  return !!IMGBB_API_KEY;
};

