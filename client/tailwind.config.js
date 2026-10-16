/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Figtree", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Bricolage Grotesque", "Figtree", "sans-serif"],
      },
      colors: {
        paper: "#F3F5F7",
        ink: "#14213D",
        status: {
          available: "#1F9D6B",
          busy: "#D6455D",
          away: "#E09F1F",
          offline: "#8A94A6",
        },
      },
    },
  },
  plugins: [],
};
