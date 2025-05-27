import { useCallback, useMemo, useState } from 'react';
import { EuchreSettings, GameMenuValues } from '../../definitions/game-state-definitions';

export default function useMenuItems(
  onCancel: () => void,
  onSaveSettings: (settings: EuchreSettings) => void
) {
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

  const handleCancel = useCallback(() => {
    onCancel();
    toggleSettings(false);
  }, [onCancel, toggleSettings]);

  const handleSaveSettings = useCallback(
    (settings: EuchreSettings) => {
      onSaveSettings(settings);
    },
    [onSaveSettings]
  );

  const menuValues: GameMenuValues = useMemo(
    () => ({
      isFullScreen,
      showEvents,
      showSettings,
      showScore,
      onToggleFullscreen: toggleFullScreen,
      onToggleEvents: toggleEvents,
      onToggleSettings: toggleSettings,
      onToggleScore: toggleScore,
      onCancel: handleCancel,
      onSaveSettings: handleSaveSettings
    }),
    [
      handleCancel,
      handleSaveSettings,
      isFullScreen,
      showEvents,
      showScore,
      showSettings,
      toggleEvents,
      toggleFullScreen,
      toggleScore,
      toggleSettings
    ]
  );

  return menuValues;
}
