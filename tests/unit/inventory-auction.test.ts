import { describe, expect, it } from "vitest";
import {
  formatAuctionClosesAt,
  formatAuctionClosesLong,
  isAuctionActive,
  isAuctionEnded,
  isAuctionMissingDeadline,
  isPublicAuctionVehicle,
  isPublicOwnedInventoryVehicle,
  isoToMexicoCityDatetimeLocal,
  mexicoCityDatetimeLocalToIso,
  resolveAuctionPublicState,
  resolvePublicChannel,
} from "@/modules/inventory/domain/vehicle-auction";
import { parseVehicleUpdateInput } from "@/modules/inventory/domain/vehicle-schema";

describe("isAuctionActive", () => {
  const now = new Date("2026-07-19T18:00:00.000Z");

  it("shows accidentado in auction when published with future deadline", () => {
    expect(
      isAuctionActive(
        {
          is_published: true,
          is_weekly_opportunity: true,
          status: "available",
          opportunity_deadline: "2026-07-21T02:30:00.000Z",
        },
        now,
      ),
    ).toBe(true);
  });

  it("excludes published vehicles without auction flag", () => {
    expect(
      isAuctionActive(
        {
          is_published: true,
          is_weekly_opportunity: false,
          status: "available",
          opportunity_deadline: "2026-07-21T02:30:00.000Z",
        },
        now,
      ),
    ).toBe(false);
  });

  it("excludes featured-only vehicles from auction board", () => {
    expect(
      isAuctionActive(
        {
          is_published: true,
          is_weekly_opportunity: false,
          status: "available",
          opportunity_deadline: null,
        },
        now,
      ),
    ).toBe(false);
  });

  it("excludes auction without deadline", () => {
    expect(
      isAuctionActive(
        {
          is_published: true,
          is_weekly_opportunity: true,
          status: "available",
          opportunity_deadline: null,
        },
        now,
      ),
    ).toBe(false);
    expect(
      isAuctionMissingDeadline({
        is_weekly_opportunity: true,
        opportunity_deadline: null,
      }),
    ).toBe(true);
  });

  it("excludes expired auctions", () => {
    expect(
      isAuctionActive(
        {
          is_published: true,
          is_weekly_opportunity: true,
          status: "available",
          opportunity_deadline: "2026-07-18T02:30:00.000Z",
        },
        now,
      ),
    ).toBe(false);
    expect(
      isAuctionEnded({
        opportunity_deadline: "2026-07-18T02:30:00.000Z",
        now,
      }),
    ).toBe(true);
  });

  it("excludes unpublished and sold", () => {
    expect(
      isAuctionActive(
        {
          is_published: false,
          is_weekly_opportunity: true,
          status: "available",
          opportunity_deadline: "2026-07-21T02:30:00.000Z",
        },
        now,
      ),
    ).toBe(false);
    expect(
      isAuctionActive(
        {
          is_published: true,
          is_weekly_opportunity: true,
          status: "sold",
          opportunity_deadline: "2026-07-21T02:30:00.000Z",
        },
        now,
      ),
    ).toBe(false);
  });

  it("excludes reserved from public auction board", () => {
    expect(
      isAuctionActive(
        {
          is_published: true,
          is_weekly_opportunity: true,
          status: "reserved",
          opportunity_deadline: "2026-07-21T02:30:00.000Z",
        },
        now,
      ),
    ).toBe(false);
  });

  it("resolveAuctionPublicState keeps category separate from auction CTA", () => {
    const state = resolveAuctionPublicState(
      {
        is_published: true,
        is_weekly_opportunity: true,
        status: "available",
        opportunity_deadline: "2026-07-21T02:30:00.000Z",
      },
      now,
    );
    expect(state.active).toBe(true);
    expect(state.badgeLabel).toBe("En subasta");
    expect(state.ctaLabel).toMatch(/participar/i);
    expect(state.includeInAuctionBoard).toBe(true);
  });
});

