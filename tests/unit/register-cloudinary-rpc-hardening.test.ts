import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { buildCloudinaryVehiclePublicId } from "@/modules/inventory/domain/cloudinary-vehicle-paths";
import type { Database } from "@/shared/lib/database.types";

const MIGRATION = join(
  process.cwd(),
  "supabase/migrations/20260720060000_harden_register_cloudinary_vehicle_media.sql",
);

const LOCAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("127.0.0.1")
  ? process.env.NEXT_PUBLIC_SUPABASE_URL
  : "http://127.0.0.1:54321";

/** Local demo service role (Supabase CLI default). */
const LOCAL_SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE_KEY_LOCAL ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

describe("harden register_cloudinary_vehicle_media migration SQL", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("is additive create or replace with exact equality binding", () => {
    expect(sql).toMatch(/create or replace function public\.register_cloudinary_vehicle_media/);
    expect(sql).toMatch(/security invoker/i);
    expect(sql).toMatch(/set search_path = public/);
    expect(sql).toMatch(
      /v_expected_public_id :=\s*'CarrosAutointegral\/vehicles\/'\s*\|\|\s*p_vehicle_id::text\s*\|\|\s*'\/'\s*\|\|\s*p_asset_id::text/,
    );
    expect(sql).toMatch(/p_public_id <> v_expected_public_id/);
    expect(sql).toMatch(/to authenticated, service_role/);
    expect(sql).not.toMatch(/\bto anon\b/);
    expect(sql).not.toMatch(/drop function/i);
  });
});

