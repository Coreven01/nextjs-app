'use client';

import { EuchreSettings } from "@/app/lib/euchre/data";
import { useState } from "react";

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

    return (
        <div>
            <div>
                <label>Animate: </label><input type="checkbox" defaultChecked={settings?.shouldAnimate} onChange={() => setAnimate(!animate)} />
            </div>
            <div className="flex justify-center">
                <button className="text-white border border-white p-2 rounded" onClick={handleNewGame}>Create Game</button>
            </div>

        </div>);
} 