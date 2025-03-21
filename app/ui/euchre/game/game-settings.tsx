'use client';

import {
  EuchreSettings,
  GAME_SPEED_MAP,
  GameSpeed,
  TEAM_COLOR_MAP,
  TeamColor
} from '@/app/lib/euchre/definitions';
import { ChangeEvent, useState } from 'react';

type Props = {
  settings: EuchreSettings;
  onNewGame: () => void;
  onApplySettings: (settings: EuchreSettings) => void;
  onRunFullGame: () => void;
};

export default function GameSettings({ settings, onNewGame, onApplySettings, onRunFullGame }: Props) {
  const [teamOneColor, setTeamOneColor] = useState<TeamColor>(settings.teamOneColor ?? 'blue');
  const [teamTwoColor, setTeamTwoColor] = useState<TeamColor>(settings.teamTwoColor ?? 'red');
  const teamColors = [...TEAM_COLOR_MAP.keys()];
  const gameSpeedValues = [...GAME_SPEED_MAP.entries()];

  const handleNewGame = () => {
    onNewGame();
  };

  const handleRunTestGame = () => {
    onRunFullGame();
  };

  const handleTeamColorChange = (teamNumber: number, value: TeamColor) => {
    if (teamNumber === 1) {
      if (value === teamTwoColor) {
        const newVal = teamColors.find((c) => c !== teamTwoColor);
        if (newVal) setTeamTwoColor(newVal);
      }
      setTeamOneColor(value);
    } else {
      if (teamOneColor === value) {
        const newVal = teamColors.find((c) => c !== teamOneColor);
        if (newVal) setTeamOneColor(newVal);
      }
      setTeamTwoColor(value);
    }

    onApplySettings({ ...settings, teamOneColor: teamOneColor, teamTwoColor: teamTwoColor });
  };

  const handleSpeedChanged = (value: string) => {
    onApplySettings({ ...settings, gameSpeed: parseInt(value) as GameSpeed });
  };

  const handleCheckChanged = (e: ChangeEvent<HTMLInputElement>) => {
    onApplySettings({ ...settings, [e.target.name]: e.target.checked });
  };

  const handleTestButtonClick = () => {
    // const game = createEuchreGame();
    // game.currentPlayer = game.player1;
    // game.dealer = game.player1;
    // game.player1.assignCards = [
    //   new Card('♠', 'Q'),
    //   new Card('♠', 'J'),
    //   new Card('♣', 'J'),
    //   new Card('♣', 'K'),
    //   new Card('♥', 'A')
    // ];
    // game.trump = new Card('♠', '9');
    // const computerChoice = game.currentPlayer.determineBid(game, game.trump, false);
  };

  const handleTestButtonClick2 = () => {
    // const suits: Suit[] = ['♠', '♣', '♥', '♦'];
    // const game = createEuchreGame();
    // game.currentPlayer = game.player1;
    // game.dealer = game.player1;
    // const t1 = new EuchreTrick(1);
    // t1.cardsPlayed.push(new EuchreCard(game.player2, new Card('♦', 'A')));
    // game.currentTricks.push(new EuchreTrick(1));
    // game.player1.assignCards = [
    //   new Card('♦', '9'),
    //   new Card('♥', 'Q'),
    //   new Card('♥', 'J'),
    //   new Card('♠', 'J'),
    //   new Card('♣', '10')
    // ];
    // game.trump = new Card('♥', '2');
    // const computerChoice = game.currentPlayer.determineCardToPlay(game);
  };

  const handleTestButtonClick3 = () => {
    // const game = createEuchreGame();
    // game.currentPlayer = game.player1;
    // game.dealer = game.player1;
    // game.currentTricks.push(new EuchreTrick(1));
    // game.player1.assignCards = [
    //   new Card('♥', '9'),
    //   new Card('♥', 'A'),
    //   new Card('♣', 'J'),
    //   new Card('♥', 'K'),
    //   new Card('♠', 'Q')
    // ];
    // game.trump = new Card('♠', 'J');
    // const computerChoice = game.currentPlayer.determineBid(game, game.trump, false);
  };

  return (
    <div className="bg-stone-800 text-white p-1">
      <div className="flex gap-4 my-2 justify-center">
        <div>
          <label>Animate: </label>
          <input
            type="checkbox"
            name="shouldAnimate"
            checked={settings.shouldAnimate}
            onChange={(e) => handleCheckChanged(e)}
          />
        </div>
        <div>
          <label>Show Hand Results: </label>
          <input
            type="checkbox"
            name="showHandResult"
            checked={settings.showHandResult}
            onChange={(e) => handleCheckChanged(e)}
          />
        </div>
        <div>
          <label>Allow Renege: </label>
          <input
            type="checkbox"
            name="allowRenege"
            checked={settings.allowRenege}
            onChange={(e) => handleCheckChanged(e)}
          />
        </div>
        <div>
          <label>Auto Follow Suit: </label>
          <input
            type="checkbox"
            name="autoFollowSuit"
            checked={settings.autoFollowSuit}
            onChange={(e) => handleCheckChanged(e)}
          />
        </div>
        <div>
          <label>Debug Always Pass: </label>
          <input
            type="checkbox"
            name="debugAlwaysPass"
            checked={settings.debugAlwaysPass}
            onChange={(e) => handleCheckChanged(e)}
          />
        </div>
        <div>
          <label>Debug Show Hands When Passed: </label>
          <input
            type="checkbox"
            name="debugShowHandsWhenPassed"
            checked={settings.debugShowHandsWhenPassed}
            onChange={(e) => handleCheckChanged(e)}
          />
        </div>
        <div>
          <label>Debug Show Player Hands: </label>
          <input
            type="checkbox"
            name="debugShowPlayersHand"
            checked={settings.debugShowPlayersHand}
            onChange={(e) => handleCheckChanged(e)}
          />
        </div>
      </div>
      <div className="my-4 flex justify-center gap-2">
        <label>Game Speed: </label>
        <select
          value={settings.gameSpeed}
          className="text-black"
          onChange={(e) => handleSpeedChanged(e.target.value)}
        >
          {gameSpeedValues.map((value) => {
            return (
              <option key={value[1]} value={value[1]}>
                {value[0]}
              </option>
            );
          })}
        </select>
        <label>Team 1 Color: </label>
        <select
          onChange={(e) => handleTeamColorChange(1, (e.target.value as TeamColor) ?? 'blue')}
          className="text-black"
          value={teamOneColor}
        >
          {teamColors.map((k) => (
            <option key={k} value={k}>
              {k.substring(0, 1).toUpperCase() + k.substring(1)}
            </option>
          ))}
        </select>
        <label>Team 2 Color: </label>
        <select
          onChange={(e) => handleTeamColorChange(2, (e.target.value as TeamColor) ?? 'red')}
          className="text-black"
          value={teamTwoColor}
        >
          {teamColors.map((k) => (
            <option key={k} value={k}>
              {k.substring(0, 1).toUpperCase() + k.substring(1)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-center gap-2">
        <button className="text-white border border-white p-2" onClick={handleNewGame}>
          Start Game
        </button>
        <button className="text-white border border-white p-2" onClick={handleRunTestGame}>
          Run Test Game
        </button>
        {/* <button className="text-white border border-white p-2" onClick={handleApplySettings}>
      Apply Settings
    </button> */}
      </div>
      {/* <div className="flex justify-center my-2">
    <button className="text-white border border-white p-2" onClick={handleTestButtonClick2}>
      Run Test
    </button>
  </div> */}
    </div>
  );
}
