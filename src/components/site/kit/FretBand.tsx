import { cn } from "@/lib/utils";

/** Xitoycha "huiwen" naqsh lentasi (namuna 1 dagi chiziqli bezak). Rang — text-* klassi. */
export default function FretBand({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("fret-band w-full", className)} />;
}
