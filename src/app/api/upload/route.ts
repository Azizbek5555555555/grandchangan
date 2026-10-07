import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { requireRole, ADMIN_ROLES } from "@/lib/auth/guard";
import {
  IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  isStorageConfigured,
  sniffImageType,
  uploadToStorage,
} from "@/lib/storage/supabase";

/**
 * Faqat lokal ishlab chiqish uchun: public/uploads ga yozish.
 * Production'da (next start) ish vaqtida qo'shilgan public fayllar ko'rsatilmaydi (404)
 * va har deploy'da o'chadi — shuning uchun u yerda faqat Supabase ishlatiladi.
 */
async function saveLocal(name: string, bytes: Uint8Array): Promise<string> {
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
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Fayl topilmadi" }, { status: 400 });
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Rasm juda katta (maksimal 8 MB)" }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = sniffImageType(bytes);
    if (!type || !IMAGE_TYPES[type]) {
      return NextResponse.json({ error: "Faqat JPG, PNG, WEBP, GIF yoki AVIF rasm yuklash mumkin" }, { status: 400 });
    }
    const now = new Date();
    const name = `${randomUUID()}.${IMAGE_TYPES[type]}`;

    if (isStorageConfigured()) {
      const folder = `uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
      const url = await uploadToStorage(`${folder}/${name}`, bytes, type);
      return NextResponse.json({ url });
    }

    if (process.env.NODE_ENV === "production") {
      console.error("[upload] SUPABASE_URL / SUPABASE_SECRET_KEY sozlanmagan");
      return NextResponse.json(
        { error: "Rasm saqlash sozlanmagan: serverga SUPABASE_URL va SUPABASE_SECRET_KEY qo'shing" },
        { status: 500 }
      );
    }
    return NextResponse.json({ url: await saveLocal(name, bytes) });
  } catch (e) {
    console.error("[upload] XATOLIK:", e);
    return NextResponse.json({ error: "Yuklashda xatolik. Birozdan keyin qayta urinib ko'ring." }, { status: 500 });
  }
}
