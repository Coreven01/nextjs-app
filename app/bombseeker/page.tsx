import { Metadata } from 'next';
import BombSeeker from '../ui/bombseeker/bomb-seeker';
import { SECTION_STYLE } from '../ui/home/home-description';

export const metadata: Metadata = {
  title: 'Nolan Appel | Bomb Seeker Example'
};

export default function BombSeekerPage() {
  return (
    <>
      <h1 className={`${SECTION_STYLE} text-2xl m-4 p-2`}>Bomb Seeker</h1>
      <div className={`${SECTION_STYLE} m-4 p-2`}>
        This is my take of the Windows original Minesweeper game that I created while learning React, Next.js,
        and TypeScript. Enjoy!
      </div>
      <BombSeeker />
    </>
  );
}
