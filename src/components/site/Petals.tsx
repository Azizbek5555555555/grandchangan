const PETALS = [
  { l: 4, d: 0, dur: 10, s: 16 }, { l: 12, d: 3, dur: 13, s: 11 }, { l: 22, d: 6, dur: 11, s: 14 },
  { l: 33, d: 1.5, dur: 14, s: 10 }, { l: 44, d: 8, dur: 12, s: 15 }, { l: 55, d: 4, dur: 15, s: 12 },
  { l: 64, d: 9, dur: 11, s: 13 }, { l: 73, d: 2, dur: 14, s: 16 }, { l: 82, d: 6.5, dur: 12, s: 10 },
  { l: 90, d: 3.5, dur: 13, s: 14 }, { l: 96, d: 7.5, dur: 15, s: 12 }, { l: 48, d: 11, dur: 12, s: 11 },
];

export default function Petals() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {PETALS.map((p, i) => (
        <span key={i} className="petal absolute -top-10" style={{ left: `${p.l}%`, width: p.s, height: p.s, animationDelay: `${p.d}s`, animationDuration: `${p.dur}s` }}>
          <svg viewBox="0 0 24 24" width="100%" height="100%">
            <path d="M12 2 C7 7 7 15 12 22 C17 15 17 7 12 2 Z" fill="#f6c1cf" opacity="0.85" />
          </svg>
        </span>
      ))}
    </div>
  );
}
