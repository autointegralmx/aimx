import {
  briefObservations,
  buildDefaultSeoDescription,
  buildDefaultSeoTitle,
  buildInfoFacts,
  buildObjectiveBadges,
  buildOperationalBadges,
  buildPublicHeadline,
  buildPublicSpecCards,
  buildPublicSpecLine,
  formatDamageTagLabel,
  formatDetailPrice,
  formatPublicPrice,
  type SpecCard,
} from "@/modules/inventory/domain/vehicle-display";
import {
  resolveAuctionPublicState,
  resolvePublicChannel,
  type AuctionPublicState,
  type PublicChannel,
} from "@/modules/inventory/domain/vehicle-auction";
import { vehicleCategoryLabel } from "@/modules/inventory/domain/vehicle-labels";
import { isUnknownPublicValue } from "@/modules/inventory/domain/public-value";
import type { PublicVehicle } from "@/modules/inventory/infrastructure/vehicle-repository";
import type { VehicleCategory } from "@/modules/inventory/domain/vehicle-schema";

export type PublicBreadcrumb = { href: string; label: string };

export type PublicVehicleViewModel = {
  id: string;
  slug: string;
  title: string;
  category: VehicleCategory | null;
  categoryLabel: string | null;
  year: number | null;
  summaryItems: string[];
  priceLabel: string;
  listPriceLabel: string | null;
  operationalBadges: string[];
  documentationBadges: string[];
  infoFacts: string[];
  damageTags: string[];
  damageTagLabels: string[];
  observations: string | null;
  auction: AuctionPublicState;
  ctaLabel: string;
  publicChannel: PublicChannel;
  breadcrumbs: PublicBreadcrumb[];
  specCards: SpecCard[];
  locationLabel: string | null;
  seo: {
    title: string;
    description: string;
  };
  /** Raw structured fields kept for WhatsApp / links */
  make: string | null;
  model: string | null;
  version: string | null;
  useManualPublicCopy: boolean;
};

/**
 * Única fuente de verdad para preview, ficha, cards, subastas y metadata.
 * Components must not re-derive titles, badges, price, or observations.
 */
