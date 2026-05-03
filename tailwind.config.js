/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-beige': '#FAF5EB',
        'brand-green': '#306B47',
      },
      fontFamily: {
        sans: ['"Darker Grotesque"', 'system-ui', 'sans-serif'],
        display: ['"Darker Grotesque"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
