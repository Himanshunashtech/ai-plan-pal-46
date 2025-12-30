import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';

interface AISparkleOverlayProps {
    size?: number;
    sparkleCount?: number;
}

const AISparkleOverlay: React.FC<AISparkleOverlayProps> = ({
    size = 288,
    sparkleCount = 14,
}) => {
    const sparkles = useMemo(
        () =>
            Array.from({ length: sparkleCount }).map((_, i) => ({
                id: i,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                delay: `${Math.random() * 2.5}s`,
                scale: 0.6 + Math.random() * 0.8,
            })),
        [sparkleCount]
    );

    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none overflow-hidden">
            {/* ===== Scoped Animations ===== */}
            <style>{`
        @keyframes twinkle {
          0%, 100% {
            opacity: 0.25;
            transform: scale(0.7);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes vertical-scan {
          0% {
            transform: translateY(-120%);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          85% {
            opacity: 0.85;
          }
          100% {
            transform: translateY(120%);
            opacity: 0;
          }
        }

        .animate-twinkle {
          animation: twinkle 2.4s ease-in-out infinite;
        }

        .animate-vertical-scan {
          animation: vertical-scan 3s linear infinite;
        }
      `}</style>

            {/* ===== Central AI Aura ===== */}
            <div
                className="absolute rounded-full bg-white/5 blur-[60px] animate-pulse"
                style={{ width: size, height: size }}
            />

            {/* ===== Horizontal Scanning Bar (Moves Up & Down) ===== */}
            <div
                className="absolute h-[3px] rounded-full 
          bg-gradient-to-r from-transparent via-white/70 to-transparent 
          animate-vertical-scan"
                style={{ width: size + 60 }}
            />

            {/* ===== Sparkle Field ===== */}
            <div className="relative" style={{ width: size, height: size }}>
                {sparkles.map((s) => (
                    <div
                        key={s.id}
                        className="absolute animate-twinkle text-white"
                        style={{
                            top: s.top,
                            left: s.left,
                            animationDelay: s.delay,
                            transform: `scale(${s.scale})`,
                        }}
                    >
                        <Sparkles className="w-4 h-4 fill-white/30" />
                    </div>
                ))}

                {/* Ambient Static Stars */}
                <span className="absolute top-6 left-10 text-white/50 text-xl animate-twinkle">
                    ✦
                </span>
                <span className="absolute bottom-10 right-12 text-white/60 text-sm animate-twinkle delay-700">
                    ✦
                </span>
                <span className="absolute top-1/2 right-4 text-white text-lg animate-twinkle delay-300">
                    ✦
                </span>
                <span className="absolute bottom-1/4 left-6 text-white/30 text-xs animate-twinkle delay-500">
                    ✦
                </span>
            </div>
        </div>
    );
};

export default React.memo(AISparkleOverlay);
