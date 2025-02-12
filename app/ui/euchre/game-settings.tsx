import { EuchreSettings } from "@/app/lib/euchre/data";

type Props = {
    onNewGame: () => void,
    onApplySettings: (settings: EuchreSettings) => void,
}

export default function GameSettings({ onNewGame, onApplySettings }: Props) {

    return (
        <div>
            <button className="text-white" onClick={onNewGame}>Create Game</button>
        </div>);
}