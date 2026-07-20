export const TRANSMISSION_OPTIONS = [
  "Automática",
  "Manual",
  "CVT",
  "DSG",
  "Otra",
] as const;

export const FUEL_OPTIONS = [
  "Gasolina",
  "Diésel",
  "Híbrido",
  "Eléctrico",
  "Otro",
] as const;

export const BODY_TYPE_OPTIONS = [
  "Sedán",
  "Hatchback",
  "SUV",
  "Pickup",
  "Van",
  "Coupé",
  "Convertible",
  "Otro",
] as const;

export const PRICE_LABEL_SUGGESTIONS = [
  "Solicita información",
  "Precio por confirmar",
  "Oportunidad disponible",
] as const;

export type TransmissionOption = (typeof TRANSMISSION_OPTIONS)[number];
export type FuelOption = (typeof FUEL_OPTIONS)[number];
