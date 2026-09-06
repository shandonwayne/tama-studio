import { memo, useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  ox: number;
  oy: number;
  pinned: boolean;
}

interface Segment {
  particles: Particle[];
  restLength: number;
}

interface StringCanvasProps {
  points: Point[];
  width: number;
  height: number;
}

function buildSegments(points: Point[]): Segment[] {
  if (points.length < 2) return [];
  const segments: Segment[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    const particleCount = Math.max(10, Math.floor(distance / 5));
    const restLength = distance / particleCount;
    const particles: Particle[] = [];
    for (let j = 0; j <= particleCount; j += 1) {
      const progress = j / particleCount;
      const x = a.x + (b.x - a.x) * progress;
      const y = a.y + (b.y - a.y) * progress;
      particles.push({ x, y, ox: x, oy: y, pinned: j === 0 || j === particleCount });
    }
    segments.push({ particles, restLength });
  }
  return segments;
}

export const StringCanvas = memo(function StringCanvas({ points, width, height }: StringCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const activeRef = useRef(false);

  useEffect(() => {
    if (width === 0 || height === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const segments = buildSegments(points);
    const mouse = { x: 0, y: 0 };
    const gravity = 0.35;
    const friction = 0.97;
    const mouseRadius = 70;
    const mouseForce = 6;
    const stringHitRadius = 22;

    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.strokeStyle = '#ffffff';
      context.lineWidth = 4;
      context.lineCap = 'round';
      context.lineJoin = 'round';

      for (const segment of segments) {
        if (segment.particles.length < 2) continue;
        context.beginPath();
        context.moveTo(segment.particles[0].x, segment.particles[0].y);
        for (let i = 1; i < segment.particles.length - 1; i += 1) {
          const particle = segment.particles[i];
          const next = segment.particles[i + 1];
          context.quadraticCurveTo(
            particle.x,
            particle.y,
            (particle.x + next.x) / 2,
            (particle.y + next.y) / 2,
          );
        }
        const last = segment.particles[segment.particles.length - 1];
        context.lineTo(last.x, last.y);
        context.stroke();
      }
    };

    const isPointerOverString = () => segments.some((segment) => segment.particles.some((particle) =>
      Math.hypot(particle.x - mouse.x, particle.y - mouse.y) <= stringHitRadius,
    ));

    const step = () => {
      if (!activeRef.current) return;
      for (const segment of segments) {
        for (const particle of segment.particles) {
          if (particle.pinned) continue;
          const velocityX = (particle.x - particle.ox) * friction;
          const velocityY = (particle.y - particle.oy) * friction;
          particle.ox = particle.x;
          particle.oy = particle.y;
          particle.x += velocityX;
          particle.y += velocityY + gravity;

          const dx = particle.x - mouse.x;
          const dy = particle.y - mouse.y;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared < mouseRadius * mouseRadius && distanceSquared > 0.1) {
            const distance = Math.sqrt(distanceSquared);
            const force = (1 - distance / mouseRadius) * mouseForce;
            particle.x += (dx / distance) * force;
            particle.y += (dy / distance) * force;
          }
        }
      }

      for (let iteration = 0; iteration < 5; iteration += 1) {
        for (const segment of segments) {
          const particles = segment.particles;
          for (let i = 0; i < particles.length - 1; i += 1) {
            const a = particles[i];
            const b = particles[i + 1];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distance = Math.hypot(dx, dy) || 0.001;
            const difference = (distance - segment.restLength) / distance;
            const offsetX = dx * 0.5 * difference;
            const offsetY = dy * 0.5 * difference;
            if (!a.pinned) {
              a.x += offsetX;
              a.y += offsetY;
            }
            if (!b.pinned) {
              b.x -= offsetX;
              b.y -= offsetY;
            }
          }
        }
      }

      draw();
      animationRef.current = requestAnimationFrame(step);
    };

    const updateMouse = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
    };

    const handlePointerDown = (event: PointerEvent) => {
      updateMouse(event);
      if (!isPointerOverString()) return;
      activeRef.current = true;
      canvas.setPointerCapture(event.pointerId);
      cancelAnimationFrame(animationRef.current);
      animationRef.current = requestAnimationFrame(step);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!activeRef.current) return;
      updateMouse(event);
    };

    const handlePointerUp = (event: PointerEvent) => {
      activeRef.current = false;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      cancelAnimationFrame(animationRef.current);
      draw();
    };

    draw();
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);
    return () => {
      activeRef.current = false;
      cancelAnimationFrame(animationRef.current);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [points, width, height]);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-auto" />;
});
