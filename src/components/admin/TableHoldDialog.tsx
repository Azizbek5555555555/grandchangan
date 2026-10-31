"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Lock, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminHoldTables } from "@/lib/reservation/actions";
import Dialog from "@/components/admin/ui/Dialog";
import { Field, Notice } from "@/components/admin/ui/Field";
import { ui } from "@/components/admin/ui/styles";

export type HoldZone = { id: string; name: string; tables: { id: string; number: string; seats: number }[] };

/** Restoran vaqti (Samarqand, UTC+5) bo'yicha bugungi sana va keyingi yarim soat */
function nowLocal() {
  const d = new Date(Date.now() + 5 * 60 * 60 * 1000);
  const iso = d.toISOString();
  const mins = d.getUTCHours() * 60 + d.getUTCMinutes();
  const next = Math.min(23 * 60 + 30, Math.ceil((mins + 1) / 30) * 30);
  const hh = String(Math.floor(next / 60)).padStart(2, "0");
  const mm = String(next % 60).padStart(2, "0");
  return { date: iso.slice(0, 10), time: `${hh}:${mm}` };
}

const addHours = (date: string, time: string, h: number) => {
  const t = new Date(`${date}T${time}:00Z`).getTime() + h * 3600 * 1000;
  const iso = new Date(t).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
};

/**
 * Admin: stol(lar)ni ma'lum vaqtga band qilish. Ikki rejim:
 * — mehmon uchun (telefon orqali kelishilgan bron: ism, telefon, kishi soni, ixtiyoriy SMS);
 * — stolni yopish (sabab bilan, mehmonsiz — masalan, ta'mir yoki tadbir).
 * Saytda shu vaqt oralig'ida tanlangan stollar "band" ko'rinadi.
 */
