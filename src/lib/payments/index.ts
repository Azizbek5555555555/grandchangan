import "server-only";

/**
 * To'lov shlyuzlari uchun umumiy skelet.
 * NEEDS-KEYS: har bir provayder uchun .env kalitlari kerak (PAYME_MERCHANT_ID/KEY,
 *   CLICK_MERCHANT_ID/SERVICE_ID/SECRET, UZUM_...). Kalitlarsiz [PAY:DEV] rejimida ishlaydi.
 * SANDBOX-TEST: har bir provayderning sandbox muhitida callback (webhook) test qilinishi shart.
 */

export type PaymentProvider = "PAYME" | "CLICK" | "UZUM";

export interface CheckoutParams {
  provider: PaymentProvider;
  amount: number; // so'mda
  orderId?: string;
  reservationId?: string;
  returnUrl?: string;
}

const KEYS = {
  PAYME: { merchantId: process.env.PAYME_MERCHANT_ID, key: process.env.PAYME_KEY },
  CLICK: { merchantId: process.env.CLICK_MERCHANT_ID, serviceId: process.env.CLICK_SERVICE_ID, secret: process.env.CLICK_SECRET_KEY },
  UZUM: { merchantId: process.env.UZUM_MERCHANT_ID, key: process.env.UZUM_KEY },
};

export function isConfigured(provider: PaymentProvider): boolean {
  if (provider === "PAYME") return !!(KEYS.PAYME.merchantId && KEYS.PAYME.key);
  if (provider === "CLICK") return !!(KEYS.CLICK.merchantId && KEYS.CLICK.secret);
  if (provider === "UZUM") return !!(KEYS.UZUM.merchantId && KEYS.UZUM.key);
  return false;
}

/** To'lov sahifasi URL'ini hosil qilish (haqiqiy imzolash provayder hujjatiga qarab qo'shiladi). */
export function buildCheckoutUrl(p: CheckoutParams): { url: string; dev: boolean } {
  if (!isConfigured(p.provider)) {
    // eslint-disable-next-line no-console
    console.log(`[PAY:DEV] ${p.provider} checkout — ${p.amount} so'm (kalitlar yo'q)`);
    return { url: `/payment/dev?provider=${p.provider}&amount=${p.amount}`, dev: true };
  }
  // TODO: provayder hujjatiga muvofiq imzolangan URL / to'lov tokeni
  switch (p.provider) {
    case "PAYME": {
      const base = "https://checkout.paycom.uz";
      const account = p.orderId ? `ac.order_id=${p.orderId}` : `ac.reservation_id=${p.reservationId}`;
      const raw = `m=${KEYS.PAYME.merchantId};${account};a=${p.amount * 100}`;
      const encoded = Buffer.from(raw).toString("base64");
      return { url: `${base}/${encoded}`, dev: false };
    }
    case "CLICK": {
      const base = "https://my.click.uz/services/pay";
      const url = `${base}?service_id=${KEYS.CLICK.serviceId}&merchant_id=${KEYS.CLICK.merchantId}&amount=${p.amount}&transaction_param=${p.orderId || p.reservationId}`;
      return { url, dev: false };
    }
    case "UZUM":
    default:
      return { url: `/payment/dev?provider=UZUM&amount=${p.amount}`, dev: true };
  }
}
