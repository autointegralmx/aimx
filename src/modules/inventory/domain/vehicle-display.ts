export function formatPublicPrice(input: {
  price_amount?: number | null;
  price_label?: string | null;
  currency?: string | null;
}): string | null {
  const label = input.price_label?.trim();
  if (label) return label;

  const amount = input.price_amount;
  if (amount == null || Number(amount) <= 0) return null;

  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: input.currency?.trim() || "MXN",
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `$${Number(amount).toLocaleString("es-MX")}`;
  }
}

export function buildDefaultSeoTitle(input: {
  year: number;
  make: string;
  model: string;
  category: string;
}): string {
  return `${input.year} ${input.make} ${input.model} · ${input.category}`.slice(
    0,
    70,
  );
}

export function buildDefaultSeoDescription(input: {
  short_description?: string | null;
  year: number;
  make: string;
  model: string;
}): string {
  const base =
    input.short_description?.trim() ||
    `${input.year} ${input.make} ${input.model} disponible en Auto Integral.`;
  return base.slice(0, 160);
}
