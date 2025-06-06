'use client';

import { HomeIcon, SparklesIcon, FireIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

// Map of links to display in the side navigation.
// Depending on the size of the application, this would be stored in a database.
const links = [
  { name: 'Home', href: '/', icon: HomeIcon },
  // {
  //   name: 'Courses',
  //   href: '/courses',
  //   icon: DocumentDuplicateIcon
  // },
  // {
  //   name: 'Dashboard',
  //   href: '/dashboard',
  //   icon: DocumentDuplicateIcon
  // },
  {
    name: 'Bomb Seeker',
    href: '/bombseeker',
    icon: FireIcon
  },
  {
    name: 'Euchre',
    href: '/euchre',
    icon: SparklesIcon
  }
];

type Props = {
  onClick: () => void;
};

export default function NavLinks({ onClick }: Props) {
  const pathname = usePathname();
  const itemClass =
    'flex h-[48px] m-2 grow items-center gap-2 rounded-md p-3 text-sm font-medium border border-black dark:border-white dark:text-white hover:dark:bg-zinc-600 hover:bg-green-100 hover:text-green-800 lg:flex-none justify-start lg:p-2 lg:px-3';
  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            onClick={onClick}
            key={link.name}
            href={link.href}
            className={clsx(`${itemClass}`, {
              'bg-green-100 text-green-950 dark:bg-green-950 dark:text-white': pathname === link.href,
              'bg-white text-green-950 dark:bg-neutral-900 dark:text-white': pathname !== link.href
            })}
          >
            <LinkIcon className="w-6" />
            <p className="">{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
