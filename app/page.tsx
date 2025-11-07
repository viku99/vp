'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ProgressiveBackgroundImage from '@/components/ProgressiveBackgroundImage';

export default function HomePage() {
  const title = "VIKAS";
  const subtitle = "Motion Designer & VFX Storyteller.";

  const sentence = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.2,
        staggerChildren: 0.08,
      },
    },
  };

  const letter = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen text-center px-4 overflow-hidden">
      <ProgressiveBackgroundImage
        src="https://picsum.photos/seed/homepage/1920/1080"
        className="absolute inset-0 z-0"
      >
        <div className="absolute inset-0 bg-black opacity-60"></div>
      </ProgressiveBackgroundImage>

      <div className="relative z-10">
        <motion.h1
          className="text-6xl md:text-9xl font-black uppercase text-white tracking-tighter"
          variants={sentence}
          initial="hidden"
          animate="visible"
        >
          {title.split("").map((char, index) => (
            <motion.span key={char + "-" + index} variants={letter}>
              {char}
            </motion.span>
          ))}
        </motion.h1>

        <motion.h2
          className="text-lg md:text-2xl font-light text-neutral-300 mt-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          {subtitle}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-block mt-12"
        >
          <Link
            href="/portfolio"
            className="group block px-6 py-3 border border-white text-white uppercase text-sm tracking-widest hover:bg-white hover:text-black transition-all duration-300"
          >
            View Portfolio <span className="inline-block transition-transform duration-300 group-hover:translate-x-2">→</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};
