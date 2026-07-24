"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/shared/lib/database.types";
import type { VehicleMediaItem } from "@/modules/inventory/infrastructure/vehicle-media-repository";
import {
  publishVehicleAction,
  reorderVehicleImagesAction,
  unpublishVehicleAction,
  updateVehicleAction,
} from "@/modules/inventory/application/vehicle-actions";
import { mediaOrderIds } from "@/modules/inventory/domain/vehicle-media-order";
import {
  DAMAGE_TAG_GROUPS,
  type AirbagsStatus,
  type InvoiceType,
  type TriState,
  type VerificationStatus,
} from "@/modules/inventory/domain/vehicle-schema";
import {
  BODY_TYPE_OPTIONS,
  FUEL_OPTIONS,
  TRANSMISSION_OPTIONS,
} from "@/modules/inventory/domain/vehicle-options";
import {
  formatPublishBlockersMessage,
  getPublishBlockers,
} from "@/modules/inventory/domain/publish-readiness";
import {
  isoToMexicoCityDatetimeLocal,
  mexicoCityDatetimeLocalToIso,
  normalizeAuctionAwardedAmount,
  resolveAuctionPublicState,
} from "@/modules/inventory/domain/vehicle-auction";
import { buildVehicleSlug } from "@/modules/inventory/domain/slug";
import { formatDamageTagLabel } from "@/modules/inventory/domain/vehicle-display";
import { VehicleImageGallery } from "@/modules/inventory/ui/vehicle-image-gallery";
import { Button } from "@/shared/ui/button";
import { vehicleCategoryLabel } from "@/modules/inventory/domain/vehicle-labels";

type VehicleRow = Database["public"]["Tables"]["vehicles"]["Row"];

type Props = {
  vehicle: VehicleRow;
  images: VehicleMediaItem[];
};

const OBSERVATIONS_MAX = 300;

function mediaSignature(items: VehicleMediaItem[]) {
  return items
    .map(
      (item) =>
        `${item.media_asset_id}:${item.is_cover ? 1 : 0}:${item.position}`,
    )
    .join("|");
}

const fieldClass =
  "min-h-10 w-full rounded-md border border-line bg-paper-elevated px-3 text-sm text-ink";
const labelClass =
  "mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted";

function Section({
  title,
  children,
  defaultOpen = true,
  optional = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  optional?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="rounded-md border border-line bg-paper-elevated"
    >
      <summary className="cursor-pointer list-none px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-ink marker:content-none">
        {title}
        {optional ? (
          <span className="ml-2 text-[11px] font-normal normal-case tracking-normal text-ink-muted">
            (opcional)
          </span>
        ) : null}
      </summary>
      <div className="space-y-3 border-t border-line px-4 py-3">{children}</div>
    </details>
  );
}

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`min-h-9 rounded-md border px-3 text-xs font-medium transition-colors ${
                active
                  ? "border-brand-red bg-brand-red text-white"
                  : "border-line bg-paper text-ink hover:border-ink-muted"
              }`}
              aria-pressed={active}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const TRI_OPTIONS: Array<{ value: TriState; label: string }> = [
  { value: "yes", label: "Sí" },
  { value: "no", label: "No" },
  { value: "unknown", label: "Por confirmar" },
];

const AIRBAG_OPTIONS: Array<{ value: AirbagsStatus; label: string }> = [
  { value: "intact", label: "Íntegras" },
  { value: "deployed", label: "Activadas" },
  { value: "repaired", label: "Reparadas" },
  { value: "unknown", label: "Por confirmar" },
];

function asTriState(value: string | null | undefined): TriState {
  if (value === "yes" || value === "no") return value;
  return "unknown";
}

function asAirbags(value: string | null | undefined): AirbagsStatus {
  if (
    value === "intact" ||
    value === "deployed" ||
    value === "repaired"
  ) {
    return value;
  }
  return "unknown";
}

function asInvoice(value: string | null | undefined): InvoiceType {
  if (
    value === "aseguradora" ||
    value === "agencia" ||
    value === "empresa" ||
    value === "particular"
  ) {
    return value;
  }
  return "unknown";
}

function asVerification(value: string | null | undefined): VerificationStatus {
  if (value === "vigente" || value === "no_vigente" || value === "no_aplica") {
    return value;
  }
  return "unknown";
}

