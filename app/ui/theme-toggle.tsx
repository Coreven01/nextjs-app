'use client';

import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

type Props = {
  useMobile: boolean;
};

const ThemeToggle = ({ useMobile }: Props) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if dark mode is already enabled in localStorage
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode && savedMode === 'enabled') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else if (savedMode && savedMode === 'disabled') {
      setIsDark(false);
    } else {
      // If not found in local storage, check browser settings to see if user perfers dark mode.
      const preferDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (preferDarkMode) {
        setIsDark(true);
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  const onToggleDarkMode = () => {
    // Toggle dark mode on the <html> element
    const newMode = !isDark;
    setIsDark(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'enabled');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'disabled');
    }
  };

  return (
    <>
      <button
        onClick={onToggleDarkMode}
        className="p-1 h-9 w-9 border border-black dark:border-white bg-zinc-200 dark:bg-neutral-900 dark:bg-opacity-10 text-black dark:text-white rounded-md"
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>
    </>
  );
};

export default ThemeToggle;
