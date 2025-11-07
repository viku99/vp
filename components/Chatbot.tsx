// 🤖 AI Chatbot Component
// This component provides a floating chat interface powered by Gemini.
// It now features a robust, proactive initialization system to ensure it's
// always ready for user interaction. It also correctly handles conversational
// memory, streaming responses, and context-aware suggested prompts.

import React, { useState, useRef, useEffect, useCallback } from 'react';
// FIX: Import `Transition` and `useAnimationControls` for Framer Motion features.
import { motion, AnimatePresence, Transition, useAnimationControls } from 'framer-motion';
import { GoogleGenAI, Chat } from '@google/genai';
import { useLocation, Link } from 'react-router-dom';
import { useEditor } from './EditorProvider';


// --- Helper function for shuffling an array ---
const shuffleArray = <T,>(array: T[]): T[] => {
    // A copy is made to avoid mutating the original array
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        // Swap elements
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};


// --- Recursive Rich Text Parser ---
/**
 * Recursively parses a string to render markdown-like features:
 * - **bold** -> <strong>
 * - *italic* -> <em>
 * - [link text](/path) -> <Link to="/path">
 * This approach correctly handles nested formatting, like a **[bold link]**.
 * @param text The raw text string to parse.
 */
function RichText({ text }: { text: string }): React.ReactElement {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/;
  const boldRegex = /\*\*([^*]+)\*\*/;
  const italicRegex = /\*([^*]+)\*/;

  if (!text) {
    return <></>;
  }

  // Combine regexes to find the first match of any type.
  // The order in the combined regex matters for parsing preference, but here it's fine.
  const combinedRegex = new RegExp(
    `(${linkRegex.source})|(${boldRegex.source})|(${italicRegex.source})`
  );

  const match = text.match(combinedRegex);
  
  if (!match) {
    return <>{text}</>;
  }
  
  const before = text.substring(0, match.index);
  const after = text.substring(match.index! + match[0].length);
  
  let element: React.ReactNode;

  // Check which capture group was successful to determine the type of markdown.
  // The indices correspond to the capture groups in the combinedRegex.
  if (match[2] && match[3]) { // Link: [text](url)
    // Recursively parse the link's text content for further formatting.
    element = <Link to={match[3]} className="text-blue-400 underline hover:text-blue-300"><RichText text={match[2]} /></Link>;
  } else if (match[5]) { // Bold: **text**
    element = <strong><RichText text={match[5]} /></strong>;
  } else if (match[7]) { // Italic: *text*
    element = <em><RichText text={match[7]} /></em>;
  } else {
    // This case should not be reached with the current regex, but it's a safe fallback.
    return <>{text}</>;
  }

  return (
    <>
      {before}
      {element}
      <RichText text={after} />
    </>
  );
}


// --- UI Components ---
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);


interface Message {
    sender: 'user' | 'bot';
    text: string;
    suggestions?: string[];
}

// --- Animation Variants for Trash Icon ---
const trashAnimations = [
  { rotate: [0, -20, 20, -15, 15, 0], scale: 1.1, transition: { duration: 0.5, ease: "easeInOut" as const } }, // Jiggle
  { y: [0, -3, 3, -2, 2, 0], transition: { duration: 0.4, ease: "easeInOut" as const } }, // Shake
  { scale: [1, 1.25, 0.9, 1.1, 1], rotate: [0, 0, 10, -10, 0], transition: { duration: 0.5, ease: "easeOut" as const } } // Pop & Twist
];

const GREETING_MESSAGE = "Hi there! I'm Fae, your guide to Vikas's portfolio. How can I help you?";

