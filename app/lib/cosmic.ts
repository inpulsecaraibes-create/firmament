import SunCalc from "suncalc";

const MOON_PHASES: Record<string, { name: string; emoji: string; desc: string }> = {
  new: { name: "Nouvelle lune", emoji: "🌑", desc: "propice aux nouveaux départs" },
  waxing_crescent: { name: "Croissant croissant", emoji: "🌒", desc: "propice à l'élan" },
  first_quarter: { name: "Premier quartier", emoji: "🌓", desc: "propice aux décisions courageuses" },
  waxing_gibbous: { name: "Gibbeuse croissante", emoji: "🌔", desc: "propice à la consolidation" },
  full: { name: "Pleine lune", emoji: "🌕", desc: "propice à la révélation" },
  waning_gibbous: { name: "Gibbeuse décroissante", emoji: "🌖", desc: "propice au lâcher-prise" },
  last_quarter: { name: "Dernier quartier", emoji: "🌗", desc: "propice aux décisions de rupture" },
  waning_crescent: { name: "Croissant décroissant", emoji: "🌘", desc: "propice à l'introspection" },
};

const NUMEROLOGY: Record<number, string> = {
  1: "Nouveau départ", 2: "Coopération", 3: "Créativité",
  4: "Structure", 5: "Liberté", 6: "Harmonie",
  7: "Discernement", 8: "Abondance", 9: "Accomplissement",
  11: "Intuition", 22: "Construction", 33: "Service",
};

function getMoonPhaseName(illumination: number, phase: number): string {
  if (illumination < 0.03) return "new";
  if (phase < 0.25 && phase > 0) return "waxing_crescent";
  if (Math.abs(phase - 0.25) < 0.03) return "first_quarter";
  if (phase < 0.5 && phase > 0.25) return "waxing_gibbous";
  if (illumination > 0.97) return "full";
  if (phase < 0.75 && phase > 0.5) return "waning_gibbous";
  if (Math.abs(phase - 0.75) < 0.03) return "last_quarter";
  return "waning_crescent";
}

function getNumerology(date: Date): number {
  const str = `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`;
  let sum = str.split("").reduce((acc, d) => acc + parseInt(d), 0);
  // Master numbers
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split("").reduce((acc, d) => acc + parseInt(d), 0);
  }
  return sum;
}

export function getCosmicLine(date: Date = new Date()): string {
  try {
    const moon = SunCalc.getMoonIllumination(date);
    const phaseName = getMoonPhaseName(moon.fraction, moon.phase);
    const phaseData = MOON_PHASES[phaseName];
    const num = getNumerology(date);
    const numWord = NUMEROLOGY[num] || "Clarté";
    return `${phaseData.emoji} ${phaseData.name} · ${phaseData.desc} · Jour ${num} · ${numWord}`;
  } catch {
    return "🌗 Dernier quartier · propice aux décisions de rupture · Jour 8 · Abondance";
  }
}
