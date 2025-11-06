import React, { createContext, useState, useEffect, useCallback, useContext, ReactNode } from 'react';
import { SiteContent } from '../types';
import { produce } from 'immer';

// --- Hardcoded Credentials ---
const ADMIN_USERNAME = 'admin$19';
const ADMIN_PASSWORD = '19$admin';

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
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};


// --- Media Modal State ---
interface MediaModalState {
    isVisible: boolean;
    path: string | null;
}

// --- Context Definition ---
interface EditorContextType {
    isLoading: boolean;
    isEditMode: boolean;
    isAuthenticated: boolean;
    isLoginVisible: boolean;
    setIsLoginVisible: (visible: boolean) => void;
    login: (username: string, password: string) => Promise<boolean>;
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
    const [siteContent, setSiteContent] = useState<SiteContent | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoginVisible, setIsLoginVisible] = useState(false);
    const [mediaModalState, setMediaModalState] = useState<MediaModalState>({ isVisible: false, path: null });


    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Check for a draft in local storage first
            const draftContent = localStorage.getItem(DRAFT_CONTENT_KEY);
            if (draftContent) {
                setSiteContent(JSON.parse(draftContent));
            } else {
                // Fetch the original content if no draft exists
                const response = await fetch('./data/content.json');
                if (!response.ok) throw new Error('Network response was not ok.');
                const data = await response.json();
                setSiteContent(data);
            }
        } catch (error) {
            console.error("Failed to load portfolio data:", error);
            // Handle error state, maybe set siteContent to an error object
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

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
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            setIsEditMode(true);
            setIsLoginVisible(false);
            return true;
        }
        return false;
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
            loadData(); // Reload from original file
        }
    }, [loadData]);

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