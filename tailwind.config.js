/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tama: {
          burgundy: '#58081E',
          green: '#009959',
          teal: '#1C7F96',
          sky: '#9DE2F2',
          lavender: '#CE9FC6',
          red: '#E13335',
          pale: '#F7ECF9',
          orange: '#F9662F',
          yellow: '#FACC41',
          white: '#FCF5FF',
          pink: '#FF9AAF',
        },
      },
      fontFamily: {
        fredoka: ['Fredoka', 'system-ui', 'sans-serif'],
        public: ['Public Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '24px': '24px',
        '30px': '30px',
      },
    },
  },
  plugins: [],
};
