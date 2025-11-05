/**
 * Motion Detection for Liveness
 * Detect natural micro-movements in real faces
 */

interface MotionResult {
  hasMotion: boolean;
  motionScore: number;
  reason: string;
}

/**
 * Calculate frame difference to detect motion
 */
const calculateFrameDifference = (frame1: ImageData, frame2: ImageData): number => {
  const { data: data1 } = frame1;
  const { data: data2 } = frame2;
  
  let totalDiff = 0;
  let pixelCount = 0;
  
  for (let i = 0; i < data1.length; i += 4) {
    const diff = Math.abs(
      (data1[i] + data1[i + 1] + data1[i + 2]) / 3 -
      (data2[i] + data2[i + 1] + data2[i + 2]) / 3
    );
    
    totalDiff += diff;
    pixelCount++;
  }
  
  return totalDiff / pixelCount;
};

/**
 * Capture frame as ImageData
 */
const captureFrame = (videoElement: HTMLVideoElement): ImageData | null => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return null;
  
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  ctx.drawImage(videoElement, 0, 0);
  
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

/**
 * Detect natural motion over time
 * Real faces have subtle movements, static images don't
 */
export const detectNaturalMotion = async (
  videoElement: HTMLVideoElement,
  durationMs: number = 2000,
  sampleIntervalMs: number = 200,
  motionMin: number = 2.0,
  motionMax: number = 8.0
): Promise<MotionResult> => {
  const frames: ImageData[] = [];
  const sampleCount = Math.floor(durationMs / sampleIntervalMs);
  
  // Capture frames over time
  for (let i = 0; i < sampleCount; i++) {
    const frame = captureFrame(videoElement);
    if (frame) {
      frames.push(frame);
    }
    
    if (i < sampleCount - 1) {
      await new Promise(resolve => setTimeout(resolve, sampleIntervalMs));
    }
  }
  
  if (frames.length < 2) {
    return {
      hasMotion: false,
      motionScore: 0,
      reason: 'Failed to capture enough frames',
    };
  }
  
  // Calculate motion between consecutive frames
  const motionScores: number[] = [];
  for (let i = 1; i < frames.length; i++) {
    const diff = calculateFrameDifference(frames[i - 1], frames[i]);
    motionScores.push(diff);
  }
  
  const avgMotion = motionScores.reduce((sum, score) => sum + score, 0) / motionScores.length;
  
  // Real faces have subtle natural motion (configurable range, default 2-8)
  // Static images or photos on screens have very little motion (< motionMin)
  // Too much motion (> motionMax) is handheld phone/video playback
  const hasMotion = avgMotion > motionMin && avgMotion < motionMax;
  
  let reason = '';
  if (avgMotion <= motionMin) {
    reason = `No natural motion detected (static image/photo on screen? Motion: ${avgMotion.toFixed(2)} <= ${motionMin})`;
  } else if (avgMotion >= motionMax) {
    reason = `Too much motion detected (handheld phone/video playback? Motion: ${avgMotion.toFixed(2)} >= ${motionMax})`;
  } else {
    reason = `Natural motion detected (${avgMotion.toFixed(2)} within ${motionMin}-${motionMax})`;
  }
  
  return {
    hasMotion,
    motionScore: avgMotion,
    reason,
  };
};

/**
 * Simple blink detection for additional liveness
 */
export const detectBlinkMotion = async (
  videoElement: HTMLVideoElement,
  durationMs: number = 3000
): Promise<boolean> => {
  // This is a simplified version - real blink detection would analyze eye landmarks
  const result = await detectNaturalMotion(videoElement, durationMs, 150);
  
  // If there's natural motion, assume user might have blinked
  return result.hasMotion && result.motionScore > 1;
};

