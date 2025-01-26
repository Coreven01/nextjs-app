import { Orbitron } from "next/font/google";

const orbitron = Orbitron({
    weight: "400"
});

type Props = {
    seconds: number
    bombsLeft: number
}

export default function GameInfo({ seconds, bombsLeft }: Props) {


    return (
        <>
            <div className={`${orbitron.className} text-xl w-[200px]`}>
                Time: {seconds}
            </div>
            <div className={`${orbitron.className} text-xl w-[200px]`}>
                Remaining: {bombsLeft}
            </div>
        </>
    )
}