/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'bounce-dot': 'bounceDot 1.2s infinite ease-in-out',
      },
      keyframes: {
        bounceDot: {
          '0%, 80%, 100%': { transform: 'scale(0)', opacity: '0.3' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
