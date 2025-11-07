// 📄 Project Detail Page
// This page showcases a single project in detail, now with full inline editing capabilities.

import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import { useEditor } from '../components/EditorProvider';
import Editable from '../components/Editable';

// Define YT types for the global window object to avoid TS errors
declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

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
        // Not a valid URL
        return null;
    }
};

const YOUTUBE_API_SRC = 'https://www.youtube.com/iframe_api';


// --- Video Player Component ---
const VideoPlayer = ({ src }: { src: string }) => {
    const [isPlaying, setIsPlaying] = useState(true);
    const [playbackError, setPlaybackError] = useState(false);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const playerInstanceRef = useRef<any>(null); // To hold the YT.Player instance

    const isYouTube = src.includes('youtube.com') || src.includes('youtu.be');
    const videoId = isYouTube ? getYouTubeVideoId(src) : null;
    
    useEffect(() => {
        if (!isYouTube || !videoId || !playerContainerRef.current) return;
        
        const container = playerContainerRef.current;
        // The API replaces the div, so we need a stable reference
        if (container.childElementCount > 0) return;

        const createPlayer = () => {
             if (playerInstanceRef.current) {
                playerInstanceRef.current.destroy();
            }
            playerInstanceRef.current = new window.YT.Player(container, {
                videoId: videoId,
                playerVars: {
                    autoplay: 1,
                    mute: 1,
                    loop: 1,
                    playlist: videoId,
                    controls: 1,
                    modestbranding: 1,
                    rel: 0,
                },
                events: {
                    'onError': (event: any) => {
                        // Error 101, 150, 153 all indicate embedding is disabled
                        if ([101, 150, 153].includes(event.data)) {
                             setPlaybackError(true);
                        }
                    },
                    'onStateChange': (event: any) => {
                        setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
                    }
                }
            });
        };

        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = YOUTUBE_API_SRC;
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode!.insertBefore(tag, firstScriptTag);
            window.onYouTubeIframeAPIReady = createPlayer;
        } else {
             createPlayer();
        }

        return () => {
            if (playerInstanceRef.current) {
                playerInstanceRef.current.destroy();
                playerInstanceRef.current = null;
            }
        };

    }, [isYouTube, videoId]);


    if (playbackError && videoId) {
        return (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden group flex flex-col items-center justify-center text-center p-4">
                <img 
                    src={`https://i3.ytimg.com/vi/${videoId}/maxresdefault.jpg`} 
                    alt="Video thumbnail"
                    className="absolute inset-0 w-full h-full object-cover opacity-30" 
                />
                <div className="relative z-10">
                    <h3 className="text-xl font-bold text-white mb-2">Playback Unavailable</h3>
                    <p className="text-neutral-300 mb-4 text-sm max-w-sm">This video can't be played here due to restrictions set by YouTube or the content owner.</p>
                    <a 
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-block mt-4 px-5 py-2 bg-red-600 text-white font-bold text-sm tracking-wider uppercase rounded-md hover:bg-red-500 transition-all duration-300"
                    >
                        Watch on YouTube <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </a>
                </div>
            </div>
        );
    }

    if (isYouTube) {
        return (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
                <div ref={playerContainerRef} className="w-full h-full" />
            </div>
        );
    }
    
    return (
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
            <video
                key={src}
                className={`w-full h-full object-contain transition-all duration-500 ${!isPlaying ? 'grayscale scale-105' : 'grayscale-0'}`}
                controls loop muted playsInline autoPlay
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            >
                <source src={src} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        </div>
    );
};


function ProjectDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const { siteContent } = useEditor();
    
    const projectIndex = siteContent?.projects.findIndex(p => p.id === slug);
    const project = projectIndex !== -1 ? siteContent?.projects[projectIndex!] : undefined;

    if (!project) {
        return <Navigate to="/portfolio" replace />;
    }

    const hasMedia = project.video || project.images.length > 0;
    const basePath = `projects[${projectIndex}]`;

    const MainMedia = () => {
        if (project.video) {
            return (
                <Editable path={`${basePath}.video`} type="media">
                    <VideoPlayer src={project.video} />
                </Editable>
            );
        }
        if (project.thumbnail) {
            return (
                <Editable path={`${basePath}.thumbnail`} type="media">
                     <div className="relative aspect-video bg-neutral-900 rounded-lg overflow-hidden">
                        <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover" />
                     </div>
                </Editable>
            );
        }
        // Fallback for when there's no video or thumbnail
        return (
             <Editable path={`${basePath}.thumbnail`} type="media">
                 <div className="relative aspect-video bg-neutral-900 rounded-lg overflow-hidden flex items-center justify-center">
                    <p className="text-neutral-500">No media found. Add a thumbnail or video URL in Edit Mode.</p>
                 </div>
            </Editable>
        );
    };

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

                    <motion.div className="mb-12" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}>
                       <MainMedia />
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
                                                <img src={image} alt={`Project image ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
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