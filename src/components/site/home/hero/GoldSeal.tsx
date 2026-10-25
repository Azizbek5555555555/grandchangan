/**
 * Oltin muhr-belgi: aylanma yozuv va markazda xitoycha nom. Hero'da rasm ustida turadi — o'qilishi uchun
 * ostida yarim shaffof tungi doira. O'lchami ota elementdan (size-full).
 */
export default function GoldSeal({ ring, center }: { ring: string; center: string }) {
  const ringText = `${ring} · ${ring} · `;
  return (
    <div aria-hidden="true" className="relative size-full">
      <span className="absolute inset-[4%] rounded-full bg-night/55" />
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full animate-spin-slow">
        <defs>
          <path id="gc-seal-ring" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
        </defs>
        <text className="fill-brand-gold-light" style={{ fontSize: 15, letterSpacing: 3, fontWeight: 600 }}>
          <textPath href="#gc-seal-ring" textLength="496" lengthAdjust="spacing">{ringText.toUpperCase()}</textPath>
        </text>
      </svg>
      <span className="absolute inset-[22%] flex items-center justify-center rounded-full border border-brand-gold/50 bg-night/80">
        <span lang="zh" className="font-cn text-center text-[13px] leading-tight text-saffron sm:text-lg lg:text-2xl">{center}</span>
      </span>
    </div>
  );
}
