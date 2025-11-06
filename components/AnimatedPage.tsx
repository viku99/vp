// ✨ Page Animation Wrapper
// This is a higher-order component that wraps each page.
// It uses Framer Motion to apply page transitions. It now uses a cinematic
// "split panel" animation for the portfolio section and a faster, simpler
// fade animation for all other pages to improve UX.

// FIX: Import `ReactNode` explicitly to ensure consistent type resolution across the project.
import React, { ReactNode } from 'react';
import { motion, Variants } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// --- Cinematic Transition Variants (for Portfolio) ---
const panelVariants: Variants = {
  initial: { scaleY: 1 },
  animate: { scaleY: 0, transition: { duration: 0.5, ease: [0.87, 0, 0.13, 1] } },
  exit: { scaleY: 1, transition: { duration: 0.5, ease: [0.87, 0, 0.13, 1] } },
};

const cinematicContentVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25, delay: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

// --- Simple Fade Transition Variants (for other pages) ---
const fadeVariants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.4, ease: 'easeInOut' } },
    exit: { opacity: 0, transition: { duration: 0.4, ease: 'easeInOut' } },
};

interface AnimatedPageProps {
    // FIX: Changed React.ReactNode to the explicitly imported ReactNode for type consistency.
    // FIX: Made children optional to resolve incorrect TypeScript errors where the compiler fails to detect children passed via JSX.
    children?: ReactNode;
}

function AnimatedPage({ children }: AnimatedPageProps) {
  const location = useLocation();
  // Use the more dramatic transition for the portfolio gallery and project detail pages.
  const useCinematicTransition = location.pathname.startsWith('/portfolio');

  if (useCinematicTransition) {
    return (
      <>
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={cinematicContentVariants}
        >
          {children}
        </motion.div>

        {/* Top transition panel */}
        <motion.div
          className="fixed top-0 left-0 w-full h-1/2 bg-neutral-900 z-[100] origin-bottom"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={panelVariants}
        />
        
        {/* Bottom transition panel */}
        <motion.div
          className="fixed bottom-0 left-0 w-full h-1/2 bg-neutral-900 z-[100] origin-top"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={panelVariants}
        />
      </>
    );
  }

  // Default: use a simple fade transition for all other pages
  return (
    <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={fadeVariants}
    >
        {children}
    </motion.div>
  );
};

export default AnimatedPage;