import { useCallback, useState } from 'react';

export default function useMenuItems() {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showScore, setShowScore] = useState(true);

  const toggleFullScreen = useCallback((value: boolean) => {
    setIsFullScreen(value);
  }, []);

  const toggleEvents = useCallback((value: boolean) => {
    setShowEvents(value);
  }, []);

  const toggleSettings = useCallback((value: boolean) => {
    setShowSettings(value);
  }, []);

  const toggleScore = useCallback((value: boolean) => {
    setShowScore(value);
  }, []);

  return {
    isFullScreen,
    showEvents,
    showSettings,
    showScore,
    toggleFullScreen,
    toggleEvents,
    toggleSettings,
    toggleScore
  };
}
