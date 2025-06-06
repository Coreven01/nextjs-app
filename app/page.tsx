import HomeDescription from './ui/home/home-description';
import Image from 'next/image';
import AppLink from './ui/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nolan Appel | .NET Developer',
  description: 'Application and web development portfolio.',
  keywords:
    'web development, next.js, seo, react, .net, application development, software development, developer, michigan, west michigan',
  openGraph: {
    title: 'Nolan Appel | .NET Developer',
    description: 'Application and web development portfolio.',
    url: 'https://app.nolanappel.dev'
  },
  twitter: {
    title: 'Nolan Appel | .NET Developerv',
    description: 'Application and web development portfolio.'
  }
};

export default function Home() {
  return (
    <>
      <HomeDescription
        orientation={'left'}
        src={GetSectionSelfImage()}
        element={GetSectionSelfDescription()}
      />
    </>
  );
}

function GetSectionSelfImage() {
  return (
    <Image
      className="border-b lg:border-r contain border-black dark:border-white"
      quality={100}
      src={'/photo.png'}
      width={600}
      height={748}
      alt="Photo"
    />
  );
}

function GetSectionSelfDescription() {
  return (
    <div className="grow p-2">
      Hello and welcome! .NET developer here seeking work in the west Michigan area. Technology has been my
      passion for more than 15 years, and I have been working in software development for the last 10 years.
      I&apos;ve worked in several different positions within IT including technical support, server
      administration, report writing, and application development.
      <br />
      <br />
      While I prefer and focus on back-end code, I am capable of full-stack development. Experienced in
      engineering, maintaining, and testing code using .NET framework and .NET core. I&apos;ve honed my skills
      over the years by using best practices, test-driven design, and SOLID principles.
      <br />
      <br />I can be reached at LinkedIn:{' '}
      <AppLink link="https://www.linkedin.com/in/nolanappel/" text="Nolan Appel - LinkedIn" />
    </div>
  );
}
