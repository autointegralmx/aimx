import { describe, expect, it } from "vitest";
import {
  formatAuctionAwardedLabel,
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
import { applyAuctionUpdateRules } from "@/modules/inventory/domain/auction-update-rules";
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

  it("expired auction stays on auction channel as closed historial", () => {
    const vehicle = {
      is_published: true,
      is_weekly_opportunity: true,
      status: "available" as const,
      opportunity_deadline: "2026-07-18T02:30:00.000Z",
    };
    expect(isPublicAuctionVehicle(vehicle, now)).toBe(false);
    expect(isPublicOwnedInventoryVehicle(vehicle)).toBe(false);
    expect(resolvePublicChannel(vehicle, now)).toBe("auction");
    const state = resolveAuctionPublicState(vehicle, now);
    expect(state.closed).toBe(true);
    expect(state.includeInAuctionBoard).toBe(true);
    expect(state.canParticipate).toBe(false);
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

  it("sold published units stay in owned inventory with Vendido badge", () => {
    const vehicle = {
      is_published: true,
      is_weekly_opportunity: false,
      status: "sold" as const,
      opportunity_deadline: null,
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
  it("blocks auction without deadline", () => {
    const missing = parseVehicleUpdateInput({
      is_weekly_opportunity: true,
      opportunity_deadline: null,
    });
    expect(missing.success).toBe(false);
  });

  it("allows preserving an expired deadline on partial update (award capture)", () => {
    const past = parseVehicleUpdateInput({
      is_weekly_opportunity: true,
      opportunity_deadline: "2020-01-01T00:00:00.000Z",
      auction_awarded_amount: 185000,
    });
    expect(past.success).toBe(true);
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

  it("rejects negative or zero award amounts", () => {
    expect(
      parseVehicleUpdateInput({ auction_awarded_amount: -1 }).success,
    ).toBe(false);
    expect(
      parseVehicleUpdateInput({ auction_awarded_amount: 0 }).success,
    ).toBe(false);
  });

  it("rejects award amounts with more than two decimals", () => {
    expect(
      parseVehicleUpdateInput({ auction_awarded_amount: 10.123 }).success,
    ).toBe(false);
  });

  it("accepts null award to clear", () => {
    const result = parseVehicleUpdateInput({ auction_awarded_amount: null });
    expect(result.success).toBe(true);
  });

  it("accepts HH:mm:ss local values from browser time inputs", () => {
    const iso = mexicoCityDatetimeLocalToIso("2026-07-20T09:00:00");
    expect(iso).toBeTruthy();
    expect(isoToMexicoCityDatetimeLocal(iso)).toBe("2026-07-20T09:00");
  });
});

describe("closed auction board + award labels", () => {
  const now = new Date("2026-07-19T18:00:00.000Z");

  it("marks closed exactly at deadline", () => {
    const deadline = "2026-07-19T18:00:00.000Z";
    const state = resolveAuctionPublicState(
      {
        is_published: true,
        is_weekly_opportunity: true,
        status: "available",
        opportunity_deadline: deadline,
      },
      new Date(deadline),
    );
    expect(state.active).toBe(false);
    expect(state.closed).toBe(true);
    expect(state.canParticipate).toBe(false);
    expect(state.statusLabel).toBe("Subasta cerrada");
  });

  it("formats award from numeric string", () => {
    expect(formatAuctionAwardedLabel("185000")).toMatch(/185/);
    expect(formatAuctionAwardedLabel("185000")).toMatch(/MXN/);
    expect(formatAuctionAwardedLabel(null)).toBeNull();
    expect(formatAuctionAwardedLabel("nope")).toBeNull();
  });

  it("includes reserved closed units on the board", () => {
    const state = resolveAuctionPublicState(
      {
        is_published: true,
        is_weekly_opportunity: true,
        status: "reserved",
        opportunity_deadline: "2026-07-18T02:30:00.000Z",
        auction_awarded_amount: 120000,
      },
      now,
    );
    expect(state.closed).toBe(true);
    expect(state.includeInAuctionBoard).toBe(true);
    expect(state.awardedLabel).toMatch(/120/);
  });
});

describe("applyAuctionUpdateRules", () => {
  const now = new Date("2026-07-20T12:00:00.000Z");
  const closedCurrent = {
    is_published: true,
    is_weekly_opportunity: true,
    opportunity_deadline: "2026-07-18T12:00:00.000Z",
    auction_awarded_amount: null as number | null,
    status: "available" as const,
  };

  it("allows award after close while preserving deadline", () => {
    const next = applyAuctionUpdateRules(
      closedCurrent,
      {
        is_weekly_opportunity: true,
        opportunity_deadline: "2026-07-18T12:00:00.000Z",
        auction_awarded_amount: 185000,
      },
      now,
    );
    expect(next.auction_awarded_amount).toBe(185000);
  });

  it("rejects award while auction still active", () => {
    expect(() =>
      applyAuctionUpdateRules(
        {
          ...closedCurrent,
          opportunity_deadline: "2026-07-25T12:00:00.000Z",
        },
        { auction_awarded_amount: 185000 },
        now,
      ),
    ).toThrow(/cerró/i);
  });

  it("rejects changing a future deadline to the past", () => {
    expect(() =>
      applyAuctionUpdateRules(
        {
          ...closedCurrent,
          opportunity_deadline: "2026-07-25T12:00:00.000Z",
        },
        { opportunity_deadline: "2026-07-10T12:00:00.000Z" },
        now,
      ),
    ).toThrow(/futura/i);
  });

  it("clears award when reprogramming a new future deadline", () => {
    const next = applyAuctionUpdateRules(
      {
        ...closedCurrent,
        auction_awarded_amount: 185000,
      },
      { opportunity_deadline: "2026-08-01T12:00:00.000Z" },
      now,
    );
    expect(next.auction_awarded_amount).toBeNull();
  });
});
