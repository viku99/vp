// 🤖 AI Chatbot Component
// This component provides a floating chat interface powered by Gemini.
// It now features conversational memory, streaming responses, and suggested prompts
// to create a more interactive and helpful user experience. It has been given
// read-only access to all site data to act as an expert assistant.

import React, { useState, useRef, useEffect } from 'react';
// FIX: Import `Transition` type to correctly type Framer Motion transition objects.
import { motion, AnimatePresence, Transition } from 'framer-motion';
import { GoogleGenAI, Chat } from '@google/genai';
import { useEditor } from './EditorProvider';

// --- Helper Functions ---

/**
 * A simple markdown parser to convert **bold** and *italic* text to HTML.
 * @param text The raw text from the AI.
 * @returns An HTML string with markdown syntax converted to tags.
 */
function parseSimpleMarkdown(text: string): string {
    let html = text;
    // Bold: **text** -> <strong>text</strong>
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text* -> <em>text</em>
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    return html;
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

interface Message {
    sender: 'user' | 'bot';
    text: string;
    suggestions?: string[];
}

function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatRef = useRef<Chat | null>(null);
    const { siteContent } = useEditor();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                { 
                    sender: 'bot', 
                    text: "Hi there! I'm Fae, your guide to Vikas's portfolio. How can I help you discover his work?",
                    suggestions: [
                        "Tell me about the 'Neon City' project",
                        "What did Jane Doe say about Vikas?",
                        "What are his skills?",
                    ]
                }
            ]);
        }
    }, [isOpen, messages.length]);

    const initializeChat = () => {
        if (!siteContent) return;
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const systemInstruction = `You are Fae, the AI guide for the portfolio of Vikas, a Motion Designer & VFX Storyteller. Think of yourself as a highly competent and articulate studio assistant or gallery curator. Your personality is bright, sharp, and helpful, with a professional yet approachable attitude. You speak with a natural, human-like cadence.

**Your Guiding Principles:**
- **Human-like Conversation:** Ditch the robotic chatbot talk. Don't start answers by repeating the user's question. Speak directly and naturally, as if you're having a real conversation. Vary your sentence structure.
- **Concise & Impactful (Quality > Quantity):** Your primary goal is clarity, not verbosity. Get straight to the point. Provide a clear, direct answer first. Only offer more detail if the user asks for it or if the question is complex. Short, insightful answers are better than long, rambling ones.
- **Text Formatting:** Use markdown for emphasis. Use **bold** for highlighting key terms like project titles or skills. This will be rendered correctly in the UI.
- **Absolute Data Fidelity:** Your knowledge is strictly limited to the portfolio data provided below. Never invent information, projects, or testimonials. If you don't know something, say so gracefully. For example: "I don't have details on that, but I can tell you about his listed projects."
- **Professional Advocacy:** When discussing Vikas's skills or potential for hire, be a confident advocate. Don't just list skills; connect them to real project outcomes from the data. Your endorsement should feel like a logical conclusion based on the evidence in his portfolio.
- **Tone:** Confident, positive, and professional. You're representing high-quality work. No slang, no emojis, just clear and polished communication. Use markdown for lists or emphasis where it enhances readability.

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
    }

    const handleSend = async (e: React.FormEvent | null, prompt?: string) => {
        if (e) e.preventDefault();
        const currentInput = prompt || input;
        if (!currentInput.trim() || isLoading) return;

        const userMessage: Message = { sender: 'user', text: currentInput };
        setMessages(prev => [...prev, userMessage, { sender: 'bot', text: '' }]);
        setInput('');
        setIsLoading(true);

        try {
            if (!chatRef.current) {
                initializeChat();
            }
             // Ensure chat is initialized, if not, show error.
            if (!chatRef.current) {
                throw new Error("Chatbot not initialized. Site content may be missing.");
            }
            const chat = chatRef.current!;
            const responseStream = await chat.sendMessageStream({ message: currentInput });

            for await (const chunk of responseStream) {
                const chunkText = chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text += chunkText;
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
        // Hide suggestions after one is clicked
        setMessages(prev => prev.map(msg => ({ ...msg, suggestions: undefined })));
        handleSend(null, suggestion);
    };
    
    const buttonLayoutTransition: Transition = { type: "spring", stiffness: 500, damping: 30 };
    const contentTransition: Transition = { type: "spring", stiffness: 400, damping: 25 };

    return (
        <>
            <div className="fixed bottom-5 right-5 z-50">
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.9 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="w-[calc(100vw-40px)] h-[60vh] max-w-sm max-h-[600px] bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-neutral-700"
                        >
                            {/* Header */}
                            <div className="flex-shrink-0 p-4 flex justify-between items-center border-b border-neutral-700">
                                <h3 className="font-bold text-white">Fae</h3>
                                <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-white transition-colors">
                                    <CloseIcon />
                                </button>
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
                                                <p
                                                    className="text-sm break-words whitespace-pre-wrap"
                                                    dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(msg.text) }}
                                                />
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
                                        disabled={isLoading}
                                    />
                                    <button type="submit" disabled={isLoading || !input.trim()} className="bg-blue-600 text-white rounded-full p-2.5 hover:bg-blue-500 disabled:bg-neutral-600 disabled:cursor-not-allowed transition-colors">
                                        <SendIcon />
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <motion.button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`group backdrop-blur-sm flex items-center justify-center transition-colors duration-300 border
                    ${isOpen 
                        ? 'w-12 h-12 bg-black/50 border-neutral-600 hover:bg-neutral-700 text-neutral-300 rounded-full shadow-lg' 
                        : 'px-6 py-3 bg-black/30 border-neutral-700 hover:border-white hover:bg-black/50 text-neutral-300 hover:text-white rounded-full subtle-glow-animation'
                    }`}
                    layout
                    transition={buttonLayoutTransition}
                    whileHover={{ scale: isOpen ? 1.1 : 1.05 }}
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
