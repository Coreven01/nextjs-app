import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      boxShadow: {
        'custom-gray': '2px 2px 1px darkgray',
        'custom-black': '2px 2px 1px black',
      },
      animation: {
        slideInRight: 'slideInRight 0.15s ease-out',
        slideInLeft: 'slideInLeft 0.15s ease-out',
        slideInTop: 'slideInTop 0.75s ease-out',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-200px)' },
          '100%': { transform: 'translateX(0px)' },
        },
        slideInTop: {
          '0%': { transform: 'translateY(-40px)' },
          '25%': { transform: 'translateY(-20px)' },
          '50%': { transform: 'translateY(-8px)' },
          '75%': { transform: 'translateY(-3px)' },
          '100%': { transform: 'translateY(0px)' },
        },
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
} satisfies Config;