export function VehicleForm({ vehicle, images }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [mediaItems, setMediaItems] = useState(images);
  const [seenMediaSignature, setSeenMediaSignature] = useState(() =>
    mediaSignature(images),
  );
  const serverMediaSignature = mediaSignature(images);
  if (serverMediaSignature !== seenMediaSignature) {
    setSeenMediaSignature(serverMediaSignature);
    setMediaItems(images);
  }

  const [make, setMake] = useState(vehicle.make);
  const [model, setModel] = useState(vehicle.model);
  const [version, setVersion] = useState(vehicle.version ?? "");
  const [year, setYear] = useState(vehicle.year);
  const [category, setCategory] = useState(vehicle.category);
  const [bodyType, setBodyType] = useState(vehicle.body_type ?? "");
  const [color, setColor] = useState(vehicle.exterior_color ?? "");
  const [stockCode, setStockCode] = useState(vehicle.stock_code ?? "");
  const [slug, setSlug] = useState(vehicle.slug);
  const [slugTouched, setSlugTouched] = useState(vehicle.is_published);
  const [mileage, setMileage] = useState(
    vehicle.mileage_km != null && vehicle.mileage_km > 0
      ? String(vehicle.mileage_km)
      : "",
  );
  const [transmission, setTransmission] = useState(vehicle.transmission ?? "");
  const [fuel, setFuel] = useState(vehicle.fuel_type ?? "");

  const [startsStatus, setStartsStatus] = useState<TriState>(
    asTriState(vehicle.starts_status),
  );
  const [drivesStatus, setDrivesStatus] = useState<TriState>(
    asTriState(vehicle.drives_status),
  );
  const [hasKeysStatus, setHasKeysStatus] = useState<TriState>(
    asTriState(vehicle.has_keys_status),
  );
  const [airbagsStatus, setAirbagsStatus] = useState<AirbagsStatus>(
    asAirbags(vehicle.airbags_status),
  );
  const [invoiceType, setInvoiceType] = useState<InvoiceType>(
    asInvoice(vehicle.invoice_type),
  );
  const [invoiceEntity, setInvoiceEntity] = useState(
    vehicle.invoice_entity ?? "",
  );
  const [tenenciasLabel, setTenenciasLabel] = useState(
    vehicle.tenencias_label ?? "",
  );
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>(asVerification(vehicle.verification_status));

  const [damageTags, setDamageTags] = useState<string[]>(
    vehicle.damage_tags ?? [],
  );
  const [observations, setObservations] = useState(
    vehicle.condition_notes ?? "",
  );
  const [showObservationsPublic, setShowObservationsPublic] = useState(
    Boolean(vehicle.publish_observations && vehicle.condition_notes?.trim()),
  );

  const [priceAmount, setPriceAmount] = useState(
    vehicle.price_amount != null ? String(vehicle.price_amount) : "",
  );
  const [locationLabel, setLocationLabel] = useState(
    vehicle.location_label ?? "",
  );
  const [isFeatured, setIsFeatured] = useState(vehicle.is_featured);
  const [isInAuction, setIsInAuction] = useState(
    vehicle.is_weekly_opportunity,
  );
  const initialAuctionLocal = isoToMexicoCityDatetimeLocal(
    vehicle.opportunity_deadline,
  );
  const [auctionEndsDate, setAuctionEndsDate] = useState(() =>
    initialAuctionLocal.includes("T")
      ? initialAuctionLocal.slice(0, 10)
      : "",
  );
  const [auctionEndsTime, setAuctionEndsTime] = useState(() =>
    initialAuctionLocal.includes("T")
      ? initialAuctionLocal.slice(11, 16)
      : "",
  );
  const [auctionAwardedAmount, setAuctionAwardedAmount] = useState(() => {
    const amount = normalizeAuctionAwardedAmount(vehicle.auction_awarded_amount);
    return amount != null && amount > 0 ? String(amount) : "";
  });
  const [status, setStatus] = useState(vehicle.status);

  const [vin, setVin] = useState(vehicle.vin ?? "");
  const [providerReference, setProviderReference] = useState(
    vehicle.provider_reference ?? "",
  );
  const [internalPrice, setInternalPrice] = useState(
    vehicle.internal_price != null ? String(vehicle.internal_price) : "",
  );

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const derivedSlug = buildVehicleSlug({ make, model, year, version });
  const identityKey = `${make}|${model}|${year}|${version}`;
  const initialIdentityKey = `${vehicle.make}|${vehicle.model}|${vehicle.year}|${vehicle.version ?? ""}`;
  const effectiveSlug =
    vehicle.is_published ||
    slugTouched ||
    identityKey === initialIdentityKey
      ? slug
      : derivedSlug;

  const auctionPreview = useMemo(() => {
    const deadlineIso = isInAuction
      ? mexicoCityDatetimeLocalToIso(
          auctionEndsDate && auctionEndsTime
            ? `${auctionEndsDate}T${auctionEndsTime}`
            : "",
        ) ?? vehicle.opportunity_deadline
      : vehicle.opportunity_deadline;
    return resolveAuctionPublicState({
      is_published: vehicle.is_published,
      is_weekly_opportunity: isInAuction,
      status,
      opportunity_deadline: deadlineIso,
      auction_awarded_amount: vehicle.auction_awarded_amount,
    });
  }, [
    isInAuction,
    auctionEndsDate,
    auctionEndsTime,
    vehicle.is_published,
    vehicle.opportunity_deadline,
    vehicle.auction_awarded_amount,
    status,
  ]);

  const blockers = useMemo(
    () =>
      getPublishBlockers({
        make,
        model,
        year,
        category,
        slug: effectiveSlug,
        status,
        image_count: mediaItems.length,
        has_cover_image: mediaItems.some((item) => item.is_cover),
      }),
    [make, model, year, category, effectiveSlug, status, mediaItems],
  );

  function markDirty() {
    setDirty(true);
  }

  function toggleDamageTag(tag: string) {
    markDirty();
    setDamageTags((list) =>
      list.includes(tag) ? list.filter((item) => item !== tag) : [...list, tag],
    );
  }

  function buildPayload() {
    const notes = observations.trim().slice(0, OBSERVATIONS_MAX);
    return {
      vehicleId: vehicle.id,
      make,
      model,
      version: version || null,
      year,
      category,
      body_type: bodyType || null,
      exterior_color: color || null,
      stock_code: stockCode || null,
      slug: effectiveSlug,
      mileage_km: (() => {
        if (mileage.trim() === "") return null;
        const n = Number(mileage);
        // 0 / invalid = unconfirmed (never persist as “0 km” publicly)
        if (!Number.isFinite(n) || n <= 0) return null;
        return n;
      })(),
      transmission: transmission || null,
      fuel_type: fuel || null,
      damage_tags: damageTags,
      condition_notes: notes || null,
      publish_observations: Boolean(notes) && showObservationsPublic,
      starts_status: startsStatus,
      drives_status: drivesStatus,
      has_keys_status: hasKeysStatus,
      airbags_status: airbagsStatus,
      invoice_type: invoiceType,
      invoice_entity: invoiceEntity.trim() || null,
      tenencias_label: tenenciasLabel.trim() || null,
      verification_status: verificationStatus,
      use_manual_public_copy: false,
      public_title: null,
      short_description: null,
      full_description: null,
      price_amount: priceAmount.trim() === "" ? null : Number(priceAmount),
      price_label: null,
      location_label: locationLabel.trim() || null,
      public_tags: [],
      is_featured: isFeatured,
      is_weekly_opportunity: isInAuction,
      opportunity_deadline: isInAuction
        ? auctionPreview.closed
          ? vehicle.opportunity_deadline
          : mexicoCityDatetimeLocalToIso(
              auctionEndsDate && auctionEndsTime
                ? `${auctionEndsDate}T${auctionEndsTime}`
                : "",
            )
        : vehicle.opportunity_deadline,
      auction_awarded_amount: (() => {
        if (!isInAuction) return undefined;
        if (!auctionPreview.closed) return null;
        const raw = auctionAwardedAmount.trim();
        if (!raw) return null;
        const n = Number(raw);
        if (!Number.isFinite(n)) return null;
        return n;
      })(),
      seo_title: null,
      seo_description: null,
      vin: vin.trim() || null,
      provider_reference: providerReference.trim() || null,
      internal_price: internalPrice.trim() === "" ? null : Number(internalPrice),
      status,
    };
  }

  async function persistMediaOrder(): Promise<{ ok: true } | { ok: false; error: string }> {
    if (mediaItems.length === 0) return { ok: true };
    const result = await reorderVehicleImagesAction({
      vehicleId: vehicle.id,
      orderedMediaAssetIds: mediaOrderIds(mediaItems),
    });
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true };
  }

  function goPreview() {
    if (pending) return;
    if (!dirty) {
      router.push(`/admin/vehiculos/${vehicle.id}/preview`);
      return;
    }
    setError(null);
    setMessage(null);
    setFieldErrors({});
    startTransition(async () => {
      const orderResult = await persistMediaOrder();
      if (!orderResult.ok) {
        setError(orderResult.error);
        return;
      }
      const result = await updateVehicleAction(buildPayload());
      if (!result.ok) {
        setError(
          result.error ||
            "Guarda los cambios antes de abrir la vista previa.",
        );
        if ("fieldErrors" in result && result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      setDirty(false);
      setMessage(result.message);
      router.push(`/admin/vehiculos/${vehicle.id}/preview`);
      router.refresh();
    });
  }

  function save() {
    if (pending) return;
    setError(null);
    setMessage(null);
    setFieldErrors({});
    startTransition(async () => {
      const orderResult = await persistMediaOrder();
      if (!orderResult.ok) {
        setError(orderResult.error);
        return;
      }
      const result = await updateVehicleAction(buildPayload());
      if (!result.ok) {
        setError(result.error);
        if ("fieldErrors" in result && result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      setDirty(false);
      setMessage(result.message);
      router.refresh();
    });
  }

  function publish() {
    if (pending) return;
    if (blockers.length > 0) {
      setError(formatPublishBlockersMessage(blockers));
      return;
    }
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const orderResult = await persistMediaOrder();
      if (!orderResult.ok) {
        setError(orderResult.error);
        return;
      }
      const saved = await updateVehicleAction(buildPayload());
      if (!saved.ok) {
        setError(saved.error);
        return;
      }
      const result = await publishVehicleAction({ vehicleId: vehicle.id });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDirty(false);
      setMessage(result.message);
      router.refresh();
    });
  }

  function unpublish() {
    if (pending) return;
    startTransition(async () => {
      const result = await unpublishVehicleAction({ vehicleId: vehicle.id });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(result.message);
      router.refresh();
    });
  }

  const showDamage = category !== "seminuevo";
  const obsCount = observations.length;

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 -mx-1 border-b border-line bg-page-background/95 px-1 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={save} disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
          {vehicle.is_published ? (
            <Button
              type="button"
              variant="secondary"
              onClick={unpublish}
              disabled={pending}
            >
              Despublicar
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={publish}
              disabled={pending || blockers.length > 0}
            >
              Publicar
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={goPreview}
            disabled={pending}
          >
            Vista previa
          </Button>
          <Link
            href={`/admin/vehiculos/${vehicle.id}`}
            className="text-sm text-ink-muted hover:text-ink"
          >
            Volver al detalle
          </Link>
        </div>
        {blockers.length > 0 && !vehicle.is_published ? (
          <p className="mt-2 text-xs text-ink-muted">
            Para publicar: {blockers.map((b) => b.message).join(" · ")}
          </p>
        ) : null}
        {message ? (
          <p className="mt-2 text-sm text-green-700" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-2 whitespace-pre-line text-sm text-brand-red" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <Section title="Vehículo">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={labelClass} htmlFor="make">
              Marca *
            </label>
            <input
              id="make"
              className={fieldClass}
              value={make}
              onChange={(e) => {
                markDirty();
                setMake(e.target.value);
              }}
            />
            {fieldErrors.make ? (
              <p className="mt-1 text-xs text-brand-red">{fieldErrors.make}</p>
            ) : null}
          </div>
          <div>
            <label className={labelClass} htmlFor="model">
              Modelo *
            </label>
            <input
              id="model"
              className={fieldClass}
              value={model}
              onChange={(e) => {
                markDirty();
                setModel(e.target.value);
              }}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="version">
              Versión
            </label>
            <input
              id="version"
              className={fieldClass}
              value={version}
              onChange={(e) => {
                markDirty();
                setVersion(e.target.value);
              }}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="year">
              Año *
            </label>
            <input
              id="year"
              type="number"
              className={fieldClass}
              value={year}
              onChange={(e) => {
                markDirty();
                setYear(Number(e.target.value));
              }}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="category">
              Categoría *
            </label>
            <select
              id="category"
              className={fieldClass}
              value={category}
              onChange={(e) => {
                markDirty();
                setCategory(
                  e.target.value as Database["public"]["Enums"]["vehicle_category"],
                );
              }}
            >
              {Object.entries(vehicleCategoryLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="bodyType">
              Carrocería
            </label>
            <select
              id="bodyType"
              className={fieldClass}
              value={bodyType}
              onChange={(e) => {
                markDirty();
                setBodyType(e.target.value);
              }}
            >
              <option value="">Por confirmar</option>
              {BODY_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="color">
              Color exterior
            </label>
            <input
              id="color"
              className={fieldClass}
              value={color}
              onChange={(e) => {
                markDirty();
                setColor(e.target.value);
              }}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="mileage">
              Kilometraje
            </label>
            <input
              id="mileage"
              type="number"
              min={0}
              placeholder="Vacío = por confirmar"
              className={fieldClass}
              value={mileage}
              onChange={(e) => {
                markDirty();
                setMileage(e.target.value);
              }}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="transmission">
              Transmisión
            </label>
            <select
              id="transmission"
              className={fieldClass}
              value={transmission}
              onChange={(e) => {
                markDirty();
                setTransmission(e.target.value);
              }}
            >
              <option value="">Por confirmar</option>
              {TRANSMISSION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="fuel">
              Combustible
            </label>
            <select
              id="fuel"
              className={fieldClass}
              value={fuel}
              onChange={(e) => {
                markDirty();
                setFuel(e.target.value);
              }}
            >
              <option value="">Por confirmar</option>
              {FUEL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="stockCode">
              Folio interno
            </label>
            <input
              id="stockCode"
              className={fieldClass}
              value={stockCode}
              onChange={(e) => {
                markDirty();
                setStockCode(e.target.value);
              }}
            />
          </div>
        </div>
      </Section>

      <Section title="Estado operativo">
        <div className="grid gap-4 sm:grid-cols-2">
          <SegmentedControl
            label="Arranca"
            value={startsStatus}
            options={TRI_OPTIONS}
            onChange={(value) => {
              markDirty();
              setStartsStatus(value);
            }}
          />
          <SegmentedControl
            label="Camina"
            value={drivesStatus}
            options={TRI_OPTIONS}
            onChange={(value) => {
              markDirty();
              setDrivesStatus(value);
            }}
          />
          <SegmentedControl
            label="Llaves"
            value={hasKeysStatus}
            options={TRI_OPTIONS}
            onChange={(value) => {
              markDirty();
              setHasKeysStatus(value);
            }}
          />
          <SegmentedControl
            label="Bolsas de aire"
            value={airbagsStatus}
            options={AIRBAG_OPTIONS}
            onChange={(value) => {
              markDirty();
              setAirbagsStatus(value);
            }}
          />
        </div>
        <div className="grid gap-3 border-t border-line pt-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelClass} htmlFor="invoiceType">
              Tipo de factura
            </label>
            <select
              id="invoiceType"
              className={fieldClass}
              value={invoiceType}
              onChange={(e) => {
                markDirty();
                setInvoiceType(e.target.value as InvoiceType);
              }}
            >
              <option value="unknown">Por confirmar</option>
              <option value="aseguradora">Aseguradora</option>
              <option value="agencia">Agencia</option>
              <option value="empresa">Empresa</option>
              <option value="particular">Particular</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="invoiceEntity">
              Refacturación
            </label>
            <input
              id="invoiceEntity"
              className={fieldClass}
              placeholder="Razón social"
              value={invoiceEntity}
              onChange={(e) => {
                markDirty();
                setInvoiceEntity(e.target.value);
              }}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="tenencias">
              Tenencias
            </label>
            <input
              id="tenencias"
              className={fieldClass}
              placeholder="2025, 2026"
              value={tenenciasLabel}
              onChange={(e) => {
                markDirty();
                setTenenciasLabel(e.target.value);
              }}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="verification">
              Verificación
            </label>
            <select
              id="verification"
              className={fieldClass}
              value={verificationStatus}
              onChange={(e) => {
                markDirty();
                setVerificationStatus(e.target.value as VerificationStatus);
              }}
            >
              <option value="unknown">Por confirmar</option>
              <option value="vigente">Vigente</option>
              <option value="no_vigente">No vigente</option>
              <option value="no_aplica">No aplica</option>
            </select>
          </div>
        </div>
      </Section>

      {showDamage ? (
        <Section title="Daños">
          <div className="space-y-4">
            {DAMAGE_TAG_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.tags.map((tag) => {
                    const active = damageTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleDamageTag(tag)}
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                          active
                            ? "border-brand-red bg-brand-red/10 text-brand-red"
                            : "border-line text-ink-muted hover:border-ink-muted hover:text-ink"
                        }`}
                        aria-pressed={active}
                      >
                        {formatDamageTagLabel(tag)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      <Section title="Fotos">
        <VehicleImageGallery
          vehicleId={vehicle.id}
          images={mediaItems}
          onImagesChange={(next) => {
            setMediaItems(next);
            markDirty();
          }}
        />
      </Section>

      <Section title="Precio y publicación">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={labelClass} htmlFor="price">
              Precio
            </label>
            <input
              id="price"
              type="number"
              min={0}
              placeholder="Vacío = por confirmar"
              className={fieldClass}
              value={priceAmount}
              onChange={(e) => {
                markDirty();
                setPriceAmount(e.target.value);
              }}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="status">
              Estado *
            </label>
            <select
              id="status"
              className={fieldClass}
              value={status}
              onChange={(e) => {
                markDirty();
                setStatus(
                  e.target.value as Database["public"]["Enums"]["vehicle_status"],
                );
              }}
            >
              <option value="draft">Borrador</option>
              <option value="available">Disponible</option>
              <option value="reserved">Apartado</option>
              <option value="sold">Vendido</option>
              <option value="archived">No disponible</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="location">
              Ubicación
            </label>
            <input
              id="location"
              className={fieldClass}
              value={locationLabel}
              onChange={(e) => {
                markDirty();
                setLocationLabel(e.target.value);
              }}
            />
          </div>
        </div>
        <label className="mt-2 flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => {
              markDirty();
              setIsFeatured(e.target.checked);
            }}
          />
          Destacar vehículo
        </label>
        <label className="mt-2 flex items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={isInAuction}
            onChange={(e) => {
              markDirty();
              setIsInAuction(e.target.checked);
            }}
          />
          <span>
            En subasta
            <span className="mt-0.5 block text-xs text-ink-muted">
              Al activarlo, el vehículo aparecerá únicamente en En subasta y se
              excluirá del inventario propio.
            </span>
          </span>
        </label>
        {isInAuction ? (
          <div className="max-w-lg space-y-3">
            {auctionPreview.closed ? (
              <div className="rounded-md border border-line bg-surface px-4 py-3">
                <p className="text-sm font-semibold text-ink">Subasta cerrada</p>
                <p className="mt-1 text-xs text-ink-muted">
                  La fecha y hora de cierre ya finalizaron. Permanecerá en el
                  historial de subastas cerradas.
                </p>
                {auctionPreview.closedLong ? (
                  <p className="mt-2 text-sm text-ink">
                    Cierre: {auctionPreview.closedLong}
                  </p>
                ) : null}
                <div className="mt-3">
                  <label className={labelClass} htmlFor="auctionAwardedAmount">
                    Monto de adjudicación
                  </label>
                  <div className="relative mt-1">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-ink-muted">
                      $
                    </span>
                    <input
                      id="auctionAwardedAmount"
                      type="number"
                      inputMode="decimal"
                      min="0.01"
                      step="0.01"
                      placeholder="Ej. 185000"
                      className={`${fieldClass} pl-7 pr-14`}
                      value={auctionAwardedAmount}
                      onChange={(e) => {
                        markDirty();
                        setAuctionAwardedAmount(e.target.value);
                      }}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-ink-muted">
                      MXN
                    </span>
                  </div>
                  {fieldErrors.auction_awarded_amount ? (
                    <p className="mt-1 text-xs text-brand-red">
                      {fieldErrors.auction_awarded_amount}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-ink-muted">
                      Captura el monto final en el que fue adjudicada la unidad.
                      Déjalo vacío si aún no se publica el resultado.
                    </p>
                  )}
                </div>
                <div className="mt-3 grid gap-3 opacity-80 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="auctionEndsDateClosed">
                      Fecha
                    </label>
                    <input
                      id="auctionEndsDateClosed"
                      type="date"
                      className={fieldClass}
                      value={auctionEndsDate}
                      readOnly
                      disabled
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="auctionEndsTimeClosed">
                      Hora
                    </label>
                    <input
                      id="auctionEndsTimeClosed"
                      type="time"
                      className={fieldClass}
                      value={auctionEndsTime}
                      readOnly
                      disabled
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-ink-muted">
                  Zona horaria: Ciudad de México. Fecha y hora en solo lectura
                  para preservar el historial.
                </p>
              </div>
            ) : (
              <>
                <p className={labelClass}>Cierre de subasta *</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="auctionEndsDate">
                      Fecha
                    </label>
                    <input
                      id="auctionEndsDate"
                      type="date"
                      className={fieldClass}
                      value={auctionEndsDate}
                      onChange={(e) => {
                        markDirty();
                        setAuctionEndsDate(e.target.value);
                      }}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="auctionEndsTime">
                      Hora
                    </label>
                    <input
                      id="auctionEndsTime"
                      type="time"
                      className={fieldClass}
                      value={auctionEndsTime}
                      onChange={(e) => {
                        markDirty();
                        setAuctionEndsTime(e.target.value);
                      }}
                    />
                  </div>
                </div>
                {fieldErrors.opportunity_deadline ? (
                  <p className="text-xs text-brand-red">
                    {fieldErrors.opportunity_deadline}
                  </p>
                ) : !auctionEndsDate || !auctionEndsTime ? (
                  <p className="text-xs text-brand-red">
                    Completa fecha y hora para publicarlo en En subasta.
                  </p>
                ) : (
                  <p className="text-xs text-ink-muted">
                    Zona horaria: Ciudad de México.
                  </p>
                )}
              </>
            )}
          </div>
        ) : null}
        <p className="text-xs text-ink-muted">
          Estado actual:{" "}
          {vehicle.is_published
            ? "Publicado en el sitio"
            : "No publicado"}
          {" · "}
          Slug: {effectiveSlug}
        </p>
        {!vehicle.is_published ? (
          <div className="max-w-md">
            <label className={labelClass} htmlFor="slug">
              Slug
            </label>
            <input
              id="slug"
              className={fieldClass}
              value={effectiveSlug}
              onChange={(e) => {
                markDirty();
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
            />
          </div>
        ) : null}
      </Section>

      <Section title="Observaciones">
        <div>
          <label className={labelClass} htmlFor="observations">
            Observaciones
          </label>
          <textarea
            id="observations"
            rows={2}
            maxLength={OBSERVATIONS_MAX}
            className={`${fieldClass} min-h-[3.5rem] resize-y py-2`}
            placeholder="Texto destacado en la ficha. Ej. Excelente oportunidad — no lo dejes ir."
            value={observations}
            onChange={(e) => {
              markDirty();
              setObservations(e.target.value.slice(0, OBSERVATIONS_MAX));
            }}
          />
          <label className="mt-3 flex items-start gap-2 text-sm text-ink">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={showObservationsPublic && observations.trim().length > 0}
              disabled={observations.trim().length === 0}
              onChange={(e) => {
                markDirty();
                setShowObservationsPublic(e.target.checked);
              }}
            />
            <span>
              Mostrar en la ficha pública
              <span className="mt-0.5 block text-xs text-ink-muted">
                Se muestra resaltado en rojo en la ficha (útil para oportunidades
                o avisos importantes). Actívalo solo en algunos autos.
              </span>
            </span>
          </label>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-ink-muted">
              Máximo {OBSERVATIONS_MAX} caracteres.
            </p>
            <span className="text-xs text-ink-muted">
              {obsCount}/{OBSERVATIONS_MAX}
            </span>
          </div>
        </div>
      </Section>

      <Section title="Datos internos" defaultOpen={false} optional>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={labelClass} htmlFor="vin">
              VIN
            </label>
            <input
              id="vin"
              className={fieldClass}
              value={vin}
              onChange={(e) => {
                markDirty();
                setVin(e.target.value);
              }}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="providerRef">
              Referencia del proveedor
            </label>
            <input
              id="providerRef"
              className={fieldClass}
              value={providerReference}
              onChange={(e) => {
                markDirty();
                setProviderReference(e.target.value);
              }}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="internalPrice">
              Precio interno
            </label>
            <input
              id="internalPrice"
              type="number"
              min={0}
              className={fieldClass}
              value={internalPrice}
              onChange={(e) => {
                markDirty();
                setInternalPrice(e.target.value);
              }}
            />
          </div>
        </div>
      </Section>
    </div>
  );
}
