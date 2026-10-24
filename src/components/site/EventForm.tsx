"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { submitInquiry } from "@/lib/event/actions";
import { btnClass } from "@/components/site/kit/ButtonLink";
import { cn } from "@/lib/utils";

// value — admin panelda ko'rinadigan (o'zbekcha) nom; label — sayt tilida
const TYPES = [
  { value: "To'y", key: "tWedding" },
  { value: "Tug'ilgan kun", key: "tBirthday" },
  { value: "Korporativ", key: "tCorporate" },
  { value: "Yubiley", key: "tAnniversary" },
  { value: "Boshqa", key: "tOther" },
] as const;

const field = "h-12 w-full rounded-xl border border-line bg-paper px-4 text-base text-content placeholder:text-muted/70 outline-none transition focus:border-fire focus:ring-2 focus:ring-fire/20";
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-muted";

export default function EventForm() {
  const te = useTranslations("Events");
  const st = useTranslations("Site");
  const e2 = useTranslations("Events2");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [eventType, setEventType] = useState<string>(TYPES[0].value);
  const [guestCount, setGuestCount] = useState("20");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) return (
    <div role="status" className="rounded-3xl border border-success/30 bg-success-soft p-10 text-center">
      <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-success text-surface"><Check size={32} /></span>
      <p className="font-display text-2xl text-content">{te("done")}</p>
    </div>
  );

  return (
    <form
      onSubmit={async (ev) => {
        ev.preventDefault();
        setLoading(true); setError(null);
        try { const r = await submitInquiry({ name, phone, eventType, guestCount: Number(guestCount) || 1, preferredDate: date || undefined, message }); if (r.ok) setDone(true); else setError(r.error || st("errGeneric")); }
        catch { setError(st("errGeneric")); }
        finally { setLoading(false); }
      }}
      className="space-y-5 rounded-3xl border border-line bg-card p-6 shadow-xl shadow-content/5 sm:p-8"
    >
      {/* Tadbir turi — katta tugmalar */}
      <fieldset>
        <legend className={label}>{e2("type")}</legend>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t2) => (
            <button
              key={t2.value}
              type="button"
              aria-pressed={eventType === t2.value}
              onClick={() => setEventType(t2.value)}
              className={cn(
                "min-h-11 rounded-full border px-4 text-sm font-semibold transition",
                eventType === t2.value ? "border-fire bg-fire text-brand-cream" : "border-line bg-paper text-content hover:border-fire/50"
              )}
            >
              {te(t2.key)}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={label}>{e2("name")}</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={st("rNamePh")} autoComplete="name" className={field} />
        </label>
        <label className="block">
          <span className={label}>{e2("phone")}</span>
          <input required type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" autoComplete="tel" className={field} />
        </label>
        <label className="block">
          <span className={label}>{te("guestsPh")}</span>
          <input type="number" min={1} inputMode="numeric" value={guestCount} onChange={(e) => setGuestCount(e.target.value)} className={field} />
        </label>
        <label className="block">
          <span className={label}>{e2("date")}</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
        </label>
      </div>
      <label className="block">
        <span className={label}>{te("notePh")}</span>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className={cn(field, "h-auto py-3")} />
      </label>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <button type="submit" disabled={loading || !name || phone.length < 7} className={cn(btnClass("fire", "lg"), "w-full disabled:opacity-50")}>
        {loading ? "..." : te("send")}
      </button>
    </form>
  );
}
