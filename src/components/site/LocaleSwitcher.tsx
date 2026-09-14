"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Globe } from "lucide-react";
import { useState } from "react";

const LABELS: Record<string, string> = { uz: "O'zbek", ru: "Русский", en: "English", zh: "中文" };

export default function LocaleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const current = (params?.locale as string) || routing.defaultLocale;
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm hover:bg-white/10"
      >
        <Globe size={16} /> {current.toUpperCase()}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-32 rounded-lg border border-line bg-card py-1 shadow-lg">
          {routing.locales.map((l) => (
            <button
              key={l}
              onClick={() => {
                setOpen(false);
                // @ts-expect-error next-intl typed pathname
                router.replace(pathname, { locale: l });
              }}
              className={`block w-full px-3 py-1.5 text-left text-sm text-content hover:bg-surface-2 ${l === current ? "font-bold" : ""}`}
            >
              {LABELS[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
