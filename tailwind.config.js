module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // default dark background
        'gray-dark': `#212636`,
      },
      animation: {
        flow: `flow 3s linear infinite`,
      },
      keyframes: {
        flow: {
          '0%': {
            transform: 'translateX(0), translateY(0)',
          },
          '100%': {
            transform: 'translateX(100%), translateY(100%)',
          },
        },
      },
    },
  },
  plugins: [],
};
