import BombSeeker from "../ui/bombseeker/bomb-seeker"

export default function BombSeekerPage() {
    return (
        <>
            <h1 className="text-2xl bg-zinc-200 dark:bg-neutral-900 dark:text-white border m-4 p-2">Bomb Seeker</h1>
            <div className="bg-zinc-200 dark:bg-neutral-900 dark:text-white border m-4 p-2">
                This is my simple implementation of Windows original Minesweeper game while learning React, Next.js, and TypeScript. My next goal will be converting
                this into a 2D version using Phaser.io. 
                </div>
            <BombSeeker />
        </>);
}