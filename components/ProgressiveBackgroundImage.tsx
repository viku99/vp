import React, { useState, useEffect } from 'react';

const getLqipUrl = (src: string): string => {
    if (!src) return '';
    if (src.includes('picsum.photos')) {
        try {
            const url = new URL(src);
            const parts = url.pathname.split('/');
            if (parts.length >= 4) { // e.g. /seed/name/w/h
                const width = parseInt(parts[parts.length - 2], 10);
                const height = parseInt(parts[parts.length - 1], 10);
                if (!isNaN(width) && !isNaN(height)) {
                    parts[parts.length - 2] = Math.round(width / 50).toString();
                    parts[parts.length - 1] = Math.round(height / 50).toString();
                    url.pathname = parts.join('/');
                    return url.toString();
                }
            }
        } catch (e) { /* Invalid URL, fallback to original */ }
    }
    return src;
};

interface ProgressiveBackgroundImageProps {
    src: string;
    className?: string;
    children?: React.ReactNode;
}

const ProgressiveBackgroundImage: React.FC<ProgressiveBackgroundImageProps> = ({ src, className, children }) => {
    const [currentSrc, setCurrentSrc] = useState(getLqipUrl(src));

    useEffect(() => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            setCurrentSrc(src);
        };
    }, [src]);

    const isLoaded = currentSrc === src;

    return (
        <div
            className={`${className} bg-cover bg-center transition-all duration-1000`}
            style={{ 
                backgroundImage: `url(${currentSrc})`,
                filter: isLoaded ? 'blur(0px)' : 'blur(20px)',
                transform: isLoaded ? 'scale(1)' : 'scale(1.05)',
            }}
        >
            {children}
        </div>
    );
};

export default ProgressiveBackgroundImage;