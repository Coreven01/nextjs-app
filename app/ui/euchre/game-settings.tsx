'use client';

import { Card, EuchreCard, EuchreSettings, EuchreTrick, Suit } from '@/app/lib/euchre/definitions';
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

  useEffect(() => {
    if (newGameStart) onNewGame();
  }, [newGameStart, onNewGame]);

  const getSettings = (): EuchreSettings => {
    const newSettings: EuchreSettings = {
      ...settings,
      shouldAnimate: animate.current?.checked ?? true,
      debugAlwaysPass: debugAlwaysPass.current?.checked ?? true,
      gameSpeed: parseFloat(gameSpeed.current?.value ?? '1'),
      showHandResult: showHandResult.current?.checked ?? true
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
          <label>Debug Always Pass: </label>
          <input type="checkbox" ref={debugAlwaysPass} defaultChecked={settings?.debugAlwaysPass} />
        </div>
      </div>
      <div className="my-4 flex justify-center">
        <label>Game Speed: </label>
        <select className="text-black" ref={gameSpeed} defaultValue={settings?.gameSpeed}>
          <option value={0.25}>0.25x</option>
          <option value={0.5}>0.5x</option>
          <option value={0.75}>0.75x</option>
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={3}>3x</option>
        </select>
      </div>
      <div className="flex justify-center gap-2">
        <button className="text-white border border-white p-2 rounded" onClick={handleNewGame}>
          Create Game
        </button>
        <button
          className="text-white border border-white p-2 rounded"
          onClick={handleApplySettings}
        >
          Apply Settings
        </button>
      </div>
      <div className="flex justify-center my-2">
        <button
          className="text-white border border-white p-2 rounded"
          onClick={handleTestButtonClick2}
        >
          Run Test
        </button>
      </div>
    </div>
  );
}
