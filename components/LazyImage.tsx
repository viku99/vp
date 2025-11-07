import React, { useState } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className, ...props }) => {
    const [isLoading, setLoading] = useState(true);

    return (
        <div className={cn("relative overflow-hidden bg-neutral-800", className)}>
            <img
                src={src}
                alt={alt}
                className={cn(
                    'object-cover w-full h-full transition-all duration-700 ease-in-out',
                    isLoading ? 'scale-105 blur-lg grayscale opacity-50' : 'scale-100 blur-0 grayscale-0 opacity-100'
                )}
                onLoad={() => setLoading(false)}
                loading="lazy"
                {...props}
            />
        </div>
    );
};

export default LazyImage;