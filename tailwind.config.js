/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'logo-blue': '#F15D38',
        'logo-teal': '#0d9488',
        blue: {
          50: '#fff5f2',
          100: '#ffe5dd',
          200: '#ffcdbf',
          300: '#ffa793',
          400: '#ff795d',
          500: '#f76b4a',
          600: '#f15d38',
          700: '#d64420',
          800: '#ae3315',
          900: '#5e1605',
        }
      },
    },
  },
  plugins: [],
}
