/**
 * Admin panelning umumiy klass to'plami (Tailwind). Faqat semantik/brend tokenlari —
 * yorug' va qorong'i temada o'zi moslashadi. Telefonda bosish joylari kamida 44px.
 * B agenti (menyu, inventar) ham import qilishi mumkin — shu faylni o'zgartirmasdan.
 */
const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60 focus-visible:ring-offset-0";
const btnBase =
  `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition sm:min-h-10 disabled:cursor-not-allowed disabled:opacity-50 ${focus}`;

export const ui = {
  /** Sahifa konteyneri (layout ichida) */
  page: "mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8",

  /** Asosiy tugma — olovli qizil */
  btnPrimary: `${btnBase} bg-fire text-brand-cream shadow-sm hover:bg-fire-deep`,
  /** Ikkinchi darajali — ingichka chegara */
  btnSecondary: `${btnBase} border border-line bg-card text-content hover:border-brand-gold/50 hover:bg-surface-2`,
  /** Ko'rinmas fon */
  btnGhost: `${btnBase} text-muted hover:bg-surface-2 hover:text-content`,
  /** Xavfli amal (o'chirish) */
  btnDanger: `${btnBase} border border-fire/30 text-fire-ink hover:bg-fire/10`,
  /** Kichik ikonka tugmasi (telefonda 44px) */
  iconBtn: `inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-content disabled:opacity-40 sm:size-9 ${focus}`,
  iconBtnDanger: `inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-fire/10 hover:text-fire-ink disabled:opacity-40 sm:size-9 ${focus}`,

  /** Forma maydonlari */
  label: "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted",
  input:
    "w-full min-h-11 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-content outline-none transition placeholder:text-muted focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 sm:min-h-10",
  inputSm:
    "min-h-11 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-content outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 sm:min-h-9",
  checkbox: "size-4 shrink-0 rounded border-line accent-fire",

  /** Kartalar */
  card: "rounded-2xl border border-line bg-card shadow-sm shadow-night/5",
  cardPad: "p-4 sm:p-5",
  cardTitle: "font-display text-lg leading-snug text-content",

  /** Jadval */
  tableWrap: "overflow-x-auto rounded-2xl border border-line bg-card shadow-sm shadow-night/5",
  table: "w-full text-sm",
  thead: "border-b border-line bg-surface-2/60",
  th: "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted",
  tbody: "divide-y divide-line",
  tr: "transition hover:bg-surface-2/40",
  td: "px-4 py-3 align-middle text-content",
} as const;
