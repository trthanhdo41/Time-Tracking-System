/**
 * Anti-Spoofing Utilities
 * Detect fake face images from photos/screens
 */

interface QualityMetrics {
  sharpness: number;
  contrast: number;
  brightness: number;
  colorfulness: number;
  textureScore: number;
}

interface SpoofingResult {
  isReal: boolean;
  confidence: number;
  reason: string;
  metrics?: QualityMetrics;
}

/**
 * Calculate image sharpness using Laplacian variance
 * Low sharpness indicates blurry image (common in photos of photos)
 */
export const calculateSharpness = (imageData: ImageData): number => {
  const { data, width, height } = imageData;
  const gray: number[] = [];
  
  // Convert to grayscale
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    gray.push(0.299 * r + 0.587 * g + 0.114 * b);
  }
  
  // Apply Laplacian operator
  let variance = 0;
  let mean = 0;
  let count = 0;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const laplacian = Math.abs(
        4 * gray[idx] -
        gray[idx - 1] -
        gray[idx + 1] -
        gray[idx - width] -
        gray[idx + width]
      );
      mean += laplacian;
      count++;
    }
  }
  
  mean /= count;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const laplacian = Math.abs(
        4 * gray[idx] -
        gray[idx - 1] -
        gray[idx + 1] -
        gray[idx - width] -
        gray[idx + width]
      );
      variance += Math.pow(laplacian - mean, 2);
    }
  }
  
  variance /= count;
  return variance;
};

/**
 * Calculate image contrast
 * Photos of screens typically have lower contrast
 */
export const calculateContrast = (imageData: ImageData): number => {
  const { data } = imageData;
  let sum = 0;
  let count = 0;
  
  // Calculate mean brightness
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    sum += brightness;
    count++;
  }
  
  const mean = sum / count;
  
  // Calculate standard deviation (contrast measure)
  let variance = 0;
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    variance += Math.pow(brightness - mean, 2);
  }
  
  return Math.sqrt(variance / count);
};

/**
 * Calculate average brightness
 */
export const calculateBrightness = (imageData: ImageData): number => {
  const { data } = imageData;
  let sum = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  
  return sum / (data.length / 4);
};

/**
 * Calculate colorfulness
 * Photos of screens often have color shifts or reduced color range
 */
export const calculateColorfulness = (imageData: ImageData): number => {
  const { data } = imageData;
  let rgDiff = 0;
  let ybDiff = 0;
  let count = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    rgDiff += Math.abs(r - g);
    ybDiff += Math.abs((r + g) / 2 - b);
    count++;
  }
  
  const avgRG = rgDiff / count;
  const avgYB = ybDiff / count;
  
  return Math.sqrt(avgRG * avgRG + avgYB * avgYB);
};

/**
 * Detect sharp edges that might indicate screen boundaries
 * Photos of screens often have visible rectangular edges
 */
export const detectScreenEdges = (imageData: ImageData): boolean => {
  const { data, width, height } = imageData;
  
  // Check for abnormally sharp rectangular edges (screen frame)
  let sharpEdgeCount = 0;
  const edgeThreshold = 50; // Brightness difference threshold
  
  // Sample top, bottom, left, right edges
  const samplePoints = 20;
  
  for (let i = 0; i < samplePoints; i++) {
    const x = Math.floor((i / samplePoints) * width);
    const y = Math.floor((i / samplePoints) * height);
    
    // Check horizontal edge transitions
    if (x > 10 && x < width - 10) {
      const topIdx = (10 * width + x) * 4;
      const topVal = (data[topIdx] + data[topIdx + 1] + data[topIdx + 2]) / 3;
      const centerIdx = (Math.floor(height / 2) * width + x) * 4;
      const centerVal = (data[centerIdx] + data[centerIdx + 1] + data[centerIdx + 2]) / 3;
      
      if (Math.abs(topVal - centerVal) > edgeThreshold) {
        sharpEdgeCount++;
      }
    }
  }
  
  // If too many sharp edges detected, likely a screen
  return sharpEdgeCount > samplePoints * 0.3;
};

/**
 * Detect interference patterns and texture artifacts
 * Common in photos of screens
 */
