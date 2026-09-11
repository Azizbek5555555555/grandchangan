import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ---------- 1. Superadmin ----------
  const email = process.env.SEED_ADMIN_EMAIL || "admin@grandchangan.uz";
  const password = process.env.SEED_ADMIN_PASSWORD || "admin12345";
  const phone = process.env.SEED_ADMIN_PHONE || "+998900000000";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "SUPERADMIN", isBlocked: false },
    create: {
      email,
      phone,
      name: "Super Admin",
      passwordHash,
      role: "SUPERADMIN",
      phoneVerified: true,
    },
  });
  console.log(`✔ Superadmin: ${email} / ${password}`);

  // ---------- 2. Site settings ----------
  const settings: Record<string, unknown> = {
    general: {
      name: "GrandChangan",
      phones: ["+998 66 000 00 00"],
      address: { uz: "Samarqand", ru: "Самарканд", en: "Samarkand", zh: "撒马尔罕" },
      email: "info@grandchangan.uz",
    },
    social: { instagram: "", telegram: "", facebook: "" },
    map: { lat: 39.6542, lng: 66.9597 },
    reservation: { slotMinutes: 120, depositEnabled: true },
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value: value as object },
      create: { key, value: value as object },
    });
  }
  console.log("✔ Site settings");

  // ---------- 3. Working hours (har kuni 11:00 - 23:00) ----------
  for (let d = 0; d < 7; d++) {
    await prisma.workingHour.upsert({
      where: { dayOfWeek: d },
      update: {},
      create: { dayOfWeek: d, openTime: "11:00", closeTime: "23:00", isClosed: false },
    });
  }
  console.log("✔ Working hours");

  // ---------- 4. Menu categories (Xitoy oshxonasi) ----------
  const categories = [
    { slug: "cold", name: { uz: "Sovuq taomlar", ru: "Холодные блюда", en: "Cold dishes", zh: "凉菜" } },
    { slug: "hot", name: { uz: "Issiq taomlar", ru: "Горячие блюда", en: "Hot dishes", zh: "热菜" } },
    { slug: "soup", name: { uz: "Sho'rvalar", ru: "Супы", en: "Soups", zh: "汤类" } },
    { slug: "dimsum", name: { uz: "Dim sum", ru: "Дим сам", en: "Dim sum", zh: "点心" } },
    { slug: "noodles", name: { uz: "Lag'mon va noodle", ru: "Лапша", en: "Noodles", zh: "面食" } },
    { slug: "rice", name: { uz: "Guruch taomlari", ru: "Рис", en: "Rice", zh: "米饭" } },
    { slug: "seafood", name: { uz: "Dengiz mahsulotlari", ru: "Морепродукты", en: "Seafood", zh: "海鲜" } },
    { slug: "tea", name: { uz: "Choy", ru: "Чай", en: "Tea", zh: "茶" } },
    { slug: "drinks", name: { uz: "Ichimliklar", ru: "Напитки", en: "Drinks", zh: "饮料" } },
    { slug: "dessert", name: { uz: "Shirinliklar", ru: "Десерты", en: "Desserts", zh: "甜点" } },
  ];
  let order = 0;
  const catIds: Record<string, string> = {};
  for (const c of categories) {
    const cat = await prisma.menuCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, sortOrder: order },
      create: { slug: c.slug, name: c.name, sortOrder: order },
    });
    catIds[c.slug] = cat.id;
    order++;
  }
  console.log(`✔ ${categories.length} menu categories`);

  // ---------- 5. Namuna taomlar ----------
  const items = [
    {
      slug: "peking-duck",
      categorySlug: "hot",
      name: { uz: "Pekin o'rdagi", ru: "Утка по-пекински", en: "Peking duck", zh: "北京烤鸭" },
      description: { uz: "An'anaviy xrustik terili o'rdak", ru: "Хрустящая утка", en: "Crispy roasted duck", zh: "皮脆肉嫩" },
      price: 180000,
      spicyLevel: "NONE" as const,
      isFeatured: true,
    },
    {
      slug: "kung-pao-chicken",
      categorySlug: "hot",
      name: { uz: "Gongbao tovuq", ru: "Курица Гунбао", en: "Kung Pao chicken", zh: "宫保鸡丁" },
      description: { uz: "Achchiq-nordon tovuq, yeryong'oq bilan", ru: "Острая курица с арахисом", en: "Spicy chicken with peanuts", zh: "花生辣子鸡" },
      price: 65000,
      spicyLevel: "HOT" as const,
      isFeatured: true,
    },
    {
      slug: "veg-spring-rolls",
      categorySlug: "cold",
      name: { uz: "Sabzavotli roll", ru: "Спринг-роллы", en: "Spring rolls", zh: "春卷" },
      description: { uz: "Xrustik sabzavotli rulon", ru: "Хрустящие овощные роллы", en: "Crispy veg rolls", zh: "蔬菜春卷" },
      price: 35000,
      spicyLevel: "NONE" as const,
      isVegetarian: true,
    },
    {
      slug: "hot-sour-soup",
      categorySlug: "soup",
      name: { uz: "Achchiq-nordon sho'rva", ru: "Кисло-острый суп", en: "Hot & sour soup", zh: "酸辣汤" },
      description: { uz: "Klassik Xitoy sho'rvasi", ru: "Классический суп", en: "Classic Chinese soup", zh: "经典酸辣汤" },
      price: 40000,
      spicyLevel: "MEDIUM" as const,
    },
    {
      slug: "jasmine-tea",
      categorySlug: "tea",
      name: { uz: "Yasemin choyi", ru: "Жасминовый чай", en: "Jasmine tea", zh: "茉莉花茶" },
      description: { uz: "Xushbo'y yashil choy", ru: "Ароматный чай", en: "Fragrant green tea", zh: "香茶" },
      price: 20000,
      spicyLevel: "NONE" as const,
      isVegetarian: true,
    },
  ];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    await prisma.menuItem.upsert({
      where: { slug: it.slug },
      update: {},
      create: {
        slug: it.slug,
        categoryId: catIds[it.categorySlug],
        name: it.name,
        description: it.description,
        price: it.price,
        spicyLevel: it.spicyLevel,
        isVegetarian: it.isVegetarian ?? false,
        isFeatured: it.isFeatured ?? false,
        sortOrder: i,
      },
    });
  }
  console.log(`✔ ${items.length} sample menu items`);

  // ---------- 6. Zone + tables (vizual xarita uchun) ----------
  const zone = await prisma.zone.upsert({
    where: { id: "seed-main-hall" },
    update: {},
    create: {
      id: "seed-main-hall",
      name: { uz: "Asosiy zal", ru: "Главный зал", en: "Main hall", zh: "主厅" },
      floor: 1,
      sortOrder: 0,
    },
  });

  const tables = [
    { number: "1", seats: 4, shape: "ROUND" as const, posX: 80, posY: 80 },
    { number: "2", seats: 4, shape: "ROUND" as const, posX: 240, posY: 80 },
    { number: "3", seats: 6, shape: "ROUND" as const, posX: 420, posY: 80, width: 110, height: 110 },
    { number: "4", seats: 8, shape: "ROUND" as const, posX: 80, posY: 260, width: 130, height: 130 },
    { number: "VIP-1", seats: 12, shape: "ROUND" as const, posX: 360, posY: 280, width: 150, height: 150, isVip: true, minSpend: 1500000 },
  ];
  for (const tb of tables) {
    await prisma.table.upsert({
      where: { zoneId_number: { zoneId: zone.id, number: tb.number } },
      update: {},
      create: {
        zoneId: zone.id,
        number: tb.number,
        seats: tb.seats,
        shape: tb.shape,
        posX: tb.posX,
        posY: tb.posY,
        width: tb.width ?? 90,
        height: tb.height ?? 90,
        isVip: tb.isVip ?? false,
        minSpend: tb.minSpend,
      },
    });
  }
  console.log(`✔ 1 zone + ${tables.length} tables`);

  // ---------- 7. Hero banner ----------
  const heroCount = await prisma.banner.count({ where: { position: "HERO" } });
  if (heroCount === 0) {
    await prisma.banner.create({
      data: {
        position: "HERO",
        imageUrl: "/images/hero-placeholder.jpg",
        title: { uz: "GrandChangan", ru: "GrandChangan", en: "GrandChangan", zh: "长安大酒楼" },
        subtitle: {
          uz: "Haqiqiy Xitoy taomlari",
          ru: "Настоящая китайская кухня",
          en: "Authentic Chinese cuisine",
          zh: "正宗中式美食",
        },
        isActive: true,
      },
    });
    console.log("✔ Hero banner");
  }

  console.log("\n✅ Seed tugadi.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
