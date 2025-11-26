export const generateCaptcha = (length: number = 3): string => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result.toUpperCase(); // Ensure all characters are uppercase
};

export const drawCaptchaToCanvas = (text: string, canvas: HTMLCanvasElement): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set canvas size
  canvas.width = 200;
  canvas.height = 80;

  // Background with gradient
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#1e293b');
  gradient.addColorStop(1, '#0f172a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add noise lines
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = `rgba(59, 130, 246, ${Math.random() * 0.3 + 0.1})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.stroke();
  }

  // Add noise dots
  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = `rgba(148, 163, 184, ${Math.random() * 0.5})`;
    ctx.beginPath();
    ctx.arc(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      Math.random() * 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // Draw text with rotation and random positions
  ctx.font = 'bold 32px Arial';
  ctx.textBaseline = 'middle';
  
  const charSpacing = canvas.width / (text.length + 1);
  
  for (let i = 0; i < text.length; i++) {
    ctx.save();
    
    const x = charSpacing * (i + 1);
    const y = canvas.height / 2 + (Math.random() - 0.5) * 10;
    const rotation = (Math.random() - 0.5) * 0.4;
    
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    // Add glow effect
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 10;
    
    // Draw character
    const gradient = ctx.createLinearGradient(0, -20, 0, 20);
    gradient.addColorStop(0, '#60a5fa');
    gradient.addColorStop(1, '#3b82f6');
    ctx.fillStyle = gradient;
    ctx.fillText(text[i], 0, 0);
    
    ctx.restore();
  }
};

export const getCaptchaImageUrl = (text: string): string => {
  const canvas = document.createElement('canvas');
  drawCaptchaToCanvas(text, canvas);
  return canvas.toDataURL('image/png');
};

