/**
 * Supabase Storage — rasmlarni doimiy saqlash (REST API, qo'shimcha paket kerak emas).
 *
 * .env:
 *   SUPABASE_URL="https://xxxx.supabase.co"
 *   SUPABASE_SECRET_KEY="sb_secret_..."   (yoki eski service_role kaliti — ikkalasi ham ishlaydi)
 *   SUPABASE_BUCKET="images"              (ixtiyoriy, standart: images)
 *
 * Bucket bo'lmasa, birinchi yuklashda avtomatik "public" bucket yaratiladi.
 * Kalit faqat serverda ishlatiladi (NEXT_PUBLIC_ emas) — brauzerga chiqmaydi.
 */

export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

function config() {
  const url = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const bucket = process.env.SUPABASE_BUCKET || "images";
  return { url, key, bucket };
}

export function isStorageConfigured(): boolean {
  const { url, key } = config();
  return Boolean(url && key);
}

function authHeaders(key: string): Record<string, string> {
  // Yangi sb_secret_ kalitlari JWT emas — faqat apikey headerida yuboriladi.
  // Eski service_role kaliti (JWT, "eyJ..." bilan boshlanadi) Authorization'da ham kerak.
  return key.startsWith("eyJ") ? { apikey: key, Authorization: `Bearer ${key}` } : { apikey: key };
}

/** Fayl boshidagi baytlar haqiqatan ham rasmmi (brauzer yuborgan MIME turiga ishonmaymiz) */
export function sniffImageType(bytes: Uint8Array): string | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length >= 6 && String.fromCharCode(...b.slice(0, 4)) === "GIF8") return "image/gif";
  if (b.length >= 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") return "image/webp";
  if (b.length >= 12 && String.fromCharCode(...b.slice(4, 8)) === "ftyp") {
    const brand = String.fromCharCode(...b.slice(8, 12));
    if (brand === "avif" || brand === "avis") return "image/avif";
  }
  return null;
}

async function createBucket(url: string, key: string, bucket: string): Promise<void> {
  const res = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...authHeaders(key), "Content-Type": "application/json" },
    body: JSON.stringify({
      id: bucket,
      name: bucket,
      public: true,
      file_size_limit: MAX_IMAGE_BYTES,
      allowed_mime_types: Object.keys(IMAGE_TYPES),
    }),
    signal: AbortSignal.timeout(15000),
  });
  // 409 / "already exists" — boshqa so'rov yaratib ulgurgan, muammo emas
  if (!res.ok && res.status !== 409) {
    const text = await res.text().catch(() => "");
    if (!/already exists/i.test(text)) throw new Error(`Supabase bucket yaratilmadi: ${res.status} ${text}`);
  }
}

/**
 * Rasmni Supabase'ga yuklash va ommaviy URL qaytarish.
 * path — bucket ichidagi yo'l, masalan "uploads/2026/10/abc.jpg".
 * upsert — shu yo'lda fayl bo'lsa ustidan yozish (ko'chirish skriptini qayta ishga tushirish uchun).
 */
export async function uploadToStorage(
  path: string,
  bytes: Uint8Array,
  contentType: string,
  { upsert = false }: { upsert?: boolean } = {}
): Promise<string> {
  const { url, key, bucket } = config();
  if (!url || !key) throw new Error("Supabase sozlanmagan (SUPABASE_URL / SUPABASE_SECRET_KEY)");

  const put = () =>
    fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
      method: "POST",
      headers: {
        ...authHeaders(key),
        "Content-Type": contentType,
        "cache-control": "max-age=31536000",
        "x-upsert": upsert ? "true" : "false",
      },
      body: Buffer.from(bytes),
      signal: AbortSignal.timeout(30000),
    });

  let res = await put();
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (/bucket not found/i.test(text)) {
      await createBucket(url, key, bucket);
      res = await put();
      if (!res.ok) throw new Error(`Supabase yuklash xatosi: ${res.status} ${await res.text().catch(() => "")}`);
    } else {
      throw new Error(`Supabase yuklash xatosi: ${res.status} ${text}`);
    }
  }
  return `${url}/storage/v1/object/public/${bucket}/${path}`;
}
