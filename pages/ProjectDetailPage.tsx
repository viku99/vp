// 📄 Project Detail Page
// This page showcases a single project in detail, now with full inline editing capabilities.

import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import { useEditor } from '../components/EditorProvider';
import Editable from '../components/Editable';
import LazyImage from '../components/LazyImage';

// Define YT types for the global window object to avoid TS errors
declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

// --- Icons ---
const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6.002l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367 2.684z" />
    </svg>
);
const TwitterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616v.064c0 2.298 1.634 4.218 3.803 4.654-.665.18-1.37.226-2.093.123.616 1.956 2.408 3.382 4.533 3.424-1.78 1.396-4.035 2.226-6.49 2.226-.424 0-.84-.025-1.25-.074 2.298 1.474 5.043 2.338 8.016 2.338 9.617 0 14.897-7.977 14.897-14.897 0-.226-.005-.452-.015-.678.96-.69 1.798-1.56 2.457-2.54z" /></svg>
);
const LinkedInIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
);
const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
);
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
);

// --- Helper to get video ID from various YouTube URL formats ---
const getYouTubeVideoId = (url: string): string | null => {
    try {
        const urlObj = new URL(url);
        let videoId: string | null = null;
        
        const hostname = urlObj.hostname;
        const pathname = urlObj.pathname;

        if (hostname.includes('youtube.com')) {
            if (pathname.startsWith('/shorts/')) {
                videoId = pathname.split('/')[2];
            } else {
                videoId = urlObj.searchParams.get('v');
            }
        } else if (hostname.includes('youtu.be')) {
            videoId = pathname.slice(1);
        }
        
        if (videoId) {
            // Clean any potential query params from the video ID
            return videoId.split('?')[0];
        }
        return null;
    } catch (e) {
        return null;
    }
};

const YOUTUBE_API_SRC = 'https://www.youtube.com/iframe_api';

// --- Floating Video Player Component ---
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" /></svg>
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" /></svg>
const MiniPlayerCloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
const ExpandIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 20.25v-4.5m0 4.5h-4.5m4.5 0L15 15" /></svg>

