import Link from 'next/link';

function ReduxNav() {
  return (
    <nav className="border-b border-black pb-3">
      <Link href="/courses">Redux Home</Link>
      {' | '}
      <Link href="/courses/about">Redux About</Link>
    </nav>
  );
}

export default ReduxNav;
