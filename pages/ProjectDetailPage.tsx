// 📄 Project Detail Page
// This page showcases a single project in detail, now with full inline editing capabilities.

import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import { useEditor } from '../components/EditorProvider';
import Editable from '../components/Editable';

// --- Helper to convert YouTube watch URL to embed URL ---
const getYouTubeEmbedUrl = (url: string) => {
    try {
        const urlObj = new URL(url);
        let videoId: string | null = null;
        if (urlObj.hostname.includes('youtube.com')) {
            videoId = urlObj.searchParams.get('v');
        } else if (urlObj.hostname.includes('youtu.be')) {
            videoId = urlObj.pathname.slice(1);
        }
        
        if (videoId) {
            // Add autoplay, mute, and loop parameters for a seamless viewing experience
            const embedParams = new URLSearchParams();
            embedParams.set('autoplay', '1');
            embedParams.set('mute', '1'); // Autoplay on most browsers requires the video to be muted
            embedParams.set('loop', '1');
            embedParams.set('playlist', videoId); // Loop for a single video requires the playlist parameter
            return `https://www.youtube.com/embed/${videoId}?${embedParams.toString()}`;
        }
    } catch (e) {
      // Not a valid URL, return original
    }
    return url;
};


// --- Video Player Component ---
const VideoPlayer = ({ src }: { src: string }) => {
    // Start in a playing state for autoplay
    const [isPlaying, setIsPlaying] = useState(true); 
    const isYouTube = src.includes('youtube.com') || src.includes('youtu.be');
    const embedUrl = isYouTube ? getYouTubeEmbedUrl(src) : src;

    if (isYouTube) {
        return (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
                <iframe
                    src={embedUrl}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                    title="Project Video"
                ></iframe>
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