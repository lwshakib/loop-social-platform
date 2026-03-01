/**
 * useIsMobile Hook
 * Custom hook to detect if the current viewport is mobile-sized (below 768px).
 * Useful for conditional rendering of components or adjusting layouts dynamically.
 */

import * as React from 'react';

// The standard breakpoint for tablets/mobile (Tailwind's 'md' usually starts here)
const MOBILE_BREAKPOINT = 768;

/**
 * useIsMobile
 * Tracks the browser window width and returns true if it's below the MOBILE_BREAKPOINT.
 *
 * @returns boolean indicating if the current screen is mobile size.
 */
export function useIsMobile() {
  // undefined initial state ensures it doesn't flicker incorrectly on first SSRHydration
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // Define the media query to match
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    // Handler to check the current window state
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Listen for window resizing events via the media query listener
    mql.addEventListener('change', onChange);

    // Run an initial check on mount
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    // CLEANUP: Remove the event listener when the component unmounts
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // Use the double-bang '!!' to ensure we return a strict boolean
  return !!isMobile;
}
