// Calcule la phase lunaire et le nombre numérologique du jour

const MOON_PHASES = [
  { name: "Nouvelle lune", emoji: "🌑", insight: "propice aux nouveaux départs" },
  { name: "Premier croissant", emoji: "🌒", insight: "propice à l'élan et à l'action" },
  { name: "Premier quartier", emoji: "🌓", insight: "propice aux décisions courageuses" },
  { name: "Lune gibbeuse croissante", emoji: "🌔", insight: "propice à la consolidation" },
  { name: "Pleine lune", emoji: "🌕", insight: "propice à la clarté et à la révélation" },
  { name: "Lune gibbeuse décroissante", emoji: "🌖", insight: "propice à la gratitude et au lâcher-prise" },
  { name: "Dernier quartier", emoji: "🌗", insight: "propice aux décisions de rupture" },
  { name: "Dernier croissant", emoji: "🌘", insight: "propice au repos et à l'introspection" },
];

const NUMEROLOGY_INSIGHTS: Record<number, string> = {
  1: "Jour 1 · Leadership",
  2: "Jour 2 · Équilibre",
  3: "Jour 3 · Créativité",
  4: "Jour 4 · Structure",
  5: "Jour 5 · Changement",
  6: "Jour 6 · Harmonie",
  7: "Jour 7 · Discernement",
  8: "Jour 8 · Abondance",
  9: "Jour 9 · Accomplissement",
};

export function getMoonPhase(date: Date): { emoji: string; name: string; insight: string } {
  // Référence : nouvelle lune connue le 6 janvier 2000
  const reference = new Date("2000-01-06T18:14:00Z");
  const lunation = 29.53058867;
  const elapsed = (date.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24);
  const age = ((elapsed % lunation) + lunation) % lunation;
  const index = Math.floor((age / lunation) * 8) % 8;
  return MOON_PHASES[index];
}

export function getNumerology(date: Date): string {
  const str = `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`;
  let sum = str.split("").reduce((acc, d) => acc + parseInt(d), 0);
  while (sum > 9) {
    sum = sum.toString().split("").reduce((acc, d) => acc + parseInt(d), 0);
  }
  return NUMEROLOGY_INSIGHTS[sum] || `Jour ${sum}`;
}

export function getCosmicLine(date: Date = new Date()): string {
  const moon = getMoonPhase(date);
  const num = getNumerology(date);
  return `${moon.emoji} ${moon.name} · ${moon.insight} · ${num}`;
}
