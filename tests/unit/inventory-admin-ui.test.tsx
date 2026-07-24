import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { VehiclesEmptyState } from "@/modules/inventory/ui/vehicles-empty-state";
import { VehiclesFilters } from "@/modules/inventory/ui/vehicles-filters";
import { parseAdminVehicleListParams } from "@/modules/inventory/domain/admin-list-filters";
import { VehicleActionsMenu } from "@/modules/inventory/ui/vehicle-actions-menu";
import { ConfirmDialog } from "@/modules/inventory/ui/confirm-dialog";
import type { AdminVehicleListItem } from "@/modules/inventory/infrastructure/vehicle-repository";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/modules/inventory/application/vehicle-actions", () => ({
  reserveVehicleAction: vi.fn(),
  makeVehicleAvailableAction: vi.fn(),
  markVehicleSoldAction: vi.fn(async () => ({
    ok: true,
    message: "Vehículo marcado como vendido.",
  })),
  archiveVehicleAction: vi.fn(async () => ({
    ok: true,
    message: "Vehículo archivado.",
  })),
  unpublishVehicleAction: vi.fn(),
  duplicateVehicleAction: vi.fn(async () => ({
    ok: true,
    message:
      "Vehículo duplicado como borrador. Las fotografías no fueron copiadas.",
    vehicleId: "new-id",
  })),
}));

function sampleVehicle(
  overrides: Partial<AdminVehicleListItem> = {},
): AdminVehicleListItem {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    slug: "demo-toyota",
    stock_code: "AI-REC-02",
    category: "recuperado",
    make: "Toyota",
    model: "Corolla",
    version: "LE",
    year: 2020,
    status: "available",
    is_published: true,
    is_featured: false,
    is_weekly_opportunity: false,
    opportunity_deadline: null,
    auction_awarded_amount: null,
    catalog_order: 1,
    featured_order: null,
    public_title: "Toyota Corolla",
    updated_at: "2026-07-19T12:00:00Z",
    created_at: "2026-07-18T12:00:00Z",
    deleted_at: null,
    cover_url: null,
    ...overrides,
  };
}

describe("VehiclesEmptyState", () => {
  it("renders empty catalog CTA", () => {
    render(<VehiclesEmptyState kind="empty" />);
    expect(
      screen.getByText("No hay vehículos registrados todavía."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /nuevo vehículo/i }),
    ).toHaveAttribute("href", "/admin/vehiculos/nuevo");
  });

  it("renders filtered empty with clear filters", () => {
    render(<VehiclesEmptyState kind="filtered" />);
    expect(
      screen.getByText("No encontramos vehículos con estos filtros."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /limpiar filtros/i }),
    ).toBeInTheDocument();
  });

  it("renders load error with retry", () => {
    render(<VehiclesEmptyState kind="error" />);
    expect(
      screen.getByText("No pudimos cargar los vehículos."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /reintentar/i })).toBeInTheDocument();
  });
});

describe("VehiclesFilters", () => {
  it("renders filter controls with current values", () => {
    const filters = parseAdminVehicleListParams({
      q: "toyota",
      category: "accidentado",
      status: "available",
    });
    const { container } = render(<VehiclesFilters filters={filters} />);
    const view = within(container);
    expect(view.getByDisplayValue("toyota")).toBeInTheDocument();
    expect(
      view.getByRole("button", { name: /aplicar filtros/i }),
    ).toBeInTheDocument();
    expect(
      view.getByRole("link", { name: /limpiar filtros/i }),
    ).toHaveAttribute("href", "/admin/vehiculos");
  });
});

describe("ConfirmDialog", () => {
  it("shows busy state and disables actions", () => {
    render(
      <ConfirmDialog
        open
        title="Marcar como vendido"
        body="Este vehículo dejará de mostrarse públicamente."
        confirmLabel="Marcar vendido"
        busy
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    );
    expect(screen.getByRole("button", { name: /procesando/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeDisabled();
  });
});

describe("VehicleActionsMenu", () => {
  it("shows valid actions for available published vehicle", () => {
    render(<VehicleActionsMenu vehicle={sampleVehicle()} />);
    fireEvent.click(screen.getByRole("button", { name: /acciones/i }));
    expect(screen.getByRole("menuitem", { name: /editar/i })).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /marcar como vendido/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /volver a disponible/i }),
    ).not.toBeInTheDocument();
  });

  it("opens sold confirmation and prevents double submit", async () => {
    const { markVehicleSoldAction } = await import(
      "@/modules/inventory/application/vehicle-actions"
    );
    render(<VehicleActionsMenu vehicle={sampleVehicle()} />);
    fireEvent.click(screen.getByRole("button", { name: /acciones/i }));
    fireEvent.click(
      screen.getByRole("menuitem", { name: /marcar como vendido/i }),
    );
    expect(
      screen.getByText(/seguirá visible en el catálogo público con el letrero vendido/i),
    ).toBeInTheDocument();

    const confirm = screen.getByRole("button", { name: /marcar vendido/i });
    fireEvent.click(confirm);
    fireEvent.click(confirm);

    await waitFor(() => {
      expect(markVehicleSoldAction).toHaveBeenCalledTimes(1);
    });
  });

  it("shows only edit/duplicate for archived", () => {
    render(
      <VehicleActionsMenu
        vehicle={sampleVehicle({ status: "archived", is_published: false })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /acciones/i }));
    expect(screen.getByRole("menuitem", { name: /editar/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /duplicar/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /archivar/i }),
    ).not.toBeInTheDocument();
  });
});
