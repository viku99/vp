import React, { createContext, useState, useEffect, useCallback, useContext, ReactNode } from 'react';
import { SiteContent } from '../types';
import { produce } from 'immer';

// --- Local Storage Key ---
const DRAFT_CONTENT_KEY = 'portfolio_content_draft';

// Helper function to trigger a file download
const downloadJson = (data: unknown, filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
        // Applying the user's recommended safe removal pattern to robustly
        // prevent the "removeChild" race condition error. This checks that the link
        // is still a child of the body before attempting to remove it.
        if (document.body.contains(link)) {
            document.body.removeChild(link);
        }
        // Always revoke the object URL to prevent memory leaks.
        URL.revokeObjectURL(url);
    }, 100);
};


// --- Media Modal State ---
interface MediaModalState {
    isVisible: boolean;
    path: string | null;
}

// --- Context Definition ---
interface EditorContextType {
    isLoading: boolean;
    error: string | null;
    isEditMode: boolean;
    isAuthenticated: boolean;
    isLoginVisible: boolean;
    setIsLoginVisible: (visible: boolean) => void;
    login: (username: string, password: string) => Promise<{ success: boolean; message?: string; }>;
    logout: () => void;
    publishContent: () => void;
    resetContent: () => void;
    
    siteContent: SiteContent | null;
    updateSiteContent: (updater: (draft: SiteContent) => void) => void;

    mediaModalState: MediaModalState;
    openMediaModal: (path: string) => void;
    closeMediaModal: () => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const useEditor = () => {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditor must be used within an EditorProvider');
    }
    return context;
};

// --- Provider Component ---
export const EditorProvider = ({ children }: { children: ReactNode }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [siteContent, setSiteContent] = useState<SiteContent | null>(null);
    const [initialContent, setInitialContent] = useState<SiteContent | null>(null); // To hold pristine data
    const [isEditMode, setIsEditMode] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoginVisible, setIsLoginVisible] = useState(false);
    const [mediaModalState, setMediaModalState] = useState<MediaModalState>({ isVisible: false, path: null });


    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch the initial content from the JSON file.
                // Using a relative path './' is more robust for different hosting environments.
                const response = await fetch('./data/content.json');
                if (!response.ok) {
                    throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
                }
                const data: SiteContent = await response.json();
                setInitialContent(data);

                // Check for a draft in local storage first
                const draftContent = localStorage.getItem(DRAFT_CONTENT_KEY);
                if (draftContent) {
                    setSiteContent(JSON.parse(draftContent));
                } else {
                    // If no draft, use the fetched data
                    setSiteContent(data);
                }
            } catch (err: any) {
                console.error("Failed to load portfolio data:", err);
                setError(err.message || "An unknown error occurred while loading site data.");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []); // Runs only once on component mount

    // Auto-save any changes to the site content to localStorage when in edit mode
    useEffect(() => {
        if (!isLoading && siteContent && isEditMode) {
            localStorage.setItem(DRAFT_CONTENT_KEY, JSON.stringify(siteContent));
        }
    }, [siteContent, isLoading, isEditMode]);


    const updateSiteContent = useCallback((updater: (draft: SiteContent) => void) => {
        setSiteContent(currentContent => {
            if (currentContent === null) return null;
            // Use Immer for safe and easy immutable updates
            return produce(currentContent, updater);
        });
    }, []);

    const login = useCallback(async (username, password) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const adminUser = 'viku19';
        const adminPass = '19viku';

        if (!adminUser || !adminPass) {
            console.error("Admin credentials are not set in environment variables.");
            return { success: false, message: "Admin credentials are not configured on the server. Please set environment variables." };
        }

        if (username === adminUser && password === adminPass) {
            setIsAuthenticated(true);
            setIsEditMode(true);
            setIsLoginVisible(false);
            return { success: true };
        }
        return { success: false, message: "Invalid username or password." };
    }, []);
    
    const logout = useCallback(() => {
        setIsAuthenticated(false);
        setIsEditMode(false);
    }, []);
    
    const publishContent = useCallback(() => {
        if (!siteContent) return;
        downloadJson(siteContent, 'content.json');
        alert("✅ Content exported successfully as content.json.\n\nTo make your changes live, replace the old `content.json` file in your project with this new one, then commit and redeploy your site.");
    }, [siteContent]);

    const resetContent = useCallback(() => {
        if (window.confirm("Are you sure you want to discard all unpublished changes? This will revert the content to your last published version.")) {
            localStorage.removeItem(DRAFT_CONTENT_KEY);
            // Reset to the pristine content fetched on load
            setSiteContent(initialContent);
        }
    }, [initialContent]);

    // --- Media Modal Controls ---
    const openMediaModal = (path: string) => setMediaModalState({ isVisible: true, path });
    const closeMediaModal = () => setMediaModalState({ isVisible: false, path: null });
    
    
    // --- Keyboard Shortcuts ---
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Toggle Edit Mode with Ctrl/Cmd + E
            if ((event.metaKey || event.ctrlKey) && event.key === 'e') {
                event.preventDefault();
                if (isAuthenticated) {
                    setIsEditMode(prev => !prev);
                } else {
                    setIsLoginVisible(true);
                }
            }
            // Publish with Ctrl/Cmd + S
            if (isEditMode && (event.metaKey || event.ctrlKey) && event.key === 's') {
                event.preventDefault();
                publishContent();
            }
            // Close modals or exit edit mode with Escape
            if (event.key === 'Escape') {
                if(mediaModalState.isVisible) closeMediaModal();
                else if (isLoginVisible) setIsLoginVisible(false);
                else if (isEditMode) setIsEditMode(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isEditMode, isAuthenticated, isLoginVisible, publishContent, mediaModalState.isVisible]);
    

    const value = {
        isLoading,
        error,
        isEditMode,
        isAuthenticated,
        isLoginVisible,
        setIsLoginVisible,
        login,
        logout,
        publishContent,
        resetContent,
        siteContent,
        updateSiteContent,
        mediaModalState,
        openMediaModal,
        closeMediaModal,
    };

    return (
        <EditorContext.Provider value={value}>
            {children}
        </EditorContext.Provider>
    );
};