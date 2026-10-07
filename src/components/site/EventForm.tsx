"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { submitInquiry } from "@/lib/event/actions";

// value — admin panelda ko'rinadigan (o'zbekcha) nom; label — sayt tilida
const TYPES = [
  { value: "To'y", key: "tWedding" },
  { value: "Tug'ilgan kun", key: "tBirthday" },
  { value: "Korporativ", key: "tCorporate" },
  { value: "Yubiley", key: "tAnniversary" },
  { value: "Boshqa", key: "tOther" },
] as const;

export default function EventForm() {
  const te = useTranslations("Events");
  const st = useTranslations("Site");
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
    <div className="mx-auto max-w-md rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
      <Check size={40} className="mx-auto mb-3 text-green-600" />
      <p className="font-medium text-green-700">{te("done")}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-line bg-card p-8">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder={st("rNamePh")} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
      <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full rounded-lg border border-line px-3 py-2 text-sm">
        {TYPES.map((t2) => <option key={t2.value} value={t2.value}>{te(t2.key)}</option>)}
      </select>
      <input type="number" value={guestCount} onChange={(e) => setGuestCount(e.target.value)} placeholder={te("guestsPh")} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
      {error && <p className="text-sm text-brand-red">{error}</p>}
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={te("notePh")} rows={3} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
      <button
        onClick={async () => {
          setLoading(true); setError(null);
          try { const r = await submitInquiry({ name, phone, eventType, guestCount: Number(guestCount) || 1, preferredDate: date || undefined, message }); if (r.ok) setDone(true); else setError(r.error || st("errGeneric")); }
          catch { setError(st("errGeneric")); }
          finally { setLoading(false); }
        }}
        disabled={loading || !name || phone.length < 7}
        className="w-full rounded-lg bg-brand-red py-2.5 font-medium text-white hover:bg-brand-red-dark disabled:opacity-50"
      >
        {loading ? "..." : te("send")}
      </button>
    </div>
  );
}
