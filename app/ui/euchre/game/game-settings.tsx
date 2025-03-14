'use client';

import {
  Card,
  EuchreCard,
  EuchreSettings,
  EuchreTrick,
  GAME_SPEED_MAP,
  GameSpeed,
  Suit,
  TEAM_COLOR_MAP,
  TeamColor
} from '@/app/lib/euchre/definitions';
import { createEuchreGame } from '@/app/lib/euchre/game';
import { useEffect, useRef, useState } from 'react';

type Props = {
  settings: EuchreSettings | undefined;
  onNewGame: () => void;
  onApplySettings: (settings: EuchreSettings) => void;
};

export default function GameSettings({ settings, onNewGame, onApplySettings }: Props) {
  const [newGameStart, setNewGameStart] = useState(false);
  const animate = useRef<HTMLInputElement>(null);
  const debugAlwaysPass = useRef<HTMLInputElement>(null);
  const gameSpeed = useRef<HTMLSelectElement>(null);
  const showHandResult = useRef<HTMLInputElement>(null);
  const allowRenege = useRef<HTMLInputElement>(null);
  const autoPlayLastCard = useRef<HTMLInputElement>(null);
  const [teamOneColor, setTeamOneColor] = useState<TeamColor>(settings?.teamOneColor ?? 'blue');
  const [teamTwoColor, setTeamTwoColor] = useState<TeamColor>(settings?.teamTwoColor ?? 'red');

  const teamColors = [...TEAM_COLOR_MAP.keys()];
  const gameSpeedValues = [...GAME_SPEED_MAP.entries()];

  useEffect(() => {
    if (newGameStart) onNewGame();
  }, [newGameStart, onNewGame]);

  const getSettings = (): EuchreSettings => {
    const newSettings: EuchreSettings = {
      ...settings,
      shouldAnimate: animate.current?.checked ?? true,
      debugAlwaysPass: debugAlwaysPass.current?.checked ?? true,
      gameSpeed: (parseInt(gameSpeed.current?.value ?? '300') as GameSpeed) ?? 300,
      showHandResult: showHandResult.current?.checked ?? true,
      allowRenege: allowRenege.current?.checked ?? true,
      teamOneColor: teamOneColor,
      teamTwoColor: teamTwoColor,
      autoPlayLastCard: autoPlayLastCard.current?.checked ?? true
    };

    return newSettings;
  };
  const handleNewGame = () => {
    onApplySettings(getSettings());
    setNewGameStart(true);
  };

  const handleApplySettings = () => {
    onApplySettings(getSettings());
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
  };

  const handleTestButtonClick = () => {
    const game = createEuchreGame();
    game.currentPlayer = game.player1;
    game.dealer = game.player1;
    game.player1.assignCards = [
      new Card('♠', 'Q'),
      new Card('♠', 'J'),
      new Card('♣', 'J'),
      new Card('♣', 'K'),
      new Card('♥', 'A')
    ];
    game.trump = new Card('♠', '9');
    const computerChoice = game.currentPlayer.determineBid(game, game.trump, false);
  };

  const handleTestButtonClick2 = () => {
    const suits: Suit[] = ['♠', '♣', '♥', '♦'];
    const game = createEuchreGame();
    game.currentPlayer = game.player1;
    game.dealer = game.player1;
    const t1 = new EuchreTrick(1);
    t1.cardsPlayed.push(new EuchreCard(game.player2, new Card('♦', 'A')));
    game.currentTricks.push(new EuchreTrick(1));
    game.player1.assignCards = [
      new Card('♦', '9'),
      new Card('♥', 'Q'),
      new Card('♥', 'J'),
      new Card('♠', 'J'),
      new Card('♣', '10')
    ];
    game.trump = new Card('♥', '2');

    const computerChoice = game.currentPlayer.determineCardToPlay(game);
  };

  const handleTestButtonClick3 = () => {
    const game = createEuchreGame();
    game.currentPlayer = game.player1;
    game.dealer = game.player1;
    game.currentTricks.push(new EuchreTrick(1));
    game.player1.assignCards = [
      new Card('♥', '9'),
      new Card('♥', 'A'),
      new Card('♣', 'J'),
      new Card('♥', 'K'),
      new Card('♠', 'Q')
    ];
    game.trump = new Card('♠', 'J');

    const computerChoice = game.currentPlayer.determineBid(game, game.trump, false);
  };

  return (
    <div>
      <div className="flex gap-4 my-2 justify-center">
        <div>
          <label>Animate: </label>
          <input type="checkbox" ref={animate} defaultChecked={settings?.shouldAnimate} />
        </div>
        <div>
          <label>Show Hand Results: </label>
          <input type="checkbox" ref={showHandResult} defaultChecked={settings?.showHandResult} />
        </div>
        <div>
          <label>Allow Renege: </label>
          <input type="checkbox" ref={allowRenege} defaultChecked={settings?.allowRenege} />
        </div>
        <div>
          <label>Auto Play Last Card: </label>
          <input type="checkbox" ref={autoPlayLastCard} defaultChecked={settings?.autoPlayLastCard} />
        </div>
        <div>
          <label>Debug Always Pass: </label>
          <input type="checkbox" ref={debugAlwaysPass} defaultChecked={settings?.debugAlwaysPass} />
        </div>
      </div>
      <div className="my-4 flex justify-center gap-2">
        <label>Game Speed: </label>
        <select className="text-black" ref={gameSpeed} defaultValue={settings?.gameSpeed}>
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
          Create Game
        </button>
        <button className="text-white border border-white p-2" onClick={handleApplySettings}>
          Apply Settings
        </button>
      </div>
      <div className="flex justify-center my-2">
        <button className="text-white border border-white p-2" onClick={handleTestButtonClick2}>
          Run Test
        </button>
      </div>
    </div>
  );
}
