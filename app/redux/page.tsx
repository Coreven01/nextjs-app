import { Metadata } from 'next';
import { SECTION_STYLE } from '../ui/home/home-description';

export const metadata: Metadata = {
  title: 'Nolan Appel | Bomb Seeker Example'
};

export default function Page() {
  return (
    <>
      <h1 className={`${SECTION_STYLE} text-2xl m-4 p-2`}>Begin Redux</h1>
    </>
  );
}
