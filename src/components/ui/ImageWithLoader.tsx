import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ImageWithLoaderProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    containerClassName?: string;
}

export const ImageWithLoader = ({
    src,
    alt,
    className,
    containerClassName,
    ...props
}: ImageWithLoaderProps) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    return (
        <div className={cn("relative overflow-hidden bg-muted", containerClassName, className)}>
            {!loaded && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10 animate-pulse">
                    {/* Optional: Add a small spinner here if desired, or just use the skeleton pulse */}
                    <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                </div>
            )}
            <img
                src={src}
                alt={alt}
                className={cn(
                    "w-full h-full object-cover transition-opacity duration-300",
                    loaded ? "opacity-100" : "opacity-0",
                    className
                )}
                onLoad={() => setLoaded(true)}
                onError={() => {
                    setError(true);
                    setLoaded(true);
                }}
                {...props}
            />
        </div>
    );
};
