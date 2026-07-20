"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/shared/lib/database.types";
import type { VehicleMediaItem } from "@/modules/inventory/infrastructure/vehicle-media-repository";
import {
  publishVehicleAction,
  unpublishVehicleAction,
  updateVehicleAction,
} from "@/modules/inventory/application/vehicle-actions";
import { DAMAGE_TAGS, PUBLIC_TAGS } from "@/modules/inventory/domain/vehicle-schema";
import {
  BODY_TYPE_OPTIONS,
  FUEL_OPTIONS,
  PRICE_LABEL_SUGGESTIONS,
  TRANSMISSION_OPTIONS,
} from "@/modules/inventory/domain/vehicle-options";
import {
  formatPublishBlockersMessage,
  getPublishBlockers,
} from "@/modules/inventory/domain/publish-readiness";
import { buildVehicleSlug } from "@/modules/inventory/domain/slug";
import { VehicleImageGallery } from "@/modules/inventory/ui/vehicle-image-gallery";
import { Button } from "@/shared/ui/button";
import { vehicleCategoryLabel } from "@/modules/inventory/domain/vehicle-labels";

type VehicleRow = Database["public"]["Tables"]["vehicles"]["Row"];

type Props = {
  vehicle: VehicleRow;
  images: VehicleMediaItem[];
};

function mediaSignature(items: VehicleMediaItem[]) {
  return items
    .map(
      (item) =>
        `${item.media_asset_id}:${item.is_cover ? 1 : 0}:${item.position}`,
    )
    .join("|");
}

const fieldClass =
  "min-h-11 w-full rounded-md border border-line bg-paper-elevated px-3 text-sm text-ink";
const labelClass =
  "mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted";

