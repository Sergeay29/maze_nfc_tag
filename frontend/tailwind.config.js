/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6A35FF',
          light: '#8A3DFF',
          dark: '#5A25EF',
        },
        secondary: {
          DEFAULT: '#BC43FF',
          light: '#D64DFF',
        },
        accent: {
          pink: '#F4C8E8',
        },
        slate: {
          DEFAULT: '#6B7280',
          light: '#9CA3AF',
          dark: '#4B5563',
        },
        cloud: {
          DEFAULT: '#FBF9FC',
          dark: '#F5F2F8',
        },
        dark: {
          DEFAULT: '#111111',
          light: '#1F1F1F',
        },
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        card: '0 4px 20px rgba(106, 53, 255, 0.08)',
        hover: '0 8px 30px rgba(106, 53, 255, 0.15)',
      },
      backgroundImage: {
        gradient: 'linear-gradient(90deg, #6A35FF 0%, #BC43FF 50%, #D64DFF 100%)',
        'gradient-light': 'linear-gradient(135deg, #FBF9FC 0%, #F5F2F8 100%)',
      },
    },
  },
  plugins: [],
};
