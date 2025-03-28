'use client';

import {
  DIFFICULTY_MAP,
  EuchreSettings,
  GAME_SPEED_MAP,
  GameSpeed,
  TEAM_COLOR_MAP,
  TeamColor
} from '@/app/lib/euchre/definitions';
import { ChangeEvent, useState } from 'react';
import Switch from '@mui/material/Switch';

type Props = {
  settings: EuchreSettings;
  onNewGame: () => void;
  onApplySettings: (settings: EuchreSettings) => void;
  onRunFullGame: () => void;
  onRunFullGameLoop: () => void;
};

export default function GameSettings({
  settings,
  onNewGame,
  onApplySettings,
  onRunFullGame,
  onRunFullGameLoop
}: Props) {
  const [teamOneColor, setTeamOneColor] = useState<TeamColor>(settings.teamOneColor ?? 'blue');
  const [teamTwoColor, setTeamTwoColor] = useState<TeamColor>(settings.teamTwoColor ?? 'red');
  const [playerName, setPlayerName] = useState(settings.playerName);

  const teamColors = [...TEAM_COLOR_MAP.keys()];
  const gameSpeedValues = [...GAME_SPEED_MAP.entries()];
  const difficultyValues = [...DIFFICULTY_MAP.entries()];

  const handleNewGame = () => {
    onNewGame();
  };

  const handleRunTestGame = () => {
    onRunFullGame();
  };

  const handleRunTestGameLoop = () => {
    onRunFullGameLoop();
  };

  const handleTeamColorChange = (teamNumber: number, value: TeamColor) => {
    let tempTeamOne = teamOneColor;
    let tempTeamTwo = teamTwoColor;

    if (teamNumber === 1) {
      if (value === teamTwoColor) {
        const newVal = teamColors.find((c) => c !== teamTwoColor);
        if (newVal) {
          setTeamTwoColor(newVal);
          tempTeamTwo = newVal;
        }
      }
      setTeamOneColor(value);
      tempTeamOne = value;
    } else {
      if (teamOneColor === value) {
        const newVal = teamColors.find((c) => c !== teamOneColor);
        if (newVal) {
          setTeamOneColor(newVal);
          tempTeamOne = newVal;
        }
      }
      setTeamTwoColor(value);
      tempTeamTwo = value;
    }

    onApplySettings({ ...settings, teamOneColor: tempTeamOne, teamTwoColor: tempTeamTwo });
  };

  const handleSpeedChanged = (event: ChangeEvent<HTMLSelectElement>) => {
    onApplySettings({ ...settings, gameSpeed: parseInt(event.target.value) as GameSpeed });
  };

  const handleCheckChanged = (e: ChangeEvent<HTMLInputElement>) => {
    onApplySettings({ ...settings, [e.target.name]: e.target.checked });
  };

  const handleSelectionChanged = (event: ChangeEvent<HTMLSelectElement>) => {
    onApplySettings({ ...settings, [event.target.name]: event.target.value });
  };

  const handlePlayerNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPlayerName(event.target.value);
  };

  const handleLoseFocus = () => {
    setPlayerName(playerName.trim().length === 0 ? 'Joe' : playerName.trim());
    onApplySettings({ ...settings, playerName: playerName.trim().length === 0 ? 'Joe' : playerName.trim() });
  };

  return (
    <div className="bg-stone-800 text-white p-1">
      <div className="flex items-center gap-4 my-2 md:text-base text-sm">
        <label htmlFor="playerName">Player Name: </label>
        <input
          className="text-black max-w-32"
          placeholder="Player Name"
          id="playerName"
          type="text"
          maxLength={8}
          value={playerName}
          onChange={handlePlayerNameChange}
          onBlur={handleLoseFocus}
        />
      </div>
      <div className="flex gap-4 my-2 md:text-base text-sm">
        <div className="flex-grow">
          <div>
            <label htmlFor="showHandResult">Show Hand Results: </label>
            <Switch
              id="showHandResult"
              size="small"
              checked={settings.showHandResult}
              name="showHandResult"
              color="success"
              onChange={(e) => handleCheckChanged(e)}
            />
          </div>
          <div>
            <label htmlFor="allowRenege">Allow Renege: </label>
            <Switch
              id="allowRenege"
              size="small"
              checked={settings.allowRenege}
              name="allowRenege"
              color="success"
              onChange={(e) => handleCheckChanged(e)}
            />
          </div>
          <div>
            <label htmlFor="autoFollowSuit">Auto Follow Suit: </label>
            <Switch
              id="autoFollowSuit"
              size="small"
              checked={settings.autoFollowSuit}
              name="autoFollowSuit"
              color="success"
              onChange={(e) => handleCheckChanged(e)}
            />
          </div>
        </div>

        <div className="flex-grow">
          <div>
            <label htmlFor="debugAlwaysPass">Debug Always Pass: </label>
            <Switch
              id="debugAlwaysPass"
              size="small"
              checked={settings.debugAlwaysPass}
              name="debugAlwaysPass"
              color="success"
              onChange={(e) => handleCheckChanged(e)}
            />
          </div>
          <div>
            <label htmlFor="debugShowHandsWhenPassed">Debug Show Hands When Passed: </label>
            <Switch
              id="debugShowHandsWhenPassed"
              size="small"
              checked={settings.debugShowHandsWhenPassed}
              name="debugShowHandsWhenPassed"
              color="success"
              onChange={(e) => handleCheckChanged(e)}
            />
          </div>
          <div>
            <label htmlFor="debugShowPlayersHand">Debug Show Player Hands: </label>
            <Switch
              id="debugShowPlayersHand"
              size="small"
              checked={settings.debugShowPlayersHand}
              name="debugShowPlayersHand"
              color="success"
              onChange={(e) => handleCheckChanged(e)}
            />
          </div>
        </div>
      </div>
      <div className="my-4 flex justify-center items-center gap-1 md:text-base text-sm">
        <div className="m-auto">
          <label className="block" htmlFor="difficulty">
            Difficulty:
          </label>
          <select
            id="difficulty"
            name="difficulty"
            onChange={handleSelectionChanged}
            className="text-black md:p-2 p-1 min-w-32 max-h-8 md:max-h-12 md:text-base text-sm"
            value={settings.difficulty}
          >
            {difficultyValues.map((value) => {
              return (
                <option key={value[1]} value={value[1]}>
                  {value[0]}
                </option>
              );
            })}
          </select>
        </div>
        <div className="m-auto">
          <label className="block" htmlFor="gameSpeed">
            Game Speed:
          </label>
          <select
            id="gameSpeed"
            onChange={handleSpeedChanged}
            className="text-black md:p-2 p-1 min-w-24 max-h-8 md:max-h-12 md:text-base text-sm"
            value={settings.gameSpeed}
          >
            {gameSpeedValues.map((value) => {
              return (
                <option key={value[1]} value={value[1]}>
                  {value[0]}
                </option>
              );
            })}
          </select>
        </div>
        <div className="m-auto">
          <label className="block" id="teamOneColor">
            Team 1 Color:
          </label>
          <select
            id="teamOneColor"
            onChange={(e) => handleTeamColorChange(1, (e.target.value as TeamColor) ?? 'blue')}
            className="text-black md:p-2 p-1 min-w-24 max-h-8 md:max-h-12 md:text-base text-sm"
            value={teamOneColor}
          >
            {teamColors.map((k) => (
              <option key={k} value={k}>
                {k.substring(0, 1).toUpperCase() + k.substring(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="m-auto">
          <label className="block" id="teamTwoColor">
            Team 2 Color:{' '}
          </label>
          <select
            id="teamTwoColor"
            onChange={(e) => handleTeamColorChange(2, (e.target.value as TeamColor) ?? 'red')}
            className="text-black md:p-2 p-1 min-w-24 max-h-8 md:max-h-12 md:text-base text-sm"
            value={teamTwoColor}
          >
            {teamColors.map((k) => (
              <option key={k} value={k}>
                {k.substring(0, 1).toUpperCase() + k.substring(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-center gap-2 md:text-base text-sm">
        <button
          className="border border-white bg-stone-900 hover:bg-amber-100 hover:text-black p-1"
          onClick={handleNewGame}
        >
          Start Game
        </button>
        <button className="text-white border border-white md:p-2 p-1" onClick={handleRunTestGame}>
          Run Test Game
        </button>
        <button className="text-white border border-white md:p-2 p-1" onClick={handleRunTestGameLoop}>
          Run Test Game Loop
        </button>
      </div>
    </div>
  );
}
