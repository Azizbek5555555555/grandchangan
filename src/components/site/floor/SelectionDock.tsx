"use client";

import { X } from "lucide-react";
import type { Photo } from "@/lib/photos";
import { cn } from "@/lib/utils";
import RoomPhoto from "./RoomPhoto";

/**
 * Tanlangan stol "dok"i — darhol bron qilish tugmasi bilan.
 * - overlay: katta ekranda xaritaning pastki-chap burchagida (bar/kirish — band qilinmaydigan joy ustida)
 * - bar: telefonda ekran pastiga yopishib turadigan qator
 * show=false — yumshoq yashiriladi (panelning o'z tugmasi ko'rinib turganda takrorlanmasin).
 */
export default function SelectionDock({
  variant,
  show,
  eyebrow,
  code,
  seats,
  photo,
  glyph,
  action,
  label,
  onClose,
  closeLabel,
}: {
  variant: "overlay" | "bar";
  show: boolean;
  /** Xona nomi ("VIP 1", "Katta zal") */
  eyebrow: string;
  /** Stol kodi (VIP-1, Z-3) */
  code: string;
  /** "12 o'rin" */
  seats: string;
  photo: Photo | null;
  glyph: string;
  action: React.ReactNode;
  /** Ekran o'quvchi uchun nom ("Tanlangan stol: VIP-1") */
  label: string;
  onClose?: () => void;
  closeLabel?: string;
}) {
  const overlay = variant === "overlay";
  return (
    <div
      role="region"
      aria-label={label}
      aria-hidden={show ? undefined : true}
      inert={!show}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-brand-gold/40 bg-night/90 text-brand-cream shadow-2xl shadow-night/60 backdrop-blur-md transition-[opacity,transform,visibility] duration-300 ease-out-expo",
        overlay ? "p-2.5 pr-3" : "p-2 pr-2.5",
        // starting: — birinchi paydo bo'lishda ham yumshoq kirish (@starting-style)
        show ? "visible translate-y-0 opacity-100 starting:translate-y-2 starting:opacity-0" : "invisible translate-y-2 opacity-0"
      )}
    >
      <div className={cn("relative shrink-0 overflow-hidden rounded-xl ring-1 ring-brand-gold/30", overlay ? "size-14 xl:h-16 xl:w-[5.5rem]" : "size-12")}>
        <RoomPhoto photo={photo} glyph={glyph} glyphSize="text-xl" decorative />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gold-light">{eyebrow}</p>
        <p className="mt-1 flex min-w-0 items-baseline gap-2">
          <b className={cn("shrink-0 whitespace-nowrap font-display font-normal leading-none", overlay ? "text-2xl" : "text-xl")}>{code}</b>
          <span className="truncate text-xs text-brand-cream/70">{seats}</span>
        </p>
      </div>
      <div className="shrink-0">{action}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          title={closeLabel}
          className="-my-1 -mr-1 flex size-11 shrink-0 items-center justify-center rounded-full text-brand-cream/60 transition hover:bg-brand-cream/10 hover:text-brand-cream"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
