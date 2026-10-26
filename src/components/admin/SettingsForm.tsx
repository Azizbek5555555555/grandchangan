"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Building2, Clock, Save } from "lucide-react";
import { LocalizedInput, type LocalizedValue } from "@/components/ui/LocalizedInput";
import { saveSetting, saveWorkingHours } from "@/lib/settings/actions";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/admin/ui/PageHeader";
import { Field, Notice } from "@/components/admin/ui/Field";
import { ui } from "@/components/admin/ui/styles";

type General = { name?: string; email?: string; phones?: string[]; address?: string | LocalizedValue; instagram?: string; telegram?: string; mapQuery?: string; mapLink?: string };
type Hour = { dayOfWeek: number; openTime: string | null; closeTime: string | null; isClosed: boolean };
/** Ko'rsatish tartibi: dushanbadan yakshanbagacha (dayOfWeek: 0 — yakshanba) */
const ORDER = [1, 2, 3, 4, 5, 6, 0];

type Msg = { ok: boolean; text: string } | null;

export default function SettingsForm({ general, hours }: { general: General; hours: Hour[] }) {
  const ta = useTranslations("Admin");
  const ts = useTranslations("AdminUi.settings");
  const tc = useTranslations("AdminUi.common");
  const [g, setG] = useState<General>(general);
  const [phones, setPhones] = useState((general.phones || []).join(", "));
  // Manzil 4 tilda saqlanadi (seed shunday yozadi); eski oddiy matn bo'lsa — UZ sifatida ochiladi
  const [address, setAddress] = useState<LocalizedValue>(() =>
    typeof general.address === "string" ? { uz: general.address } : general.address || {}
  );
  const [h, setH] = useState<Hour[]>(() => {
    const map = new Map(hours.map((x) => [x.dayOfWeek, x]));
    return Array.from({ length: 7 }).map((_, i) => map.get(i) || { dayOfWeek: i, openTime: "10:00", closeTime: "23:00", isClosed: false });
  });
  const [msgGeneral, setMsgGeneral] = useState<Msg>(null);
  const [msgHours, setMsgHours] = useState<Msg>(null);
  const [saving, setSaving] = useState<"general" | "hours" | null>(null);

  const setDay = (dow: number, patch: Partial<Hour>) => setH((list) => list.map((d) => (d.dayOfWeek === dow ? { ...d, ...patch } : d)));

  async function saveGeneral() {
    setSaving("general"); setMsgGeneral(null);
    try {
      await saveSetting("general", { ...g, address, phones: phones.split(",").map((s) => s.trim()).filter(Boolean) });
      setMsgGeneral({ ok: true, text: tc("saved") });
    } catch {
      setMsgGeneral({ ok: false, text: tc("error") });
    } finally {
      setSaving(null);
    }
  }
  async function saveHours() {
    setSaving("hours"); setMsgHours(null);
    try {
      await saveWorkingHours(h);
      setMsgHours({ ok: true, text: tc("saved") });
    } catch {
      setMsgHours({ ok: false, text: tc("error") });
    } finally {
      setSaving(null);
    }
  }

  const text = (key: keyof General, label: string, extra?: { placeholder?: string; hint?: string; type?: string }) => (
    <Field label={label} hint={extra?.hint}>
      <input
        type={extra?.type || "text"}
        value={(g[key] as string) || ""}
        onChange={(e) => setG({ ...g, [key]: e.target.value })}
        placeholder={extra?.placeholder}
        className={ui.input}
      />
    </Field>
  );

  return (
    <div className={ui.page}>
      <PageHeader section="settings" title={ta("settings")} description={ts("subtitle")} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <section aria-labelledby="set-general" className={cn(ui.card, "self-start xl:col-span-3")}>
          <div className="flex items-center gap-3 border-b border-line px-4 py-4 sm:px-5">
            <span className="inline-flex size-9 items-center justify-center rounded-xl bg-fire/10 text-fire-ink"><Building2 size={18} aria-hidden /></span>
            <div>
              <h2 id="set-general" className={ui.cardTitle}>{ts("general")}</h2>
              <p className="text-xs text-muted">{ts("generalHint")}</p>
            </div>
          </div>
          <div className="space-y-4 p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {text("name", ts("name"))}
              {text("email", tc("email"), { type: "email" })}
            </div>
            <Field label={ts("phones")} hint={ts("phonesHint")}>
              <input value={phones} onChange={(e) => setPhones(e.target.value)} placeholder="+998 90 123 45 67, +998 66 …" className={ui.input} />
            </Field>
            <LocalizedInput label={ts("address")} value={address} onChange={setAddress} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {text("instagram", "Instagram", { placeholder: "https://instagram.com/…" })}
              {text("telegram", "Telegram", { placeholder: "https://t.me/…" })}
            </div>
            {text("mapQuery", ts("mapQuery"), { placeholder: "Grand Changan Restaurant, Ibn Xoldun 10B, Samarqand", hint: ts("mapQueryHint") })}
            {text("mapLink", ts("mapLink"), { placeholder: "https://maps.app.goo.gl/…", hint: ts("mapLinkHint") })}
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3 sm:px-5">
            {msgGeneral && <Notice ok={msgGeneral.ok} className="mr-auto">{msgGeneral.text}</Notice>}
            <button type="button" onClick={saveGeneral} disabled={saving === "general"} className={cn(ui.btnPrimary, "ml-auto")}>
              <Save size={16} aria-hidden /> {saving === "general" ? tc("saving") : tc("save")}
            </button>
          </div>
        </section>

        <section aria-labelledby="set-hours" className={cn(ui.card, "self-start xl:col-span-2")}>
          <div className="flex items-center gap-3 border-b border-line px-4 py-4 sm:px-5">
            <span className="inline-flex size-9 items-center justify-center rounded-xl bg-fire/10 text-fire-ink"><Clock size={18} aria-hidden /></span>
            <div>
              <h2 id="set-hours" className={ui.cardTitle}>{ts("hours")}</h2>
              <p className="text-xs text-muted">{ts("hoursHint")}</p>
            </div>
          </div>
          <ul className="divide-y divide-line px-4 sm:px-5">
            {ORDER.map((dow) => {
              const day = h.find((d) => d.dayOfWeek === dow)!;
              return (
                <li key={dow} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 text-sm">
                  <span className="w-28 font-medium text-content">{ts(`days.d${dow}`)}</span>
                  <label className="flex min-h-11 items-center gap-2 text-muted sm:min-h-9">
                    <input type="checkbox" checked={day.isClosed} onChange={(e) => setDay(dow, { isClosed: e.target.checked })} className={ui.checkbox} />
                    {ts("closed")}
                  </label>
                  {!day.isClosed ? (
                    <span className="ml-auto flex items-center gap-1.5">
                      <input type="time" aria-label={ts("open", { day: ts(`days.d${dow}`) })} value={day.openTime || "10:00"} onChange={(e) => setDay(dow, { openTime: e.target.value })} className={cn(ui.inputSm, "tabular-nums")} />
                      <span aria-hidden="true" className="text-muted">—</span>
                      <input type="time" aria-label={ts("close", { day: ts(`days.d${dow}`) })} value={day.closeTime || "23:00"} onChange={(e) => setDay(dow, { closeTime: e.target.value })} className={cn(ui.inputSm, "tabular-nums")} />
                    </span>
                  ) : (
                    <span className="ml-auto rounded-full bg-fire/10 px-2.5 py-1 text-xs font-medium text-fire-ink">{ts("closedDay")}</span>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3 sm:px-5">
            {msgHours && <Notice ok={msgHours.ok} className="mr-auto">{msgHours.text}</Notice>}
            <button type="button" onClick={saveHours} disabled={saving === "hours"} className={cn(ui.btnPrimary, "ml-auto")}>
              <Save size={16} aria-hidden /> {saving === "hours" ? tc("saving") : tc("save")}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