export const detectTextureArtifacts = (imageData: ImageData): number => {
  const { data, width, height } = imageData;
  
  // Detect high-frequency patterns (interference)
  let highFreqCount = 0;
  let totalSamples = 0;
  
  for (let y = 2; y < height - 2; y += 2) {
    for (let x = 2; x < width - 2; x += 2) {
      const idx = (y * width + x) * 4;
      
      // Sample neighboring pixels
      const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      const neighbors = [
        (data[idx - 8] + data[idx - 7] + data[idx - 6]) / 3,
        (data[idx + 8] + data[idx + 9] + data[idx + 10]) / 3,
        (data[idx - width * 4] + data[idx - width * 4 + 1] + data[idx - width * 4 + 2]) / 3,
        (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3,
      ];
      
      // Check for alternating pattern (indicator of interference)
      let alternating = 0;
      for (const neighbor of neighbors) {
        if (Math.abs(center - neighbor) > 30) {
          alternating++;
        }
      }
      
      if (alternating >= 3) {
        highFreqCount++;
      }
      totalSamples++;
    }
  }
  
  return highFreqCount / totalSamples;
};

/**
 * Extract image data from video or image element
 */
const getImageData = (element: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): ImageData | null => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return null;
  
  if (element instanceof HTMLVideoElement) {
    canvas.width = element.videoWidth;
    canvas.height = element.videoHeight;
    ctx.drawImage(element, 0, 0);
  } else if (element instanceof HTMLImageElement) {
    canvas.width = element.width;
    canvas.height = element.height;
    ctx.drawImage(element, 0, 0);
  } else {
    return element.getContext('2d')?.getImageData(0, 0, element.width, element.height) || null;
  }
  
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

/**
 * Analyze image quality metrics
 */
export const analyzeImageQuality = (element: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): QualityMetrics | null => {
  const imageData = getImageData(element);
  if (!imageData) return null;
  
  // Check for screen edges first - if detected, penalize heavily
  const hasScreenEdges = detectScreenEdges(imageData);
  
  return {
    sharpness: calculateSharpness(imageData),
    contrast: calculateContrast(imageData),
    brightness: calculateBrightness(imageData),
    colorfulness: calculateColorfulness(imageData),
    textureScore: hasScreenEdges ? 1.0 : detectTextureArtifacts(imageData), // Max penalty if screen detected
  };
};

/**
 * Check if image is likely a fake (photo of screen/print)
 * Returns confidence score 0-1 (1 = definitely real, 0 = definitely fake)
 */
export const checkImageAuthenticity = (
  element: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  sharpnessMin: number = 150,
  contrastMin: number = 40,
  colorfulnessMin: number = 30,
  textureScoreMax: number = 0.15,
  confidenceThreshold: number = 0.55
): SpoofingResult => {
  const metrics = analyzeImageQuality(element);
  
  if (!metrics) {
    return {
      isReal: false,
      confidence: 0,
      reason: 'Failed to analyze image',
    };
  }
  
  let score = 0;
  const reasons: string[] = [];
  
  // Sharpness check (configurable threshold)
  if (metrics.sharpness > sharpnessMin) {
    score += 0.3;
  } else if (metrics.sharpness < 80) {
    reasons.push(`Image too blurry (sharpness: ${metrics.sharpness.toFixed(0)} < 80)`);
  } else {
    score += 0.1; // Partial credit for borderline sharpness
  }
  
  // Contrast check (configurable threshold)
  if (metrics.contrast > contrastMin) {
    score += 0.3;
  } else if (metrics.contrast < 25) {
    reasons.push(`Low contrast (${metrics.contrast.toFixed(0)} < 25)`);
  } else {
    score += 0.1; // Partial credit
  }
  
  // Brightness check (should be within reasonable range)
  if (metrics.brightness > 60 && metrics.brightness < 180) {
    score += 0.15;
  } else {
    reasons.push(`Unusual brightness levels (${metrics.brightness.toFixed(0)})`);
  }
  
  // Colorfulness check (configurable threshold)
  if (metrics.colorfulness > colorfulnessMin) {
    score += 0.2;
  } else if (metrics.colorfulness < 15) {
    reasons.push(`Low color range (${metrics.colorfulness.toFixed(0)} < 15)`);
  }
  
  // Texture artifacts check (interference patterns indicate screen - configurable)
  if (metrics.textureScore < 0.05) {
    score += 0.15;
  } else if (metrics.textureScore > textureScoreMax) {
    reasons.push(`Detected screen patterns (${metrics.textureScore.toFixed(2)} > ${textureScoreMax})`);
  }
  
  const isReal = score >= confidenceThreshold;
  
  return {
    isReal,
    confidence: score,
    reason: isReal ? 'Image appears authentic' : reasons.join(', '),
    metrics,
  };
};

/**
 * Multi-frame verification
 * Capture multiple frames and check consistency
 */
export const verifyMultipleFrames = async (
  videoElement: HTMLVideoElement,
  frameCount: number = 3,
  delayMs: number = 200,
  sharpnessMin: number = 150,
  contrastMin: number = 40,
  colorfulnessMin: number = 30,
  textureScoreMax: number = 0.15,
  confidenceThreshold: number = 0.55
): Promise<SpoofingResult> => {
  const results: SpoofingResult[] = [];
  
  for (let i = 0; i < frameCount; i++) {
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    const result = checkImageAuthenticity(
      videoElement,
      sharpnessMin,
      contrastMin,
      colorfulnessMin,
      textureScoreMax,
      confidenceThreshold
    );
    results.push(result);
  }
  
  // Calculate average confidence
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  
  // Check consistency - real faces should have similar scores
  const confidences = results.map(r => r.confidence);
  const variance = confidences.reduce((sum, c) => sum + Math.pow(c - avgConfidence, 2), 0) / confidences.length;
  
  // High variance indicates inconsistent quality (suspicious)
  const isConsistent = variance < 0.05;
  const isReal = avgConfidence >= confidenceThreshold && isConsistent;
  
  return {
    isReal,
    confidence: avgConfidence,
    reason: isReal 
      ? 'Multi-frame verification passed'
      : `Verification failed: ${!isConsistent ? 'Inconsistent frames, ' : ''}avg confidence ${(avgConfidence * 100).toFixed(0)}%`,
  };
};

