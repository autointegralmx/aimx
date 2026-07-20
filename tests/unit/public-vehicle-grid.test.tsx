import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PublicVehicle } from "@/modules/inventory/infrastructure/vehicle-repository";

vi.mock("@/modules/inventory/ui/public-vehicle-card", () => ({
  VehicleCard: ({ vehicle }: { vehicle: { id: string; title: string } }) => (
    <div data-testid={`card-${vehicle.id}`}>{vehicle.title}</div>
  ),
}));

vi.mock("@/modules/inventory/ui/auction-vehicle-card", () => ({
  AuctionVehicleCard: ({
    vehicle,
  }: {
    vehicle: { id: string; title: string };
  }) => <div data-testid={`auction-${vehicle.id}`}>{vehicle.title}</div>,
}));

vi.mock("@/modules/inventory/ui/compact-vehicle-row", () => ({
  CompactVehicleRow: ({
    vehicle,
  }: {
    vehicle: { id: string; title: string };
  }) => <div data-testid={`row-${vehicle.id}`}>{vehicle.title}</div>,
}));

import { PublicVehicleGrid } from "@/modules/inventory/ui/public-vehicle-grid";

function makeItem(id: string, title: string) {
  return {
    vehicle: { id, title } as unknown as PublicVehicle,
    coverUrl: null,
  };
}

describe("PublicVehicleGrid listMode", () => {
  const items = [
    makeItem("1", "Uno"),
    makeItem("2", "Dos"),
    makeItem("3", "Tres"),
    makeItem("4", "Cuatro"),
  ];

  it("listMode=all renders every vehicle (no default limit of 3)", () => {
    render(<PublicVehicleGrid items={items} listMode="all" />);
    expect(screen.getByTestId("card-1")).toBeInTheDocument();
    expect(screen.getByTestId("card-2")).toBeInTheDocument();
    expect(screen.getByTestId("card-3")).toBeInTheDocument();
    expect(screen.getByTestId("card-4")).toBeInTheDocument();
  });

  it("listMode=all ignores limit prop", () => {
    render(<PublicVehicleGrid items={items} listMode="all" limit={3} />);
    expect(screen.getByTestId("card-4")).toBeInTheDocument();
  });

  it("listMode=preview with limit=3 only shows three", () => {
    render(
      <PublicVehicleGrid items={items} listMode="preview" limit={3} />,
    );
    expect(screen.getByTestId("card-1")).toBeInTheDocument();
    expect(screen.getByTestId("card-2")).toBeInTheDocument();
    expect(screen.getByTestId("card-3")).toBeInTheDocument();
    expect(screen.queryByTestId("card-4")).not.toBeInTheDocument();
  });
});
