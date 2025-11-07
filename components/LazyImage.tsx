import React, { useState, useEffect, useRef } from 'react';

// Helper to generate a low-quality placeholder URL from various image services
const getLqipUrl = (src: string): string => {
    if (!src) return '';
    if (src.includes('picsum.photos')) {
        // Example: https://picsum.photos/seed/aurora-thumb/800/600 -> https://picsum.photos/seed/aurora-thumb/40/30
        try {
            const url = new URL(src);
            const parts = url.pathname.split('/');
            if (parts.length >= 2) {
                const width = parseInt(parts[parts.length - 2], 10);
                const height = parseInt(parts[parts.length - 1], 10);
                if (!isNaN(width) && !isNaN(height)) {
                    parts[parts.length - 2] = '40';
                    parts[parts.length - 1] = Math.round(40 * (height / width)).toString();
                    url.pathname = parts.join('/');
                    return url.toString();
                }
            }
        } catch (e) { /* Invalid URL, fallback */ }
    }
    if (src.includes('i.pravatar.cc')) {
         // Example: https://i.pravatar.cc/150?u=jane -> https://i.pravatar.cc/20?u=jane
         try {
            const url = new URL(src);
            const parts = url.pathname.split('/');
            parts[parts.length - 1] = '20';
            url.pathname = parts.join('/');
            return url.toString();
         } catch(e) { /* Invalid URL, fallback */ }
    }
    // For other URLs, we can't easily generate a placeholder, so we return an empty string to avoid loading the large image twice
    return ''; 
};


interface LazyImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
}

const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className, ...props }) => {
    const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let observer: IntersectionObserver;
        const currentRef = containerRef.current;

        if (currentRef) {
            observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setImageSrc(src);
                        observer.unobserve(currentRef);
                    }
                },
                { rootMargin: '200px' } 
            );
            observer.observe(currentRef);
        }

        return () => {
            if (observer && currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [src]);
    
    // Generate a placeholder. If one can't be generated, it will be empty.
    const placeholderSrc = getLqipUrl(src);

    return (
        <div ref={containerRef} className={`relative bg-neutral-900 overflow-hidden ${className}`}>
            {/* Low-res, blurred background image. Only shown if a placeholder can be generated. */}
            {placeholderSrc && (
                <img
                    src={placeholderSrc}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover filter blur-lg scale-105"
                />
            )}
            {/* High-res image that fades in */}
            <img
                src={imageSrc}
                alt={alt}
                loading="lazy" // Native lazy loading as a fallback
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out opacity-0"
                onLoad={(e) => {
                    // Check if the loaded source is the high-res one before fading in
                    if (e.currentTarget.src === src) {
                        e.currentTarget.style.opacity = '1';
                    }
                }}
                {...props}
            />
        </div>
    );
};

export default LazyImage;
