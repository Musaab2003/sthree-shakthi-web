/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFFFF',
          100: '#FDF9F6',
          200: '#FAF2EB',
          300: '#F4E5DA',
          400: '#EBD4C4',
        },
        rosewood: {
          50: '#FDF4F6',
          100: '#FCE7EC',
          200: '#F8CAD5',
          300: '#F4A7B9',
          400: '#E8829C',
          500: '#D95F7F',
          600: '#BE4465',
          700: '#9E324F',
          800: '#7E253E',
          900: '#5C1D3B',
          950: '#3E1028',
        },
        brand: {
          50: '#FDF4F6',
          100: '#FCE7EC',
          200: '#F8CAD5',
          300: '#F4A7B9',
          400: '#E8829C',
          500: '#D95F7F',
          600: '#BE4465',
          700: '#9E324F',
          800: '#7E253E',
          900: '#5C1D3B',
          950: '#3E1028',
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Plus Jakarta Sans', 'serif'],
      },
      borderRadius: {
        'arch-tl': '120px 40px 40px 40px',
        'arch-tr': '40px 120px 40px 40px',
        'arch-bl': '40px 40px 40px 120px',
        'arch-br': '40px 40px 120px 40px',
      }
    },
  },
  plugins: [],
}
