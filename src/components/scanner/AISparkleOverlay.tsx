import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';

interface AISparkleOverlayProps {
    size?: number;
    sparkleCount?: number;
}

const AISparkleOverlay: React.FC<AISparkleOverlayProps> = ({
    size = 288,
    sparkleCount = 12,
}) => {
    const sparkles = useMemo(() => {
        return Array.from({ length: sparkleCount }).map((_, i) => ({
            id: i,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 2}s`,
            tx: `${(Math.random() - 0.5) * 40}px`,
            ty: `${(Math.random() - 0.5) * 40}px`,
            scale: 0.5 + Math.random() * 0.8,
        }));
    }, [sparkleCount]);

    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none overflow-hidden">
            {/* Central Aura */}
            <div
                className="absolute rounded-full bg-white/5 blur-[60px] animate-pulse"
                style={{ width: size, height: size }}
            />

            {/* Scanning Line */}
            <div
                className="absolute h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer-scan"
                style={{ width: size + 40 }}
            />

            {/* Sparkle Field */}
            <div
                className="relative"
                style={{ width: size, height: size }}
            >
                {sparkles.map((s) => (
                    <div
                        key={s.id}
                        className="absolute text-white animate-sparkle"
                        style={{
                            top: s.top,
                            left: s.left,
                            animationDelay: s.delay,
                            ['--tx' as any]: s.tx,
                            ['--ty' as any]: s.ty,
                            ['--scale' as any]: s.scale,
                        }}
                    >
                        <Sparkles className="w-4 h-4 fill-white/20" />
                    </div>
                ))}

                {/* Ambient Static Sparkles */}
                <span className="absolute top-4 left-10 text-white/40 text-xl animate-pulse">✦</span>
                <span className="absolute bottom-10 right-12 text-white/60 text-sm animate-pulse delay-700">✦</span>
                <span className="absolute top-1/2 right-4 text-white text-lg animate-pulse delay-300">✦</span>
                <span className="absolute bottom-1/4 left-6 text-white/30 text-xs animate-pulse delay-500">✦</span>
            </div>
        </div>
    );
};

export default React.memo(AISparkleOverlay);
