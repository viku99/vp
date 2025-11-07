import React, { useState, useRef, useEffect, useCallback, ReactElement } from 'react';
import { motion, AnimatePresence, Transition, useAnimationControls } from 'framer-motion';
import { GoogleGenAI, Chat } from '@google/genai';
import { useLocation, Link } from 'react-router-dom';
import { useEditor } from './EditorProvider';

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

function RichText({ text }: { text: string }): ReactElement {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/;
  const boldRegex = /\*\*([^*]+)\*\*/;
  const italicRegex = /\*([^*]+)\*/;

  if (!text) return <></>;

  const combinedRegex = new RegExp(`(${linkRegex.source})|(${boldRegex.source})|(${italicRegex.source})`);
  const match = text.match(combinedRegex);
  
  if (!match) return <>{text}</>;
  
  const before = text.substring(0, match.index);
  const after = text.substring(match.index! + match[0].length);
  
  let element: React.ReactNode;

  if (match[2] && match[3]) {
    // Ensure internal links use the Link component for SPA navigation
    const isInternal = match[3].startsWith('/');
    if (isInternal) {
        element = <Link to={match[3]} className="text-blue-400 underline hover:text-blue-300"><RichText text={match[2]} /></Link>;
    } else {
        element = <a href={match[3]} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300"><RichText text={match[2]} /></a>;
    }
  } else if (match[5]) {
    element = <strong><RichText text={match[5]} /></strong>;
  } else if (match[7]) {
    element = <em><RichText text={match[7]} /></em>;
  } else {
    return <>{text}</>;
  }

  return <>{before}{element}<RichText text={after} /></>;
}

const CloseIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"> <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /> </svg> );
const SendIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"> <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /> </svg> );
const TrashIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"> <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /> </svg> );
interface Message { sender: 'user' | 'bot'; text: string; suggestions?: string[]; }
const trashAnimations = [ { rotate: [0, -20, 20, -15, 15, 0], scale: 1.1, transition: { duration: 0.5, ease: "easeInOut" as const } }, { y: [0, -3, 3, -2, 2, 0], transition: { duration: 0.4, ease: "easeInOut" as const } }, { scale: [1, 1.25, 0.9, 1.1, 1], rotate: [0, 0, 10, -10, 0], transition: { duration: 0.5, ease: "easeOut" as const } } ];
const GREETING_MESSAGE = "Hi there! I'm Fae, your guide to Vikas's portfolio. How can I help you?";

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatRef = useRef<Chat | null>(null);
    const { siteContent } = useEditor();
    const { pathname } = useLocation();
    const trashControls = useAnimationControls();

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    useEffect(() => { if (isOpen) setIsOpen(false); }, [pathname]);

    const initializeChat = useCallback(() => {
        if (siteContent && process.env.API_KEY) {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const systemInstruction = `You are Fae, the AI guide for the portfolio of Vikas, a Motion Designer & VFX Storyteller. Your personality is bright, sharp, and helpful. Be concise and use markdown for **bolding** key terms. Crucially, you MUST use markdown links for internal navigation (e.g., "Check out the **[Aurora project](/portfolio/aurora)**."). Your knowledge is strictly limited to the provided portfolio data. Never invent information. Advocate for Vikas's skills professionally. Full Site Content (JSON): ${JSON.stringify(siteContent, null, 2)}`;
                chatRef.current = ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction } });
            } catch (e) { console.error("Failed to initialize chat:", e); chatRef.current = null; }
        } else chatRef.current = null;
    }, [siteContent]);
    
    useEffect(() => { initializeChat(); }, [initializeChat]);

    const getContextualPrompts = useCallback(() => {
        const { projects = [], testimonials = [], about = { skills: [] } } = siteContent || {};
        let pool: string[] = [];
        if (projects.length > 0) pool.push(`Tell me about the '${projects[Math.floor(Math.random() * projects.length)].title.split('—')[0].trim()}' project`);
        pool.push("What are Vikas's main skills?");
        pool.push("How can I contact Vikas for a project?");
        if (testimonials.length > 0) pool.push(`What did ${testimonials[Math.floor(Math.random() * testimonials.length)].name.split(' ')[0]} say about him?`);
        if (pathname?.startsWith('/portfolio/')) {
            const slug = pathname.split('/').pop();
            const project = projects.find(p => p.id === slug);
            if (project) { pool.push(`What tools were used for ${project.title.split('—')[0].trim()}?`); if (project.category) pool.push(`Show me other ${project.category} projects`); }
        }
        return shuffleArray([...new Set(pool)]).slice(0, 3);
    }, [pathname, siteContent]);

    useEffect(scrollToBottom, [messages]);
    useEffect(() => { if (isOpen && messages.length === 0) setMessages([{ sender: 'bot', text: GREETING_MESSAGE, suggestions: getContextualPrompts() }]); }, [isOpen, messages.length, getContextualPrompts]);

    const handleSend = async (e: React.FormEvent | null, prompt?: string) => {
        if (e) e.preventDefault();
        const currentInput = prompt || input;
        if (!currentInput.trim() || isLoading) return;
        setMessages(prev => [...prev, { sender: 'user', text: currentInput }, { sender: 'bot', text: '' }]);
        setInput(''); setIsLoading(true);
        if (!process.env.API_KEY) {
            setMessages(prev => [...prev.slice(0, -1), { sender: 'bot', text: "Sorry, I can't connect. The API key is missing. Please contact the site administrator." }]); setIsLoading(false); return;
        }
        if (!chatRef.current) {
            initializeChat(); // Re-initialize if chat is not ready
            if(!chatRef.current) {
                setMessages(prev => [...prev.slice(0, -1), { sender: 'bot', text: "I'm still getting ready. Please try again in a moment." }]); setIsLoading(false); return;
            }
        }
        try {
            const responseStream = await chatRef.current.sendMessageStream({ message: currentInput });
            for await (const chunk of responseStream) {
                if (chunk.text) setMessages(prev => { const newMessages = [...prev]; newMessages[newMessages.length - 1].text += chunk.text; return newMessages; });
            }
        } catch (error) {
            console.error("Gemini API error:", error);
            setMessages(prev => [...prev.slice(0, -1), { sender: 'bot', text: "Sorry, I'm having trouble connecting." }]);
        } finally { setIsLoading(false); }
    };
    
    const handleSuggestionClick = (suggestion: string) => { setMessages(prev => prev.map(msg => ({ ...msg, suggestions: undefined }))); handleSend(null, suggestion); };
    const handleClearChat = () => { trashControls.start(trashAnimations[Math.floor(Math.random() * trashAnimations.length)]); initializeChat(); setMessages([{ sender: 'bot', text: GREETING_MESSAGE, suggestions: getContextualPrompts() }]); };
    
    const buttonLayoutTransition: Transition = { type: "spring", stiffness: 500, damping: 30 };
    const contentTransition: Transition = { type: "spring", stiffness: 400, damping: 25 };

    return (
        <div className="fixed bottom-5 right-5 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} style={{ transformOrigin: 'bottom right' }} className="w-[calc(100vw-40px)] h-[60vh] max-w-sm max-h-[600px] bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-neutral-700">
                        <div className="flex-shrink-0 p-4 flex justify-between items-center border-b border-neutral-700">
                            <h3 className="font-bold text-white">Fae</h3>
                            <div className="flex items-center gap-2"> <motion.button onClick={handleClearChat} className="text-neutral-400 hover:text-white" title="Clear Chat" animate={trashControls}><TrashIcon /></motion.button> <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-white"><CloseIcon /></button> </div>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-lg' : 'bg-neutral-700 text-neutral-200 rounded-bl-lg'}`}>
                                        {msg.sender === 'bot' && isLoading && msg.text === '' ? <div className="flex items-center space-x-1"><span className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse [animation-delay:0s]"></span><span className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse [animation-delay:0.2s]"></span><span className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse [animation-delay:0.4s]"></span></div> : <div className="text-sm break-words whitespace-pre-wrap"><RichText text={msg.text} /></div>}
                                        {msg.suggestions && <div className="mt-3 flex flex-wrap gap-2">{msg.suggestions.map((suggestion, i) => ( <button key={i} onClick={() => handleSuggestionClick(suggestion)} className="px-3 py-1 text-xs bg-neutral-600/50 hover:bg-neutral-600/80 text-neutral-200 rounded-full transition-colors">{suggestion}</button> ))}</div>}
                                    </motion.div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="flex-shrink-0 p-3 border-t border-neutral-700">
                            <form onSubmit={handleSend} className="flex items-center space-x-2">
                                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={!process.env.API_KEY ? "Assistant not available..." : "Ask a question..."} className="w-full bg-neutral-800 border border-neutral-600 rounded-full py-2 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500" disabled={isLoading || !process.env.API_KEY} />
                                <button type="submit" disabled={isLoading || !input.trim() || !process.env.API_KEY} className="bg-blue-600 text-white rounded-full p-2.5 hover:bg-blue-500 disabled:bg-neutral-600 disabled:cursor-not-allowed"> <SendIcon /> </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.button onClick={() => setIsOpen(!isOpen)} className={`group backdrop-blur-sm flex items-center justify-center border ${isOpen ? 'w-12 h-12 bg-black/50 border-neutral-600 text-neutral-300 rounded-full shadow-lg' : 'px-6 py-3 bg-black/30 border-neutral-700 hover:border-white hover:bg-black/50 text-neutral-300 hover:text-white rounded-full subtle-glow-animation'}`} layout transition={buttonLayoutTransition} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} aria-label={isOpen ? "Close Chatbot" : "Open Chatbot"}>
                <AnimatePresence mode="wait" initial={false}>
                    {isOpen ? <motion.div key="close" initial={{ opacity: 0, scale: 0.7, rotate: -45 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.7, rotate: 45 }} transition={contentTransition}><CloseIcon /></motion.div> : <motion.div key="ask" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={contentTransition} className="font-bold text-sm tracking-wider uppercase">Ask Fae</motion.div>}
                </AnimatePresence>
            </motion.button>
        </div>
    );
};