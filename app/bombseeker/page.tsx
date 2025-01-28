import BombSeeker from "../ui/bombseeker/bomb-seeker"
import { sectionStyle } from "../ui/home/home-description";

export default function BombSeekerPage() {
    return (
        <>
            <h1 className={`${sectionStyle} text-2xl m-4 p-2`}>Bomb Seeker</h1>
            <div className={`${sectionStyle} m-4 p-2`}>
                This is my take of the Windows original Minesweeper game that I created while learning React, Next.js, and TypeScript. Enjoy!
            </div>
            <BombSeeker />
        </>);
}