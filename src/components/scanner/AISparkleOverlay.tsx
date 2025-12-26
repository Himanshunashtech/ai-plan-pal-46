import React from 'react';
import { Sparkles } from 'lucide-react';

const AISparkleOverlay: React.FC = () => {
    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden pointer-events-none">
            {/* Central Aura */}
            <div className="absolute w-64 h-64 rounded-full bg-white/5 blur-[60px] animate-pulse" />

            {/* Scanning Shimmer Line */}
            <div className="absolute w-72 h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent top-1/2 -translate-y-1/2 animate-[shimmer-scan_2s_infinite_linear]" />

            {/* Randomized Sparkles */}
            <style>{`
        @keyframes sparkle-float {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0; }
          50% { transform: translate(var(--tw-tx), var(--tw-ty)) scale(var(--tw-scale)); opacity: 1; }
        }
        @keyframes shimmer-scan {
          0% { transform: translateY(-144px) scaleX(0.5); opacity: 0; }
          50% { transform: translateY(0px) scaleX(1); opacity: 0.8; }
          100% { transform: translateY(144px) scaleX(0.5); opacity: 0; }
        }
      `}</style>

            <div className="relative w-72 h-72">
                {/* Floating Stars */}
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute text-white animate-[sparkle-float_3s_infinite_ease-in-out]"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            '--tw-tx': `${(Math.random() - 0.5) * 40}px`,
                            '--tw-ty': `${(Math.random() - 0.5) * 40}px`,
                            '--tw-scale': 0.5 + Math.random() * 0.8,
                        } as any}
                    >
                        <Sparkles className="w-4 h-4 fill-white/20" />
                    </div>
                ))}

                {/* Static Ambient Sparkles */}
                <span className="absolute top-4 left-10 text-white/40 text-xl animate-pulse">✦</span>
                <span className="absolute bottom-10 right-12 text-white/60 text-sm animate-pulse delay-700">✦</span>
                <span className="absolute top-1/2 right-4 text-white text-lg animate-pulse delay-300">✦</span>
                <span className="absolute bottom-1/4 left-6 text-white/30 text-xs animate-pulse delay-500">✦</span>
            </div>

            {/* Subtitle */}
            <div className="absolute bottom-24 left-0 right-0 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                    <Sparkles className="w-4 h-4 text-white animate-twinkle" />
                    <span className="text-white font-medium text-sm tracking-wide">AI Analysing...</span>
                </div>
            </div>
        </div>
    );
};

export default AISparkleOverlay;
