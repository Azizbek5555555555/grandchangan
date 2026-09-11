import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { requireRole, ADMIN_ROLES } from "@/lib/auth/guard";

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;

export async function POST(req: NextRequest) {
  const user = await requireRole(ADMIN_ROLES);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });

  // 1) Cloudinary (agar .env da sozlangan bo'lsa) — DOIMIY saqlash.
  //    Deploy va qayta ishga tushirishlarda rasmlar yo'qolmaydi.
  if (CLOUD && PRESET) {
    const cloudForm = new FormData();
    cloudForm.append("file", file);
    cloudForm.append("upload_preset", PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
      method: "POST",
      body: cloudForm,
    });
    if (!res.ok) {
      return NextResponse.json({ error: "cloudinary upload failed" }, { status: 500 });
    }
    const data = (await res.json()) as { secure_url: string };
    return NextResponse.json({ url: data.secure_url });
  }

  // 2) Lokal fallback — faqat development uchun.
  //    OGOHLANTIRISH: bu rasmlar faqat shu kompyuterda saqlanadi; deploy'da/boshqa
  //    mashinada ko'rinmaydi. Ishlab chiqarish uchun yuqoridagi Cloudinary'ni yoqing.
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const name = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);
  return NextResponse.json({ url: `/uploads/${name}` });
}