describe("public channel mutual exclusion", () => {
  const now = new Date("2026-07-19T18:00:00.000Z");

  it("accidentado owned appears in inventory not auctions", () => {
    const vehicle = {
      is_published: true,
      is_weekly_opportunity: false,
      status: "available" as const,
      opportunity_deadline: null,
    };
    expect(isPublicOwnedInventoryVehicle(vehicle)).toBe(true);
    expect(isPublicAuctionVehicle(vehicle, now)).toBe(false);
    expect(resolvePublicChannel(vehicle, now)).toBe("owned_inventory");
  });

  it("accidentado in auction appears only on auction channel", () => {
    const vehicle = {
      is_published: true,
      is_weekly_opportunity: true,
      status: "available" as const,
      opportunity_deadline: "2026-07-21T02:30:00.000Z",
    };
    expect(isPublicOwnedInventoryVehicle(vehicle)).toBe(false);
    expect(isPublicAuctionVehicle(vehicle, now)).toBe(true);
    expect(resolvePublicChannel(vehicle, now)).toBe("auction");
  });

  it("recuperado and seminuevo in auction are excluded from owned inventory", () => {
    const vehicle = {
      is_published: true,
      is_weekly_opportunity: true,
      status: "available" as const,
      opportunity_deadline: "2026-07-21T02:30:00.000Z",
    };
    expect(isPublicOwnedInventoryVehicle(vehicle)).toBe(false);
    expect(isPublicAuctionVehicle(vehicle, now)).toBe(true);
  });

  it("featured + auction stays off owned inventory", () => {
    const vehicle = {
      is_published: true,
      is_weekly_opportunity: true,
      status: "available" as const,
      opportunity_deadline: "2026-07-21T02:30:00.000Z",
    };
    expect(isPublicOwnedInventoryVehicle(vehicle)).toBe(false);
    expect(resolvePublicChannel(vehicle, now)).toBe("auction");
  });

  it("expired auction does not reappear in owned inventory while flag stays on", () => {
    const vehicle = {
      is_published: true,
      is_weekly_opportunity: true,
      status: "available" as const,
      opportunity_deadline: "2026-07-18T02:30:00.000Z",
    };
    expect(isPublicAuctionVehicle(vehicle, now)).toBe(false);
    expect(isPublicOwnedInventoryVehicle(vehicle)).toBe(false);
    expect(resolvePublicChannel(vehicle, now)).toBeNull();
  });

  it("turning auction off returns vehicle to owned inventory", () => {
    const vehicle = {
      is_published: true,
      is_weekly_opportunity: false,
      status: "available" as const,
      opportunity_deadline: "2026-07-21T02:30:00.000Z",
    };
    expect(isPublicOwnedInventoryVehicle(vehicle)).toBe(true);
    expect(isPublicAuctionVehicle(vehicle, now)).toBe(false);
    expect(resolvePublicChannel(vehicle, now)).toBe("owned_inventory");
  });

  it("never allows owned and auction simultaneously", () => {
    const cases = [
      {
        is_published: true,
        is_weekly_opportunity: false,
        status: "available" as const,
        opportunity_deadline: null,
      },
      {
        is_published: true,
        is_weekly_opportunity: true,
        status: "available" as const,
        opportunity_deadline: "2026-07-21T02:30:00.000Z",
      },
      {
        is_published: true,
        is_weekly_opportunity: true,
        status: "available" as const,
        opportunity_deadline: "2026-07-18T02:30:00.000Z",
      },
      {
        is_published: true,
        is_weekly_opportunity: true,
        status: "reserved" as const,
        opportunity_deadline: "2026-07-21T02:30:00.000Z",
      },
    ];
    for (const vehicle of cases) {
      const owned = isPublicOwnedInventoryVehicle(vehicle);
      const auction = isPublicAuctionVehicle(vehicle, now);
      expect(owned && auction).toBe(false);
    }
  });
});

describe("auction timezone formatting", () => {
  it("formats Mexico City wall time from UTC instant", () => {
    // 2026-07-21 20:30 in Mexico City (UTC-6 in July CDT = UTC-5)
    const iso = mexicoCityDatetimeLocalToIso("2026-07-21T20:30");
    expect(iso).toBeTruthy();
    const long = formatAuctionClosesLong(iso!);
    expect(long).toMatch(/21/);
    expect(long).toMatch(/2026/);
    expect(long.toLowerCase()).toMatch(/8:30|20:30/);

    const roundTrip = isoToMexicoCityDatetimeLocal(iso);
    expect(roundTrip).toBe("2026-07-21T20:30");
  });

  it("labels same-day close in Mexico City", () => {
    const local = isoToMexicoCityDatetimeLocal(
      new Date("2026-07-19T23:00:00.000Z").toISOString(),
    );
    // Derive a future same-day deadline in MX from a known local input.
    const ends = mexicoCityDatetimeLocalToIso("2026-07-19T22:00");
    expect(ends).toBeTruthy();
    const now = new Date(mexicoCityDatetimeLocalToIso("2026-07-19T10:00")!);
    const label = formatAuctionClosesAt(ends!, now);
    expect(label).toMatch(/Cierra hoy/i);
    expect(local).toMatch(/T/);
  });
});

describe("auction schema validation", () => {
  it("blocks auction without future deadline", () => {
    const missing = parseVehicleUpdateInput({
      is_weekly_opportunity: true,
      opportunity_deadline: null,
    });
    expect(missing.success).toBe(false);

    const past = parseVehicleUpdateInput({
      is_weekly_opportunity: true,
      opportunity_deadline: "2020-01-01T00:00:00.000Z",
    });
    expect(past.success).toBe(false);
  });

  it("accepts auction with future deadline without forcing is_published", () => {
    const result = parseVehicleUpdateInput({
      is_weekly_opportunity: true,
      opportunity_deadline: "2030-01-01T00:00:00.000Z",
      status: "available",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_published).toBeUndefined();
    }
  });

  it("accepts HH:mm:ss local values from browser time inputs", () => {
    const iso = mexicoCityDatetimeLocalToIso("2026-07-20T09:00:00");
    expect(iso).toBeTruthy();
    expect(isoToMexicoCityDatetimeLocal(iso)).toBe("2026-07-20T09:00");
  });
});
