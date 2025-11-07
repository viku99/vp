import React, { createContext, useState, useEffect, useCallback, useContext, ReactNode } from 'react';
import { SiteContent } from '../types';
import { produce } from 'immer';

const DRAFT_CONTENT_KEY = 'portfolio_content_draft';

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
        if (document.body.contains(link)) document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
};

interface MediaModalState { isVisible: boolean; path: string | null; }
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
    if (!context) throw new Error('useEditor must be used within an EditorProvider');
    return context;
};

interface EditorProviderProps {
    children: ReactNode;
    initialContent: SiteContent;
}

export const EditorProvider = ({ children, initialContent: serverInitialContent }: EditorProviderProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [siteContent, setSiteContent] = useState<SiteContent | null>(null);
    const [initialContent, setInitialContent] = useState<SiteContent | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoginVisible, setIsLoginVisible] = useState(false);
    const [mediaModalState, setMediaModalState] = useState<MediaModalState>({ isVisible: false, path: null });

    useEffect(() => {
        setIsLoading(true);
        setError(null);
        try {
            setInitialContent(serverInitialContent);
            const draftContent = localStorage.getItem(DRAFT_CONTENT_KEY);
            setSiteContent(draftContent ? JSON.parse(draftContent) : serverInitialContent);
        } catch (err: any) {
            setError(err.message || "An unknown error occurred while loading site data.");
        } finally {
            setIsLoading(false);
        }
    }, [serverInitialContent]);

    useEffect(() => {
        if (!isLoading && siteContent && isEditMode) {
            localStorage.setItem(DRAFT_CONTENT_KEY, JSON.stringify(siteContent));
        }
    }, [siteContent, isLoading, isEditMode]);

    const updateSiteContent = useCallback((updater: (draft: SiteContent) => void) => {
        setSiteContent(currentContent => currentContent ? produce(currentContent, updater) : null);
    }, []);

    const login = useCallback(async (username, password) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (username === 'viku19' && password === '19viku') {
            setIsAuthenticated(true);
            setIsEditMode(true);
            setIsLoginVisible(false);
            return { success: true };
        }
        return { success: false, message: "Invalid username or password." };
    }, []);
    
    const logout = useCallback(() => { setIsAuthenticated(false); setIsEditMode(false); }, []);
    
    const publishContent = useCallback(() => {
        if (!siteContent) return;
        downloadJson(siteContent, 'content.json');
        alert("✅ Content exported as content.json.\nReplace the old file and redeploy your site.");
    }, [siteContent]);

    const resetContent = useCallback(() => {
        if (window.confirm("Discard all unpublished changes?")) {
            localStorage.removeItem(DRAFT_CONTENT_KEY);
            setSiteContent(initialContent);
        }
    }, [initialContent]);

    const openMediaModal = (path: string) => setMediaModalState({ isVisible: true, path });
    const closeMediaModal = () => setMediaModalState({ isVisible: false, path: null });
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'e') {
                event.preventDefault();
                isAuthenticated ? setIsEditMode(prev => !prev) : setIsLoginVisible(true);
            }
            if (isEditMode && (event.metaKey || event.ctrlKey) && event.key === 's') {
                event.preventDefault();
                publishContent();
            }
            if (event.key === 'Escape') {
                if(mediaModalState.isVisible) closeMediaModal();
                else if (isLoginVisible) setIsLoginVisible(false);
                else if (isEditMode) setIsEditMode(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isEditMode, isAuthenticated, isLoginVisible, publishContent, mediaModalState.isVisible]);
    
    const value = { isLoading, error, isEditMode, isAuthenticated, isLoginVisible, setIsLoginVisible, login, logout, publishContent, resetContent, siteContent, updateSiteContent, mediaModalState, openMediaModal, closeMediaModal };

    return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
};