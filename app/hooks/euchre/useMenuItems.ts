'use client';

import { useState } from 'react';

export default function useMenuItems() {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showSettings, setShowSettings] = useState(true);

  const toggleFullScreen = (value: boolean) => {
    setIsFullScreen(value);
  };

  const toggleEvents = (value: boolean) => {
    setShowEvents(value);
  };

  const toggleSettings = (value: boolean) => {
    setShowSettings(value);
  };

  return { isFullScreen, showEvents, showSettings, toggleFullScreen, toggleEvents, toggleSettings };
}
