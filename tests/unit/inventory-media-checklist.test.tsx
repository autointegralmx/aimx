import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import type { Database } from "@/shared/lib/database.types";
import type { VehicleMediaItem } from "@/modules/inventory/infrastructure/vehicle-media-repository";
import { VehicleForm } from "@/modules/inventory/ui/vehicle-form";

type VehicleRow = Database["public"]["Tables"]["vehicles"]["Row"];

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh,
  }),
}));

vi.mock("@/modules/inventory/application/vehicle-actions", () => ({
  updateVehicleAction: vi.fn(),
  publishVehicleAction: vi.fn(),
  unpublishVehicleAction: vi.fn(),
  registerUploadedVehicleImageAction: vi.fn(),
  reorderVehicleImagesAction: vi.fn(),
  setVehicleCoverAction: vi.fn(),
  deleteVehicleImageAction: vi.fn(),
}));

vi.mock("@/modules/inventory/application/upload-vehicle-image-client", () => ({
  uploadVehicleImageDirect: vi.fn(async () => ({
    media_asset_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    vehicle_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    position: 0,
    is_cover: true,
    bucket: "vehicle-images",
    object_path:
      "vehicles/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1.jpg",
    original_filename: "a.jpg",
    mime_type: "image/jpeg",
    byte_size: 1200,
    width: null,
    height: null,
    alt_text: null,
    url: "http://127.0.0.1:54321/storage/v1/object/public/vehicle-images/demo.jpg",
  } satisfies VehicleMediaItem)),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function sampleVehicle(overrides: Partial<VehicleRow> = {}): VehicleRow {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    slug: "vw-jetta-2019-test",
    stock_code: null,
    category: "recuperado",
    make: "Volkswagen",
    model: "Jetta",
    version: null,
    year: 2019,
    body_type: null,
    exterior_color: null,
    transmission: null,
    fuel_type: null,
    mileage_km: null,
    public_title: "Volkswagen Jetta 2019",
    short_description: "Unidad de prueba Fase 4.",
    full_description: null,
    public_description: null,
    price_amount: null,
    price_label: null,
    currency: "MXN",
    status: "available",
    is_published: false,
    is_featured: false,
    is_weekly_opportunity: false,
    opportunity_deadline: null,
    featured_order: null,
    damage_summary: null,
    condition_notes: null,
    damage_tags: [],
    public_tags: [],
    location_label: null,
    vin: null,
    provider_reference: null,
    private_notes: null,
    internal_price: null,
    seo_title: null,
    seo_description: null,
    published_at: null,
    created_by: null,
    updated_by: null,
    created_at: "2026-07-19T12:00:00Z",
    updated_at: "2026-07-19T12:00:00Z",
    deleted_at: null,
    starts_status: "unknown",
    drives_status: "unknown",
    has_keys_status: "unknown",
    airbags_status: "unknown",
    invoice_type: "unknown",
    invoice_entity: null,
    tenencias_label: null,
    verification_status: "unknown",
    publish_observations: true,
    use_manual_public_copy: false,
    ...overrides,
  };
}

describe("VehicleForm media checklist", () => {
  it("enables Publicar after upload without manual reload", async () => {
    render(<VehicleForm vehicle={sampleVehicle()} images={[]} />);

    expect(screen.getByRole("button", { name: /^Publicar$/ })).toBeDisabled();
    expect(
      screen.getByText(/Agrega al menos una fotografía/i),
    ).toBeInTheDocument();

    const file = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], "a.jpg", {
      type: "image/jpeg",
    });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^Publicar$/ })).toBeEnabled();
    });
    expect(
      screen.queryByText(/Agrega al menos una fotografía/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Selecciona una portada/i),
    ).not.toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });
});
