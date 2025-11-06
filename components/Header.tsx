// 🧭 Navigation Header
// This component is the site's main navigation.
// It renders as a fixed vertical bar on the left (on desktop) or a top bar (on mobile),
// ensuring it's always accessible.

import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', name: 'Home' },
  { path: '/portfolio', name: 'Portfolio' },
  { path: '/about', name: 'About' },
  { path: '/contact', name: 'Contact' },
];

function Header() {
  return (
    <header className="fixed top-0 left-0 z-50 w-full bg-black bg-opacity-50 backdrop-blur-sm md:w-20 md:h-full md:bg-transparent md:backdrop-blur-none">
      <div className="flex justify-center md:flex-col md:h-full md:items-center p-2 md:py-8">
        <NavLink to="/" className="text-2xl font-black text-white mb-0 md:mb-16 hidden md:block">V.</NavLink>
        <nav className="w-full">
          <ul className="flex justify-around items-center md:flex-col md:space-y-8">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `text-xs font-bold uppercase tracking-widest transition-colors duration-300 md:[writing-mode:vertical-rl] md:rotate-180 ${
                      isActive ? 'text-white' : 'text-neutral-500 hover:text-white'
                    }`
                  }
                >
                  <motion.span
                     className="block p-2 md:py-4"
                     whileHover={{ scale: 1.1 }}
                     whileTap={{ scale: 0.95 }}
                  >
                      {item.name}
                  </motion.span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;