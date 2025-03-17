import ThemeToggle from './theme-toggle';
import { Chakra_Petch } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';

const chakraPetch = Chakra_Petch({
  weight: '400',
  subsets: ['latin']
});

type Props = {
  className: string;
};

export default function TopNav({ className }: Props) {
  return (
    <div className={`p-2 border-b bg-zinc-300 dark:bg-neutral-900 bg-opacity-100 z-40 ${className}`}>
      <div className="md:w-28">
        <Link href={'/'}>
          <Image
            src="/guitar_corner1.png"
            width={200}
            height={71}
            className="hidden md:block"
            alt="Screenshots of the dashboard project showing desktop version"
          />
        </Link>
      </div>
      <div
        className={`text-xl text-black dark:text-white md:text-3xl md:pl-5 flex-grow ${chakraPetch.className}`}
      >
        Nolan Appel - .NET Developer
      </div>
      <div className="hidden flex-none md:block">
        <ThemeToggle useMobile={false} />
      </div>
    </div>
  );
}
