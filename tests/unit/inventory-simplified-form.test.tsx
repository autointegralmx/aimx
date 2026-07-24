import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { Database } from "@/shared/lib/database.types";
import { VehicleForm } from "@/modules/inventory/ui/vehicle-form";

type VehicleRow = Database["public"]["Tables"]["vehicles"]["Row"];

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/modules/inventory/application/vehicle-actions", () => ({
  updateVehicleAction: vi.fn(),
  publishVehicleAction: vi.fn(),
  unpublishVehicleAction: vi.fn(),
  uploadVehicleImagesAction: vi.fn(),
  reorderVehicleImagesAction: vi.fn(),
  setVehicleCoverAction: vi.fn(),
  deleteVehicleImageAction: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

function sampleVehicle(overrides: Partial<VehicleRow> = {}): VehicleRow {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    slug: "mazda-mx-5-2025",
    stock_code: null,
    category: "accidentado",
    make: "Mazda",
    model: "MX-5",
    version: null,
    year: 2025,
    body_type: "Coupé",
    exterior_color: "Negro",
    transmission: "Manual",
    fuel_type: "Gasolina",
    mileage_km: null,
    public_title: null,
    short_description: null,
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
    auction_awarded_amount: null,
    featured_order: null,
    catalog_order: 1000,
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

describe("simplified VehicleForm", () => {
  it("shows inventory fields without manual copy CMS", () => {
    render(<VehicleForm vehicle={sampleVehicle()} images={[]} />);

    expect(screen.getByRole("button", { name: /^Guardar$/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Observaciones$/i)).toBeInTheDocument();
    expect(screen.getByText("Arranca")).toBeInTheDocument();
    expect(screen.getByText("Camina")).toBeInTheDocument();
    expect(screen.getByText("Llaves")).toBeInTheDocument();
    expect(screen.getByText("Bolsas de aire")).toBeInTheDocument();
    expect(screen.getByText("Destacar vehículo")).toBeInTheDocument();
    expect(screen.getByText("En subasta")).toBeInTheDocument();

    const openTextareas = [
      ...document.querySelectorAll("details[open] textarea"),
    ];
    expect(openTextareas).toHaveLength(1);
    expect(openTextareas[0]).toHaveAttribute("id", "observations");
    expect(openTextareas[0]).toHaveAttribute("maxLength", "300");

    expect(screen.queryByText(/personalización avanzada/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/título público manual/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/descripción corta manual/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/seo título/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/tags comerciales/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/usar personalización manual/i),
    ).not.toBeInTheDocument();
  });

  it("keeps observations as the only open free-text field", () => {
    render(<VehicleForm vehicle={sampleVehicle()} images={[]} />);
    expect(
      screen.getByPlaceholderText(/excelente oportunidad/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/fecha límite oportunidad/i),
    ).not.toBeInTheDocument();
  });
});
