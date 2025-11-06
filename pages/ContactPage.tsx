// 📞 Contact Page
// This page provides ways to get in touch.
// It includes an AI-powered contact form that analyzes the user's message
// to suggest the most appropriate communication channel.

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI, Type } from '@google/genai';
import AnimatedPage from '../components/AnimatedPage';

// --- Types & Data ---
interface Suggestion {
  channel: string;
  reason: string;
  cta_text: string;
  link: string;
}

// --- SVG Icons as React Components ---
const InstagramIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);
const LinkedInIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
);
const BehanceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.4 9.15a1.4 1.4 0 1 0 0-2.8 1.4 1.4 0 0 0 0 2.8z M8.5 16.5H2.3v-9h6.2c3 0 4.2 1.4 4.2 4.1 0 2-1.3 3.6-3.2 3.9v.1c2.4.3 3.9 1.9 3.9 4.4 0 3.3-2.2 4.5-5.6 4.5H2.3v-7.5zm.9-6.4H5.6v3.9h3.8c1.4 0 2.1-.7 2.1-2s-.8-1.9-2.1-1.9zm0 8.3H5.6v4.6h4c1.7 0 2.6-.8 2.6-2.3s-1-2.3-2.6-2.3z M21.8 12.3c-.2-2.9-2-4.6-5.1-4.6h-.1c-2.3 0-3.9 1-4.5 2.5h.1c1.2-.5 2.5-.7 3.8-.7 1.5 0 2.3.6 2.3 1.8 0 1.1-.9 1.6-2.1 1.6h-2v3.1h2.1c1.8 0 2.9.8 2.9 2.2 0 1.6-1.1 2.3-2.9 2.3-1.8 0-3.3-.8-4.3-2.1h-.1c.6 3.1 2.6 4.6 5.8 4.6 3.4 0 5.6-1.9 5.8-5.3z"></path></svg>
);
const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
);
const GithubIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
);
const WhatsAppIcon = () => (
    <svg role="img" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.204-1.634a11.86 11.86 0 005.785 1.47h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
);
const DiscordIcon = () => (
    <svg role="img" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6.28 15.75c-.32.06-1.6.43-1.6.43s-.16-.1.08-.34c1.1-1.12 1.43-2.12 1.43-2.12s-.48-.26-.89-.52c-2.3-1.43-2.84-4.5-2.84-4.5s.98-1.04 3.2-.95c0 0 1.5-3.17 5.3-3.17s5.3 3.17 5.3 3.17c2.2-.09 3.2.95 3.2.95s-.55 3.07-2.84 4.5c-.4.26-.89.52-.89.52s.33 1 1.43 2.12c.24.24.08.34.08.34s-1.28-.37-1.6-.43c-1.35-.29-2.07.2-2.73.65-.6.4-1.12.74-2.37.74s-1.78-.34-2.37-.74c-.66-.45-1.38-.94-2.73-.65z M9.5 12.43c-.83 0-1.5-.72-1.5-1.6 0-.89.67-1.6 1.5-1.6s1.5.71 1.5 1.6c0 .88-.67 1.6-1.5 1.6zm5 0c-.83 0-1.5-.72-1.5-1.6 0-.89.67-1.6 1.5-1.6s1.5.71 1.5 1.6c0 .88-.67 1.6-1.5 1.6z"/></svg>
);
const SpinnerIcon = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const socialLinks = [
    { name: 'LinkedIn', icon: <LinkedInIcon />, href: "https://www.linkedin.com/in/vikasbala19" },
    { name: 'Behance', icon: <BehanceIcon />, href: "https://www.behance.net/vikasbala" },
    { name: 'Github', icon: <GithubIcon />, href: "https://github.com/viku99" },
    { name: 'Instagram', icon: <InstagramIcon />, href: "https://www.instagram.com/zorox.x_" },
    { name: 'WhatsApp', icon: <WhatsAppIcon />, href: "https://wa.me/919043529067" },
    { name: 'Discord', icon: <DiscordIcon />, href: "https://discord.com/users/zororobinxo" },
    { name: 'Email', icon: <MailIcon />, href: "mailto:vikasbg.png@gmail.com" },
];

const iconMap: { [key: string]: React.ReactNode } = socialLinks.reduce((acc, { name, icon }) => {
    acc[name] = icon;
    return acc;
}, {} as { [key: string]: React.ReactNode });


