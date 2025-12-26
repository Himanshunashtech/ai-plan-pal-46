import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface WheelPickerProps {
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
    className?: string;
    itemHeight?: number;
    visibleItems?: number;
}

export const WheelPicker: React.FC<WheelPickerProps> = ({
    value,
    min,
    max,
    step = 1,
    onChange,
    className,
    itemHeight = 80,
    visibleItems = 5,
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isScrolling, setIsScrolling] = useState(false);
    const [scrollTop, setScrollTop] = useState(0);

    const options = React.useMemo(() => {
        const opts = [];
        for (let i = min; i <= max; i += step) {
            opts.push(i);
        }
        return opts;
    }, [min, max, step]);

    const centerIndex = Math.floor(visibleItems / 2);
    const containerHeight = itemHeight * visibleItems;

    useEffect(() => {
        if (scrollRef.current && !isScrolling) {
            const index = options.indexOf(value);
            if (index !== -1) {
                scrollRef.current.scrollTop = index * itemHeight;
            }
        }
    }, [value, options, itemHeight, isScrolling]);

    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return;

        setIsScrolling(true);
        const st = scrollRef.current.scrollTop;
        setScrollTop(st);
        const index = Math.round(st / itemHeight);

        if (options[index] !== undefined && options[index] !== value) {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(10);
            }
            onChange(options[index]);
        }
    }, [options, itemHeight, onChange, value]);

    const onScrollEnd = useCallback(() => {
        setIsScrolling(false);
        if (!scrollRef.current) return;

        const index = Math.round(scrollRef.current.scrollTop / itemHeight);
        scrollRef.current.scrollTo({
            top: index * itemHeight,
            behavior: 'smooth'
        });
    }, [itemHeight]);

    useEffect(() => {
        const scrollEl = scrollRef.current;
        let timeout: NodeJS.Timeout;

        const handleScrollWithTimeout = () => {
            handleScroll();
            clearTimeout(timeout);
            timeout = setTimeout(onScrollEnd, 150);
        };

        if (scrollEl) {
            scrollEl.addEventListener('scroll', handleScrollWithTimeout);
        }
        return () => {
            if (scrollEl) {
                scrollEl.removeEventListener('scroll', handleScrollWithTimeout);
            }
            clearTimeout(timeout);
        };
    }, [handleScroll, onScrollEnd]);

    return (
        <div
            className={cn(
                "relative overflow-hidden flex flex-col items-center justify-center perspective-1000",
                className
            )}
            style={{ height: containerHeight }}
        >
            {/* Selection Highlight */}
            <div
                className="absolute left-0 right-0 z-10 pointer-events-none transition-all duration-300"
                style={{
                    height: itemHeight,
                    top: centerIndex * itemHeight,
                    background: 'linear-gradient(90deg, transparent 0%, hsl(var(--primary)/0.05) 50%, transparent 100%)',
                    borderTop: '1px solid hsl(var(--primary)/0.1)',
                    borderBottom: '1px solid hsl(var(--primary)/0.1)',
                }}
            />

            {/* Fading Gradients */}
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-background via-background/80 to-transparent pointer-events-none z-20" />
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-20" />

            {/* Scrollable Area with 3D Perspective */}
            <div
                ref={scrollRef}
                className="w-full overflow-y-auto scrollbar-none snap-y snap-mandatory relative"
                style={{
                    paddingTop: centerIndex * itemHeight,
                    paddingBottom: centerIndex * itemHeight,
                    height: containerHeight,
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
            >
                <div className="flex flex-col items-center py-4">
                    {options.map((opt, i) => {
                        const distance = (scrollTop - (i * itemHeight)) / itemHeight;
                        const absDistance = Math.abs(distance);

                        // 3D Effect Calculations
                        const rotation = distance * -22;
                        const opacity = Math.max(0.1, 1 - (absDistance * 0.3));

                        // Smoother scaling dampening: quadratic falloff for 5x scale
                        // This prevents the "jitter" by making the size change less aggressive over distance
                        const scale = Math.max(0.7, 5.0 / (1 + absDistance * 3.5));

                        const zIndex = 10 - Math.floor(absDistance);

                        return (
                            <div
                                key={opt}
                                className={cn(
                                    "snap-center flex items-center justify-center w-full preserve-3d will-change-transform transition-all",
                                    value === opt ? "font-black" : "font-semibold"
                                )}
                                style={{
                                    height: itemHeight,
                                    opacity,
                                    transform: `rotateX(${rotation}deg) scale(${scale})`,
                                    zIndex,
                                    transitionDuration: '400ms',
                                    transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)'
                                }}
                            >
                                <span className={cn(
                                    "inline-block tracking-tighter transition-all duration-300",
                                    value === opt ? "text-primary drop-shadow-2xl" : "text-muted-foreground"
                                )}>
                                    {opt}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
