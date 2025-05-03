import { useEffect, useState } from 'react';
import { EuchreSettings } from '../../../lib/euchre/definitions/game-state-definitions';
import { INIT_GAME_SETTINGS } from '../../../lib/euchre/definitions/definitions';

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
      setEuchreSettings(setting);
    }
  }, []);

  const saveSettings = (setting: EuchreSettings) => {
    const json = JSON.stringify(setting);
    localStorage.setItem('euchre-game-settings', json);
    setEuchreSettings(setting);
  };

  return { euchreSettings, saveSettings };
};

export default useGameSettings;
