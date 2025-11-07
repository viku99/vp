// 🖼️ Portfolio Gallery Page
// This page displays a grid of all projects.
// In edit mode, it provides controls to add, edit, delete, and reorder projects.

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProjectCard from '../components/ProjectCard';
import AnimatedPage from '../components/AnimatedPage';
import { useEditor } from '../components/EditorProvider';
import { Project } from '../types';

const INITIAL_PROJECT_COUNT = 9;
const PROJECTS_TO_LOAD_MORE = 6;

// --- Custom Debounce Hook ---
// Improves performance by delaying state updates on rapid input changes,
// preventing re-renders and filtering on every keystroke.
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function to clear the timeout if the value changes before the delay has passed
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}


const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

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
  
  // Debounce the search input to avoid filtering on every keystroke
  const searchQuery = useDebounce(inputValue, 300);
  
  useEffect(() => {
    // Reset the number of visible projects when the filters change
    setVisibleCount(INITIAL_PROJECT_COUNT);
  }, [searchQuery, selectedCategory]);

  const categories = useMemo(() => ['All', ...new Set(portfolioProjects.map(p => p.category))], [portfolioProjects]);

  const filteredProjects = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return portfolioProjects.filter(project => {
        const categoryMatch = selectedCategory === 'All' || project.category === selectedCategory;
        const searchMatch = !query || project.title.toLowerCase().includes(query) || project.description.toLowerCase().includes(query);
        return categoryMatch && searchMatch;
    });
  }, [searchQuery, portfolioProjects, selectedCategory]);
  
  const displayedProjects = useMemo(() => filteredProjects.slice(0, visibleCount), [filteredProjects, visibleCount]);

  const handleLoadMore = () => setVisibleCount(prev => prev + PROJECTS_TO_LOAD_MORE);
  
  return (
    <AnimatedPage>
      <div className="min-h-screen p-4 md:p-8 pt-24 md:pt-8 text-white">
        <div className="container mx-auto">
          <motion.div 
            className="flex flex-wrap items-center justify-between"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-8">
              Selected Work
            </h1>
            {isEditMode && (
                <motion.button
                    // onClick={() => setEditingProject({})} // This would trigger a modal
                    className="flex items-center px-4 py-2 text-sm font-bold text-black bg-white rounded-md hover:bg-neutral-200 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <AddIcon /> Add Project
                </motion.button>
            )}
          </motion.div>

          <motion.div
            className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {categories.map(category => (
                <motion.button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-300 ${ selectedCategory === category ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {category}
                </motion.button>
            ))}
          </motion.div>

          <motion.div 
            className="mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="relative w-full max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><SearchIcon /></span>
                <input
                  type="text"
                  placeholder="Search by title or keyword..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full bg-transparent border-b border-neutral-700 focus:border-white outline-none py-3 pl-10 pr-10 text-white placeholder-neutral-500 transition-colors duration-300"
                />
                {inputValue && ( <button onClick={() => setInputValue('')} className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500 hover:text-white transition-colors" aria-label="Clear search"><ClearIcon /></button> )}
            </div>
          </motion.div>
          
          {filteredProjects.length > 0 ? (
            <>
            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {displayedProjects.map((project, index) => (
                    <ProjectCard key={project.id} project={project} index={index} />
                ))}
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
            </motion.div>
          )}

        </div>
      </div>
    </AnimatedPage>
  );
};

export default PortfolioPage;