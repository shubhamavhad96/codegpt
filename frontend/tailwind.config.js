/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';
import scrollbar from 'tailwind-scrollbar';

export default {
    content: [
      "./src/pages/**/*.{js,ts,jsx,tsx}",
      "./src/components/**/*.{js,ts,jsx,tsx}",
      "./src/app/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {},
    },
    plugins: [
      typography,
      scrollbar,
    ],
  }
  