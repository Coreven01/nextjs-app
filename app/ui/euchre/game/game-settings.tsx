import {
  DEFAULT_GAME_SETTINGS,
  DIFFICULTY_MAP,
  EuchreSettings,
  GAME_SPEED_MAP,
  GameSpeed,
  NOTIFICATION_SPEED_MAP,
  TEAM_COLOR_MAP,
  TeamColor
} from '@/app/lib/euchre/definitions';
import { ChangeEvent, useState } from 'react';
import Switch from '@mui/material/Switch';
import PromptHeader from '../prompt/prompt-header';

type Props = {
  settings: EuchreSettings;
  onReturn: () => void;
  onApplySettings: (settings: EuchreSettings) => void;
  onRunFullGame: () => void;
  onRunFullGameLoop: () => void;
};

const GameSettings = ({ settings, onReturn, onApplySettings, onRunFullGame, onRunFullGameLoop }: Props) => {
  const [teamOneColor, setTeamOneColor] = useState<TeamColor>(settings.teamOneColor ?? 'blue');
  const [teamTwoColor, setTeamTwoColor] = useState<TeamColor>(settings.teamTwoColor ?? 'red');
  const [playerName, setPlayerName] = useState(settings.playerName);

  const teamColors = [...TEAM_COLOR_MAP.keys()];
  const gameSpeedValues = [...GAME_SPEED_MAP.entries()];
  const notificationSpeedValues = [...NOTIFICATION_SPEED_MAP.entries()];
  const difficultyValues = [...DIFFICULTY_MAP.entries()];
  const isDebugMode = true;

  //#region Handlers
  const handleReturn = () => {
    onReturn();
  };

  const handleSetDefaultSettings = () => {
    onApplySettings({ ...settings, ...DEFAULT_GAME_SETTINGS });
  };

  const handleRunTestGame = () => {
    onRunFullGame();
  };

  const handleRunTestGameLoop = () => {
    onRunFullGameLoop();
  };

  const handleApplyAutoSettings = () => {
    onApplySettings({
      ...settings,
      showHandResult: false,
      stickTheDealer: true,
      debugAllComputerPlayers: true,
      gameSpeed: 700
    });
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

  const handleNotificationSpeedChanged = (event: ChangeEvent<HTMLSelectElement>) => {
    onApplySettings({ ...settings, notificationSpeed: parseInt(event.target.value) as GameSpeed });
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
  //#endregion

  return (
    <div className="bg-stone-800 text-white lg:p-2 p-1">
      <PromptHeader>Settings</PromptHeader>
      <div className="flex items-center jusitify-center gap-4 my-2 lg:text-base text-sm">
        <div className="grow">
          <label className="block" htmlFor="playerName">
            Player Name:{' '}
          </label>
          <input
            className="text-black max-w-32 text-sm lg:p-1 lg:text-base"
            placeholder="Player Name"
            id="playerName"
            type="text"
            maxLength={8}
            value={playerName}
            onChange={handlePlayerNameChange}
            onBlur={handleLoseFocus}
          />
        </div>
        <div className="grow">
          <label className="block" htmlFor="difficulty">
            Difficulty:
          </label>
          <select
            id="difficulty"
            name="difficulty"
            onChange={handleSelectionChanged}
            className="text-black lg:p-1 min-w-48 max-h-8 lg:max-h-12 lg:text-base text-sm"
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
      </div>
      <div className="grid gap-2 grid-cols-2 my-2 lg:text-base text-sm">
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
          <label htmlFor="enforceFollowSuit">Enforce Follow Suit: </label>
          <Switch
            id="enforceFollowSuit"
            size="small"
            checked={settings.enforceFollowSuit}
            name="enforceFollowSuit"
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
        <div>
          <label htmlFor="stickTheDealer">Stick The Dealer: </label>
          <Switch
            id="stickTheDealer"
            size="small"
            checked={settings.stickTheDealer}
            name="stickTheDealer"
            color="success"
            onChange={(e) => handleCheckChanged(e)}
          />
        </div>
        <div>
          <label htmlFor="viewPlayerInfoDetail">Player Info Detail: </label>
          <Switch
            id="viewPlayerInfoDetail"
            size="small"
            checked={settings.viewPlayerInfoDetail}
            name="viewPlayerInfoDetail"
            color="success"
            onChange={(e) => handleCheckChanged(e)}
          />
        </div>
      </div>

      {isDebugMode && (
        <div className="grid gap-2 grid-cols-2 my-2 lg:text-base text-sm bg-stone-700 p-2 border border-white">
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
          <div>
            {' '}
            <label htmlFor="debugAllComputerPlayers">Debug All Computer Players: </label>
            <Switch
              id="debugAllComputerPlayers"
              size="small"
              checked={settings.debugAllComputerPlayers}
              name="debugAllComputerPlayers"
              color="success"
              onChange={(e) => handleCheckChanged(e)}
            />
          </div>
        </div>
      )}
      <div className="my-4 flex justify-center items-center gap-1 lg:text-base text-sm">
        <div className="m-auto">
          <label className="block" htmlFor="gameSpeed">
            Game Speed:
          </label>
          <select
            id="gameSpeed"
            onChange={handleSpeedChanged}
            className="text-black lg:min-w-32 lg:p-1 min-w-24 max-h-8 lg:max-h-12 lg:text-base text-sm"
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
          <label className="block" htmlFor="notificationSpeed">
            Notification Speed:
          </label>
          <select
            id="notificationSpeed"
            onChange={handleNotificationSpeedChanged}
            className="text-black lg:min-w-32 lg:p-1 min-w-24 max-h-8 lg:max-h-12 lg:text-base text-sm"
            value={settings.notificationSpeed}
          >
            {notificationSpeedValues.map((value) => {
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
            className="text-black lg:p-1 min-w-24 max-h-8 lg:max-h-12 lg:text-base text-sm"
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
            className="text-black lg:p-1 min-w-24 max-h-8 lg:max-h-12 lg:text-base text-sm"
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
      <div className="flex justify-center gap-2 lg:text-base text-sm">
        <button
          className="border border-white bg-stone-900 hover:bg-amber-100 hover:text-black p-1"
          onClick={handleReturn}
        >
          Main Menu
        </button>
        <button
          className="border border-white bg-stone-900 hover:bg-amber-100 hover:text-black p-1"
          onClick={handleSetDefaultSettings}
        >
          Default Settings
        </button>
      </div>
      {isDebugMode && (
        <div className="flex justify-center gap-2 lg:text-base text-sm mt-2">
          <button className="text-white border border-white lg:p-2 p-1" onClick={handleRunTestGame}>
            Run Test Game
          </button>
          <button className="text-white border border-white lg:p-2 p-1" onClick={handleRunTestGameLoop}>
            Run Test Game Loop
          </button>
          <button className="text-white border border-white lg:p-2 p-1" onClick={handleApplyAutoSettings}>
            Set Auto Settings
          </button>
        </div>
      )}
    </div>
  );
};

export default GameSettings;
