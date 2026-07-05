// SKIN REGISTRY: 14 verified skins (previews in docs/skins/; regenerate via the
// skin-gallery composition). A skin is TOKENS ONLY (palette + fonts + shape language +
// karaoke variant). There are NO prebuilt layouts: every video composes its own scenes
// from the content's structure (see skill/references/remotion-render.md).
// DEFAULT for GitHub repo tours: repo-dark (tech-dark-neon blended with
// escbase-starfield), unless the user picks another skin.
// Fonts name their @remotion/google-fonts module; all checked for the vietnamese
// subset unless fontNote says otherwise.

export type SkinSpec = {
  id: string;
  name: string;
  mood: string;
  bg: string;
  fg: string;
  accents: string[];
  fonts: { display: string; body: string; mono: string };
  shapes: string;
  karaoke: "neon" | "marker" | "sticker";
  fontNote?: string;
};

export const SKINS: SkinSpec[] = [
  {
    id: "repo-dark",
    name: "Repo dark (tech neon x escbase)",
    mood: "DEFAULT for GitHub repo tours: tech seriousness + infographic density",
    bg: "#070f1d",
    fg: "#F5F7FA",
    accents: ["#22d3ee", "#fbbf24", "#4ADE80", "#c084fc", "#ef4444"],
    fonts: { display: "BeVietnamPro", body: "BeVietnamPro", mono: "JetBrainsMono" },
    shapes: "starfield bg, glow cards radius 24 with 1px border, badge pill opening scenes, icon squares, token chips, stat rows, ring %, brand header+footer",
    karaoke: "neon",
  },
  {
    id: "tech-dark-neon",
    name: "Tech dark neon",
    mood: "tech repo tour, serious with glow",
    bg: "#0a0e1a",
    fg: "#F5F7FA",
    accents: ["#22d3ee", "#ef4444", "#4ADE80"],
    fonts: { display: "BeVietnamPro", body: "BeVietnamPro", mono: "JetBrainsMono" },
    shapes: "cards radius 24 with dark 1px border, radial glow, brand header+footer, drifting particles",
    karaoke: "neon",
  },
  {
    id: "escbase-starfield",
    name: "Escbase starfield",
    mood: "AI-news infographic, high density, emoji icons",
    bg: "#060e1c",
    fg: "#eaf2fb",
    accents: ["#38bdf8", "#fbbf24", "#10b981", "#c084fc", "#fb7185"],
    fonts: { display: "BeVietnamPro", body: "BeVietnamPro", mono: "SpaceGrotesk" },
    shapes: "badge pill opening each scene, icon squares, token chips, stat rows, ring %, starfield bg",
    karaoke: "neon",
  },
  {
    id: "mono-editorial",
    name: "Mono editorial",
    mood: "print newspaper, analytical teardown, cold elegance",
    bg: "#F6F3EE",
    fg: "#151310",
    accents: ["#E8590C"],
    fonts: { display: "PlayfairDisplay", body: "Lora", mono: "DMMono" },
    shapes: "6px masthead rule, hairlines, box-score tables, contact sheet, rotated stamp, SQUARE corners, no glow",
    karaoke: "marker",
    fontNote: "DMMono is latin-only: digits/URLs/EN labels exclusively",
  },
  {
    id: "pop-sticker",
    name: "Pop sticker",
    mood: "playful mass-market, TikTok/Reels",
    bg: "#FFF3E2",
    fg: "#1D1814",
    accents: ["#E5484D", "#2667FF", "#06A77D", "#F7B801", "#FF6B35"],
    fonts: { display: "BeVietnamPro", body: "BeVietnamPro", mono: "SpaceGrotesk" },
    shapes: "3px ink borders, hard 9px offset shadows, slightly rotated stickers, outline numbers, confetti",
    karaoke: "sticker",
  },
  {
    id: "terminal-crt",
    name: "Terminal CRT",
    mood: "dev tool, hacker, a machine really running",
    bg: "#040804",
    fg: "#33FF66",
    accents: ["#33FF66", "#1E9944"],
    fonts: { display: "JetBrainsMono", body: "JetBrainsMono", mono: "JetBrainsMono" },
    shapes: "all mono, $ prompt, block progress bars, blinking cursor, scanline overlay, vignette",
    karaoke: "neon",
  },
  {
    id: "blueprint",
    name: "Blueprint",
    mood: "architecture teardown, how-it-works",
    bg: "#0E2A47",
    fg: "#EAF2FB",
    accents: ["#8FC1EE"],
    fonts: { display: "BeVietnamPro", body: "SpaceGrotesk", mono: "JetBrainsMono" },
    shapes: "44px grid, 2.5px white-stroke boxes with thin offset shadow, dimension arrows, spec frames",
    karaoke: "neon",
  },
  {
    id: "swiss",
    name: "Swiss",
    mood: "benchmarks, numbers, minimal authority",
    bg: "#FFFFFF",
    fg: "#111111",
    accents: ["#E30613"],
    fonts: { display: "Inter", body: "Inter", mono: "JetBrainsMono" },
    shapes: "giant 900-weight type filling the frame, 3px rules, red squares, tight column grid, zero decoration",
    karaoke: "marker",
  },
  {
    id: "keynote-clean",
    name: "Keynote clean",
    mood: "serious product, buying audience (video-ad candidate)",
    bg: "#F7F9FC",
    fg: "#1D1D1F",
    accents: ["#0A84FF"],
    fonts: { display: "Inter", body: "Inter", mono: "JetBrainsMono" },
    shapes: "white cards radius 32 with SOFT 0 24px 70px shadow, pale pills, big accent numbers, lots of whitespace",
    karaoke: "marker",
  },
  {
    id: "poster-70s",
    name: "Poster 70s",
    mood: "retro personality, personal channel",
    bg: "#F1E3C8",
    fg: "#4A2C1A",
    accents: ["#D8000F"],
    fonts: { display: "PaytoneOne", body: "Lora", mono: "JetBrainsMono" },
    shapes: "sunburst rays from center, oval frames with 5px border, display type with solid shadow, star separators",
    karaoke: "marker",
  },
  {
    id: "cinematic-teal",
    name: "Cinematic teal",
    mood: "storytelling, long narrative",
    bg: "linear-gradient(160deg, #0F2027 0%, #1A2942 100%)",
    fg: "#E9F2F1",
    accents: ["#4FD1C5"],
    fonts: { display: "Fraunces", body: "Inter", mono: "JetBrainsMono" },
    shapes: "full-bleed 9:16 (no letterbox bars: wasted pixels on vertical), large serif, wide-tracking kicker, mint glow underline",
    karaoke: "neon",
  },
  {
    id: "comic",
    name: "Comic",
    mood: "hot news, drama, high energy",
    bg: "#FFFDF5",
    fg: "#17120E",
    accents: ["#FFD400", "#D8000F"],
    fonts: { display: "Baloo2", body: "Baloo2", mono: "SpaceGrotesk" },
    shapes: "yellow polygon bursts, action lines radiating, speech bubbles 6px border + tail, halftone dot corners",
    karaoke: "sticker",
  },
  {
    id: "notebook",
    name: "Notebook",
    mood: "friendly tutorial, let-me-show-you",
    bg: "#FDFBF3",
    fg: "#1E2A5A",
    accents: ["#D8000F", "#FFD400"],
    fonts: { display: "PatrickHand", body: "PatrickHand", mono: "JetBrainsMono" },
    shapes: "58px ruled lines + red margin, yellow highlighter behind words, scribbled arrows, taped paper cards",
    karaoke: "marker",
  },
  {
    id: "chalkboard",
    name: "Chalkboard",
    mood: "teaching, lecture",
    bg: "#24382E",
    fg: "#F2EFE4",
    accents: ["#FFE08A", "#F5B8C4"],
    fonts: { display: "PatrickHand", body: "PatrickHand", mono: "JetBrainsMono" },
    shapes: "26px wood frame, chalk-dust speckles, wavy underlines, dashed boxes, chalk text-shadow",
    karaoke: "neon",
  },
];
