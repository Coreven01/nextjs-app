import clsx from 'clsx';
import ThemeToggle from '../theme-toggle';
import Image from 'next/image';
import Link from 'next/link';
import { chakraPetch } from '../fonts';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function TopNav({ children, className }: Props) {
  return (
    <div
      id="site-top-nav"
      style={{ zIndex: 500 }}
      className={clsx(`p-2 border-b bg-zinc-300 dark:bg-neutral-900 bg-opacity-100`, className)}
    >
      <div className="md:w-28">
        <Link href={'/'}>
          <Image
            src="/guitar_corner1.png"
            width={200}
            height={71}
            className="hidden md:block"
            alt="Guitar Icon"
          />
        </Link>
      </div>
      <div
        className={clsx(
          `text-xl text-black dark:text-white md:text-3xl md:pl-5 flex-grow`,
          chakraPetch.className
        )}
      >
        {children}
      </div>
      <div className="hidden flex-none md:block">
        <ThemeToggle useMobile={false} />
      </div>
    </div>
  );
}
