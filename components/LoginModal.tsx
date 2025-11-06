import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor } from './EditorProvider';

const SpinnerIcon = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


function LoginModal() {
    const { isLoginVisible, setIsLoginVisible, login } = useEditor();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const usernameRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isLoginVisible) {
            // Focus the username input when the modal opens
            setTimeout(() => usernameRef.current?.focus(), 100);
        } else {
            // Reset state when modal closes
            setUsername('');
            setPassword('');
            setError('');
            setIsLoading(false);
        }
    }, [isLoginVisible]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const success = await login(username, password);
            if (!success) {
                setError('Invalid username or password.');
            }
        } catch (e) {
            setError('An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isLoginVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[102] flex items-center justify-center p-4"
                    onClick={() => setIsLoginVisible(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl w-full max-w-sm p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold text-white mb-2 text-center">Editor Access</h2>
                        <p className="text-sm text-neutral-400 mb-6 text-center">Login to manage site content.</p>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <input
                                    ref={usernameRef}
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="w-full bg-transparent border-b border-neutral-700 focus:border-white outline-none py-3 transition-colors duration-300 text-white placeholder-neutral-500"
                                />
                            </div>
                            <div>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="w-full bg-transparent border-b border-neutral-700 focus:border-white outline-none py-3 transition-colors duration-300 text-white placeholder-neutral-500"
                                />
                            </div>

                             <AnimatePresence>
                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-xs text-red-500 text-center"
                                    >
                                        {error}
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            <div className="pt-2">
                                <motion.button
                                    type="submit"
                                    className="group w-full flex items-center justify-center mt-4 px-6 py-3 border border-white text-white uppercase text-sm tracking-widest hover:bg-white hover:text-black transition-all duration-300 disabled:bg-neutral-700 disabled:cursor-not-allowed"
                                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <SpinnerIcon /> : 'Login'}
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default LoginModal;
