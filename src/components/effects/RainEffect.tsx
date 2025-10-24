import React, { useEffect, useRef } from 'react';

interface Raindrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  depth: number;
}

interface Splash {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  particles: SplashParticle[];
}

interface SplashParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
}

interface Lightning {
  active: boolean;
  brightness: number;
  branches: { x1: number; y1: number; x2: number; y2: number; }[];
}

interface WindGust {
  strength: number;
  direction: number;
  duration: number;
}

interface CameraDroplet {
  x: number;
  y: number;
  size: number;
  opacity: number;
  slideSpeed: number;
}

export const RainEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raindropsRef = useRef<Raindrop[]>([]);
  const splashesRef = useRef<Splash[]>([]);
  const lightningRef = useRef<Lightning>({ active: false, brightness: 0, branches: [] });
  const windRef = useRef<WindGust>({ strength: 0, direction: 0, duration: 0 });
  const cameraDropletsRef = useRef<CameraDroplet[]>([]);
  const fogOpacityRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number; isDown: boolean }>({ x: 0, y: 0, isDown: false });
  const mouseTrailRef = useRef<{ x: number; y: number; opacity: number }[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Mouse tracking with smart throttling for smooth performance
    let lastMouseUpdate = 0;
    const mouseUpdateInterval = 16; // ~60fps
    
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastMouseUpdate < mouseUpdateInterval) return;
      
      lastMouseUpdate = now;
      
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      
      // Add to trail (reduced frequency)
      if (Math.random() < 0.3) { // Only 30% chance to add trail point
        mouseTrailRef.current.push({
          x: e.clientX,
          y: e.clientY,
          opacity: 1
        });
        
        // Limit trail length
        if (mouseTrailRef.current.length > 15) {
          mouseTrailRef.current.shift();
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      mouseRef.current.isDown = true;
      
      // Create big splash on click
      createSplash(e.clientX, e.clientY, 1);
      
      // Create multiple small splashes around click
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 / 5) * i;
        const distance = 30 + Math.random() * 20;
        const x = e.clientX + Math.cos(angle) * distance;
        const y = e.clientY + Math.sin(angle) * distance;
        setTimeout(() => createSplash(x, y, 0.8), i * 50);
      }
    };

    const handleMouseUp = () => {
      mouseRef.current.isDown = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Initialize raindrops with depth (5D effect)
    const initRaindrops = () => {
      const drops: Raindrop[] = [];
      const count = 150; // Professional amount, not too much

      for (let i = 0; i < count; i++) {
        const depth = Math.random(); // 0 = far, 1 = close
        drops.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          length: 10 + depth * 20, // Longer drops are closer
          speed: 2 + depth * 8, // Faster drops are closer
          opacity: 0.1 + depth * 0.4, // Closer drops are more visible
          depth: depth
        });
      }
      return drops;
    };

    raindropsRef.current = initRaindrops();

    // Initialize camera droplets (water on lens effect)
    const initCameraDroplets = () => {
      const droplets: CameraDroplet[] = [];
      for (let i = 0; i < 8; i++) {
        droplets.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 0.3,
          size: 20 + Math.random() * 40,
          opacity: 0.1 + Math.random() * 0.2,
          slideSpeed: 0.5 + Math.random() * 1
        });
      }
      return droplets;
    };
    cameraDropletsRef.current = initCameraDroplets();

    // Trigger lightning randomly
    const triggerLightning = () => {
      lightningRef.current.active = true;
      lightningRef.current.brightness = 1;
      
      // Generate lightning branches
      const branches: { x1: number; y1: number; x2: number; y2: number; }[] = [];
      const startX = Math.random() * canvas.width;
      let currentX = startX;
      let currentY = 0;
      
      // Main bolt
      for (let i = 0; i < 8; i++) {
        const nextX = currentX + (Math.random() - 0.5) * 100;
        const nextY = currentY + canvas.height / 8;
        branches.push({ x1: currentX, y1: currentY, x2: nextX, y2: nextY });
        
        // Add side branches
        if (Math.random() > 0.6) {
          const branchX = nextX + (Math.random() - 0.5) * 80;
          const branchY = nextY + 40;
          branches.push({ x1: nextX, y1: nextY, x2: branchX, y2: branchY });
        }
        
        currentX = nextX;
        currentY = nextY;
      }
      
      lightningRef.current.branches = branches;
      
      // Thunder sound would go here
      setTimeout(() => {
        lightningRef.current.active = false;
      }, 150);
    };

    // Random lightning strikes
    const lightningInterval = setInterval(() => {
      if (Math.random() > 0.95) {
        triggerLightning();
      }
    }, 2000);

    // Wind gusts
    const windInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        windRef.current = {
          strength: 2 + Math.random() * 4,
          direction: Math.random() > 0.5 ? 1 : -1,
          duration: 100
        };
      }
    }, 3000);

    // Create splash when raindrop hits ground
    const createSplash = (x: number, y: number, depth: number) => {
      const particleCount = Math.floor(4 + depth * 6);
      const particles: SplashParticle[] = [];
      
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI / 3) + (Math.random() * Math.PI / 3); // Splash upward
        const speed = 2 + Math.random() * 3;
        particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
          vy: -Math.sin(angle) * speed,
          life: 1,
          size: 1 + depth * 2
        });
      }
      
      splashesRef.current.push({
        x,
        y,
        radius: 0,
        opacity: 0.6 * depth,
        particles
      });
    };

    // Animate
    const animate = () => {
      // Dynamic background color based on lightning
      const bgBrightness = lightningRef.current.active ? 60 : 10;
      const bgColor = `rgba(${bgBrightness}, ${bgBrightness + 5}, ${bgBrightness + 20}, 0.15)`;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw lightning
      if (lightningRef.current.active) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.strokeStyle = `rgba(200, 220, 255, ${lightningRef.current.brightness})`;
        ctx.lineWidth = 3;
        
        lightningRef.current.branches.forEach(branch => {
          ctx.beginPath();
          ctx.moveTo(branch.x1, branch.y1);
          ctx.lineTo(branch.x2, branch.y2);
          ctx.stroke();
        });
        
        ctx.shadowBlur = 0;
        lightningRef.current.brightness -= 0.1;
      }

      // Update wind
      if (windRef.current.duration > 0) {
        windRef.current.duration--;
      } else {
        windRef.current.strength = 0;
      }

      // Draw fog/mist layer (parallax depth)
      fogOpacityRef.current = Math.sin(Date.now() * 0.0005) * 0.05 + 0.1;
      ctx.fillStyle = `rgba(100, 120, 150, ${fogOpacityRef.current})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height * 0.6);

      // Draw raindrops
      raindropsRef.current.forEach((drop) => {
        // Draw raindrop with gradient for 3D effect
        const gradient = ctx.createLinearGradient(
          drop.x,
          drop.y,
          drop.x,
          drop.y + drop.length
        );
        
        gradient.addColorStop(0, `rgba(174, 194, 224, ${drop.opacity})`);
        gradient.addColorStop(1, `rgba(174, 194, 224, 0)`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 0.5 + drop.depth * 1.5;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y + drop.length);
        ctx.stroke();

        // Update position
        drop.y += drop.speed;

        // Check if hit ground and create splash
        if (drop.y >= canvas.height - 2) {
          // Only create splash for closer drops (more visible)
          if (drop.depth > 0.3 && Math.random() > 0.7) {
            createSplash(drop.x, canvas.height - 2, drop.depth);
          }
          // Reset drop
          drop.y = -drop.length;
          drop.x = Math.random() * canvas.width;
        }

        // Add wind effect (natural + gusts)
        const naturalWind = Math.sin(Date.now() * 0.001 + drop.y * 0.01) * 0.3;
        const gustWind = windRef.current.strength * windRef.current.direction;
        drop.x += (naturalWind + gustWind) * drop.depth;
        
        // Mouse repel effect - raindrops avoid cursor (optimized)
        const dx = drop.x - mouseRef.current.x;
        const dy = drop.y - mouseRef.current.y;
        const mouseDistanceSquared = dx * dx + dy * dy;
        const repelRadiusSquared = 100 * 100;
        
        if (mouseDistanceSquared < repelRadiusSquared) {
          const mouseDistance = Math.sqrt(mouseDistanceSquared);
          const repelStrength = (1 - mouseDistance / 100) * 3; // Reduced strength
          const angle = Math.atan2(dy, dx);
          drop.x += Math.cos(angle) * repelStrength * drop.depth;
          drop.y += Math.sin(angle) * repelStrength * drop.depth * 0.5;
        }
        
        // Add slight variation in speed (rain intensity)
        drop.speed += Math.sin(Date.now() * 0.002) * 0.1;
      });

      // Draw and update splashes
      splashesRef.current = splashesRef.current.filter(splash => {
        // Draw ripple (expanding circle)
        splash.radius += 2;
        splash.opacity -= 0.02;
        
        if (splash.opacity > 0 && splash.radius < 20) {
          ctx.strokeStyle = `rgba(174, 194, 224, ${splash.opacity * 0.3})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(splash.x, splash.y, splash.radius, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw splash particles (water bouncing up)
        splash.particles = splash.particles.filter(particle => {
          if (particle.life <= 0) return false;

          // Draw particle
          ctx.fillStyle = `rgba(174, 194, 224, ${particle.life * 0.6})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();

          // Update particle physics
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.3; // Gravity
          particle.life -= 0.05;

          return true;
        });

        return splash.opacity > 0 || splash.particles.length > 0;
      });

      // Draw camera water droplets (foreground layer - on lens effect)
      cameraDropletsRef.current.forEach(droplet => {
        // Slide down slowly
        droplet.y += droplet.slideSpeed;
        
        // Reset when off screen
        if (droplet.y > canvas.height) {
          droplet.y = -droplet.size;
          droplet.x = Math.random() * canvas.width;
        }
        
        // Draw droplet with blur effect
        const gradient = ctx.createRadialGradient(
          droplet.x, droplet.y, 0,
          droplet.x, droplet.y, droplet.size
        );
        gradient.addColorStop(0, `rgba(174, 194, 224, ${droplet.opacity * 0.8})`);
        gradient.addColorStop(0.5, `rgba(174, 194, 224, ${droplet.opacity * 0.4})`);
        gradient.addColorStop(1, 'rgba(174, 194, 224, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(droplet.x, droplet.y, droplet.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner highlight (refraction effect)
        ctx.fillStyle = `rgba(255, 255, 255, ${droplet.opacity * 0.3})`;
        ctx.beginPath();
        ctx.arc(droplet.x - droplet.size * 0.2, droplet.y - droplet.size * 0.2, droplet.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw mouse trail (optimized)
      if (mouseTrailRef.current.length > 0) {
        ctx.save();
        mouseTrailRef.current = mouseTrailRef.current.filter(trail => {
          trail.opacity -= 0.08; // Faster fade
          
          if (trail.opacity <= 0) return false;
          
          // Draw trail circle with glow (simplified)
          ctx.shadowBlur = 15;
          ctx.shadowColor = `rgba(100, 180, 255, ${trail.opacity * 0.5})`;
          ctx.fillStyle = `rgba(100, 180, 255, ${trail.opacity * 0.2})`;
          ctx.beginPath();
          ctx.arc(trail.x, trail.y, 12, 0, Math.PI * 2);
          ctx.fill();
          
          return true;
        });
        ctx.restore();
      }

      // Draw cursor glow when mouse is down
      if (mouseRef.current.isDown) {
        const glowGradient = ctx.createRadialGradient(
          mouseRef.current.x, mouseRef.current.y, 0,
          mouseRef.current.x, mouseRef.current.y, 60
        );
        glowGradient.addColorStop(0, 'rgba(100, 180, 255, 0.5)');
        glowGradient.addColorStop(1, 'rgba(100, 180, 255, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(
          mouseRef.current.x - 60, 
          mouseRef.current.y - 60, 
          120, 120
        );
      }

      // Draw cursor repel zone (invisible force field indicator)
      ctx.strokeStyle = `rgba(100, 180, 255, ${Math.sin(Date.now() * 0.005) * 0.1 + 0.1})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mouseRef.current.x, mouseRef.current.y, 100, 0, Math.PI * 2);
      ctx.stroke();

      // Depth of field blur effect (vignette)
      const vignetteGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.7
      );
      vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
      ctx.fillStyle = vignetteGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      clearInterval(lightningInterval);
      clearInterval(windInterval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      style={{ 
        mixBlendMode: 'screen',
        opacity: 0.8,
        cursor: 'none'
      }}
    />
  );
};

