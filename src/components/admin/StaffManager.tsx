"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Ban, Check, UserMinus, ShieldCheck } from "lucide-react";
import { saveStaff, setStaffBlocked, removeStaff } from "@/lib/staff/actions";
import { ROLE_RANK, STAFF_ROLE_LIST } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/admin/ui/PageHeader";
import Dialog from "@/components/admin/ui/Dialog";
import { Field, Notice } from "@/components/admin/ui/Field";
import Pill, { type PillTone } from "@/components/admin/ui/Pill";
import { ui } from "@/components/admin/ui/styles";
import type { UserRole } from "@prisma/client";

type Staff = { id: string; name: string | null; email: string | null; phone: string; role: UserRole; isBlocked: boolean };
const ROLE_TONE: Record<string, PillTone> = { SUPERADMIN: "fire", ADMIN: "gold", MANAGER: "saffron", WAITER: "jade", KITCHEN: "neutral" };
/** Rol izohi bor rollar (AdminUi.staff.roleHint.<ROLE>) */
const HINTED: UserRole[] = ["WAITER", "KITCHEN", "MANAGER", "ADMIN"];

export default function StaffManager({ staff, myId, myRole }: { staff: Staff[]; myId: string; myRole: UserRole }) {
  const ta = useTranslations("Admin");
  const tsf = useTranslations("AdminUi.staff");
  const tr = useTranslations("AdminUi.roles");
  const tc = useTranslations("AdminUi.common");
  const [modal, setModal] = useState<Staff | null>(null);
  const [pending, startTransition] = useTransition();
  const canManage = (s: Staff) => s.id !== myId && ROLE_RANK[s.role] < ROLE_RANK[myRole];
  const act = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => { const r = await fn(); if (!r.ok) alert(r.error); });

  return (
    <div className={ui.page}>
      <PageHeader
        section="staff"
        title={ta("staff")}
        description={tsf("subtitle")}
        actions={
          <button type="button" className={ui.btnPrimary} onClick={() => setModal({ id: "", name: "", email: "", phone: "", role: "WAITER", isBlocked: false })}>
            <Plus size={16} aria-hidden /> {tsf("add")}
          </button>
        }
      />

      {/* Rollar bo'yicha qisqa ma'lumot */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {HINTED.map((r) => (
          <div key={r} className={cn(ui.card, "p-4")}>
            <Pill tone={ROLE_TONE[r]}>{tr(r)}</Pill>
            <p className="mt-2 text-xs leading-relaxed text-muted">{tsf(`roleHint.${r}`)}</p>
          </div>
        ))}
      </div>

      <div className={ui.tableWrap}>
        <table className={cn(ui.table, "min-w-[46rem]")}>
          <thead className={ui.thead}>
            <tr>
              <th className={ui.th}>{tc("name")}</th>
              <th className={ui.th}>{tc("email")}</th>
              <th className={ui.th}>{tc("phone")}</th>
              <th className={ui.th}>{tsf("colRole")}</th>
              <th className={ui.th}>{tc("status")}</th>
              <th className={cn(ui.th, "text-right")}>{tc("actions")}</th>
            </tr>
          </thead>
          <tbody className={ui.tbody}>
            {staff.map((s) => (
              <tr key={s.id} className={ui.tr}>
                <td className={cn(ui.td, "font-medium")}>
                  <span className="flex items-center gap-2.5">
                    <span aria-hidden="true" className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-brand-gold/30 bg-brand-gold/10 font-display text-sm text-content">
                      {((s.name || s.email || "?").trim()[0] || "?").toUpperCase()}
                    </span>
                    <span>
                      {s.name || "—"}
                      {s.id === myId && <span className="ml-2 text-xs font-normal text-muted">{tsf("you")}</span>}
                    </span>
                  </span>
                </td>
                <td className={cn(ui.td, "text-muted")}>{s.email || "—"}</td>
                <td className={cn(ui.td, "whitespace-nowrap text-muted")}>{s.phone}</td>
                <td className={ui.td}><Pill tone={ROLE_TONE[s.role]}>{tr(s.role)}</Pill></td>
                <td className={ui.td}><Pill tone={s.isBlocked ? "fire" : "success"}>{s.isBlocked ? tc("blocked") : tc("active")}</Pill></td>
                <td className={ui.td}>
                  {canManage(s) ? (
                    <div className="flex justify-end gap-0.5">
                      <button type="button" title={tc("edit")} aria-label={tc("edit")} onClick={() => setModal(s)} className={ui.iconBtn}><Pencil size={15} aria-hidden /></button>
                      <button
                        type="button"
                        disabled={pending}
                        title={s.isBlocked ? tc("unblock") : tc("block")}
                        aria-label={s.isBlocked ? tc("unblock") : tc("block")}
                        onClick={() => act(() => setStaffBlocked(s.id, !s.isBlocked))}
                        className={cn(ui.iconBtn, s.isBlocked ? "hover:text-success" : "hover:text-fire-ink")}
                      >
                        {s.isBlocked ? <Check size={15} aria-hidden /> : <Ban size={15} aria-hidden />}
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        title={tsf("remove")}
                        aria-label={tsf("remove")}
                        onClick={() => confirm(tsf("removeConfirm", { name: s.name || s.email || "" })) && act(() => removeStaff(s.id))}
                        className={ui.iconBtnDanger}
                      >
                        <UserMinus size={15} aria-hidden />
                      </button>
                    </div>
                  ) : (
                    <span className="flex justify-end text-muted" title={tsf("protected")}><ShieldCheck size={16} aria-label={tsf("protected")} /></span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && <StaffModal data={modal} myRole={myRole} onClose={() => setModal(null)} />}
    </div>
  );
}

function StaffModal({ data, myRole, onClose }: { data: Staff; myRole: UserRole; onClose: () => void }) {
  const tsf = useTranslations("AdminUi.staff");
  const tr = useTranslations("AdminUi.roles");
  const tc = useTranslations("AdminUi.common");
  const isNew = !data.id;
  const [name, setName] = useState(data.name || "");
  const [email, setEmail] = useState(data.email || "");
  const [phone, setPhone] = useState(data.phone || "");
  const [role, setRole] = useState<UserRole>(data.role);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const roles = STAFF_ROLE_LIST.filter((r) => ROLE_RANK[r] < ROLE_RANK[myRole]);

  async function save() {
    setSaving(true); setError(null);
    try {
      const r = await saveStaff({ id: data.id || undefined, name, email, phone, role, password });
      if (r.ok) onClose(); else setError(r.error || tc("error"));
    } catch {
      setError(tc("error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      onClose={onClose}
      title={isNew ? tsf("newTitle") : tsf("editTitle")}
      footer={
        <>
          <button type="button" onClick={onClose} className={ui.btnSecondary}>{tc("cancel")}</button>
          <button type="button" disabled={saving} onClick={save} className={ui.btnPrimary}>{saving ? tc("saving") : tc("save")}</button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={tc("name")}>
          <input value={name} onChange={(e) => setName(e.target.value)} className={ui.input} />
        </Field>
        <Field label={tsf("emailLogin")}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={ui.input} autoComplete="off" />
        </Field>
        <Field label={tc("phone")}>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" className={ui.input} inputMode="tel" />
        </Field>
        <Field label={tsf("colRole")} hint={HINTED.includes(role) ? tsf(`roleHint.${role}`) : undefined}>
          <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className={ui.input}>
            {roles.map((r) => <option key={r} value={r}>{tr(r)}</option>)}
          </select>
        </Field>
        <Field label={isNew ? tsf("password") : tsf("newPassword")} hint={isNew ? tsf("passwordHint") : tsf("newPasswordHint")}>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className={ui.input} />
        </Field>
        {error && <Notice ok={false}>{error}</Notice>}
      </div>
    </Dialog>
  );
}
