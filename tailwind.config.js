/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        plum: { 50: "#F7F1FB", 100: "#EEE2F7", 200: "#DCC4EE", 300: "#C39CE0", 400: "#9C63C4", 500: "#7A3BA8", 600: "#5E268B", 700: "#4C1E71", 800: "#3A1757", 900: "#26103A" },
        tangerine: { 50: "#FFF4EC", 100: "#FFE6D3", 200: "#FFCBA5", 400: "#F69A55", 500: "#F07A2A", 600: "#D9631A" },
        lagoon: { 50: "#EAF8F8", 100: "#CDEFEF", 200: "#9CDEDF", 400: "#2FB3B9", 500: "#0E979F", 600: "#0B7C83" },
        blush: { 50: "#FFF8F6", 100: "#FDEDEA", 200: "#FAD9D3", 300: "#F5BDB3" },
        cream: "#FFFBF7",
        ink: "#2A1838",
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        script: ['"Caveat"', "cursive"],
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      borderRadius: { "4xl": "2rem", "5xl": "2.75rem" },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(94, 38, 139, 0.22)",
        glow: "0 20px 60px -20px rgba(240, 122, 42, 0.45)",
      },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        rise: { from: { opacity: 0, transform: "translateY(14px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      },
      animation: { float: "float 6s ease-in-out infinite", rise: "rise .6s cubic-bezier(.2,.7,.2,1) both" },
    },
  },
  plugins: [],
};
