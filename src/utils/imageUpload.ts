// Image upload utility using imgbb API (free unlimited storage)

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

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

    // Convert blob to base64
    const base64 = await blobToBase64(imageBlob);
    
    // Remove data:image/jpeg;base64, prefix
    const base64Data = base64.split(',')[1];

    // Create form data
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64Data);
    if (imageName) {
      formData.append('name', imageName);
    }

    // Upload to imgbb
    const response = await fetch(IMGBB_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`imgbb upload failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error('imgbb upload failed');
    }

    // Return the image URL
    return data.data.url;
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

