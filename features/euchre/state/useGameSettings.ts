import { useCallback, useEffect, useState } from 'react';
import { INIT_GAME_SETTINGS } from '../definitions/definitions';
import { EuchreSettings } from '../definitions/game-state-definitions';

const getInitPlayerName = () => {
  const names = ['Joe', 'Jim', 'Jack', 'Jane', 'Joan', 'Jean'];
  const index = Math.round(Math.random() * (names.length - 1));

  return names[index];
};

const useGameSettings = () => {
  const [euchreSettings, setEuchreSettings] = useState<EuchreSettings>({
    ...INIT_GAME_SETTINGS,
    playerName: getInitPlayerName()
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('euchre-game-settings');

    if (savedSettings) {
      const setting = JSON.parse(savedSettings) as EuchreSettings;
      setEuchreSettings({ ...INIT_GAME_SETTINGS, ...setting });
    }
  }, []);

  const saveSettings = useCallback((settings: EuchreSettings) => {
    const json = JSON.stringify(settings);
    localStorage.setItem('euchre-game-settings', json);
    setEuchreSettings(settings);
  }, []);

  return { euchreSettings, saveSettings };
};

export default useGameSettings;
