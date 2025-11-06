import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor } from './EditorProvider';

const EditorToolbar = () => {
    const { isEditMode, publishContent, resetContent, logout } = useEditor();

    return (
        <AnimatePresence>
            {isEditMode && (
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[101] p-2 bg-black/30 backdrop-blur-lg border border-neutral-700 rounded-xl shadow-2xl flex items-center gap-2"
                >
                    <div className="flex items-center gap-2 pr-2">
                         <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                        <span className="text-sm font-bold text-white">Editing Mode</span>
                    </div>

                    <button
                        onClick={publishContent}
                        className="px-4 py-2 text-sm font-bold text-black bg-white rounded-md hover:bg-neutral-200 transition-colors"
                        title="Publish (Cmd/Ctrl + S)"
                    >
                        Publish
                    </button>
                    <button
                        onClick={resetContent}
                        className="px-4 py-2 text-sm font-bold text-neutral-300 bg-neutral-800 rounded-md hover:bg-neutral-700 transition-colors"
                    >
                        Discard
                    </button>
                     <button
                        onClick={logout}
                        className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-md hover:bg-red-500 transition-colors"
                    >
                        Logout
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default EditorToolbar;
