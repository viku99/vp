import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor } from './EditorProvider';
import get from 'lodash.get';

const MediaUploadModal = () => {
    const { mediaModalState, closeMediaModal, siteContent, updateSiteContent } = useEditor();
    const { isVisible, path } = mediaModalState;

    const [url, setUrl] = useState('');
    const [activeTab, setActiveTab] = useState('url');
    const [localFile, setLocalFile] = useState<File | null>(null);

    const initialValue = path ? get(siteContent, path, '') : '';

    useEffect(() => {
        if (isVisible) {
            setUrl(initialValue);
            setActiveTab('url');
            setLocalFile(null);
        }
    }, [isVisible, initialValue]);

    const handleSave = () => {
        if (!path) return;
        updateSiteContent(draft => {
            const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
            let current: any = draft;
            while (keys.length > 1) {
                const key = keys.shift()!;
                current = current[key];
            }
            if (keys[0]) {
               current[keys[0]] = url;
            }
        });
        closeMediaModal();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setLocalFile(e.target.files[0]);
        }
    };
    
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[102] flex items-center justify-center p-4"
                    onClick={closeMediaModal}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 w-full max-w-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-bold mb-4">Edit Media</h2>
                        
                        <div className="flex border-b border-neutral-700 mb-4">
                            <button onClick={() => setActiveTab('url')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'url' ? 'border-b-2 border-white text-white' : 'text-neutral-400'}`}>Use a URL</button>
                            <button onClick={() => setActiveTab('upload')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'upload' ? 'border-b-2 border-white text-white' : 'text-neutral-400'}`}>Upload a File</button>
                        </div>

                        {activeTab === 'url' && (
                            <div>
                                <label htmlFor="media-url" className="block text-sm font-medium text-neutral-400 mb-2">
                                    Enter an image or video URL. YouTube links are also supported.
                                </label>
                                <input
                                    id="media-url"
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://... or youtube.com/watch?v=..."
                                    className="w-full bg-neutral-800 border border-neutral-600 rounded-md py-2 px-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        )}
                        
                        {activeTab === 'upload' && (
                             <div>
                                <label htmlFor="media-upload" className="block text-sm font-medium text-neutral-400 mb-2">
                                    Select a file from your computer.
                                </label>
                                <input
                                    id="media-upload"
                                    type="file"
                                    onChange={handleFileChange}
                                    className="w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neutral-700 file:text-white hover:file:bg-neutral-600"
                                />
                                <div className="mt-4 p-4 bg-neutral-800 rounded-md text-sm text-neutral-400">
                                    <h4 className="font-bold text-white mb-2">How this works:</h4>
                                    <ol className="list-decimal list-inside space-y-1">
                                        <li>Select a file from your computer.</li>
                                        <li>Upload it to a hosting service (e.g., Imgur, Cloudinary, or your project's public folder).</li>
                                        <li>Copy the public URL for the file.</li>
                                        <li>Switch to the "Use a URL" tab and paste the link there.</li>
                                    </ol>
                                    <p className="mt-3">This site is static, so files must be hosted online to be viewed by everyone.</p>
                                </div>
                                {localFile && <p className="mt-2 text-xs text-green-400">Selected: {localFile.name}</p>}
                            </div>
                        )}
                        
                        <div className="flex justify-end gap-4 pt-6">
                            <button type="button" onClick={closeMediaModal} className="px-4 py-2 text-sm font-bold text-neutral-300 bg-neutral-700 rounded-md hover:bg-neutral-600 transition-colors">Cancel</button>
                            <button type="button" onClick={handleSave} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors" disabled={activeTab !== 'url'}>
                                Save
                            </button>
                        </div>

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MediaUploadModal;