describe("register_cloudinary_vehicle_media path hardening (local RPC)", () => {
  let client: SupabaseClient<Database>;
  let localAvailable = false;
  let vehicleId = "";
  let actorId = "";
  const createdAssetIds: string[] = [];

  async function callRpc(input: {
    assetId: string;
    vehicleId: string;
    publicId: string;
    makeCover?: boolean;
  }) {
    return client.rpc("register_cloudinary_vehicle_media", {
      p_asset_id: input.assetId,
      p_vehicle_id: input.vehicleId,
      p_actor_id: actorId,
      p_public_id: input.publicId,
      p_secure_url: "",
      p_resource_type: "image",
      p_version: 1,
      p_format: "jpg",
      p_width: 100,
      p_height: 100,
      p_byte_size: 10,
      p_original_filename: "t.jpg",
      p_mime_type: "image/jpeg",
      p_make_cover: input.makeCover ?? false,
    });
  }

  beforeAll(async () => {
    client = createClient<Database>(LOCAL_URL, LOCAL_SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    try {
      const health = await fetch(`${LOCAL_URL.replace(/\/$/, "")}/rest/v1/`, {
        headers: {
          apikey: LOCAL_SERVICE_ROLE,
          Authorization: `Bearer ${LOCAL_SERVICE_ROLE}`,
        },
      });
      localAvailable = health.ok;
    } catch {
      localAvailable = false;
    }

    if (!localAvailable) return;

    vehicleId = crypto.randomUUID();
    const { data: admins } = await client
      .from("admin_profiles")
      .select("id")
      .eq("is_active", true)
      .limit(1);
    actorId = admins?.[0]?.id ?? crypto.randomUUID();

    const { error } = await client.from("vehicles").insert({
      id: vehicleId,
      slug: `rpc-harden-${vehicleId.slice(0, 8)}`,
      make: "TEST",
      model: "RpcHarden",
      year: 2020,
      category: "seminuevo",
      status: "draft",
      is_published: false,
      currency: "MXN",
      public_title: "TEST RPC Harden",
    });
    if (error) {
      localAvailable = false;
      throw new Error(`No se pudo crear vehículo de prueba local: ${error.message}`);
    }
  });

  afterAll(async () => {
    if (!localAvailable || !vehicleId) return;
    await client.from("vehicle_media").delete().eq("vehicle_id", vehicleId);
    if (createdAssetIds.length > 0) {
      await client.from("media_assets").delete().in("id", createdAssetIds);
    }
    await client.from("vehicles").delete().eq("id", vehicleId);
  });

  it("skips live RPC tests when local Supabase is down", () => {
    if (!localAvailable) {
      expect(localAvailable).toBe(false);
    } else {
      expect(localAvailable).toBe(true);
    }
  });

  it("1 exact valid public_id passes and becomes cover", async ({ skip }) => {
    if (!localAvailable) skip();
    const assetId = crypto.randomUUID();
    const publicId = buildCloudinaryVehiclePublicId(vehicleId, assetId);
    const { data, error } = await callRpc({ assetId, vehicleId, publicId });
    expect(error).toBeNull();
    expect(data).toMatchObject({
      media_asset_id: assetId,
      vehicle_id: vehicleId,
      position: 0,
      is_cover: true,
    });
    createdAssetIds.push(assetId);

    const { data: asset } = await client
      .from("media_assets")
      .select("provider, bucket, object_path, public_id")
      .eq("id", assetId)
      .single();
    expect(asset).toMatchObject({
      provider: "cloudinary",
      bucket: null,
      object_path: null,
      public_id: publicId,
    });
  });

  it("2 different vehicleId in public_id is rejected", async ({ skip }) => {
    if (!localAvailable) skip();
    const assetId = crypto.randomUUID();
    const otherVehicle = crypto.randomUUID();
    const publicId = buildCloudinaryVehiclePublicId(otherVehicle, assetId);
    const { error } = await callRpc({ assetId, vehicleId, publicId });
    expect(error).toBeTruthy();
    expect(error?.message ?? "").toMatch(/public_id inválido/i);
  });

  it("3 different assetId in public_id is rejected", async ({ skip }) => {
    if (!localAvailable) skip();
    const assetId = crypto.randomUUID();
    const otherAsset = crypto.randomUUID();
    const publicId = buildCloudinaryVehiclePublicId(vehicleId, otherAsset);
    const { error } = await callRpc({ assetId, vehicleId, publicId });
    expect(error).toBeTruthy();
    expect(error?.message ?? "").toMatch(/public_id inválido/i);
  });

  it("4 different root folder is rejected", async ({ skip }) => {
    if (!localAvailable) skip();
    const assetId = crypto.randomUUID();
    const publicId = `OtherRoot/vehicles/${vehicleId}/${assetId}`;
    const { error } = await callRpc({ assetId, vehicleId, publicId });
    expect(error).toBeTruthy();
    expect(error?.message ?? "").toMatch(/public_id inválido/i);
  });

  it("5 extra folder segment is rejected", async ({ skip }) => {
    if (!localAvailable) skip();
    const assetId = crypto.randomUUID();
    const publicId = `CarrosAutointegral/vehicles/${vehicleId}/extra/${assetId}`;
    const { error } = await callRpc({ assetId, vehicleId, publicId });
    expect(error).toBeTruthy();
    expect(error?.message ?? "").toMatch(/public_id inválido/i);
  });

  it("6 full Cloudinary URL is rejected", async ({ skip }) => {
    if (!localAvailable) skip();
    const assetId = crypto.randomUUID();
    const publicId = `https://res.cloudinary.com/cniopmlz/image/upload/v1/CarrosAutointegral/vehicles/${vehicleId}/${assetId}`;
    const { error } = await callRpc({ assetId, vehicleId, publicId });
    expect(error).toBeTruthy();
    expect(error?.message ?? "").toMatch(/public_id inválido/i);
  });

  it("7 empty public_id is rejected", async ({ skip }) => {
    if (!localAvailable) skip();
    const assetId = crypto.randomUUID();
    const { error } = await callRpc({
      assetId,
      vehicleId,
      publicId: "",
    });
    expect(error).toBeTruthy();
    expect(error?.message ?? "").toMatch(/public_id inválido/i);
  });

  it("8 double slash is rejected", async ({ skip }) => {
    if (!localAvailable) skip();
    const assetId = crypto.randomUUID();
    const publicId = `CarrosAutointegral/vehicles//${vehicleId}/${assetId}`;
    const { error } = await callRpc({ assetId, vehicleId, publicId });
    expect(error).toBeTruthy();
    expect(error?.message ?? "").toMatch(/public_id inválido/i);
  });

  it("9 path traversal is rejected", async ({ skip }) => {
    if (!localAvailable) skip();
    const assetId = crypto.randomUUID();
    const publicId = `CarrosAutointegral/vehicles/${vehicleId}/../${assetId}`;
    const { error } = await callRpc({ assetId, vehicleId, publicId });
    expect(error).toBeTruthy();
    expect(error?.message ?? "").toMatch(/public_id inválido/i);
  });

  it("10 query string is rejected", async ({ skip }) => {
    if (!localAvailable) skip();
    const assetId = crypto.randomUUID();
    const publicId = `${buildCloudinaryVehiclePublicId(vehicleId, assetId)}?x=1`;
    const { error } = await callRpc({ assetId, vehicleId, publicId });
    expect(error).toBeTruthy();
    expect(error?.message ?? "").toMatch(/public_id inválido/i);
  });

  it("11 file extension on public_id is rejected", async ({ skip }) => {
    if (!localAvailable) skip();
    const assetId = crypto.randomUUID();
    const publicId = `${buildCloudinaryVehiclePublicId(vehicleId, assetId)}.jpg`;
    const { error } = await callRpc({ assetId, vehicleId, publicId });
    expect(error).toBeTruthy();
    expect(error?.message ?? "").toMatch(/public_id inválido/i);
  });

  it("12-13 second valid image is atomic and does not replace cover", async ({
    skip,
  }) => {
    if (!localAvailable) skip();
    const assetId = crypto.randomUUID();
    const publicId = buildCloudinaryVehiclePublicId(vehicleId, assetId);
    const { data, error } = await callRpc({ assetId, vehicleId, publicId });
    expect(error).toBeNull();
    expect(data).toMatchObject({
      media_asset_id: assetId,
      is_cover: false,
      position: 1,
    });
    createdAssetIds.push(assetId);

    const { data: covers } = await client
      .from("vehicle_media")
      .select("media_asset_id, is_cover")
      .eq("vehicle_id", vehicleId)
      .eq("is_cover", true);
    expect(covers).toHaveLength(1);
    expect(covers?.[0]?.media_asset_id).not.toBe(assetId);
  });

  it("15 duplicate asset / public_id still rejected", async ({ skip }) => {
    if (!localAvailable) skip();
    const existing = createdAssetIds[0];
    expect(existing).toBeTruthy();
    const { error } = await callRpc({
      assetId: existing!,
      vehicleId,
      publicId: buildCloudinaryVehiclePublicId(vehicleId, existing!),
    });
    expect(error).toBeTruthy();
    expect(error?.message ?? "").toMatch(
      /media_asset duplicado|public_id duplicado/i,
    );
  });

  it("14 max 30 images still enforced", async ({ skip }) => {
    if (!localAvailable) skip();
    // Fill until 30 total for this vehicle
    const { count } = await client
      .from("vehicle_media")
      .select("media_asset_id", { count: "exact", head: true })
      .eq("vehicle_id", vehicleId);
    let current = count ?? 0;
    while (current < 30) {
      const assetId = crypto.randomUUID();
      const publicId = buildCloudinaryVehiclePublicId(vehicleId, assetId);
      const { error } = await callRpc({ assetId, vehicleId, publicId });
      expect(error).toBeNull();
      createdAssetIds.push(assetId);
      current += 1;
    }
    const assetId = crypto.randomUUID();
    const publicId = buildCloudinaryVehiclePublicId(vehicleId, assetId);
    const { error } = await callRpc({ assetId, vehicleId, publicId });
    expect(error).toBeTruthy();
    expect(error?.message ?? "").toMatch(/Máximo 30/i);
  });

  it("16 cleanup leaves no temp rows for this vehicle", async ({ skip }) => {
    if (!localAvailable) skip();
    await client.from("vehicle_media").delete().eq("vehicle_id", vehicleId);
    if (createdAssetIds.length > 0) {
      await client.from("media_assets").delete().in("id", createdAssetIds);
    }
    await client.from("vehicles").delete().eq("id", vehicleId);

    const { data: v } = await client
      .from("vehicles")
      .select("id")
      .eq("id", vehicleId);
    const { data: m } = await client
      .from("vehicle_media")
      .select("media_asset_id")
      .eq("vehicle_id", vehicleId);
    expect(v ?? []).toEqual([]);
    expect(m ?? []).toEqual([]);
    vehicleId = "";
    createdAssetIds.length = 0;
  });
});
