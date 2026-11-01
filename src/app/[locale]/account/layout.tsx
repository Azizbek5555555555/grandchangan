import { notFound } from "next/navigation";

/**
 * Mijoz kabineti (/account, /account/login — telefon + SMS kod bilan kirish) o'chirilgan: saytda kabinet yo'q,
 * mijozlar ro'yxatdan o'tmasdan bron qiladi (Aziz, 2026-11-01). Kod saqlangan — kerak bo'lsa shu faylni o'chiring
 * va requestOtpAction'dagi to'xtatishni olib tashlang (Eskiz'da "Tasdiqlash kodi" shabloni ham kerak bo'ladi).
 */
export default function AccountLayout(): never {
  notFound();
}
