import { Metadata } from 'next';
import EuchreGame from '../ui/euchre/game/game';
import { SECTION_STYLE } from '../ui/home/home-description';

export const metadata: Metadata = {
  title: 'Nolan Appel | Euchre'
};

export default function Euchre() {
  return (
    <>
      <h1 className={`${SECTION_STYLE} text-2xl m-4 p-2`}>Euchre</h1>
      <EuchreGame />
    </>
  );
}
