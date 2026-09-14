"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { submitInquiry } from "@/lib/event/actions";

const TYPES = ["To'y", "Tug'ilgan kun", "Korporativ", "Yubiley", "Boshqa"];

export default function EventForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [eventType, setEventType] = useState(TYPES[0]);
  const [guestCount, setGuestCount] = useState("20");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  if (done) return (
    <div className="mx-auto max-w-md rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
      <Check size={40} className="mx-auto mb-3 text-green-600" />
      <p className="font-medium text-green-700">So'rovingiz qabul qilindi! Tez orada bog'lanamiz.</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-line bg-card p-8">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ismingiz" className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
      <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full rounded-lg border border-line px-3 py-2 text-sm">
        {TYPES.map((t2) => <option key={t2} value={t2}>{t2}</option>)}
      </select>
      <input type="number" value={guestCount} onChange={(e) => setGuestCount(e.target.value)} placeholder="Mehmonlar soni" className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Qo'shimcha izoh" rows={3} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
      <button
        onClick={async () => { setLoading(true); const r = await submitInquiry({ name, phone, eventType, guestCount: Number(guestCount) || 1, preferredDate: date || undefined, message }); setLoading(false); if (r.ok) setDone(true); }}
        disabled={loading || !name || phone.length < 7}
        className="w-full rounded-lg bg-brand-red py-2.5 font-medium text-white hover:bg-brand-red-dark disabled:opacity-50"
      >
        {loading ? "..." : "So'rov yuborish"}
      </button>
    </div>
  );
}
