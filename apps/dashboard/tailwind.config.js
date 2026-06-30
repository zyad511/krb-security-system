/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        black: "#000000",
        white: "#FFFFFF",
        zinc: {
          950: "#09090b",
          900: "#18181b",
          800: "#27272a",
          500: "#71717a",
          400: "#a1a1aa"
        }
      }
    },
  },
  plugins: [],
}
