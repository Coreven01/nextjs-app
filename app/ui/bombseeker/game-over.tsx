import clsx from "clsx";

type Props = {
    message: string,
    showGameOver: boolean,
    gameLost: boolean,
    onGameOverClick: () => void,
}

export default function GameOver({ message, showGameOver, gameLost, onGameOverClick }: Props) {

    return (
        <div onClick={onGameOverClick} className={clsx('absolute top-0 left-0 w-full h-full bg-neutral-800 bg-opacity-50', { 'hidden': !showGameOver })}>
            <div className={
                clsx(`relative top-[25px] my-2 mx-auto text-xl font-bold h-12 bg-black w-full items-center justify-center flex animate-slideInTop`,
                    { 'text-red-600': gameLost, 'text-green-600': !gameLost })}>{message}</div>
        </div>
    );
}