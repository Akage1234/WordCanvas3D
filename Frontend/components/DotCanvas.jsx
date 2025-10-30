'use client';
import { useEffect, useRef } from 'react';

export default function DotCanvas({ opacity = 0.04, dotColor = '#ffffff' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    function resize() {
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      const step = 48;                 // grid spacing
      const pts = [];
      for (let x = 0; x <= innerWidth; x += step) {
        for (let y = 0; y <= innerHeight; y += step) {
          pts.push({ x, y });
        }
      }

      // lines
      ctx.strokeStyle = dotColor;
      ctx.globalAlpha = opacity * 0.35;
      ctx.lineWidth = 0.75;
      pts.forEach(p => {
        pts.forEach(q => {
          const dist = Math.hypot(p.x - q.x, p.y - q.y);
          if (dist && dist <= step * 1.5) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        });
      });

      // dots
      ctx.fillStyle = dotColor;
      ctx.globalAlpha = opacity;
      pts.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    resize();
    addEventListener('resize', resize);
    return () => removeEventListener('resize', resize);
  }, [opacity, dotColor]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    />
  );
}