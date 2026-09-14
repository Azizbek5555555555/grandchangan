"use client";
import { Badge } from "@/components/ui/primitives";
import { Trash2 } from "lucide-react";
import { updateInquiryStatus, deleteInquiry } from "@/lib/event/actions";

type Inquiry = { id: string; name: string; phone: string; eventType: string; guestCount: number; preferredDate?: string | null; message?: string | null; status: string; createdAt: string };
const STATUSES = ["NEW", "CONTACTED", "CONFIRMED", "CLOSED"];
const COLOR: Record<string, string> = { NEW: "gold", CONTACTED: "blue", CONFIRMED: "green", CLOSED: "gray" };

export default function EventInquiries({ inquiries }: { inquiries: Inquiry[] }) {
  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Tadbir so'rovlari</h1>
      <div className="space-y-3">
        {inquiries.map((q) => (
          <div key={q.id} className="rounded-xl border border-line bg-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{q.name}</span>
                  <Badge color={COLOR[q.status]}>{q.status}</Badge>
                </div>
                <p className="text-sm text-muted">{q.phone} · {q.eventType} · {q.guestCount} kishi</p>
                {q.preferredDate && <p className="text-xs text-muted">Sana: {new Date(q.preferredDate).toLocaleDateString("uz-UZ")}</p>}
                {q.message && <p className="mt-1 text-sm text-muted">{q.message}</p>}
              </div>
              <div className="flex items-center gap-2">
                <select value={q.status} onChange={(e) => updateInquiryStatus(q.id, e.target.value)} className="rounded border border-line px-2 py-1 text-xs">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => confirm("O'chirilsinmi?") && deleteInquiry(q.id)} className="rounded p-1 text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
        {inquiries.length === 0 && <p className="text-muted">So'rov yo'q.</p>}
      </div>
    </div>
  );
}
