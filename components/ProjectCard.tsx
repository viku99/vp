// 📇 Project Card Component
// This component displays a single project thumbnail in the portfolio grid.
// In edit mode, it shows controls for editing, deleting, and reordering.

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Project } from '../types';
import { useEditor } from './EditorProvider';

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  },
};

const getCardSpan = (index: number) => {
    if ((index + 1) % 7 === 0) return 'lg:col-span-2';
    return 'lg:col-span-1';
}

// --- Icons ---
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
);
const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
);
const ReorderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white cursor-grab active:cursor-grabbing">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
    </svg>
);


function ProjectCard({ project, index }: { project: Project; index: number }) {
  const { isEditMode, updateSiteContent } = useEditor();
  const fallbackThumbnail = `https://picsum.photos/seed/${project.id}/800/600`;

  const handleDelete = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.confirm(`Are you sure you want to delete "${project.title}"?`)) {
          updateSiteContent(draft => {
              draft.projects = draft.projects.filter(p => p.id !== project.id);
          });
      }
  };

  const handleEdit = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Logic to open an edit modal would go here
      alert(`Editing "${project.title}"... (modal not implemented yet)`);
  }

  return (
    <motion.div
      className={`group relative aspect-video overflow-hidden ${getCardSpan(index)}`}
      variants={cardVariants}
      key={project.id}
    >
      {isEditMode && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="p-2"><ReorderIcon /></div>
              <button onClick={handleEdit} className="p-2 bg-blue-600 rounded-full text-white hover:bg-blue-500 transition-colors"><EditIcon /></button>
              <button onClick={handleDelete} className="p-2 bg-red-600 rounded-full text-white hover:bg-red-500 transition-colors"><DeleteIcon /></button>
          </div>
      )}
      <Link to={`/portfolio/${project.id}`} className="block w-full h-full">
        <img
          src={project.thumbnail || fallbackThumbnail}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 transition-opacity duration-500 group-hover:bg-opacity-70" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
          <div
            className="transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-in-out"
          >
            <h3 className="text-xl font-bold uppercase">{project.title}</h3>
            <p className="text-sm text-neutral-300">{project.category}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProjectCard;