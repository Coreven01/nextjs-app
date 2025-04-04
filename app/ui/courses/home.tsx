'use client';

import Link from 'next/link';
import React from 'react';

class ReduxHome extends React.Component {
  render() {
    return (
      <>
        <h1 className="text-xl my-2">Course Administration</h1>
        <p>Redux tutorial</p>
        <Link href="/courses/about">About</Link>
      </>
    );
  }
}

export default ReduxHome;
