import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  volume: number; // Normalized 0-1
  isActive: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ volume, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let currentHeight = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      const centerY = h / 2;

      // Smooth interpolation for the volume
      const targetHeight = Math.max(0.05, volume) * (h * 0.8);
      currentHeight += (targetHeight - currentHeight) * 0.2;

      // Draw Wave
      if (isActive) {
        ctx.beginPath();
        ctx.moveTo(0, centerY);

        const segments = 100;
        for (let i = 0; i <= segments; i++) {
          const x = (i / segments) * w;
          // Create a sine wave affected by current volume
          const frequency = 0.1; // frequency of the sine wave
          const time = Date.now() * 0.005;
          const amplitude = currentHeight * Math.sin((i + time) * 0.5) * Math.sin(i * 0.1); 
          
          ctx.lineTo(x, centerY + amplitude);
        }

        ctx.strokeStyle = '#10b981'; // Emerald 500 equivalent
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#10b981';
        ctx.stroke();
      } else {
        // Idle straight line
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(w, centerY);
        ctx.strokeStyle = '#334155'; // Slate 700
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [volume, isActive]);

  return (
    <div className="w-full h-32 bg-slate-850 rounded-xl overflow-hidden shadow-inner border border-slate-700 relative">
        <div className="absolute top-2 left-3 text-xs text-slate-400 font-mono tracking-wider">AUDIO STREAM</div>
        <canvas 
            ref={canvasRef} 
            width={800} 
            height={200} 
            className="w-full h-full"
        />
    </div>
  );
};

export default AudioVisualizer;