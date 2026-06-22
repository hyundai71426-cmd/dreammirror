export interface ThemeStyle {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  colors: string[]; // preview circles
  appBg: string; // Outer container background
  containerBg: string; // Inner max-w-md profile wrapper
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderBase: string;
  headerBg: string;
  bottomNavBg: string;
  cardBg: string;
  cardBorder: string;
  accentText: string;
  accentBtn: string;
  accentBtnText: string;
  badgeBg: string;
  badgeText: string;
  baseTextSize: string;
  smallTextSize: string;
  titleSize: string;
  tabActive: string;
  tabInactive: string;
}

export const THEME_STYLES: Record<string, ThemeStyle> = {
  cosmic: {
    id: "cosmic",
    name: "우주적 몽환 (Cosmic)",
    desc: "신비로운 우주인디고 컬러와 촉촉한 보라색 하이라이트가 은은히 빛나는 밤 테마",
    emoji: "🌌",
    colors: ["#0B0D1B", "#1E1B4B", "#6366F1"],
    appBg: "bg-[#070914] text-white",
    containerBg: "bg-[#0B0D1B] text-indigo-100 border-indigo-950/20",
    textPrimary: "text-white",
    textSecondary: "text-indigo-200/80",
    textMuted: "text-indigo-400/50",
    borderBase: "border-indigo-950/60",
    headerBg: "bg-[#0E112A]/90 backdrop-blur-md border-b border-indigo-950/60",
    bottomNavBg: "bg-[#0B0D1B]/95 backdrop-blur-md border-t border-indigo-950/80",
    cardBg: "bg-indigo-950/25 border border-indigo-900/40 hover:border-indigo-800/80 hover:bg-indigo-950/35 transition-all shadow-lg",
    cardBorder: "border-indigo-900/40",
    accentText: "text-indigo-400",
    accentBtn: "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-indigo-600/20 shadow-md",
    accentBtnText: "text-white",
    badgeBg: "bg-indigo-950 border border-indigo-900 text-indigo-300",
    badgeText: "text-indigo-300",
    baseTextSize: "text-[15px] leading-relaxed",
    smallTextSize: "text-[13px] font-semibold text-indigo-200",
    titleSize: "text-xl font-bold tracking-tight text-white",
    tabActive: "text-indigo-400 bg-indigo-950/60 font-black",
    tabInactive: "text-indigo-300/40 hover:text-indigo-100"
  },
  zen: {
    id: "zen",
    name: "마음 미니멀 젠 (Minimal Zen)",
    desc: "눈이 편안하고 여백이 넉넉한 따뜻한 아이보리와 차분한 회갈색 테마 (글 읽기 강추!)",
    emoji: "🪵",
    colors: ["#FDFBF7", "#EFECE6", "#2D2A26"],
    appBg: "bg-[#EFECE6] text-stone-900",
    containerBg: "bg-[#FDFBF7] text-stone-900 border-stone-300",
    textPrimary: "text-stone-950 font-black",
    textSecondary: "text-stone-800 font-bold",
    textMuted: "text-stone-650 font-semibold",
    borderBase: "border-stone-300",
    headerBg: "bg-[#FDFBF7]/95 border-b border-stone-300 backdrop-blur-md",
    bottomNavBg: "bg-[#FDFBF7]/95 border-t border-stone-350 backdrop-blur-md",
    cardBg: "bg-[#FAF7F0] border border-stone-300 hover:bg-[#F2EDE1] transition-all shadow-sm rounded-3xl",
    cardBorder: "border-stone-300",
    accentText: "text-stone-950 font-black",
    accentBtn: "bg-stone-950 hover:bg-stone-900 text-[#FDFBF7] font-black shadow-md active:scale-95",
    accentBtnText: "text-[#FDFBF7]",
    badgeBg: "bg-stone-200 border border-stone-350 text-stone-950 font-black",
    badgeText: "text-stone-950 font-black",
    baseTextSize: "text-[15px] leading-loose tracking-wide font-sans text-stone-900",
    smallTextSize: "text-[12px] font-black text-stone-905",
    titleSize: "text-2xl font-black tracking-tight text-stone-950",
    tabActive: "text-stone-950 bg-stone-150/80 font-black border-b-2 border-stone-950",
    tabInactive: "text-stone-550 hover:text-stone-900 font-bold"
  },
  "neo-aura": {
    id: "neo-aura",
    name: "네오 오라 네온 (Aura Neon)",
    desc: "아크릴릭 일루미네이션과 선명한 야간 하이라이트가 돋보이며 직관적인 야간 조명 테마",
    emoji: "🔮",
    colors: ["#09070F", "#1A1625", "#EC4899"],
    appBg: "bg-[#09070F] text-zinc-100",
    containerBg: "bg-[#110E19] text-zinc-100 border-zinc-900/60",
    textPrimary: "text-zinc-50 font-bold",
    textSecondary: "text-zinc-300",
    textMuted: "text-zinc-500",
    borderBase: "border-zinc-900/80",
    headerBg: "bg-[#110E19]/95 border-b border-[#ec4899]/15 backdrop-blur-md",
    bottomNavBg: "bg-[#110E19]/95 border-t border-[#ec4899]/15 backdrop-blur-md",
    cardBg: "bg-[#181423] border border-[#d946ef]/15 hover:border-[#d946ef]/45 transition-all shadow-lg rounded-2xl",
    cardBorder: "border-[#d946ef]/15",
    accentText: "text-[#f472b6]",
    accentBtn: "bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-500 hover:from-fuchsia-500 hover:to-rose-400 text-white shadow-[#db2777]/20 shadow-md",
    accentBtnText: "text-white",
    badgeBg: "bg-[#1F112D] border border-fuchsia-900/40 text-[#f472b6]",
    badgeText: "text-[#f472b6]",
    baseTextSize: "text-[15px] leading-relaxed",
    smallTextSize: "text-[13px] font-semibold text-[#f472b6]",
    titleSize: "text-xl font-extrabold tracking-tight text-white hover:text-fuchsia-400",
    tabActive: "text-[#f472b6] bg-pink-950/30 border-b-2 border-pink-500 font-extrabold",
    tabInactive: "text-zinc-500 hover:text-zinc-200"
  }
};
