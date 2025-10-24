// Device Detection Utility
export const isMobileDevice = (): boolean => {
  // Check for mobile user agents
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const userAgent = navigator.userAgent;
  
  // Check for touch capability
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Check screen size
  const isSmallScreen = window.innerWidth <= 768;
  
  return mobileRegex.test(userAgent) || (hasTouch && isSmallScreen);
};

export const isTabletDevice = (): boolean => {
  // Check for tablet user agents
  const tabletRegex = /iPad|Android(?=.*Mobile)/i;
  const userAgent = navigator.userAgent;
  
  // Check for touch capability and medium screen size
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMediumScreen = window.innerWidth > 768 && window.innerWidth <= 1024;
  
  return tabletRegex.test(userAgent) || (hasTouch && isMediumScreen);
};

export const isDesktopDevice = (): boolean => {
  return !isMobileDevice() && !isTabletDevice();
};

export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (isMobileDevice()) return 'mobile';
  if (isTabletDevice()) return 'tablet';
  return 'desktop';
};
