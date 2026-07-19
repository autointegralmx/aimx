export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function buildVehicleSlug(parts: {
  make: string;
  model: string;
  year: number;
  version?: string | null;
}): string {
  const base = [parts.make, parts.model, parts.version, String(parts.year)]
    .filter(Boolean)
    .join(" ");
  return slugify(base);
}
