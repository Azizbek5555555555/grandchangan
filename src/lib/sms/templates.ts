/**
 * SMS matnlari — Eskiz kabinetida ("Mening matnlarim") moderatsiyadan o'tgan shablonlar bilan AYNAN bir xil
 * bo'lishi kerak (%w — bitta so'z, bo'shliqsiz). Matnni o'zgartirsangiz — Eskiz'da ham yangi shablonni tasdiqlating.
 *
 *   managerBooking: GrandChangan: yangi bron %w. %w %w, %w kishi, stol %w. Tel: %w. Mehmon: %w
 *   guestBooking:   GrandChangan: bron qabul qilindi. Kod: %w. %w %w
 *   otp:            GrandChangan. Tasdiqlash kodi: %w
 */

/** Ism: bo'shliqlar "_" ga — shablonda bitta so'z bo'lib qoladi */
const word = (s: string) => s.trim().replace(/\s+/g, "_").slice(0, 40) || "-";

export const smsText = {
  managerBooking: (p: { code: string; date: string; time: string; party: number; table: string; contact: string; name: string }) =>
    `GrandChangan: yangi bron ${p.code}. ${p.date} ${p.time}, ${p.party} kishi, stol ${word(p.table)}. Tel: ${p.contact}. Mehmon: ${word(p.name)}`,
  guestBooking: (p: { code: string; date: string; time: string }) => `GrandChangan: bron qabul qilindi. Kod: ${p.code}. ${p.date} ${p.time}`,
  otp: (code: string) => `GrandChangan. Tasdiqlash kodi: ${code}`,
};