function ContactPage() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTextChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setter(e.target.value);
    // Reset suggestion if user modifies the message
    if (suggestion) setSuggestion(null);
    if (error) setError(null);
  }
    
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    setSuggestion(null);
    setError(null);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const systemInstruction = `You are a smart communications assistant for Vikas, a Motion Designer. Your job is to analyze incoming messages and suggest the best way for the user to contact him.

You must choose one of the following channels:
- **Email**: For formal business, job offers, freelance projects, and detailed professional inquiries.
- **LinkedIn**: For professional networking, recruitment, and corporate collaborations.
- **Discord**: For creative collaborations, community chat, and peer-to-peer technical discussions.
- **Behance**: For feedback on portfolio work or connecting with the creative community.
- **Instagram**: For casual messages, quick questions, and social interactions.
- **WhatsApp**: Only for very urgent or direct communication. Use this sparingly.

Analyze the user's message for its tone, content, and likely intent. Based on your analysis, you must return a JSON object with the *exact* following structure:
{
  "channel": "The single best channel name from the list above",
  "reason": "A short, friendly, one-sentence explanation for your choice.",
  "cta_text": "A compelling call-to-action for the button, like 'Connect on LinkedIn' or 'Send an Email'.",
  "link": "The corresponding contact link."
}

Here are the links for each channel:
- Email: "mailto:vikasbg.png@gmail.com?subject=Contact from Portfolio&body=${encodeURIComponent(message)}"
- LinkedIn: "https://www.linkedin.com/in/vikasbala19"
- Discord: "https://discord.com/users/zororobinxo"
- Behance: "https://www.behance.net/vikasbala"
- Instagram: "https://www.instagram.com/zorox.x_"
- WhatsApp: "https://wa.me/919043529067"

Be thoughtful in your recommendation to ensure the communication is efficient and professional.`;
        
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                channel: { type: Type.STRING },
                reason: { type: Type.STRING },
                cta_text: { type: Type.STRING },
                link: { type: Type.STRING },
            },
            required: ["channel", "reason", "cta_text", "link"]
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `From: ${name || 'Anonymous'}\n\nMessage:\n${message}`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema
            },
        });

        const parsedSuggestion = JSON.parse(response.text);
        setSuggestion(parsedSuggestion);

    } catch (err) {
        console.error("AI analysis failed:", err);
        setError("Sorry, the AI assistant is currently unavailable. Please use a social link below.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <AnimatedPage>
      <div className="min-h-screen flex items-center justify-center p-4 md:p-8 text-white">
        <div className="container mx-auto max-w-lg text-center">
            
            <motion.h1 
                className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-4"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
            >
                Get In Touch
            </motion.h1>
            <motion.p
                className="text-neutral-400 mb-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
            >
                Have a project in mind? Let my AI assistant find the best way to connect.
            </motion.p>
          
            <motion.form 
                onSubmit={handleSubmit}
                className="space-y-6 text-left"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.4 }}
            >
                <input
                    type="text"
                    placeholder="Your Name"
                    className="w-full bg-transparent border-b border-neutral-700 focus:border-white outline-none py-3 transition-colors duration-300"
                    value={name}
                    onChange={handleTextChange(setName)}
                />
                <textarea
                    placeholder="Your Message"
                    required
                    rows={4}
                    className="w-full bg-transparent border-b border-neutral-700 focus:border-white outline-none py-3 transition-colors duration-300 resize-none"
                    value={message}
                    onChange={handleTextChange(setMessage)}
                ></textarea>
                <motion.button
                  type="submit"
                  className="group w-full mt-8 px-6 py-3 border border-white text-white uppercase text-sm tracking-widest hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center disabled:bg-neutral-700 disabled:cursor-not-allowed"
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  disabled={isLoading || !message.trim()}
                >
                    {isLoading ? (
                        <>
                            <SpinnerIcon />
                            <span className="ml-2">Analyzing & Suggesting...</span>
                        </>
                    ) : (
                       "Send Message"
                    )}
                </motion.button>
            </motion.form>

            <AnimatePresence>
                {suggestion && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="mt-8 bg-neutral-900 border border-neutral-700 p-6 rounded-lg text-left"
                    >
                       <div className="flex items-start gap-4">
                           <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-neutral-800 rounded-full">
                                {iconMap[suggestion.channel] || <MailIcon />}
                           </div>
                           <div>
                                <h4 className="font-bold text-white">Suggested Channel: {suggestion.channel}</h4>
                                <p className="text-sm text-neutral-400 mt-1">{suggestion.reason}</p>
                                <a 
                                    href={suggestion.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group inline-block mt-4 px-5 py-2 bg-blue-600 text-white font-bold text-sm tracking-wider uppercase rounded-md hover:bg-blue-500 transition-all duration-300"
                                >
                                    {suggestion.cta_text} <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                                </a>
                           </div>
                       </div>
                    </motion.div>
                )}
                {error && (
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-6 text-red-500 text-sm"
                    >
                       {error}
                    </motion.p>
                )}
            </AnimatePresence>

            <motion.div
                className="flex justify-center items-center space-x-6 mt-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.6 }}
            >
                {socialLinks.map((link, index) => (
                    <a key={index} href={link.href} target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-white transition-colors duration-300" title={link.name}>
                        {link.icon}
                    </a>
                ))}
            </motion.div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ContactPage;