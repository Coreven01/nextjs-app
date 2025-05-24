import type { NextConfig } from 'next';

//const { i18n } = require('./next-i18next.config.js');

process.env.REACT_APP_DEBUG = 'true';

module.exports = {
  // images: {
  //   unoptimized: true
  // },
  i18n: {
    // These are all the locales you want to support in
    // your application
    locales: ['en-US', 'fr', 'nl-NL'],
    // This is the default locale you want to be used when visiting
    // a non-locale prefixed path e.g. `/hello`
    defaultLocale: 'en-US'
  }
};

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