function Section({
  id,
  title,
  children,
  defaultOpen = true,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      id={id}
      open={defaultOpen}
      className="rounded-md border border-line bg-paper-elevated"
    >
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold uppercase tracking-wide text-ink marker:content-none">
        {title}
      </summary>
      <div className="space-y-4 border-t border-line px-4 py-4">{children}</div>
    </details>
  );
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
    vehicle.mileage_km != null ? String(vehicle.mileage_km) : "",
  );
  const [transmission, setTransmission] = useState(vehicle.transmission ?? "");
  const [fuel, setFuel] = useState(vehicle.fuel_type ?? "");
  const [damageSummary, setDamageSummary] = useState(
    vehicle.damage_summary ?? "",
  );
  const [conditionNotes, setConditionNotes] = useState(
    vehicle.condition_notes ?? "",
  );
  const [damageTags, setDamageTags] = useState<string[]>(vehicle.damage_tags ?? []);
  const [publicTitle, setPublicTitle] = useState(vehicle.public_title ?? "");
  const [shortDescription, setShortDescription] = useState(
    vehicle.short_description ?? "",
  );
  const [fullDescription, setFullDescription] = useState(
    vehicle.full_description ?? vehicle.public_description ?? "",
  );
  const [priceAmount, setPriceAmount] = useState(
    vehicle.price_amount != null ? String(vehicle.price_amount) : "",
  );
  const [priceLabel, setPriceLabel] = useState(vehicle.price_label ?? "");
  const [locationLabel, setLocationLabel] = useState(
    vehicle.location_label ?? "",
  );
  const [publicTags, setPublicTags] = useState<string[]>(
    vehicle.public_tags ?? [],
  );
  const [isFeatured, setIsFeatured] = useState(vehicle.is_featured);
  const [isWeeklyOpportunity, setIsWeeklyOpportunity] = useState(
    vehicle.is_weekly_opportunity,
  );
  const [opportunityDeadline, setOpportunityDeadline] = useState(
    vehicle.opportunity_deadline
      ? vehicle.opportunity_deadline.slice(0, 16)
      : "",
  );
  const [featuredOrder, setFeaturedOrder] = useState(
    vehicle.featured_order != null ? String(vehicle.featured_order) : "",
  );
  const [seoTitle, setSeoTitle] = useState(vehicle.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(
    vehicle.seo_description ?? "",
  );
  const [vin, setVin] = useState(vehicle.vin ?? "");
  const [providerReference, setProviderReference] = useState(
    vehicle.provider_reference ?? "",
  );
  const [internalPrice, setInternalPrice] = useState(
    vehicle.internal_price != null ? String(vehicle.internal_price) : "",
  );
  const [privateNotes, setPrivateNotes] = useState(vehicle.private_notes ?? "");
  const [status, setStatus] = useState(vehicle.status);

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

  const blockers = useMemo(
    () =>
      getPublishBlockers({
        make,
        model,
        year,
        category,
        public_title: publicTitle,
        short_description: shortDescription,
        slug: effectiveSlug,
        status,
        image_count: mediaItems.length,
        has_cover_image: mediaItems.some((item) => item.is_cover),
      }),
    [
      make,
      model,
      year,
      category,
      publicTitle,
      shortDescription,
      effectiveSlug,
      status,
      mediaItems,
    ],
  );

  function markDirty() {
    setDirty(true);
  }

  function toggleTag(
    list: string[],
    setList: (value: string[]) => void,
    tag: string,
  ) {
    markDirty();
    setList(
      list.includes(tag) ? list.filter((item) => item !== tag) : [...list, tag],
    );
  }

  function buildPayload() {
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
      mileage_km: mileage ? Number(mileage) : null,
      transmission: transmission || null,
      fuel_type: fuel || null,
      damage_summary: damageSummary || null,
      condition_notes: conditionNotes || null,
      damage_tags: damageTags,
      public_title: publicTitle || null,
      short_description: shortDescription || null,
      full_description: fullDescription || null,
      price_amount: priceAmount ? Number(priceAmount) : null,
      price_label: priceLabel || null,
      location_label: locationLabel || null,
      public_tags: publicTags,
      is_featured: isFeatured,
      is_weekly_opportunity: isWeeklyOpportunity,
      opportunity_deadline: opportunityDeadline
        ? new Date(opportunityDeadline).toISOString()
        : null,
      featured_order: featuredOrder ? Number(featuredOrder) : null,
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      vin: vin || null,
      provider_reference: providerReference || null,
      internal_price: internalPrice ? Number(internalPrice) : null,
      private_notes: privateNotes || null,
      status,
    };
  }

  function save() {
    if (pending) return;
    setError(null);
    setMessage(null);
    setFieldErrors({});
    startTransition(async () => {
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

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 -mx-5 border-b border-line bg-paper/95 px-5 py-3 backdrop-blur md:mx-0 md:rounded-md md:border">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" disabled={pending} onClick={save}>
            {pending ? "Guardando…" : "Guardar cambios"}
          </Button>
          <Button
            type="button"
            variant="dark"
            disabled={pending || blockers.length > 0}
            onClick={publish}
          >
            Publicar
          </Button>
          {vehicle.is_published ? (
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={unpublish}
            >
              Despublicar
            </Button>
          ) : null}
          <Link
            href={`/admin/vehiculos/${vehicle.id}/preview`}
            className="btn-secondary touch-target inline-flex"
          >
            Vista previa
          </Link>
          <Link
            href={`/admin/vehiculos/${vehicle.id}`}
            className="touch-target inline-flex items-center px-3 text-sm text-ink-muted hover:text-ink"
          >
            Volver al detalle
          </Link>
          {dirty ? (
            <span className="text-xs text-ink-muted">Cambios sin guardar</span>
          ) : null}
        </div>
        {message ? (
          <p className="mt-2 text-sm text-success" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <pre className="mt-2 whitespace-pre-wrap text-sm text-danger" role="alert">
            {error}
          </pre>
        ) : null}
      </div>

      <Section id="principal" title="1. Información principal">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className={labelClass}>Marca *</span>
            <input
              className={fieldClass}
              value={make}
              onChange={(event) => {
                markDirty();
                setMake(event.target.value);
              }}
            />
            {fieldErrors.make ? (
              <span className="text-xs text-danger">{fieldErrors.make}</span>
            ) : null}
          </label>
          <label className="block text-sm">
            <span className={labelClass}>Modelo *</span>
            <input
              className={fieldClass}
              value={model}
              onChange={(event) => {
                markDirty();
                setModel(event.target.value);
              }}
            />
          </label>
          <label className="block text-sm">
            <span className={labelClass}>Versión</span>
            <input
              className={fieldClass}
              value={version}
              onChange={(event) => {
                markDirty();
                setVersion(event.target.value);
              }}
            />
          </label>
          <label className="block text-sm">
            <span className={labelClass}>Año *</span>
            <input
              type="number"
              min={1950}
              max={2100}
              className={fieldClass}
              value={year}
              onChange={(event) => {
                markDirty();
                setYear(Number(event.target.value));
              }}
            />
          </label>
          <label className="block text-sm">
            <span className={labelClass}>Categoría *</span>
            <select
              className={fieldClass}
              value={category}
              onChange={(event) => {
                markDirty();
                setCategory(
                  event.target.value as VehicleRow["category"],
                );
              }}
            >
              <option value="accidentado">Accidentado</option>
              <option value="recuperado">Recuperado</option>
              <option value="seminuevo">Seminuevo</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className={labelClass}>Carrocería</span>
            <select
              className={fieldClass}
              value={bodyType}
              onChange={(event) => {
                markDirty();
                setBodyType(event.target.value);
              }}
            >
              <option value="">—</option>
              {BODY_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className={labelClass}>Color</span>
            <input
              className={fieldClass}
              value={color}
              onChange={(event) => {
                markDirty();
                setColor(event.target.value);
              }}
            />
          </label>
          <label className="block text-sm">
            <span className={labelClass}>Folio interno</span>
            <input
              className={fieldClass}
              value={stockCode}
              onChange={(event) => {
                markDirty();
                setStockCode(event.target.value);
              }}
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className={labelClass}>
              Slug {vehicle.is_published ? "(bloqueado al publicar)" : ""}
            </span>
            <input
              className={fieldClass}
              value={effectiveSlug}
              disabled={vehicle.is_published}
              onChange={(event) => {
                markDirty();
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
            />
          </label>
        </div>
      </Section>

      <Section id="caracteristicas" title="2. Características">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-sm">
            <span className={labelClass}>Kilometraje</span>
            <input
              type="number"
              min={0}
              className={fieldClass}
              value={mileage}
              onChange={(event) => {
                markDirty();
                setMileage(event.target.value);
              }}
            />
          </label>
          <label className="block text-sm">
            <span className={labelClass}>Transmisión</span>
            <select
              className={fieldClass}
              value={transmission}
              onChange={(event) => {
                markDirty();
                setTransmission(event.target.value);
              }}
            >
              <option value="">—</option>
              {TRANSMISSION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className={labelClass}>Combustible</span>
            <select
              className={fieldClass}
              value={fuel}
              onChange={(event) => {
                markDirty();
                setFuel(event.target.value);
              }}
            >
              <option value="">—</option>
              {FUEL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Section>

      <Section
        id="condicion"
        title="3. Condición y daños"
        defaultOpen={showDamage}
      >
        <label className="block text-sm">
          <span className={labelClass}>Notas de condición</span>
          <textarea
            className={`${fieldClass} min-h-24 py-2`}
            value={conditionNotes}
            onChange={(event) => {
              markDirty();
              setConditionNotes(event.target.value);
            }}
          />
        </label>
        {showDamage ? (
          <>
            <label className="block text-sm">
              <span className={labelClass}>Resumen de daños</span>
              <textarea
                className={`${fieldClass} min-h-20 py-2`}
                value={damageSummary}
                onChange={(event) => {
                  markDirty();
                  setDamageSummary(event.target.value);
                }}
              />
            </label>
            <fieldset>
              <legend className={labelClass}>Etiquetas de daño</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {DAMAGE_TAGS.map((tag) => (
                  <label
                    key={tag}
                    className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-line px-3 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={damageTags.includes(tag)}
                      onChange={() =>
                        toggleTag(damageTags, setDamageTags, tag)
                      }
                    />
                    {tag.replaceAll("_", " ")}
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        ) : (
          <p className="text-sm text-ink-muted">
            Para seminuevos la sección de daños es opcional.
          </p>
        )}
      </Section>

      <Section id="fotos" title="4. Fotografías">
        <VehicleImageGallery
          vehicleId={vehicle.id}
          images={mediaItems}
          onImagesChange={setMediaItems}
        />
      </Section>

      <Section id="comercial" title="5. Información comercial">
        <div className="grid gap-4">
          <label className="block text-sm">
            <span className={labelClass}>Título público</span>
            <input
              className={fieldClass}
              value={publicTitle}
              onChange={(event) => {
                markDirty();
                setPublicTitle(event.target.value);
              }}
            />
          </label>
          <label className="block text-sm">
            <span className={labelClass}>Descripción corta</span>
            <textarea
              className={`${fieldClass} min-h-20 py-2`}
              maxLength={280}
              value={shortDescription}
              onChange={(event) => {
                markDirty();
                setShortDescription(event.target.value);
              }}
            />
            <span className="text-xs text-ink-muted">
              {shortDescription.length}/280
            </span>
          </label>
          <label className="block text-sm">
            <span className={labelClass}>Descripción completa</span>
            <textarea
              className={`${fieldClass} min-h-32 py-2`}
              value={fullDescription}
              onChange={(event) => {
                markDirty();
                setFullDescription(event.target.value);
              }}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className={labelClass}>Precio público (MXN)</span>
              <input
                type="number"
                min={0}
                className={fieldClass}
                value={priceAmount}
                onChange={(event) => {
                  markDirty();
                  setPriceAmount(event.target.value);
                }}
              />
            </label>
            <label className="block text-sm">
              <span className={labelClass}>Etiqueta de precio</span>
              <input
                list="price-labels"
                className={fieldClass}
                value={priceLabel}
                onChange={(event) => {
                  markDirty();
                  setPriceLabel(event.target.value);
                }}
              />
              <datalist id="price-labels">
                {PRICE_LABEL_SUGGESTIONS.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </label>
          </div>
          <label className="block text-sm">
            <span className={labelClass}>Ubicación pública</span>
            <input
              className={fieldClass}
              value={locationLabel}
              onChange={(event) => {
                markDirty();
                setLocationLabel(event.target.value);
              }}
            />
          </label>
          <fieldset>
            <legend className={labelClass}>Tags públicos</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {PUBLIC_TAGS.map((tag) => (
                <label
                  key={tag}
                  className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-line px-3 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={publicTags.includes(tag)}
                    onChange={() => toggleTag(publicTags, setPublicTags, tag)}
                  />
                  {tag.replaceAll("_", " ")}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </Section>

      <Section id="oportunidad" title="6. Oportunidad y destacados">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="inline-flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(event) => {
                markDirty();
                setIsFeatured(event.target.checked);
              }}
            />
            Destacar vehículo
          </label>
          <label className="inline-flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isWeeklyOpportunity}
              onChange={(event) => {
                markDirty();
                setIsWeeklyOpportunity(event.target.checked);
              }}
            />
            Mostrar como oportunidad
          </label>
          <label className="block text-sm">
            <span className={labelClass}>Fecha límite oportunidad</span>
            <input
              type="datetime-local"
              className={fieldClass}
              value={opportunityDeadline}
              onChange={(event) => {
                markDirty();
                setOpportunityDeadline(event.target.value);
              }}
            />
          </label>
          <label className="block text-sm">
            <span className={labelClass}>Orden destacado</span>
            <input
              type="number"
              min={0}
              className={fieldClass}
              value={featuredOrder}
              onChange={(event) => {
                markDirty();
                setFeaturedOrder(event.target.value);
              }}
            />
          </label>
        </div>
        <p className="text-xs text-ink-muted">
          La oportunidad solo se muestra públicamente si el vehículo está
          publicado y disponible/reservado.
        </p>
      </Section>

      <Section id="seo" title="7. SEO" defaultOpen={false}>
        <label className="block text-sm">
          <span className={labelClass}>SEO title ({seoTitle.length}/70)</span>
          <input
            className={fieldClass}
            maxLength={70}
            value={seoTitle}
            onChange={(event) => {
              markDirty();
              setSeoTitle(event.target.value);
            }}
          />
        </label>
        <label className="block text-sm">
          <span className={labelClass}>
            SEO description ({seoDescription.length}/160)
          </span>
          <textarea
            className={`${fieldClass} min-h-20 py-2`}
            maxLength={160}
            value={seoDescription}
            onChange={(event) => {
              markDirty();
              setSeoDescription(event.target.value);
            }}
          />
        </label>
      </Section>

      <Section id="interna" title="8. Información interna">
        <p className="rounded-md border border-line bg-surface px-3 py-2 text-xs text-ink-muted">
          Esta información no se publica.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className={labelClass}>VIN</span>
            <input
              className={fieldClass}
              value={vin}
              onChange={(event) => {
                markDirty();
                setVin(event.target.value);
              }}
            />
          </label>
          <label className="block text-sm">
            <span className={labelClass}>Referencia del proveedor</span>
            <input
              className={fieldClass}
              value={providerReference}
              onChange={(event) => {
                markDirty();
                setProviderReference(event.target.value);
              }}
            />
          </label>
          <label className="block text-sm">
            <span className={labelClass}>Precio interno</span>
            <input
              type="number"
              min={0}
              className={fieldClass}
              value={internalPrice}
              onChange={(event) => {
                markDirty();
                setInternalPrice(event.target.value);
              }}
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className={labelClass}>Notas privadas</span>
          <textarea
            className={`${fieldClass} min-h-24 py-2`}
            value={privateNotes}
            onChange={(event) => {
              markDirty();
              setPrivateNotes(event.target.value);
            }}
          />
        </label>
      </Section>

      <Section id="publicacion" title="9. Publicación">
        <label className="block text-sm max-w-xs">
          <span className={labelClass}>Estado</span>
          <select
            className={fieldClass}
            value={status}
            onChange={(event) => {
              markDirty();
              setStatus(event.target.value as VehicleRow["status"]);
            }}
          >
            <option value="draft">Borrador</option>
            <option value="available">Disponible</option>
            <option value="reserved">Reservado</option>
            <option value="sold">Vendido</option>
            <option value="archived">Archivado</option>
          </select>
        </label>
        <div className="rounded-md border border-line bg-surface px-4 py-3 text-sm">
          <p className="font-medium text-ink">
            {vehicle.is_published ? "Publicado" : "No publicado"} ·{" "}
            {vehicleCategoryLabel[category]}
          </p>
          {vehicle.is_published ? (
            <p className="mt-2 text-success">Publicado en el sitio.</p>
          ) : blockers.length > 0 ? (
            <div className="mt-3">
              <p className="font-medium text-ink">No se puede publicar todavía:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-muted">
                {blockers.map((item) => (
                  <li key={item.code}>{item.message}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-2 text-success">Listo para publicar.</p>
          )}
        </div>
      </Section>
    </div>
  );
}
