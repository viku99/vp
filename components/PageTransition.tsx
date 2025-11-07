'use client';
import React, { ReactNode } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

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
const fadeVariants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.4, ease: 'easeInOut' } },
    exit: { opacity: 0, transition: { duration: 0.4, ease: 'easeInOut' } },
};

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const useCinematicTransition = pathname?.startsWith('/portfolio');

  return (
    <AnimatePresence mode="wait">
        <div key={pathname}>
            {useCinematicTransition ? (
                <>
                    <motion.div
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={cinematicContentVariants}
                    >
                    {children}
                    </motion.div>
                    <motion.div className="fixed top-0 left-0 w-full h-1/2 bg-neutral-900 z-[100] origin-bottom" initial="initial" animate="animate" exit="exit" variants={panelVariants}/>
                    <motion.div className="fixed bottom-0 left-0 w-full h-1/2 bg-neutral-900 z-[100] origin-top" initial="initial" animate="animate" exit="exit" variants={panelVariants}/>
                </>
            ) : (
                <motion.div
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={fadeVariants}
                >
                    {children}
                </motion.div>
            )}
        </div>
    </AnimatePresence>
  );
};