export default function TableHoldDialog({ zones, onClose }: { zones: HoldZone[]; onClose: () => void }) {
  const t = useTranslations("AdminUi.hold");
  const tc = useTranslations("AdminUi.common");
  const start = useMemo(nowLocal, []);
  const [kind, setKind] = useState<"guest" | "block">("guest");
  const [selected, setSelected] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState(start.date);
  const [fromTime, setFromTime] = useState(start.time);
  const end0 = addHours(start.date, start.time, 2);
  const [toDate, setToDate] = useState(end0.date);
  const [toTime, setToTime] = useState(end0.time);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+998 ");
  const [party, setParty] = useState(2);
  const [note, setNote] = useState("");
  const [smsGuest, setSmsGuest] = useState(true);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; list?: string[] } | null>(null);
  const [pending, startTransition] = useTransition();

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const preset = (h: number) => {
    const e = addHours(fromDate, fromTime, h);
    setToDate(e.date);
    setToTime(e.time);
  };

  function submit() {
    setMsg(null);
    startTransition(async () => {
      const res = await adminHoldTables({
        tableIds: selected, fromDate, fromTime, toDate, toTime, kind,
        guestName: name, guestPhone: phone, partySize: party, note, smsGuest,
      });
      if (res.ok) {
        setMsg({ ok: true, text: t("done", { count: res.codes.length, codes: res.codes.join(", ") }) });
        setSelected([]);
      } else {
        setMsg({ ok: false, text: res.error, list: res.conflicts });
      }
    });
  }

  const modeBtn = (k: "guest" | "block", Icon: typeof Lock, label: string, hint: string) => (
    <button
      type="button"
      onClick={() => setKind(k)}
      aria-pressed={kind === k}
      className={cn(
        "flex flex-1 items-start gap-3 rounded-xl border p-3 text-left transition",
        kind === k ? "border-fire bg-fire/5" : "border-line hover:border-brand-gold/50"
      )}
    >
      <Icon size={18} aria-hidden className={kind === k ? "mt-0.5 text-fire-ink" : "mt-0.5 text-muted"} />
      <span>
        <span className="block text-sm font-medium text-content">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
    </button>
  );

  return (
    <Dialog
      onClose={onClose}
      eyebrow={t("eyebrow")}
      title={t("title")}
      wide
      footer={
        <div className="flex w-full flex-wrap items-center gap-3">
          <button type="button" onClick={onClose} className={ui.btnGhost}>{tc("close")}</button>
          <button type="button" onClick={submit} disabled={pending || !selected.length} className={cn(ui.btnPrimary, "ml-auto")}>
            {kind === "block" ? <Lock size={16} aria-hidden /> : <UserRound size={16} aria-hidden />}
            {pending ? tc("saving") : t("submit", { count: selected.length })}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          {modeBtn("guest", UserRound, t("modeGuest"), t("modeGuestHint"))}
          {modeBtn("block", Lock, t("modeBlock"), t("modeBlockHint"))}
        </div>

        {/* Vaqt oralig'i */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("from")}>
            <div className="flex gap-2">
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={ui.input} />
              <input type="time" step={900} value={fromTime} onChange={(e) => setFromTime(e.target.value)} className={cn(ui.input, "w-32 tabular-nums")} />
            </div>
          </Field>
          <Field label={t("to")}>
            <div className="flex gap-2">
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={ui.input} />
              <input type="time" step={900} value={toTime} onChange={(e) => setToTime(e.target.value)} className={cn(ui.input, "w-32 tabular-nums")} />
            </div>
          </Field>
        </div>
        <div className="-mt-2 flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((h) => (
            <button key={h} type="button" onClick={() => preset(h)} className="rounded-full border border-line px-3 py-1 text-xs text-muted transition hover:border-brand-gold/50 hover:text-content">
              {t("hours", { count: h })}
            </button>
          ))}
          <button type="button" onClick={() => { setToDate(fromDate); setToTime("23:59"); }} className="rounded-full border border-line px-3 py-1 text-xs text-muted transition hover:border-brand-gold/50 hover:text-content">
            {t("untilClose")}
          </button>
        </div>

        {/* Stollar */}
        <div>
          <p className={ui.label}>{t("tables")}</p>
          <div className="max-h-56 space-y-3 overflow-y-auto rounded-xl border border-line p-3">
            {zones.map((z) => (
              <div key={z.id}>
                <p className="mb-1.5 text-xs font-medium text-muted">{z.name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {z.tables.map((tb) => {
                    const on = selected.includes(tb.id);
                    return (
                      <button
                        key={tb.id}
                        type="button"
                        onClick={() => toggle(tb.id)}
                        aria-pressed={on}
                        className={cn(
                          "min-h-9 rounded-lg border px-2.5 text-xs tabular-nums transition",
                          on ? "border-fire bg-fire text-brand-cream" : "border-line text-content hover:border-brand-gold/50"
                        )}
                      >
                        {tb.number} <span className={on ? "text-brand-cream/80" : "text-muted"}>· {tb.seats}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {kind === "guest" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_7rem]">
            <Field label={tc("name")}>
              <input value={name} onChange={(e) => setName(e.target.value)} className={ui.input} />
            </Field>
            <Field label={tc("phone")}>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={cn(ui.input, "tabular-nums")} />
            </Field>
            <Field label={t("party")}>
              <input type="number" min={1} max={200} value={party} onChange={(e) => setParty(Number(e.target.value))} className={cn(ui.input, "tabular-nums")} />
            </Field>
          </div>
        ) : null}

        <Field label={kind === "block" ? t("reason") : t("note")} hint={kind === "block" ? t("reasonHint") : undefined}>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={kind === "block" ? t("reasonPh") : ""} className={ui.input} />
        </Field>

        {kind === "guest" && (
          <label className="flex min-h-11 items-center gap-2 text-sm text-content">
            <input type="checkbox" checked={smsGuest} onChange={(e) => setSmsGuest(e.target.checked)} className={ui.checkbox} />
            {t("smsGuest")}
          </label>
        )}

        {msg && (
          <div>
            <Notice ok={msg.ok}>{msg.text}</Notice>
            {/* Ustma-ust tushgan bronlar — avval ularni bekor qilish kerak */}
            {msg.list?.length ? (
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted">
                {msg.list.map((c) => <li key={c}>{c}</li>)}
              </ul>
            ) : null}
          </div>
        )}
      </div>
    </Dialog>
  );
}
