// tailwind.config.ts

import type { Config } from "tailwindcss";

const config: Config = {
  // Dit is het cruciale deel: 
  // We vertellen Tailwind v4 waar het klassen moet zoeken.
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    
    // VOEG DEZE REGEL TOE:
    // Zorg ervoor dat Tailwind ook de Tremor componenten scant
    // op de klassen die het nodig heeft.
    "./node_modules/@tremor/react/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;