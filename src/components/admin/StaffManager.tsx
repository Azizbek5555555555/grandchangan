"use client";
import { useState } from "react";
import { Plus, Pencil, Ban, Check, UserMinus } from "lucide-react";
import { Button, Modal, Badge, TextField } from "@/components/ui/primitives";
import { saveStaff, setStaffBlocked, removeStaff } from "@/lib/staff/actions";
import { ROLE_LABELS, ROLE_RANK, STAFF_ROLE_LIST } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";

type Staff = { id: string; name: string | null; email: string | null; phone: string; role: UserRole; isBlocked: boolean };
const ROLE_COLOR: Record<string, string> = { SUPERADMIN: "red", ADMIN: "gold", MANAGER: "blue", WAITER: "green", KITCHEN: "gray" };
const ROLE_HINT: Partial<Record<UserRole, string>> = {
  WAITER: "bronlar va buyurtmalar",
  KITCHEN: "faqat buyurtmalar (holatini o'zgartirish)",
  MANAGER: "barcha bo'limlar, xodimlardan tashqari",
  ADMIN: "barcha bo'limlar + xodimlar",
};

export default function StaffManager({ staff, myId, myRole }: { staff: Staff[]; myId: string; myRole: UserRole }) {
  const [modal, setModal] = useState<Staff | null>(null);
  const canManage = (s: Staff) => s.id !== myId && ROLE_RANK[s.role] < ROLE_RANK[myRole];
  const act = async (fn: () => Promise<{ ok: boolean; error?: string }>) => { const r = await fn(); if (!r.ok) alert(r.error); };

  return (
    <div className="p-6">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Xodimlar</h1>
        <Button onClick={() => setModal({ id: "", name: "", email: "", phone: "", role: "WAITER", isBlocked: false })}>
          <Plus size={16} /> Xodim qo&apos;shish
        </Button>
      </div>
      <p className="mb-6 text-sm text-muted">
        Xodim admin panelga email va parol bilan kiradi va faqat o&apos;z roliga tegishli bo&apos;limlarni ko&apos;radi.
      </p>
      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-surface-2 text-left text-muted">
            <tr><th className="px-4 py-3">Ism</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Telefon</th><th className="px-4 py-3">Rol</th><th className="px-4 py-3">Holat</th><th className="px-4 py-3" /></tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-b border-line">
                <td className="px-4 py-3 font-medium">{s.name || "—"}{s.id === myId && <span className="ml-2 text-xs text-muted">(siz)</span>}</td>
                <td className="px-4 py-3">{s.email || "—"}</td>
                <td className="px-4 py-3">{s.phone}</td>
                <td className="px-4 py-3"><Badge color={ROLE_COLOR[s.role]}>{ROLE_LABELS[s.role]}</Badge></td>
                <td className="px-4 py-3"><Badge color={s.isBlocked ? "red" : "green"}>{s.isBlocked ? "Bloklangan" : "Faol"}</Badge></td>
                <td className="px-4 py-3">
                  {canManage(s) && (
                    <div className="flex justify-end gap-1">
                      <button title="Tahrirlash" onClick={() => setModal(s)} className="rounded p-1.5 hover:bg-surface-2"><Pencil size={15} /></button>
                      <button title={s.isBlocked ? "Ochish" : "Bloklash"} onClick={() => act(() => setStaffBlocked(s.id, !s.isBlocked))} className={`rounded p-1.5 hover:bg-surface-2 ${s.isBlocked ? "text-green-600" : "text-orange-500"}`}>
                        {s.isBlocked ? <Check size={15} /> : <Ban size={15} />}
                      </button>
                      <button title="Xodimlikdan chiqarish" onClick={() => confirm(`${s.name || s.email} xodimlikdan chiqarilsinmi? Admin panelga kira olmaydi.`) && act(() => removeStaff(s.id))} className="rounded p-1.5 text-red-500 hover:bg-surface-2"><UserMinus size={15} /></button>
                    </div>
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
  const isNew = !data.id;
  const [name, setName] = useState(data.name || "");
  const [email, setEmail] = useState(data.email || "");
  const [phone, setPhone] = useState(data.phone || "");
  const [role, setRole] = useState<UserRole>(data.role);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const roles = STAFF_ROLE_LIST.filter((r) => ROLE_RANK[r] < ROLE_RANK[myRole]);

  return (
    <Modal open onClose={onClose} title={isNew ? "Yangi xodim" : "Xodimni tahrirlash"}>
      <div className="space-y-4">
        <TextField label="Ism" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="Email (login)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-content">Rol</span>
          <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full rounded-lg border border-line px-3 py-2 text-sm">
            {roles.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}{ROLE_HINT[r] ? ` — ${ROLE_HINT[r]}` : ""}</option>)}
          </select>
        </label>
        <TextField
          label={isNew ? "Parol (kamida 8 belgi)" : "Yangi parol (o'zgartirmasangiz bo'sh qoldiring)"}
          type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Bekor</Button>
          <Button
            disabled={saving}
            onClick={async () => {
              setSaving(true); setError(null);
              const r = await saveStaff({ id: data.id || undefined, name, email, phone, role, password });
              setSaving(false);
              if (r.ok) onClose(); else setError(r.error || "Xatolik");
            }}
          >
            Saqlash
          </Button>
        </div>
      </div>
    </Modal>
  );
}
