import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        wood: {
          DEFAULT: "hsl(var(--wood))",
          dark: "hsl(var(--wood-dark))",
          light: "hsl(var(--wood-light))",
        },
        gold: {
          DEFAULT: "hsl(var(--gold))",
          glow: "hsl(var(--gold-glow))",
        },
        diamond: {
          DEFAULT: "hsl(var(--diamond))",
          glow: "hsl(var(--diamond-glow))",
        },
        iron: {
          DEFAULT: "hsl(var(--iron))",
        },
        creeper: {
          DEFAULT: "hsl(var(--creeper))",
          glow: "hsl(var(--creeper-glow))",
        },
        lantern: {
          DEFAULT: "hsl(var(--lantern))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        pixel: "2px",
      },
      fontFamily: {
        minecraft: ["var(--font-minecraft)"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "wood-grain": "var(--gradient-wood)",
        "gold-shimmer": "var(--gradient-gold)",
        "diamond-sparkle": "var(--gradient-diamond)",
        "creeper-danger": "var(--gradient-creeper)",
        "lantern-glow": "var(--gradient-lantern)",
      },
      keyframes: {
        "card-deal": {
          "0%": { transform: "translateY(-200px) rotateX(90deg) scale(0.5)", opacity: "0" },
          "50%": { transform: "translateY(-50px) rotateX(45deg) scale(0.8)", opacity: "0.7" },
          "100%": { transform: "translateY(0) rotateX(0) scale(1)", opacity: "1" }
        },
        "card-flip": {
          "0%": { transform: "rotateY(0)" },
          "50%": { transform: "rotateY(90deg)" },
          "100%": { transform: "rotateY(180deg)" }
        },
        "button-press": {
          "0%, 100%": { transform: "scale(1) translateY(0)" },
          "50%": { transform: "scale(0.95) translateY(2px)" }
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" }
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-2px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(2px)" }
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" }
        },
        "count-up": {
          "0%": { transform: "scale(1.5)", opacity: "0" },
          "50%": { transform: "scale(1.2)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" }
        },
        "particle-float": {
          "0%": { transform: "translateY(100vh) rotate(0deg)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateY(-100vh) rotate(720deg)", opacity: "0" }
        }
      },
      animation: {
        "card-deal": "card-deal 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        "card-flip": "card-flip 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        "button-press": "button-press 0.2s ease-out",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "shake": "shake 0.5s ease-in-out",
        "float": "float 3s ease-in-out infinite",
        "count-up": "count-up 0.4s ease-out",
        "particle-float": "particle-float 15s linear infinite"
      },
      boxShadow: {
        "wood": "inset 0 2px 4px 0 hsl(var(--wood-dark) / 0.3)",
        "glow-gold": "0 0 20px hsl(var(--gold-glow) / 0.5)",
        "glow-diamond": "0 0 30px hsl(var(--diamond-glow) / 0.7)",
        "glow-creeper": "0 0 40px hsl(var(--creeper-glow) / 0.8)",
        "3d": "0 4px 0 hsl(var(--wood-dark)), 0 8px 20px hsl(var(--wood-dark) / 0.3)",
      },
      perspective: {
        "1000": "1000px",
        "2000": "2000px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