const FloatingVideoPlayer: React.FC<{ src: string }> = ({ src }) => {
    const [isMini, setIsMini] = useState(false);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isClosed, setIsClosed] = useState(false);
    const [playbackError, setPlaybackError] = useState(false);
    const [shouldScroll, setShouldScroll] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const playerDivRef = useRef<HTMLDivElement>(null);
    const playerInstanceRef = useRef<any>(null);

    const isYouTube = src.includes('youtube.com') || src.includes('youtu.be');
    const videoId = isYouTube ? getYouTubeVideoId(src) : null;

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!playerInstanceRef.current && isYouTube) return;
    
                if (entry.isIntersecting) {
                    // Player is back in view, so restore it.
                    setIsMini(false);
                    setIsClosed(false);
                } else {
                    // Player is out of view.
                    // Activate mini-player only if it hasn't been manually closed.
                    if (!isClosed) {
                        setIsMini(true);
                    }
                }
            },
            { threshold: 0.5 }
        );
        
        const currentContainer = containerRef.current;
        if (currentContainer) {
            observer.observe(currentContainer);
        }
    
        return () => {
            if (currentContainer) {
                observer.unobserve(currentContainer);
            }
        };
    }, [isClosed, isYouTube]);

    useEffect(() => {
        if (!isYouTube || !videoId || !playerDivRef.current) return;
        
        const createPlayer = () => {
            if (playerInstanceRef.current) playerInstanceRef.current.destroy();
            playerInstanceRef.current = new window.YT.Player(playerDivRef.current, {
                videoId: videoId,
                playerVars: { autoplay: 1, mute: 1, loop: 1, playlist: videoId, controls: 1, modestbranding: 1, rel: 0 },
                events: {
                    'onReady': (event: any) => {
                        setIsPlaying(true);
                        // Disable native Picture-in-Picture to avoid conflicts with the custom mini-player
                        const iframe = event.target.getIframe();
                        if (iframe) {
                            iframe.setAttribute('disablepictureinpicture', 'true');
                        }
                    },
                    'onError': (e: any) => { if ([101, 150].includes(e.data)) setPlaybackError(true); },
                    'onStateChange': (e: any) => setIsPlaying(e.data === window.YT.PlayerState.PLAYING)
                }
            });
        };
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = YOUTUBE_API_SRC;
            document.body.appendChild(tag);
            window.onYouTubeIframeAPIReady = createPlayer;
        } else {
            createPlayer();
        }
        return () => {
            if (playerInstanceRef.current) playerInstanceRef.current.destroy();
            if (window.onYouTubeIframeAPIReady) window.onYouTubeIframeAPIReady = () => {};
        };
    }, [isYouTube, videoId]);
    
    useEffect(() => {
        if (shouldScroll) {
            containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setShouldScroll(false);
        }
    }, [shouldScroll]);

    const handlePlayPause = () => {
        if (!playerInstanceRef.current) return;
        const player = playerInstanceRef.current;
        if (isPlaying) {
            isYouTube ? player.pauseVideo() : player.pause();
        } else {
            isYouTube ? player.playVideo() : player.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleClose = () => {
        if (playerInstanceRef.current && isPlaying) {
            if (isYouTube) {
                playerInstanceRef.current.pauseVideo();
            } else {
                playerInstanceRef.current.pause();
            }
            setIsPlaying(false);
        }
        setIsClosed(true);
    };

    const handleExpand = () => {
        setIsMini(false);
        setShouldScroll(true);
    };

    if (playbackError && videoId) {
        return (
            <div className="relative aspect-video bg-black rounded-lg group flex flex-col items-center justify-center text-center p-4">
                <img src={`https://i3.ytimg.com/vi/${videoId}/maxresdefault.jpg`} alt="Video thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                <div className="relative z-10">
                    <h3 className="text-xl font-bold text-white mb-2">Playback Unavailable</h3>
                    <p className="text-neutral-300 mb-4 text-sm max-w-sm">This video can't be embedded. Please watch it directly on YouTube.</p>
                    <a href={src} target="_blank" rel="noopener noreferrer" className="group inline-block mt-4 px-5 py-2 bg-red-600 text-white font-bold text-sm tracking-wider uppercase rounded-md hover:bg-red-500 transition-all duration-300">
                        Watch on YouTube <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </a>
                </div>
            </div>
        );
    }
    
    return (
        <div ref={containerRef} className="relative aspect-video w-full h-full bg-black rounded-lg overflow-hidden">
             <AnimatePresence>
                {!isClosed && (
                    <motion.div
                        layout
                        className={`${isMini ? "fixed bottom-4 right-4 w-64 md:w-80 h-auto z-[101] rounded-lg overflow-hidden shadow-2xl bg-black" : "absolute inset-0 w-full h-full"}`}
                        drag={isMini}
                        dragConstraints={{ top: 16, left: 16, right: window.innerWidth - (window.innerWidth > 768 ? 320 : 256) - 16, bottom: window.innerHeight - 144 - 16 }}
                        dragMomentum={false}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    >
                        <div className={`relative w-full h-full aspect-video transition-all duration-300 ease-in-out ${!isPlaying ? 'grayscale scale-105' : 'grayscale-0 scale-100'}`}>
                            {isYouTube ? (
                                <div ref={playerDivRef} className="w-full h-full" />
                            ) : (
                                <video ref={playerInstanceRef} key={src} className="w-full h-full object-contain" controls loop muted playsInline autoPlay onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} disablePictureInPicture>
                                    <source src={src} type="video/mp4" />
                                </video>
                            )}
                            {isMini && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 text-white">
                                    <button onClick={handleExpand} title="Expand" className="p-2 rounded-full hover:bg-white/20"><ExpandIcon /></button>
                                    <button onClick={handlePlayPause} title={isPlaying ? "Pause" : "Play"} className="p-2 rounded-full hover:bg-white/20">{isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
                                    <button onClick={handleClose} title="Close" className="p-2 rounded-full hover:bg-white/20"><MiniPlayerCloseIcon /></button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

function ProjectDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const { siteContent } = useEditor();
    
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const shareMenuRef = useRef<HTMLDivElement>(null);

    const projectIndex = siteContent?.projects.findIndex(p => p.id === slug);
    const project = projectIndex !== -1 ? siteContent?.projects[projectIndex!] : undefined;
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // FIX: Corrected typo from `shareMenuref` to `shareMenuRef`.
            if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
                setIsShareOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!project) {
        return <Navigate to="/portfolio" replace />;
    }
    
    const handleCopyLink = () => {
        if (!isCopied) {
            navigator.clipboard.writeText(window.location.href).then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            });
        }
    };

    const hasMedia = project.video || project.images.length > 0;
    const basePath = `projects[${projectIndex}]`;

    const MainMedia = () => {
        if (project.video) {
            return (
                <Editable path={`${basePath}.video`} type="media">
                    <FloatingVideoPlayer src={project.video} />
                </Editable>
            );
        }
        if (project.thumbnail) {
            return (
                <Editable path={`${basePath}.thumbnail`} type="media">
                     <LazyImage 
                        src={project.thumbnail} 
                        alt={project.title} 
                        className="aspect-video bg-neutral-900 rounded-lg"
                    />
                </Editable>
            );
        }
        return (
             <Editable path={`${basePath}.thumbnail`} type="media">
                 <div className="relative aspect-video bg-neutral-900 rounded-lg flex items-center justify-center">
                    <p className="text-neutral-500">No media found. Add a thumbnail or video URL in Edit Mode.</p>
                 </div>
            </Editable>
        );
    };

    const pageUrl = window.location.href;
    const shareText = `Check out "${project.title}" from Vikas's portfolio:`;
    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`;
    const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;

    return (
        <AnimatedPage>
            <div className="min-h-screen p-4 md:p-8 pt-24 md:pt-8 text-white">
                <div className="container mx-auto max-w-6xl">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.8 }} className="mb-8">
                        <Link to="/portfolio" className="group text-neutral-400 hover:text-white transition-colors duration-300 inline-flex items-center">
                            <span className="inline-block transition-transform duration-300 group-hover:-translate-x-1 mr-2">←</span> Back to Portfolio
                        </Link>
                    </motion.div>

                    <motion.header initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }} className="mb-8 text-center">
                        <Editable as="h1" path={`${basePath}.title`} className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-2" />
                        <p className="text-lg text-neutral-400">
                            <Editable path={`${basePath}.category`} as="span" /> &bull; <Editable path={`${basePath}.year`} as="span" />
                        </p>
                    </motion.header>

                    <motion.div className="mb-6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}>
                       <MainMedia />
                    </motion.div>

                    <motion.div
                        className="mb-12 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                    >
                        <div className="relative inline-block text-left" ref={shareMenuRef}>
                            <div>
                                <motion.button
                                    onClick={() => setIsShareOpen(!isShareOpen)}
                                    type="button"
                                    className="inline-flex items-center justify-center px-4 py-2 border border-neutral-700 text-sm font-medium rounded-md text-neutral-300 bg-neutral-800/50 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-blue-500 transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <ShareIcon />
                                    Share
                                </motion.button>
                            </div>
                            <AnimatePresence>
                                {isShareOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        transition={{ duration: 0.15 }}
                                        style={{ originX: 0.5, originY: 0 }}
                                        className="origin-top absolute left-1/2 -translate-x-1/2 mt-2 w-56 rounded-md shadow-lg bg-neutral-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                                    >
                                        <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                            <a href={twitterShareUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700 hover:text-white w-full text-left transition-colors" role="menuitem">
                                                <TwitterIcon /> Share on Twitter
                                            </a>
                                            <a href={linkedInShareUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700 hover:text-white w-full text-left transition-colors" role="menuitem">
                                                <LinkedInIcon /> Share on LinkedIn
                                            </a>
                                            <button onClick={handleCopyLink} className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700 hover:text-white w-full text-left transition-colors" role="menuitem">
                                                {isCopied ? <CheckIcon /> : <CopyIcon />}
                                                {isCopied ? 'Copied!' : 'Copy Link'}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
                        <motion.div className="lg:col-span-1" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.4 }}>
                            <h2 className="text-2xl font-bold uppercase tracking-wider mb-4">About the Project</h2>
                            <Editable path={`${basePath}.description`} as="p" className="text-neutral-300 leading-relaxed mb-8" multiline />
                            
                            <h3 className="text-xl font-bold uppercase tracking-wider mb-4">Tools Used</h3>
                            <div className="flex flex-wrap gap-2">
                                <Editable
                                    path={`${basePath}.tools`}
                                    multiline
                                    label="Tools (comma separated)"
                                    render={(tools: string[]) => tools.map(tool => (
                                        <span key={tool} className="bg-neutral-800 text-neutral-300 px-3 py-1 text-sm font-medium rounded-full">
                                            {tool}
                                        </span>
                                    ))}
                                />
                            </div>
                        </motion.div>

                        {hasMedia && project.images.length > 0 && (
                            <motion.div className="lg:col-span-2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.5 }}>
                                <h2 className="text-2xl font-bold uppercase tracking-wider mb-4">Gallery</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {project.images.map((image, index) => (
                                        <Editable
                                            key={image + index}
                                            path={`${basePath}.images[${index}]`}
                                            type="media"
                                        >
                                            <motion.div className="group relative aspect-video overflow-hidden rounded-lg" whileHover={{ scale: 1.03 }} transition={{ type: 'spring', stiffness: 300 }}>
                                                <LazyImage 
                                                    src={image} 
                                                    alt={`Project image ${index + 1}`} 
                                                    className="w-full h-full" 
                                                />
                                            </motion.div>
                                        </Editable>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </AnimatedPage>
    );
}

export default ProjectDetailPage;
