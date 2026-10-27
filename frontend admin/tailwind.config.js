/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111111',
        accent: '#E11D48',
        canvas: '#F5F5F5',
      },
      fontFamily: {
        heading: ['Poppins', 'Inter', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 18px 50px rgba(17, 17, 17, 0.06)',
      },
    },
  },
  plugins: [],
}
