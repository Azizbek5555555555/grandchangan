/**
 * Tayyor boshlang'ich ro'yxat — xitoy restorani stoli uchun odatiy jihozlar.
 * Hammasi 0 dona bilan qo'shiladi: haqiqiy sonlar keyin "Kirim" yoki inventarizatsiya orqali kiritiladi.
 * Normalar (perSeat/perTable) va minimal zaxira — taxminiy, admin har birini tahrirlay oladi.
 */
import type { InventoryCategory } from "@prisma/client";

export type StarterItem = {
  name: string;
  category: InventoryCategory;
  perSeat: number;
  perTable: number;
  minReserve: number;
  sortOrder: number;
};

type Row = [name: string, category: InventoryCategory, perSeat: number, perTable: number, minReserve: number];

const ROWS: Row[] = [
  // Oshxona anjomlari (har bir o'ringa)
  ["Palochka (juft)", "CUTLERY", 1, 0, 30],
  ["Palochka tagligi", "CUTLERY", 1, 0, 20],
  ["Qoshiq", "CUTLERY", 1, 0, 20],
  ["Vilka", "CUTLERY", 1, 0, 20],
  ["Pichoq", "CUTLERY", 1, 0, 10],
  ["Chinni qoshiq (sho'rva uchun)", "CUTLERY", 1, 0, 20],
  // Idish-tovoq
  ["Guruch kosasi", "TABLEWARE", 1, 0, 20],
  ["Sho'rva kosasi", "TABLEWARE", 1, 0, 20],
  ["Kichik likopcha", "TABLEWARE", 1, 0, 20],
  ["Katta likopcha (umumiy taom)", "TABLEWARE", 0, 2, 10],
  ["Sous idishchasi", "TABLEWARE", 1, 0, 20],
  // Choy
  ["Piyola", "TEA", 1, 0, 30],
  ["Choynak", "TEA", 0, 1, 5],
  // Stakanlar
  ["Stakan", "GLASSWARE", 1, 0, 20],
  // Stol jihozlari (har bir stolga)
  ["Tuz-murch idishi", "TABLE_ACCESSORY", 0, 1, 3],
  ["Soya sousi shishasi", "TABLE_ACCESSORY", 0, 1, 3],
  ["Sirka/achchiq sous idishi", "TABLE_ACCESSORY", 0, 1, 3],
  ["Salfetka qutisi", "TABLE_ACCESSORY", 0, 1, 3],
  ["Stol raqami tagligi", "TABLE_ACCESSORY", 0, 1, 2],
  ["Menyu papkasi", "TABLE_ACCESSORY", 0, 2, 5],
  // Matolar
  ["Dasturxon", "TEXTILE", 0, 1, 10],
];

/** sortOrder 10 qadam bilan — keyin orasiga yangi buyum qo'yish oson */
export const STARTER_ITEMS: StarterItem[] = ROWS.map(([name, category, perSeat, perTable, minReserve], i) => ({
  name,
  category,
  perSeat,
  perTable,
  minReserve,
  sortOrder: (i + 1) * 10,
}));
