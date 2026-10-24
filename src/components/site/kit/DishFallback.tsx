import { cn } from "@/lib/utils";

type Props = { className?: string; /** Markazdagi xitoycha belgi */ char?: string };

/**
 * Taom rasmi yo'q bo'lganda — "Rasm yo'q" o'rniga chiroyli zaxira: krem disk, qizil naqsh
 * halqasi va mo'yqalamda yozilgan belgi. Ota element o'lchamini to'ldiradi.
 */
export default function DishFallback({ className, char = "菜" }: Props) {
  return (
    <div aria-hidden="true" className={cn("relative flex h-full w-full items-center justify-center overflow-hidden bg-sand", className)}>
      <span className="lattice-bg absolute inset-0 text-fire/10" />
      <span className="absolute inset-[12%] rounded-full border-2 border-dashed border-fire/30" />
      <span lang="zh" className="font-cn relative text-[clamp(2.5rem,30%,7rem)] leading-none text-fire/80">{char}</span>
    </div>
  );
}
