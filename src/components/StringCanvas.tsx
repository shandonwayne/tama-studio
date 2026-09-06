import { memo, useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
}

interface MouseState {
  x: number;
  y: number;
  active: boolean;
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
  mouseRef: { current: MouseState };
}

function buildSegments(points: Point[]): Segment[] {
  if (points.length < 2) return [];
  const segments: Segment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const numParticles = Math.max(10, Math.floor(dist / 5));
    const restLength = dist / numParticles;
    const particles: Particle[] = [];
    for (let j = 0; j <= numParticles; j++) {
      const t = j / numParticles;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      particles.push({ x, y, ox: x, oy: y, pinned: j === 0 || j === numParticles });
    }
    segments.push({ particles, restLength });
  }
  return segments;
}

export const StringCanvas = memo(function StringCanvas({
  points,
  width,
  height,
  mouseRef,
}: StringCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const segmentsRef = useRef<Segment[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    segmentsRef.current = buildSegments(points);
  }, [points]);

  useEffect(() => {
    if (width === 0 || height === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const gravity = 0.35;
    const friction = 0.97;
    const mouseRadius = 70;
    const mouseForce = 6;
    const iterations = 5;

    const step = () => {
      const segments = segmentsRef.current;
      const mouse = mouseRef.current;

      for (const segment of segments) {
        for (const p of segment.particles) {
          if (p.pinned) continue;
          const vx = (p.x - p.ox) * friction;
          const vy = (p.y - p.oy) * friction;
          p.ox = p.x;
          p.oy = p.y;
          p.x += vx;
          p.y += vy + gravity;

          if (mouse.active) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < mouseRadius * mouseRadius && distSq > 0.1) {
              const dist = Math.sqrt(distSq);
              const force = (1 - dist / mouseRadius) * mouseForce;
              p.x += (dx / dist) * force;
              p.y += (dy / dist) * force;
            }
          }
        }
      }

      for (let iter = 0; iter < iterations; iter++) {
        for (const segment of segments) {
          const ps = segment.particles;
          for (let i = 0; i < ps.length - 1; i++) {
            const a = ps[i];
            const b = ps[i + 1];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy) || 0.001;
            const diff = (dist - segment.restLength) / dist;
            const ox = dx * 0.5 * diff;
            const oy = dy * 0.5 * diff;
            if (!a.pinned) {
              a.x += ox;
              a.y += oy;
            }
            if (!b.pinned) {
              b.x -= ox;
              b.y -= oy;
            }
          }
        }
      }

      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 20;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const segment of segments) {
        if (segment.particles.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(segment.particles[0].x, segment.particles[0].y);
        for (let i = 1; i < segment.particles.length - 1; i++) {
          const p = segment.particles[i];
          const next = segment.particles[i + 1];
          const midX = (p.x + next.x) / 2;
          const midY = (p.y + next.y) / 2;
          ctx.quadraticCurveTo(p.x, p.y, midX, midY);
        }
        const last = segment.particles[segment.particles.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [width, height, mouseRef]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0"
    />
  );
});
