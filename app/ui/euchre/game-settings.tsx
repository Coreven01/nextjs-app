'use client';

import { Card, EuchreSettings } from "@/app/lib/euchre/data";
import { createEuchreGame } from "@/app/lib/euchre/game";
import { logConsole } from "@/app/lib/euchre/util";
import { useCallback, useState } from "react";

type Props = {
    settings: EuchreSettings | undefined,
    onNewGame: () => void,
    onApplySettings: (settings: EuchreSettings) => void,
}

export default function GameSettings({ settings, onNewGame, onApplySettings }: Props) {

    const [animate, setAnimate] = useState(settings?.shouldAnimate ?? true);

    const handleNewGame = () => {
        const newSettings: EuchreSettings = { ...settings, shouldAnimate: animate };
        onApplySettings(newSettings);
        onNewGame();
    }

    const handleTestButtonClick = () => {
        const game = createEuchreGame();
        game.currentPlayer = game.player1;
        game.dealer = game.player1;
        game.player1.hand = [new Card("♠", "Q"), new Card("♠", "J"), new Card("♣", "J"), new Card("♣", "K"), new Card("♥", "A")];
        game.trump = new Card("♠", "9");
        const computerChoice = game.currentPlayer.determineBid(game, game.trump, false);
        logConsole(computerChoice);
    }

    const [count, setCount] = useState(0);

    // Memoizing logMessage so it doesn't get re-created on every render
    const logMessage = useCallback(() => {
        setCount(count + 1);
        console.log("Current time: ", new Date().toTimeString(), " Count: ", count);
    }, []);  // The function will only be re-created if `count` changes

    return (
        <div>
            <div>
                <label>Animate: </label><input type="checkbox" defaultChecked={settings?.shouldAnimate} onChange={() => setAnimate(!animate)} />
            </div>
            <div className="flex justify-center">
                <button className="text-white border border-white p-2 rounded" onClick={handleNewGame}>Create Game</button>
            </div>
            <div className="flex justify-center my-2">
                <button className="text-white border border-white p-2 rounded" onClick={handleTestButtonClick}>Run Test</button>
            </div>

            <div className="flex justify-center my-2">
                <button className="text-white border border-white p-2 rounded" onClick={logMessage}>Run Test2</button>
            </div>
        </div>);
} 