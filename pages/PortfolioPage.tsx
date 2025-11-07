// 🖼️ Portfolio Gallery Page
// This page displays a grid of all projects.
// It now features an advanced fuzzy search with real-time suggestions to handle typos.

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProjectCard from '../components/ProjectCard';
import AnimatedPage from '../components/AnimatedPage';
import { useEditor } from '../components/EditorProvider';
import { Project } from '../types';

const INITIAL_PROJECT_COUNT = 9;
const PROJECTS_TO_LOAD_MORE = 6;

// --- Custom Debounce Hook ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

// --- Levenshtein Distance Calculator for Fuzzy Search ---
const calculateLevenshteinDistance = (a: string = '', b: string = ''): number => {
    const an = a.length, bn = b.length;
    if (an === 0) return bn;
    if (bn === 0) return an;
    const matrix = Array(bn + 1).fill(null).map(() => Array(an + 1).fill(null));
    for (let i = 0; i <= an; i++) matrix[0][i] = i;
    for (let j = 0; j <= bn; j++) matrix[j][0] = j;
    for (let j = 1; j <= bn; j++) {
        for (let i = 1; i <= an; i++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,        // Deletion
                matrix[j - 1][i] + 1,        // Insertion
                matrix[j - 1][i - 1] + cost, // Substitution
            );
        }
    }
    return matrix[bn][an];
};


const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

// --- Icons ---
const SearchIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> );
const ClearIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> );
const AddIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg> );

function PortfolioPage() {
  const { siteContent, isEditMode } = useEditor();
  const portfolioProjects = siteContent?.projects || [];
  
  const [inputValue, setInputValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [visibleCount, setVisibleCount] = useState(INITIAL_PROJECT_COUNT);
  const [suggestions, setSuggestions] = useState<Project[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debouncedSearchQuery = useDebounce(inputValue, 300);
  
  useEffect(() => {
    setVisibleCount(INITIAL_PROJECT_COUNT);
  }, [debouncedSearchQuery, selectedCategory]);

  const categories = useMemo(() => ['All', ...new Set(portfolioProjects.map(p => p.category))], [portfolioProjects]);

  const filteredProjects = useMemo(() => {
    const query = debouncedSearchQuery.toLowerCase().trim();
    const categoryFiltered = portfolioProjects.filter(p => selectedCategory === 'All' || p.category === selectedCategory);

    if (!query) return categoryFiltered;

    const scoredProjects = categoryFiltered
      .map(project => {
        let score = 0;
        const title = project.title.toLowerCase();
        const tools = project.tools.join(' ').toLowerCase();
        const category = project.category.toLowerCase();

        // Levenshtein distance for fuzzy matching on title
        const titleDistance = calculateLevenshteinDistance(query, title);
        const titleThreshold = Math.max(1, Math.floor(query.length / 3));
        
        if (titleDistance <= titleThreshold) {
            score += 50 / (titleDistance + 1);
        }
        
        // Check against category (high relevance)
        if (category === query) {
            score += 40;
        } else if (category.includes(query)) {
            score += 20;
        }
        
        // Exact substring matches in other fields
        if (title.includes(query)) score += 30;
        if (tools.includes(query)) score += 10;
        
        // Bonus for matching individual words in the query
        query.split(' ').forEach(word => {
            if (word.length < 2) return; // Allow 2-letter words
            if (title.includes(word)) score += 15;
            if (category.includes(word)) score += 10;
            if (tools.includes(word)) score += 5;
        });

        return { project, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.project);
      
    return scoredProjects;
  }, [debouncedSearchQuery, portfolioProjects, selectedCategory]);

  useEffect(() => {
    if (debouncedSearchQuery) {
        setSuggestions(filteredProjects.slice(0, 5));
    } else {
        setSuggestions([]);
    }
  }, [debouncedSearchQuery, filteredProjects]);
  
  const displayedProjects = useMemo(() => filteredProjects.slice(0, visibleCount), [filteredProjects, visibleCount]);

  const handleLoadMore = () => setVisibleCount(prev => prev + PROJECTS_TO_LOAD_MORE);
  
  const handleSuggestionClick = useCallback((project: Project) => {
    setInputValue(project.title);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIndex > -1) {
        handleSuggestionClick(suggestions[activeSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [activeSuggestionIndex, suggestions, handleSuggestionClick]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setActiveSuggestionIndex(-1);
    setShowSuggestions(true);
  }

  return (
    <AnimatedPage>
      <div className="min-h-screen p-4 md:p-8 pt-24 md:pt-8 text-white">
        <div className="container mx-auto">
          {/* ... Header and Edit Button ... */}
          <motion.div className="flex flex-wrap items-center justify-between" initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-8">Selected Work</h1>
            {isEditMode && (<motion.button className="flex items-center px-4 py-2 text-sm font-bold text-black bg-white rounded-md hover:bg-neutral-200 transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><AddIcon /> Add Project</motion.button>)}
          </motion.div>

          {/* ... Categories ... */}
          <motion.div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.2 }}>
            {categories.map(category => ( <motion.button key={category} onClick={() => setSelectedCategory(category)} className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-300 ${ selectedCategory === category ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' }`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>{category}</motion.button>))}
          </motion.div>

          {/* --- Search Input & Suggestions --- */}
          <motion.div ref={searchContainerRef} className="mb-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.3 }} onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} onFocus={() => setShowSuggestions(true)}>
            <div className="relative w-full max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><SearchIcon /></span>
                <input type="text" placeholder="Search by title (e.g., 'Auroa')" value={inputValue} onChange={handleInputChange} onKeyDown={handleKeyDown} className="w-full bg-transparent border-b border-neutral-700 focus:border-white outline-none py-3 pl-10 pr-10 text-white placeholder-neutral-500 transition-colors duration-300"/>
                {inputValue && ( <button onClick={() => setInputValue('')} className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500 hover:text-white transition-colors" aria-label="Clear search"><ClearIcon /></button> )}
                <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                        <motion.ul initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full mt-2 w-full bg-neutral-800 border border-neutral-700 rounded-md shadow-lg overflow-hidden z-10">
                           {suggestions.map((project, index) => (
                               <li key={project.id} onMouseDown={() => handleSuggestionClick(project)} className={`px-4 py-3 cursor-pointer text-sm transition-colors ${activeSuggestionIndex === index ? 'bg-blue-600 text-white' : 'text-neutral-300 hover:bg-neutral-700'}`}>
                                   {project.title}
                               </li>
                           ))}
                        </motion.ul>
                    )}
                </AnimatePresence>
            </div>
          </motion.div>
          
          {/* --- Project Grid --- */}
          {filteredProjects.length > 0 ? (
            <>
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8" variants={containerVariants} initial="hidden" animate="visible">
                {displayedProjects.map((project, index) => ( <ProjectCard key={project.id} project={project} index={index} /> ))}
            </motion.div>

            {visibleCount < filteredProjects.length && (
                <motion.div className="text-center mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    <motion.button onClick={handleLoadMore} className="group inline-block mt-8 px-6 py-3 border border-white text-white uppercase text-sm tracking-widest hover:bg-white hover:text-black transition-all duration-300" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        Load More <span className="inline-block transition-transform duration-300 group-hover:translate-x-2">→</span>
                    </motion.button>
                </motion.div>
            )}
            </>
          ) : (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                <p className="text-neutral-400 text-lg">No projects match your search.</p>
                <p className="text-neutral-500 text-sm mt-2">Try a different keyword or check your spelling.</p>
            </motion.div>
          )}

        </div>
      </div>
    </AnimatedPage>
  );
};

export default PortfolioPage;