export function buildPublicVehicleViewModel(
  vehicle: PublicVehicle,
  options?: { now?: Date },
): PublicVehicleViewModel {
  const useManual = Boolean(vehicle.use_manual_public_copy);
  const version = publicText(vehicle.version);

  const title = buildPublicHeadline({
    make: vehicle.make,
    model: vehicle.model,
    version,
    public_title: useManual ? vehicle.public_title : null,
    useManualPublicCopy: useManual,
  });

  const priceInput = {
    price_amount: vehicle.price_amount,
    price_label: useManual ? publicText(vehicle.price_label) : null,
    currency: vehicle.currency,
  };

  const auction = resolveAuctionPublicState(
    {
      is_published: true,
      is_weekly_opportunity: vehicle.is_weekly_opportunity,
      status: vehicle.status,
      opportunity_deadline: vehicle.opportunity_deadline,
    },
    options?.now,
  );

  const publicChannel = resolvePublicChannel(
    {
      is_published: true,
      is_weekly_opportunity: vehicle.is_weekly_opportunity,
      status: vehicle.status,
      opportunity_deadline: vehicle.opportunity_deadline,
    },
    options?.now,
  );

  const damageTags = (vehicle.damage_tags ?? []).filter(
    (tag): tag is string => Boolean(tag?.trim()),
  );

  const observations = briefObservations({
    condition_notes: vehicle.condition_notes,
    publish_observations: vehicle.publish_observations,
  });

  const category =
    (vehicle.category as VehicleCategory | null | undefined) ?? null;

  const seoTitle = useManual
    ? publicText(vehicle.seo_title) ||
      buildDefaultSeoTitle({
        year: vehicle.year ?? 0,
        make: vehicle.make ?? "",
        model: vehicle.model ?? "",
        version,
        category: category ?? "vehículo",
      })
    : buildDefaultSeoTitle({
        year: vehicle.year ?? 0,
        make: vehicle.make ?? "",
        model: vehicle.model ?? "",
        version,
        category: category ?? "vehículo",
      });

  const seoDescription = useManual
    ? publicText(vehicle.seo_description) ||
      buildDefaultSeoDescription({
        short_description: vehicle.short_description,
        year: vehicle.year ?? 0,
        make: vehicle.make ?? "",
        model: vehicle.model ?? "",
        category,
        transmission: vehicle.transmission,
        fuel_type: vehicle.fuel_type,
        status: vehicle.status,
        damage_tags: damageTags,
        invoice_type: vehicle.invoice_type,
      })
    : buildDefaultSeoDescription({
        short_description: null,
        year: vehicle.year ?? 0,
        make: vehicle.make ?? "",
        model: vehicle.model ?? "",
        category,
        transmission: vehicle.transmission,
        fuel_type: vehicle.fuel_type,
        status: vehicle.status,
        damage_tags: damageTags,
        invoice_type: vehicle.invoice_type,
      });

  return {
    id: vehicle.id ?? "",
    slug: vehicle.slug ?? "",
    title,
    category,
    categoryLabel: category ? vehicleCategoryLabel[category] : null,
    year: vehicle.year ?? null,
    summaryItems: buildPublicSpecLine({
      year: vehicle.year,
      transmission: publicText(vehicle.transmission),
      body_type: publicText(vehicle.body_type),
      fuel_type: publicText(vehicle.fuel_type),
      version,
    }),
    priceLabel: formatDetailPrice(priceInput),
    listPriceLabel: formatPublicPrice(priceInput),
    operationalBadges: buildOperationalBadges({
      starts_status: vehicle.starts_status,
      drives_status: vehicle.drives_status,
      has_keys_status: vehicle.has_keys_status,
      airbags_status: vehicle.airbags_status,
    }),
    documentationBadges: buildObjectiveBadges({
      invoice_type: vehicle.invoice_type,
      verification_status: vehicle.verification_status,
      tenencias_label: publicText(vehicle.tenencias_label),
      status: vehicle.status,
    }),
    infoFacts: buildInfoFacts({
      status: vehicle.status,
      invoice_type: vehicle.invoice_type,
      verification_status: vehicle.verification_status,
      tenencias_label: publicText(vehicle.tenencias_label),
      invoice_entity: publicText(vehicle.invoice_entity),
    }),
    damageTags,
    damageTagLabels: damageTags.map(formatDamageTagLabel),
    observations,
    auction,
    ctaLabel: auction.ctaLabel,
    publicChannel,
    breadcrumbs: buildPublicBreadcrumbs({
      publicChannel,
      category,
      categoryLabel: category ? vehicleCategoryLabel[category] : null,
      title,
    }),
    specCards: buildPublicSpecCards({
      year: vehicle.year,
      mileage_km: vehicle.mileage_km,
      transmission: publicText(vehicle.transmission),
      fuel_type: publicText(vehicle.fuel_type),
      exterior_color: publicText(vehicle.exterior_color),
      body_type: publicText(vehicle.body_type),
      version,
      status: vehicle.status,
      invoice_type: vehicle.invoice_type,
      tenencias_label: publicText(vehicle.tenencias_label),
      verification_status: vehicle.verification_status,
    }),
    locationLabel: publicText(vehicle.location_label),
    seo: {
      title: seoTitle,
      description: seoDescription,
    },
    make: publicText(vehicle.make),
    model: publicText(vehicle.model),
    version,
    useManualPublicCopy: useManual,
  };
}

const CATEGORY_HREF: Record<VehicleCategory, string> = {
  accidentado: "/vehiculos/accidentados",
  recuperado: "/vehiculos/recuperados",
  seminuevo: "/vehiculos/seminuevos",
};

export function buildPublicBreadcrumbs(input: {
  publicChannel: PublicChannel;
  category: VehicleCategory | null;
  categoryLabel: string | null;
  title: string;
}): PublicBreadcrumb[] {
  const crumbs: PublicBreadcrumb[] = [{ href: "/", label: "Inicio" }];
  if (input.publicChannel === "auction") {
    crumbs.push({ href: "/subastas", label: "En subasta" });
  } else if (input.category && input.categoryLabel) {
    crumbs.push({
      href: CATEGORY_HREF[input.category],
      label: input.categoryLabel,
    });
  } else {
    crumbs.push({ href: "/vehiculos", label: "Vehículos" });
  }
  crumbs.push({ href: "#", label: input.title });
  return crumbs;
}

function publicText(value?: string | null): string | null {
  if (isUnknownPublicValue(value)) return null;
  return value!.trim();
}