function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatRef = useRef<Chat | null>(null);
    const { siteContent } = useEditor();
    const location = useLocation();
    const trashControls = useAnimationControls();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // --- Close chat window on page navigation ---
    useEffect(() => {
        // This effect runs when the URL path changes. If the chatbot is open,
        // it will be closed to prevent it from obstructing the new page's content.
        if (isOpen) {
            setIsOpen(false);
        }
    }, [location.pathname]); // Dependency on pathname triggers this on navigation

    const initializeChat = useCallback(() => {
        if (siteContent && process.env.API_KEY) {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const systemInstruction = `You are Fae, the AI guide for the portfolio of Vikas, a Motion Designer & VFX Storyteller. Think of yourself as a highly competent and articulate studio assistant or gallery curator. Your personality is bright, sharp, and helpful, with a professional yet approachable attitude. You speak with a natural, human-like cadence.

**Your Guiding Principles:**
- **Human-like Conversation:** Ditch the robotic chatbot talk. Don't start answers by repeating the user's question. Speak directly and naturally, as if you're having a real conversation. Vary your sentence structure.
- **Concise & Impactful (Quality > Quantity):** Your primary goal is clarity, not verbosity. Get straight to the point. Provide a clear, direct answer first. Only offer more detail if the user asks for it or if the question is complex. Short, insightful answers are better than long, rambling ones.
- **Text Formatting:** Use markdown for emphasis. Use **bold** for highlighting key terms like project titles or skills. This will be rendered correctly in the UI.
- **Internal Navigation:** When you mention a specific project, page, or category, you MUST provide a direct link to it using markdown link syntax. For example: "You can learn more about his skills on the [About page](/about)." or "He used After Effects for the **[Aurora project](/portfolio/aurora)**." This is crucial for helping the user navigate the site. Always use relative paths starting with '/'.
- **Absolute Data Fidelity:** Your knowledge is strictly limited to the portfolio data provided below. Never invent information, projects, or testimonials. If you don't know something, say so gracefully. For example: "I don't have details on that, but I can tell you about his listed projects."
- **Professional Advocacy:** When discussing Vikas's skills or potential for hire, be a confident advocate. Don't just list skills; connect them to real project outcomes from the data. Your endorsement should feel like a logical conclusion based on the evidence in his portfolio.
- **Tone:** Confident, positive, and professional. You're representing high-quality work. No slang, no emojis, just clear and polished communication.

**PORTFOLIO OWNER:**
The portfolio belongs to Vikas, a Motion Designer & VFX Storyteller studying at CSMU.

**CONTACT & SOCIAL MEDIA:**
- **Email:** vikasbg.png@gmail.com
- **LinkedIn:** https://www.linkedin.com/in/vikasbala19
- **Behance:** https://www.behance.net/vikasbala
- **GitHub:** https://github.com/viku99
- **Instagram:** @zorox.x_ (https://www.instagram.com/zorox.x_)
- **WhatsApp:** +91 9043529067
- **Discord:** @zororobinxo (https://discord.com/users/zororobinxo)

**WEBSITE STRUCTURE & PAGES:**
- **Home Page:** A cinematic landing page with the title 'VIKAS' and the subtitle 'Motion Designer & VFX Storyteller'.
- **Portfolio Page:** A gallery of all projects. Users can filter projects by category and search using keywords.
- **About Page:** Contains a bio for Vikas, his list of skills, and testimonials from people he has worked with.
- **Project Detail Page:** Each project has a dedicated page showing a description, a video or lead image, tools used, and a gallery of process images. The video player has advanced controls like a quality selector.
- **Contact Page:** A page with a contact form and links to all social media profiles.

**FULL SITE CONTENT (JSON FORMAT):**
${JSON.stringify(siteContent, null, 2)}

**YOUR TASK:**
Engage users in a helpful, human-like conversation about Vikas and his work. Use the provided data to answer questions accurately and concisely. Embody your persona as a knowledgeable and professional guide.`;

                chatRef.current = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: { systemInstruction },
                });
            } catch (e) {
                console.error("Failed to initialize chat:", e);
                chatRef.current = null;
            }
        } else {
            chatRef.current = null;
        }
    }, [siteContent]);
    
    useEffect(() => {
        // Proactively initialize the chat as soon as site content is available.
        initializeChat();
    }, [initializeChat]);


    const getContextualPrompts = useCallback(() => {
        const { projects = [], testimonials = [], about = { skills: [] } } = siteContent || {};
        const path = location.pathname;
        let pool: string[] = [];

        // --- Generic Prompts (always available as a base) ---
        if (projects.length > 0) {
            const randomProject = projects[Math.floor(Math.random() * projects.length)];
            pool.push(`Tell me about the '${randomProject.title.split('—')[0].trim()}' project`);
        }
        pool.push("What are Vikas's main skills?");
        pool.push("How can I contact Vikas for a project?");
        if (testimonials.length > 0) {
            const randomTestimonial = testimonials[Math.floor(Math.random() * testimonials.length)];
            // Use first name for a more conversational prompt
            pool.push(`What did ${randomTestimonial.name.split(' ')[0]} say about him?`);
        }

        // --- Page-Specific, Context-Aware Prompts ---
        if (path.startsWith('/portfolio/')) {
            const slug = path.split('/').pop();
            const project = projects.find(p => p.id === slug);
            if (project) {
                pool.push(`What tools were specifically used for ${project.title.split('—')[0].trim()}?`);
                if (project.category) {
                     pool.push(`Show me other ${project.category} projects`);
                }
                // An inferential question for the AI to handle
                pool.push("What was the most challenging part of this project?");
            }
        } else if (path.startsWith('/portfolio')) {
            const allTools = [...new Set(projects.flatMap(p => p.tools))];
            const allCategories = [...new Set(projects.map(p => p.category))];
            if (allTools.length > 0) {
                const randomTool = allTools[Math.floor(Math.random() * allTools.length)];
                pool.push(`Which projects used ${randomTool}?`);
            }
            if (allCategories.length > 1) { // Only if there's more than one to choose from
                const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];
                 pool.push(`Show me all projects in the ${randomCategory} category.`);
            }
            pool.push("What was the most recent project?");
        } else if (path.startsWith('/about')) {
            pool.push("Tell me more about Vikas's professional background.");
            if (about.skills.length > 0) {
                const randomSkill = about.skills[Math.floor(Math.random() * about.skills.length)];
                pool.push(`How has he used ${randomSkill} in his work?`);
            }
            pool.push("Are there any testimonials from his collaborators?");
        }

        // De-duplicate, shuffle the pool, and take the top 3 suggestions
        const uniquePrompts = [...new Set(pool)];
        return shuffleArray(uniquePrompts).slice(0, 3);
    }, [location.pathname, siteContent]);

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                { 
                    sender: 'bot', 
                    text: GREETING_MESSAGE,
                    suggestions: getContextualPrompts()
                }
            ]);
        }
    }, [isOpen, messages.length, getContextualPrompts]);


    const handleSend = async (e: React.FormEvent | null, prompt?: string) => {
        if (e) e.preventDefault();
        const currentInput = prompt || input;
        if (!currentInput.trim() || isLoading) return;

        const userMessage: Message = { sender: 'user', text: currentInput };
        setMessages(prev => [...prev, userMessage, { sender: 'bot', text: '' }]);
        setInput('');
        setIsLoading(true);

        if (!process.env.API_KEY) {
            const errorMessage: Message = { sender: 'bot', text: "I'm sorry, I can't connect right now. The API key for the AI service is missing." };
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = errorMessage;
                return newMessages;
            });
            setIsLoading(false);
            return;
        }
        
        if (!chatRef.current) {
            const errorMessage: Message = { sender: 'bot', text: "I'm still getting ready as the site content loads. Please try again in a moment." };
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = errorMessage;
                return newMessages;
            });
            setIsLoading(false);
            return;
        }

        try {
            const chat = chatRef.current;
            const responseStream = await chat.sendMessageStream({ message: currentInput });

            for await (const chunk of responseStream) {
                const chunkText = chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = { ...newMessages[newMessages.length - 1] };
                    lastMessage.text += chunkText;
                    newMessages[newMessages.length - 1] = lastMessage;
                    return newMessages;
                });
            }

        } catch (error) {
            console.error("Gemini API error:", error);
            const errorMessage: Message = { sender: 'bot', text: "Sorry, I'm having trouble connecting right now. Please try again later." };
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = errorMessage;
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSuggestionClick = (suggestion: string) => {
        setMessages(prev => prev.map(msg => ({ ...msg, suggestions: undefined })));
        handleSend(null, suggestion);
    };

    const handleClearChat = () => {
        // Trigger a random animation on click
        const randomIndex = Math.floor(Math.random() * trashAnimations.length);
        trashControls.start(trashAnimations[randomIndex]);

        // Re-initialize the chat session on the server to clear its memory.
        initializeChat();
        
        // Directly reset the client-side messages to the initial welcome state.
        setMessages([
            {
                sender: 'bot',
                text: GREETING_MESSAGE,
                suggestions: getContextualPrompts()
            }
        ]);
    };
    
    const buttonLayoutTransition: Transition = { type: "spring", stiffness: 500, damping: 30 };
    const contentTransition: Transition = { type: "spring", stiffness: 400, damping: 25 };

    return (
        <>
            <div className="fixed bottom-5 right-5 z-50">
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            style={{ transformOrigin: 'bottom right' }}
                            className="w-[calc(100vw-40px)] h-[60vh] max-w-sm max-h-[600px] bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-neutral-700"
                        >
                            {/* Header */}
                            <div className="flex-shrink-0 p-4 flex justify-between items-center border-b border-neutral-700">
                                <h3 className="font-bold text-white">Fae</h3>
                                <div className="flex items-center gap-2">
                                    <motion.button
                                        onClick={handleClearChat}
                                        className="text-neutral-400 hover:text-white transition-colors"
                                        title="Clear Chat"
                                        animate={trashControls}
                                    >
                                        <TrashIcon />
                                    </motion.button>
                                    <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-white transition-colors">
                                        <CloseIcon />
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                                {messages.map((msg, index) => (
                                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-lg' : 'bg-neutral-700 text-neutral-200 rounded-bl-lg'}`}
                                        >
                                           {msg.sender === 'bot' && isLoading && msg.text === '' ? (
                                                <div className="flex items-center space-x-1">
                                                    <span className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse [animation-delay:0s]"></span>
                                                    <span className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse [animation-delay:0.2s]"></span>
                                                    <span className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse [animation-delay:0.4s]"></span>
                                                </div>
                                            ) : (
                                                <div className="text-sm break-words whitespace-pre-wrap">
                                                    <RichText text={msg.text} />
                                                </div>
                                            )}

                                           {msg.suggestions && (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {msg.suggestions.map((suggestion, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => handleSuggestionClick(suggestion)}
                                                            className="px-3 py-1 text-xs bg-neutral-600/50 hover:bg-neutral-600/80 text-neutral-200 rounded-full transition-colors"
                                                        >
                                                            {suggestion}
                                                        </button>
                                                    ))}
                                                </div>
                                           )}
                                        </motion.div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="flex-shrink-0 p-3 border-t border-neutral-700">
                                <form onSubmit={handleSend} className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask a question..."
                                        className="w-full bg-neutral-800 border border-neutral-600 rounded-full py-2 px-4 text-sm text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                                        disabled={isLoading || !chatRef.current}
                                    />
                                    <button type="submit" disabled={isLoading || !input.trim() || !chatRef.current} className="bg-blue-600 text-white rounded-full p-2.5 hover:bg-blue-500 disabled:bg-neutral-600 disabled:cursor-not-allowed transition-colors">
                                        <SendIcon />
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <motion.button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`group backdrop-blur-sm flex items-center justify-center border
                    ${isOpen 
                        ? 'w-12 h-12 bg-black/50 border-neutral-600 text-neutral-300 rounded-full shadow-lg transition-all hover:shadow-[0_0_12px_rgba(239,68,68,0.3)]' 
                        : 'px-6 py-3 bg-black/30 border-neutral-700 hover:border-white hover:bg-black/50 text-neutral-300 hover:text-white rounded-full subtle-glow-animation'
                    }`}
                    layout
                    transition={buttonLayoutTransition}
                    whileHover={{ scale: isOpen ? 0.95 : 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={isOpen ? "Close Chatbot" : "Open Chatbot"}
                >
                    <AnimatePresence mode="wait" initial={false}>
                        {isOpen ? (
                            <motion.div
                                key="close"
                                initial={{ opacity: 0, scale: 0.7, rotate: -45 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0.7, rotate: 45 }}
                                transition={contentTransition}
                            >
                                <CloseIcon />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="ask"
                                initial={{ opacity: 0, scale: 0.7 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.7 }}
                                transition={contentTransition}
                                className="font-bold text-sm tracking-wider uppercase"
                            >
                                Ask Fae
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>
        </>
    );
};

export default Chatbot;