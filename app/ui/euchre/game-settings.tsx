'use client';

import { Card, EuchreSettings, EuchreTrick } from "@/app/lib/euchre/data";
import { createEuchreGame } from "@/app/lib/euchre/game";
import { useEffect, useRef, useState } from "react";

type Props = {
    settings: EuchreSettings | undefined,
    onNewGame: () => void,
    onApplySettings: (settings: EuchreSettings) => void,
}

export default function GameSettings({ settings, onNewGame, onApplySettings }: Props) {

    const [newGameStart, setNewGameStart] = useState(false);
    const animate = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (newGameStart)
            onNewGame();
    }, [newGameStart]);

    const handleNewGame = () => {
        const newSettings: EuchreSettings = { ...settings, shouldAnimate: animate.current?.checked ?? true };
        onApplySettings(newSettings);
        setNewGameStart(true);
    }

    const handleApplySettings = () => {
        const newSettings: EuchreSettings = { ...settings, shouldAnimate: animate.current?.checked ?? true };
        onApplySettings(newSettings);
    }

    const handleTestButtonClick = () => {
        const game = createEuchreGame();
        game.currentPlayer = game.player1;
        game.dealer = game.player1;
        game.player1.hand = [new Card("♠", "Q"), new Card("♠", "J"), new Card("♣", "J"), new Card("♣", "K"), new Card("♥", "A")];
        game.trump = new Card("♠", "9");
        const computerChoice = game.currentPlayer.determineBid(game, game.trump, false);
    }

    const handleTestButtonClick2 = () => {
        const game = createEuchreGame();
        game.currentPlayer = game.player1;
        game.dealer = game.player1;
        game.currentRoundTricks.push(new EuchreTrick(1));
        game.player1.hand = [new Card("♦", "Q"), new Card("♦", "J"), new Card("♣", "J"), new Card("♦", "K"), new Card("♦", "Q")];
        game.trump = new Card("♠", "2");

        const computerChoice = game.currentPlayer.determineCardToPlay(game);
    }

    return (
        <div>
            <div>
                <label>Animate: </label>
                <input
                    type="checkbox"
                    ref={animate}
                    defaultChecked={settings?.shouldAnimate} />
            </div>
            <div className="flex justify-center gap-2">
                <button className="text-white border border-white p-2 rounded" onClick={handleNewGame}>Create Game</button>
                <button className="text-white border border-white p-2 rounded" onClick={handleApplySettings}>Apply Settings</button>
            </div>
            <div className="flex justify-center my-2">
                <button className="text-white border border-white p-2 rounded" onClick={handleTestButtonClick2}>Run Test</button>
            </div>
        </div>);
} 