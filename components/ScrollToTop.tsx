// 📜 Scroll To Top
// This component ensures that the window scrolls to the top whenever the route changes.
// It provides a better user experience, especially for long pages, by preventing
// the scroll position from being retained between page navigations.

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [pathname]);

  return null; // This component does not render any UI
}

export default ScrollToTop;