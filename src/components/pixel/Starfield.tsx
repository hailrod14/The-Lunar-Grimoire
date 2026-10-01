/** Deterministic PRNG so the server and client render the same sky. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(1337);
const STARS = Array.from({ length: 70 }, (_, i) => ({
  id: i,
  top: rand() * 100,
  left: rand() * 100,
  size: rand() < 0.8 ? 2 : 4,
  gold: rand() < 0.15,
  twinkle: rand() < 0.4,
  delay: rand() * 3,
}));

/** A fixed, pixel starfield behind every page. */
export function Starfield() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ opacity: "var(--starfield-opacity)" }}>
      {STARS.map((s) => (
        <span
          key={s.id}
          className={s.twinkle ? "absolute animate-twinkle" : "absolute"}
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            background: s.gold ? "var(--color-gold-300)" : "var(--color-silver-300)",
            opacity: s.size === 2 ? 0.6 : 0.9,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
