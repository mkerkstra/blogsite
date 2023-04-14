module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-from': '#6C7893',
        'bg-to': '#8993A9',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
