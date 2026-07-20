import { describe, expect, it } from "vitest";
import {
  formatAuctionClosesAt,
  formatAuctionClosesLong,
  isAuctionEnded,
  isAuctionMissingDeadline,
  isPublicAuctionVehicle,
  isoToMexicoCityDatetimeLocal,
  mexicoCityDatetimeLocalToIso,
} from "@/modules/inventory/domain/vehicle-auction";
import { vehicleUpdateSchema } from "@/modules/inventory/domain/vehicle-schema";

describe("isPublicAuctionVehicle", () => {
  const now = new Date("2026-07-19T18:00:00.000Z");

  it("shows accidentado in auction when published with future deadline", () => {
    expect(
      isPublicAuctionVehicle(
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
      isPublicAuctionVehicle(
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
      isPublicAuctionVehicle(
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
      isPublicAuctionVehicle(
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
      isPublicAuctionVehicle(
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
      isPublicAuctionVehicle(
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
      isPublicAuctionVehicle(
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
      isPublicAuctionVehicle(
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
    const missing = vehicleUpdateSchema.safeParse({
      is_weekly_opportunity: true,
      opportunity_deadline: null,
    });
    expect(missing.success).toBe(false);

    const past = vehicleUpdateSchema.safeParse({
      is_weekly_opportunity: true,
      opportunity_deadline: "2020-01-01T00:00:00.000Z",
    });
    expect(past.success).toBe(false);
  });

  it("accepts auction with future deadline", () => {
    const result = vehicleUpdateSchema.safeParse({
      is_weekly_opportunity: true,
      opportunity_deadline: "2030-01-01T00:00:00.000Z",
      status: "available",
      is_published: true,
      slug: "mazda-mx-5-2025",
    });
    expect(result.success).toBe(true);
  });
});
