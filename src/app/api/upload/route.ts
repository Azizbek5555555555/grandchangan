import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { requireRole, ADMIN_ROLES } from "@/lib/auth/guard";

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;

async function saveLocal(file: File): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = ((file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "")) || "jpg";
  const name = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);
  return `/uploads/${name}`;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(ADMIN_ROLES);
    if (!user) return NextResponse.json({ error: "Ruxsat yo'q (admin sifatida kiring)" }, { status: 401 });

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Fayl topilmadi" }, { status: 400 });

    // 1) Cloudinary — faqat sozlangan bo'lsa. Xatolik/blok bo'lsa LOKALGA tushamiz.
    if (CLOUD && PRESET) {
      try {
        const cloudForm = new FormData();
        cloudForm.append("file", file);
        cloudForm.append("upload_preset", PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
          method: "POST",
          body: cloudForm,
        });
        if (res.ok) {
          const data = (await res.json()) as { secure_url: string };
          return NextResponse.json({ url: data.secure_url });
        }
        console.error("[upload] Cloudinary javob bermadi, lokalga o'tildi. status:", res.status);
      } catch (e) {
        console.error("[upload] Cloudinary xatosi (bloklangan bo'lishi mumkin), lokalga o'tildi:", e);
      }
    }

    // 2) Lokal saqlash (dev). Deploy'da Cloudinary/alternativ storage kerak.
    const url = await saveLocal(file);
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[upload] XATOLIK:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Yuklashda xatolik" },
      { status: 500 }
    );
  }
}
