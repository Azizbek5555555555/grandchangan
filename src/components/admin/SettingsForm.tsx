"use client";
import { useState } from "react";
import { Button } from "@/components/ui/primitives";
import { saveSetting, saveWorkingHours } from "@/lib/settings/actions";

type General = { name?: string; email?: string; phones?: string[]; address?: string; instagram?: string; telegram?: string };
type Hour = { dayOfWeek: number; openTime: string | null; closeTime: string | null; isClosed: boolean };
const DAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

export default function SettingsForm({ general, hours }: { general: General; hours: Hour[] }) {
  const [g, setG] = useState<General>(general);
  const [phones, setPhones] = useState((general.phones || []).join(", "));
  const [h, setH] = useState<Hour[]>(() => {
    const map = new Map(hours.map((x) => [x.dayOfWeek, x]));
    return Array.from({ length: 7 }).map((_, i) => map.get(i) || { dayOfWeek: i, openTime: "11:00", closeTime: "23:00", isClosed: false });
  });
  const [saved, setSaved] = useState(false);

  return (
    <div className="max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Sozlamalar</h1>

      <section className="mb-8 space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="font-semibold">Umumiy ma'lumot</h2>
        <label className="block"><span className="mb-1 block text-sm">Nomi</span><input value={g.name || ""} onChange={(e) => setG({ ...g, name: e.target.value })} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" /></label>
        <label className="block"><span className="mb-1 block text-sm">Email</span><input value={g.email || ""} onChange={(e) => setG({ ...g, email: e.target.value })} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" /></label>
        <label className="block"><span className="mb-1 block text-sm">Telefonlar (vergul bilan)</span><input value={phones} onChange={(e) => setPhones(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" /></label>
        <label className="block"><span className="mb-1 block text-sm">Manzil</span><input value={g.address || ""} onChange={(e) => setG({ ...g, address: e.target.value })} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" /></label>
        <label className="block"><span className="mb-1 block text-sm">Instagram</span><input value={g.instagram || ""} onChange={(e) => setG({ ...g, instagram: e.target.value })} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" /></label>
        <Button onClick={async () => { await saveSetting("general", { ...g, phones: phones.split(",").map((s) => s.trim()).filter(Boolean) }); setSaved(true); }}>Saqlash</Button>
      </section>

      <section className="space-y-2 rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-2 font-semibold">Ish vaqti</h2>
        {h.map((day, idx) => (
          <div key={day.dayOfWeek} className="flex items-center gap-3 text-sm">
            <span className="w-24">{DAYS[day.dayOfWeek]}</span>
            <label className="flex items-center gap-1"><input type="checkbox" checked={day.isClosed} onChange={(e) => { const n = [...h]; n[idx] = { ...day, isClosed: e.target.checked }; setH(n); }} /> Yopiq</label>
            {!day.isClosed && (
              <>
                <input type="time" value={day.openTime || "11:00"} onChange={(e) => { const n = [...h]; n[idx] = { ...day, openTime: e.target.value }; setH(n); }} className="rounded border border-neutral-300 px-2 py-1" />
                <span>—</span>
                <input type="time" value={day.closeTime || "23:00"} onChange={(e) => { const n = [...h]; n[idx] = { ...day, closeTime: e.target.value }; setH(n); }} className="rounded border border-neutral-300 px-2 py-1" />
              </>
            )}
          </div>
        ))}
        <Button className="mt-3" onClick={async () => { await saveWorkingHours(h); setSaved(true); }}>Saqlash</Button>
      </section>

      {saved && <p className="mt-4 text-sm text-green-600">Saqlandi ✓</p>}
    </div>
  );
}
